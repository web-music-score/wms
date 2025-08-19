import { NoteLength, ScaleType } from "@tspro/web-music-score/theory";
import { DocumentBuilder, MDocument, StaffPreset } from "@tspro/web-music-score/score";

/** @public */
export function createFrereJacques(): MDocument {
    return new DocumentBuilder(StaffPreset.GuitarTreble)

        .setHeader("Frere Jacques")

        .addMeasure()
        .setKeySignature("G", ScaleType.Major)
        .setTimeSignature("4/4")
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "A3", NoteLength.Quarter)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "A3", NoteLength.Quarter)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "C4", NoteLength.Quarter)
        .addNote(0, "D4", NoteLength.Half)
        .endRow()

        .addMeasure()
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "C4", NoteLength.Quarter)
        .addNote(0, "D4", NoteLength.Half)

        .addMeasure()
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "C4", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter)
        .endRow()

        .addMeasure()
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "E4", NoteLength.Eighth)
        .addNote(0, "D4", NoteLength.Eighth)
        .addNote(0, "C4", NoteLength.Eighth)
        .addNote(0, "B3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "D3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Half)

        .addMeasure()
        .addNote(0, "G3", NoteLength.Quarter)
        .addNote(0, "D3", NoteLength.Quarter)
        .addNote(0, "G3", NoteLength.Half)

        .getDocument();
}
