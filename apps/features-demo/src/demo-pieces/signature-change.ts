import * as Score from "@tspro/web-music-score";

export function createSignatureChangeDemo() {
    let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

    doc.setHeader("Signature Change");

    doc.addMeasure()
        .setKeySignature("Db", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(100)
        .addNote(0, "Db3", Score.NoteLength.Quarter)
        .addNote(0, "Db3", Score.NoteLength.Quarter)
        .addNote(0, "Db3", Score.NoteLength.Quarter)
        .addNote(0, "Db3", Score.NoteLength.Quarter);

    doc.addMeasure()
        .setKeySignature("A", Score.ScaleType.Major)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .endRow();

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .addNote(0, "G3", Score.NoteLength.Quarter)
        .addNote(0, "G3", Score.NoteLength.Quarter)
        .addNote(0, "G3", Score.NoteLength.Quarter)
        .addNote(0, "G3", Score.NoteLength.Quarter);

    doc.addMeasure()
        .setTimeSignature("6/8")
        .setTempo(200)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth)
        .addNote(0, "G3", Score.NoteLength.Eighth)
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth);

    return doc;
}
