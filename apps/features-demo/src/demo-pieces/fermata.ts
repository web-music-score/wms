import * as Score from "@tspro/web-music-score";

export function createFermataDemo() {
    let doc = new Score.MDocument(Score.StaffKind.Bass);

    doc.setHeader("Fermata");

    doc.addMeasure()
        .setKeySignature("C", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "C3", Score.NoteLength.Eighth)
        .addNote(0, "D3", Score.NoteLength.Eighth)
        .addNote(0, "C3", Score.NoteLength.Quarter)
        .addNote(0, "C3", Score.NoteLength.Eighth)
        .addNote(0, "D3", Score.NoteLength.Eighth)
        .addNote(0, "C3", Score.NoteLength.Quarter)
        .addFermata(Score.Fermata.AtMeasureEnd);

    doc.addMeasure()
        .addNote(0, "C3", Score.NoteLength.Eighth)
        .addNote(0, "D3", Score.NoteLength.Eighth)
        .addNote(0, "C3", Score.NoteLength.Quarter).addFermata()
        .addNote(0, "C3", Score.NoteLength.Eighth)
        .addNote(0, "D3", Score.NoteLength.Eighth)
        .addNote(0, "C3", Score.NoteLength.Quarter).addFermata(Score.Fermata.AtNote);

    doc.addMeasure()
        .addNote(0, "C3", Score.NoteLength.Eighth)
        .addNote(0, "D3", Score.NoteLength.Eighth)
        .addRest(0, Score.NoteLength.Quarter).addFermata()
        .addNote(0, "C3", Score.NoteLength.Eighth)
        .addNote(0, "D3", Score.NoteLength.Eighth)
        .addRest(0, Score.NoteLength.Quarter)
        .addFermata(Score.Fermata.AtMeasureEnd);

    return doc;
}
