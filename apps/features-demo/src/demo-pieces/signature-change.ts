import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createSignatureChangeDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

    doc.setHeader("Signature Change");

    doc.addMeasure()
        .setKeySignature("Db", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(100)
        .addNote(0, "Db3", Theory.NoteLength.Quarter)
        .addNote(0, "Db3", Theory.NoteLength.Quarter)
        .addNote(0, "Db3", Theory.NoteLength.Quarter)
        .addNote(0, "Db3", Theory.NoteLength.Quarter);

    doc.addMeasure()
        .setKeySignature("A", Theory.ScaleType.Major)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .endRow();

    doc.addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter);

    doc.addMeasure()
        .setTimeSignature("6/8")
        .setTempo(200)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth);

    return doc;
}
