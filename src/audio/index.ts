import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { init as initCore, MusicError, MusicErrorType } from "web-music-score/core";
import { Instrument, linearToDecibels } from "./instrument";
import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Synthesizer } from "web-music-score/audio-synth";
import { SamplesInstrument } from "./samples-instrument";

export { Instrument, linearToDecibels }

initCore();

export class AudioError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.Audio, message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}

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

function getSamplesInstrument(file: string) {
    return new SamplesInstrument("https://cdn.jsdelivr.net/npm/web-music-score-samples@2.0.0/samples/" + file)
}

const InstrumentList: Instrument[] = [
    Synthesizer,
    getSamplesInstrument("classical-guitar.json")
];

let currentInstrument: string = Synthesizer.getName();

const DefaultDuration = (function calcDuration(noteSize: number, beatsPerMinute: number, timeTisgnature: string): number {
    let beatSize = parseInt(timeTisgnature.split("/")[1] ?? "4");
    return 60 * (1 / noteSize) / (beatsPerMinute * (1 / beatSize));
})(2, 80, "4/4"); // Half note, 80 bpm, 4/4 time signature.

const DefaultVolume = 1;

let mutePlayback: boolean = false;

/**
 * Get instrument name list.
 * @returns - Array of available instrument names.
 */
export function getInstrumentList(): ReadonlyArray<string> {
    return Utils.Arr.removeDuplicates(InstrumentList.map(instr => instr.getName()));
}

/**
 * Get current instrument name.
 * @returns - Name of current instrument.
 */
export function getCurrentInstrument(): string {
    return currentInstrument;
}

/**
 * Add and use instrument.
 * @param instrument - Object that implements Instrument interface. Can be single instrument or array of instruments.
 */
export function addInstrument(instrument: Instrument | Instrument[]): void {
    for (const instr of Guard.isArray(instrument) ? instrument : [instrument]) {
        if (
            Utils.Obj.hasProperties(instr, ["getName", "playNote", "stop"]) &&
            Guard.isFunction(instr.getName) &&
            Guard.isFunction(instr.playNote) &&
            Guard.isFunction(instr.stop)
        ) {
            const i = InstrumentList.findIndex(testInstr => testInstr.getName() === instr.getName());

            if (i < 0) {
                // Add new instrument.
                InstrumentList.push(instr);
            }
            else {
                // Replace existing instrument.
                InstrumentList[i] = instr;
            }

            currentInstrument = instr.getName();

            // Clear cache
            _getInstrumentMap.clear();
        }
        else {
            console.error("Object is not instrument or instrument samples!");
        }
    }
}

// Cache instruments by name for simple optimization.
let _getInstrumentMap = new UniMap<string, Instrument>();

function _getInstrument(): Instrument | undefined {
    let instr = _getInstrumentMap.get(currentInstrument);
    if (instr)
        return instr;

    instr = InstrumentList.find(instr => (
        instr.getName() === currentInstrument ||
        // Accept filename in case samples json not fetched and parsed yet.
        instr instanceof SamplesInstrument && instr.getFilename() === currentInstrument
    ));

    if (instr)
        _getInstrumentMap.set(currentInstrument, instr);

    return instr;
}

/**
 * Set instrument to use in playback.
 * @param instrumentName - Instrument name.
 */
export function useInstrument(instrumentName: string): void {
    if (instrumentName === currentInstrument)
        return;

    _getInstrument()?.stop();

    currentInstrument = instrumentName;
}

/**
 * Play a note using current instrument.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    if (!mutePlayback) {
        _getInstrument()?.playNote(getNoteName(note), duration ?? DefaultDuration, linearVolume ?? DefaultVolume);
    }
}

/**
 * Stop playback on current instrument.
 */
export function stop() {
    _getInstrument()?.stop();
}

/**
 * Mute playback on current instrument.
 */
export function mute() {
    stop();
    mutePlayback = true;
}

/**
 * Unmute playback on current instrument.
 */
export function unmute() {
    mutePlayback = false;
}

/**
 * Is playback muted?
 * @returns True/false.
 */
export function isMuted(): boolean {
    return mutePlayback;
}
