import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGuitarCombinedDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration([
            { type: "staff", clef: Score.Clef.G, isOctaveDown: true, voiceIds: [0, 1] },
            { type: "tab", tuning: "Drop D", voiceIds: [0, 1] }
        ])
        .setHeader("Guitar Combined")

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(60)
        .addNote(1, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(1, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(1, "C4", Theory.NoteLength.Eighth, { string: 2 })

        .addMeasure()
        .addNavigation(Score.Navigation.StartRepeat)
        .addChord(0, ["E4", "C3"], Theory.NoteLength.Eighth, { string: [1, 5] }).addLabel(Score.Label.Chord, "C")
        .addNote(0, "E3", Theory.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addChord(0, ["D4", "G3", "F3", "C3"], Theory.NoteLength.Eighth, { string: [2, 3, 4, 5] }).addLabel(Score.Label.Chord, "Csus4")
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addNote(0, "C4", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth, { string: 3 })

        .addMeasure()
        .addChord(0, ["G3", "C3"], Theory.NoteLength.Eighth, { string: [3, 5] }).addLabel(Score.Label.Chord, "C")
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addNote(0, "E3", Theory.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "C3", Theory.NoteLength.Eighth, { string: 5 })
        .addNote(0, "C4", Theory.NoteLength.Eighth, { string: 2 })
        .addChord(0, ["C4", "G3"], Theory.NoteLength.Eighth, { string: [2, 3] })
        .addNote(0, "E4", Theory.NoteLength.Eighth, { string: 1 })
        .endRow()

        .addMeasure()
        .addNote(0, "F3", Theory.NoteLength.Half, { string: 4 }).addConnective(Score.Connective.Tie)
        .addNote(0, "F3", Theory.NoteLength.Half, { string: 4 })

        .addMeasure()
        .addNote(0, "F3", Theory.NoteLength.Quarter, { string: 4 }).addConnective(Score.Connective.Slur)
        .addNote(0, "A3", Theory.NoteLength.Quarter, { string: 4 })
        .addNote(0, "A3", Theory.NoteLength.Quarter, { string: 4 }).addConnective(Score.Connective.Slur)
        .addNote(0, "F3", Theory.NoteLength.Quarter, { string: 4 })

        .addMeasure()
        .addNote(0, "F3", Theory.NoteLength.Quarter, { string: 4 }).addConnective(Score.Connective.Slide)
        .addNote(0, "A3", Theory.NoteLength.Quarter, { string: 4 })
        .addNote(0, "A3", Theory.NoteLength.Quarter, { string: 4 }).addConnective(Score.Connective.Slide)
        .addNote(0, "F3", Theory.NoteLength.Quarter, { string: 4 })
        .endRow()

        .addMeasure()
        .addNote(0, "F3", Theory.NoteLength.Half, { string: 4 }).addConnective(Score.Connective.Tie, Score.TieType.Stub)
        .addNote(0, "A3", Theory.NoteLength.Half, { string: 4 }).addConnective(Score.Connective.Tie)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Half, { string: 4 })
        .addNote(0, "F3", Theory.NoteLength.Half, { string: 4 }).addConnective(Score.Connective.Tie, Score.TieType.ToMeasureEnd)

        .getDocument();
}
