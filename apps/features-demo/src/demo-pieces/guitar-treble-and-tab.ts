import * as Score from "@tspro/web-music-score";

export function createGuitarTrebleAndTabDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab);

    doc.setHeader("Guitar Treble And Tab");

    doc.addMeasure()
        .setKeySignature("G", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNavigation(Score.Navigation.StartRepeat)
        .addChord(0, ["G2", "B3"], Score.NoteLength.Eighth, { string: [6, 2] })
        .addNote(0, "B3", Score.NoteLength.Eighth, { string: 2 })
        .addNote(0, "D3", Score.NoteLength.Eighth, { string: 4})
        .addNote(0, "B3", Score.NoteLength.Eighth, { string: 2 })
        .addNote(0, "G2", Score.NoteLength.Eighth, { string: 6 })
        .addNote(0, "A3", Score.NoteLength.Eighth, { string: 3 })
        .addChord(0, ["D3", "B3"], Score.NoteLength.Quarter, { string: [4, 2] });

    return doc;
}
