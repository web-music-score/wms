import { Accidental, Note } from "web-music-score/theory";
import { ObjMeasure } from "./obj-measure";

export class AccidentalState {
    private readonly accidentalByDiatonicId: Accidental[] = [];

    constructor(readonly measure: ObjMeasure) { }

    getAccidentalFromKeySignature(diatonicId: number) {
        let ks = this.measure.getKeySignature();
        let accNote = ks.getOrderedAccidentalNotes().find(accNote => accNote.diatonicClass === Note.getDiatonicClass(diatonicId));
        return accNote ? accNote.accidental : undefined;
    }

    setAccidental(note: Note) {
        this.accidentalByDiatonicId[note.diatonicId] = note.accidental;
    }

    needAccidental(note: Note) {
        let currentAccidental = this.accidentalByDiatonicId[note.diatonicId] ?? this.getAccidentalFromKeySignature(note.diatonicId) ?? 0;

        return note.accidental !== currentAccidental;
    }
}
