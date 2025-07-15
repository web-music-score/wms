import { Note, getDefaultScale, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { ClassicalGuitarInstrument } from "./classical-guitar";
import { SynthInstrument } from "./synth";
import { init as initCore } from "@tspro/web-music-score/core";

initCore();

/** @public */
export interface InstrumentInterface {
    playNote(note: string, duration?: number, volume?: number): void;
    stop(): void;
}

/** @public */
export enum Instrument {
    Synth,
    ClassicalGuitar
}

/** @public */
export const InstrumentList = Utils.Enum.getEnumValues(Instrument);

/** @public */
export const DefaultInstrument = Instrument.Synth;

let currentInstrument: InstrumentInterface = SynthInstrument;

/** @public */
export function validateInstrument(instr: number): Instrument {
    if (Instrument[instr]) {
        return instr as Instrument;
    }
    else {
        Assert.interrupt("Invalid instrument: " + instr);
    }
}

/** @public */
export function getInstrumentName(instr: Instrument) {
    switch (instr) {
        case Instrument.ClassicalGuitar:
            return "Classical Guitar";
        default:
            return Instrument[instr];
    }
}

/** @public */
export function setInstrument(instr: Instrument) {
    currentInstrument.stop();

    switch (instr) {
        case Instrument.ClassicalGuitar:
            currentInstrument = ClassicalGuitarInstrument;
            break;
        case Instrument.Synth:
            currentInstrument = SynthInstrument;
            break;
    }
}

function getNoteName(note: Note | number | string) {
    if (typeof note === "string") {
        return note;
    }
    else if (typeof note === "number") {
        note = getDefaultScale().getPreferredNote(note);
    }
    return note.format(PitchNotation.Scientific, SymbolSet.Ascii);
}

/** @public */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    currentInstrument.playNote(getNoteName(note), duration, linearVolume);
}

/** @public */
export function stop() {
    currentInstrument.stop();
}
