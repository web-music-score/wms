import { Note, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { init as initCore, MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Synthesizer } from "@tspro/web-music-score/audio-synth";
import { Instrument, linearToDecibels } from "./instrument";
import { Utils } from "@tspro/ts-utils-lib";

export { Instrument, linearToDecibels }

initCore();

function getNoteName(note: Note | number | string) {
    if (typeof note === "string") {
        return note;
    }
    else if (typeof note === "number") {
        // midiNumber
        note = Note.getChromaticNote(note);
    }
    return note.format(PitchNotation.Scientific, SymbolSet.Ascii);
}

const InstrumentList: Instrument[] = [Synthesizer];

let currentInstrument: Instrument = Synthesizer;

const DefaultDuration = (function calcDuration(noteSize: number, beatsPerMinute: number, timeTisgnature: string): number {
    let beatSize = parseInt(timeTisgnature.split("/")[1] ?? "4");
    return 60 * (1 / noteSize) / (beatsPerMinute * (1 / beatSize));
})(2, 80, "4/4"); // Half note, 120 bpm, 4/4 time signature.

const DefaultVolume = 1;

let isMuted: boolean = false;

/**
 * Get instrument name list.
 * @returns - Array of available instrument names.
 */
export function getInstrumentList(): ReadonlyArray<string> {
    return InstrumentList.map(instr => instr.getName());
}

/**
 * Get current instrument name.
 * @returns - Name of current instrument.
 */
export function getCurrentInstrument(): string {
    return currentInstrument.getName();
}

/**
 * Add and use instrument.
 * @param instrument - Object that implements Instrument interface. Can be single instrument or array of instruments.
 */
export function addInstrument(instrument: Instrument | Instrument[]): void {
    (Utils.Is.isArray(instrument) ? instrument : [instrument])
        .forEach(instr => {
            if (
                !Utils.Obj.hasProperties(instr, ["getName", "playNote", "stop"]) ||
                !Utils.Is.isFunction(instr.getName) ||
                !Utils.Is.isFunction(instr.playNote) ||
                !Utils.Is.isFunction(instr.stop)
            ) {
                throw new MusicError(MusicErrorType.Audio, "Invalid instrument object: " + instr);
            }

            if (InstrumentList.some(instr2 => instr2.getName() === instr.getName())) {
                console.warn(`Instrument "${instr.getName()}" already registered!`);
            }
            else {
                InstrumentList.push(instr);
            }

            // Set as current.
            useInstrument(instr.getName());
        });
}

/**
 * Set instrument to use in playback.
 * @param instrumentName - Instrument name.
 */
export function useInstrument(instrumentName: string): void {
    if (instrumentName === currentInstrument.getName()) {
        return;
    }

    currentInstrument.stop();

    let instr = InstrumentList.find(instr => instr.getName() === instrumentName);

    if (instr) {
        currentInstrument = instr;
    }
}

/**
 * Play a note using current instrument.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    if (!isMuted) {
        currentInstrument.playNote(getNoteName(note), duration ?? DefaultDuration, linearVolume ?? DefaultVolume);
    }
}

/**
 * Stop playback on current instrument.
 */
export function stop() {
    currentInstrument.stop();
}

/**
 * Mute playback on current instrument.
 */
export function mute() {
    stop();
    isMuted = true;
}

/**
 * Unmute playback on current instrument.
 */
export function unmute() {
    isMuted = false;
}
