import * as Score from "@tspro/web-music-score";

export function createGuitarTabDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTab);

    doc.setHeader("Guitar Tab");

    doc.addMeasure()
        .setKeySignature("C", Score.ScaleType.Major)
        .setTimeSignature("6/8")
        .addNote(0, "E2", Score.NoteLength.Eighth, { string: 6 })
        .addNote(0, "B2", Score.NoteLength.Eighth, { string: 5 })
        .addNote(0, "E3", Score.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Score.NoteLength.Eighth, { string: 3 })
        .addNote(0, "B3", Score.NoteLength.Eighth, { string: 2 })
        .addNote(0, "E4", Score.NoteLength.Eighth, { string: 1 })

    doc.addMeasure()
        .addChord(0, ["E2", "B2", "E3", "G3", "B3", "E4"], Score.NoteLength.Whole, { string: [6, 5, 4, 3, 2, 1], arpeggio: true });

    return doc;
}
