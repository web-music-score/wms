import { Note, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { Synthesizer } from "./synth";
import { init as initCore } from "@tspro/web-music-score/core";

initCore();

function getNoteName(note: Note | number | string) {
    if (typeof note === "string") {
        return note;
    }
    else if (typeof note === "number") {
        note = Note.getChromaticNote(note);
    }
    return note.format(PitchNotation.Scientific, SymbolSet.Ascii);
}

/** @public */
export interface Instrument {
    getName(): string;
    playNote(note: string, duration?: number, volume?: number): void;
    stop(): void;
}

const InstrumentList: Instrument[] = [Synthesizer];
let CurrentInstrument: Instrument = Synthesizer;

/** @public */
export function getInstrumentList(): ReadonlyArray<string> {
    return InstrumentList.map(instr => instr.getName());
}

/** @public */
export function getCurrentInstrument(): string {
    return CurrentInstrument.getName();
}

/** @public */
export function registerInstrument(instr: Instrument) {
    if (InstrumentList.some(instr2 => instr2.getName() === instr.getName())) {
        return;
    }

    InstrumentList.push(instr);

    setInstrument(instr.getName());
}


/** @public */
export function setInstrument(instrName: string) {
    if (instrName === CurrentInstrument.getName()) {
        return;
    }

    CurrentInstrument.stop();

    let instr = InstrumentList.find(instr => instr.getName() === instrName);

    if (instr) {
        CurrentInstrument = instr;
    }
}

/** @public */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    CurrentInstrument.playNote(getNoteName(note), duration, linearVolume);
}

/** @public */
export function stop() {
    CurrentInstrument.stop();
}
