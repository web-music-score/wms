import { Accidental, Note } from "@tspro/web-music-score/theory";
import { ObjMeasure } from "./obj-measure";

export class AccidentalState {
    private readonly accidentalByPitch: Accidental[] = [];

    constructor(readonly measure: ObjMeasure) { }

    getAccidentalFromKeySignature(pitch: number) {
        let ks = this.measure.getKeySignature();
        let accNote = ks.getOrderedAccidentalNotes().find(accNote => accNote.diatonicClass === Note.getDiatonicClass(pitch));
        return accNote ? accNote.accidental : undefined;
    }

    setAccidental(note: Note) {
        this.accidentalByPitch[note.pitch] = note.accidental;
    }

    needAccidental(note: Note) {
        let currentAccidental = this.accidentalByPitch[note.pitch] ?? this.getAccidentalFromKeySignature(note.pitch) ?? 0;

        return note.accidental !== currentAccidental;
    }
}
