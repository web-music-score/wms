import { Note, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { Synthesizer } from "./synth";
import { init as initCore } from "@tspro/web-music-score/core";

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

/** Instrument interface. */
export interface Instrument {
    /**
     * Get instrument name.
     * @return - Instrument name.
     */
    getName(): string;
    
    /**
     * Play a note.
     * @param note - Note to play (e.g. "C4").
     * @param duration - Play duration in seconds.
     * @param volume - Linear volume in range [0, 1].
     */
    playNote(note: string, duration?: number, volume?: number): void;
    
    /**
     * Stop playback.
     */
    stop(): void;
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
export function registerInstrument(instr: Instrument): void {
    if (InstrumentList.some(instr2 => instr2.getName() === instr.getName())) {
        return;
    }

    InstrumentList.push(instr);

    setInstrument(instr.getName());
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
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    CurrentInstrument.playNote(getNoteName(note), duration, linearVolume);
}

/**
 * Stop playing on current instrument.
 */
export function stop() {
    CurrentInstrument.stop();
}
