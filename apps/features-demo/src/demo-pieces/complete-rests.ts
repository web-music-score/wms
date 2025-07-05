import * as Score from "@tspro/web-music-score";

export function createCompleteRestsDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

    doc.setHeader("Complete Rests");

    doc.addMeasure()
        .setKeySignature("C", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "G3", Score.NoteLength.Whole)
        .completeRests();

    doc.addMeasure()
        .completeRests();

    doc.addMeasure()
        .addNote(0, "B3", Score.NoteLength.Half)
        .completeRests();

    doc.addMeasure()
        .addNote(0, "G3", Score.NoteLength.Half, { dotted: true })
        .completeRests()
        .endRow();

    doc.addMeasure()
        .addNote(0, "A3", Score.NoteLength.Quarter)
        .completeRests();

    doc.addMeasure()
        .addNote(0, "B3", Score.NoteLength.Eighth)
        .completeRests();

    doc.addMeasure()
        .addNote(0, "B3", Score.NoteLength.Sixteenth)
        .completeRests()
        .endRow();

    doc.addMeasure()
        .addNote(0, "C4", Score.NoteLength.Eighth, { stem: Score.Stem.Up })
        .addNote(1, "D3", Score.NoteLength.Quarter, { stem: Score.Stem.Down })
        .completeRests();

    doc.addMeasure()
        .addNote(0, "E4", Score.NoteLength.Half, { stem: Score.Stem.Up, dotted: true })
        .addNote(1, "F3", Score.NoteLength.Half, { stem: Score.Stem.Down })
        .completeRests();

    return doc;
}
