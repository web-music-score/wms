import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGuitarTrebleAndTabDemo() {
    let doc = new Score.MDocument(Score.StaffKind.GuitarTrebleAndTab, { tuning: "Drop D" });

    doc.setHeader("Guitar Treble And Tab");

    doc.addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(60)
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 });

    doc.addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addChord(0, ["E4", "C3"], Theory.NoteLength.Eighth, { string: [1, 5] }).addLabel(Score.Label.Chord, "C")
        .addNote(0, "E3", Theory.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addChord(0, ["D4", "G3", "F3", "C3"], Theory.NoteLength.Eighth, { string: [2, 3, 4, 5] }).addLabel(Score.Label.Chord, "Csus4")
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth, { string: 3 })

    doc.addMeasure()
        .addChord(0, ["G3", "C3"], Theory.NoteLength.Eighth, { string: [3, 5] }).addLabel(Score.Label.Chord, "C")
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addNote(0, "E3", Theory.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C3", Theory.NoteLength.Eighth, { string: 5 })
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addChord(0, ["C4", "G3"], Theory.NoteLength.Eighth, { string: [2, 3] })
        .addNote(0, "E4", Theory.NoteLength.Eighth, { string: 1 })

    return doc;
}
