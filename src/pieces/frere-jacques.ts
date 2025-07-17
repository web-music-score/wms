import { NoteLength, ScaleType } from "@tspro/web-music-score/theory";
import { MDocument, StaffPreset } from "@tspro/web-music-score/score";

/** @public */
export function createFrereJacques(): MDocument {
    let doc = new MDocument(StaffPreset.GuitarTreble);

    doc.setHeader("Frere Jacques");

    doc.addMeasure()
        .setKeySignature("G", ScaleType.Major)
        .setTimeSignature("4/4")
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "A3", NoteLength.Quarter)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "A3", NoteLength.Quarter)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "C4", NoteLength.Quarter)
        .addNote(0, "D4", NoteLength.Half)
        .endRow();

    doc.addMeasure()
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "C4", NoteLength.Quarter)
        .addNote(0, "D4", NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "C4", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter)
        .endRow();

    doc.addMeasure()
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "C4", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter);

    doc.addMeasure()
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "D3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Half);

    doc.addMeasure()
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "D3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Half);

    return doc;
}
