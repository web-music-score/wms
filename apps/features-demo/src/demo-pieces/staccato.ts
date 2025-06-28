import * as Score from "@tspro/web-music-score";

export function createStaccatoDemo() {
    let doc = new Score.MDocument(Score.StaffKind.Treble);

    doc.setHeader("Staccato");

    doc.addMeasure()
        .setKeySignature("E", Score.ScaleType.NaturalMinor)
        .setTimeSignature("4/4")
        .addNote(0, "E4", Score.NoteLength.Eighth, { staccato: true })
        .addNote(0, "F#4", Score.NoteLength.Eighth, { staccato: true })
        .addNote(0, "G4", Score.NoteLength.Quarter, { staccato: true })
        .addNote(0, "B4", Score.NoteLength.Eighth, { staccato: true })
        .addNote(0, "C5", Score.NoteLength.Eighth, { staccato: true })
        .addNote(0, "D5", Score.NoteLength.Quarter, { staccato: true });

    doc.addMeasure()
        .addNote(0, "E4", Score.NoteLength.Eighth)
        .addNote(0, "F#4", Score.NoteLength.Eighth)
        .addNote(0, "G4", Score.NoteLength.Quarter)
        .addNote(0, "B4", Score.NoteLength.Eighth)
        .addNote(0, "C5", Score.NoteLength.Eighth)
        .addNote(0, "D5", Score.NoteLength.Quarter);


    return doc;
}
