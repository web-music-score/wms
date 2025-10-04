import { Note, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { Synthesizer } from "./audio-synth";
import { init as initCore, MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Instrument } from "./instrument";
import { Utils } from "@tspro/ts-utils-lib";

export { Instrument }

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
let CurrentInstrument: Instrument = Synthesizer;

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
    return CurrentInstrument.getName();
}

/**
 * Register new instrument.
 * @param instr - Instrument object implementing Instrument interface.
 */
export function registerInstrument(instr: Instrument | Instrument[]): void {
    (Utils.Is.isArray(instr) ? instr : [instr])
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
            setInstrument(instr.getName());
        });
}

/**
 * Set current instrument to use in playback.
 * @param instrName - Instrument name.
 */
export function setInstrument(instrName: string): void {
    if (instrName === CurrentInstrument.getName()) {
        return;
    }

    CurrentInstrument.stop();

    let instr = InstrumentList.find(instr => instr.getName() === instrName);

    if (instr) {
        CurrentInstrument = instr;
    }
}

/**
 * Play a note using current instrument.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 */
export function playNote(note: Note | string | number, duration: number, linearVolume: number) {
    CurrentInstrument.playNote(getNoteName(note), duration, linearVolume);
}

/**
 * Stop playing on current instrument.
 */
export function stop() {
    CurrentInstrument.stop();
}
