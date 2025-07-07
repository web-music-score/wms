import * as Score from "@tspro/web-music-score";

export function createGuitarTrebleAndTabDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab, { tuning: "Drop D" });

    doc.setHeader("Guitar Treble And Tab");

    doc.addMeasure()
        .setKeySignature("C", Score.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(60)
        .addRest(0, Score.NoteLength.Eighth, { hide: true }) // FIXME Kohotahti pakit menee väärin.
        .addNote(0, "G3", Score.NoteLength.Eighth, { string: 3 })
        .addNote(0, "G3", Score.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C4", Score.NoteLength.Eighth, { string: 2 });

    doc.addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addChord(0, ["E4", "C3"], Score.NoteLength.Eighth, { string: [1, 5] }).addLabel(Score.Label.Chord, "C")
        .addNote(0, "E3", Score.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Score.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C4", Score.NoteLength.Eighth, { string: 2 })
        .addChord(0, ["D4", "G3", "F3", "C3"], Score.NoteLength.Eighth, { string: [2, 3, 4, 5] }).addLabel(Score.Label.Chord, "Csus4")
        .addNote(0, "C4", Score.NoteLength.Eighth, { string: 2 })
        .addNote(0, "C4", Score.NoteLength.Eighth)
        .addNote(0, "A3", Score.NoteLength.Eighth, { string: 3 })

    doc.addMeasure()
        .addChord(0, ["G3", "C3"], Score.NoteLength.Eighth, { string: [3, 5] }).addLabel(Score.Label.Chord, "C")
        .addNote(0, "C4", Score.NoteLength.Eighth, { string: 2 })
        .addNote(0, "E3", Score.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Score.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C3", Score.NoteLength.Eighth, { string: 5 })
        .addNote(0, "C4", Score.NoteLength.Eighth, { string: 2 })
        .addChord(0, ["C4", "G3"], Score.NoteLength.Eighth, { string: [2, 3] })
        .addNote(0, "E4", Score.NoteLength.Eighth, { string: 1 })

    return doc;
}
