import { getDefaultScale } from "../theory/scale";
import { PitchNotation, SymbolSet } from "../theory/types";
import { Note } from "../theory/note";
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { ClassicalGuitarInstrument } from "./classical-guitar/classical-guitar";
import { SynthInstrument } from "./synth/synth";

/** @public */
export interface InstrumentInterface {
    playNote(note: string, duration?: number, volume?: number): void;
    stop(): void;
}

/** @public */
export namespace Audio {
    export enum Instrument {
        Synth,
        ClassicalGuitar
    }

    export const InstrumentList = Utils.Enum.getEnumValues(Instrument);
    export const DefaultInstrument = Instrument.Synth;

    let currentInstrument: InstrumentInterface = SynthInstrument;

    export function validateInstrument(instr: number): Instrument {
        if (Instrument[instr]) {
            return instr as Instrument;
        }
        else {
            Assert.interrupt("Invalid instrument: " + instr);
        }
    }

    export function getInstrumentName(instr: Instrument) {
        switch (instr) {
            case Instrument.ClassicalGuitar:
                return "Classical Guitar";
            default:
                return Instrument[instr];
        }
    }

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

    export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
        currentInstrument.playNote(getNoteName(note), duration, linearVolume);
    }

    export function stop() {
        currentInstrument.stop();
    }
}
