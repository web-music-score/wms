import * as Score from "@tspro/web-music-score";

export function createGuitarTrebleAndTabDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab);

    doc.setHeader("Guitar Treble And Tab");

    doc.addMeasure()
        .setKeySignature("C", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNavigation(Score.Navigation.StartRepeat)
        .addNote(0, "C4", Score.NoteLength.Eighth, { string: 1 })
        .addNote(0, "D4", Score.NoteLength.Eighth, { string: 3 })
        .addChord(0, ["C4", "E4"], Score.NoteLength.Quarter, { string: [2, 1] })
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "D4", Score.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C4", Score.NoteLength.Quarter, { string: 4 });

    doc.addMeasure()
        .addNote(0, "E4", Score.NoteLength.Whole)
        .addNavigation(Score.Navigation.EndRepeat);

    return doc;
}
