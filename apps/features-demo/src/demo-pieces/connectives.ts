import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createConnectivesDemo() {
    return new Score.DocumentBuilder(Score.StaffPreset.Treble)

        .setHeader("Connectives")

        .addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.Below)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.Below)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.Above)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.Above)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.Center)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.Center)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .addMeasure()
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.StemTip)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "G4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Slur, 2, Score.NoteAnchor.StemTip)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })
        .endRow()

        .addMeasure()
        .setKeySignature("D", Theory.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(1, "G3", Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Down })
        .addRest(0, Theory.NoteLength.Quarter, { staffPos: "D5" })
        .addChord(0, ["A4", "B4"], Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Tie)
        .addChord(0, ["G4", "B4"], Theory.NoteLength.Quarter)

        .addMeasure()
        .addNote(1, "D4", Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Down }).addConnective(Score.Connective.Tie, 2, Score.NoteAnchor.Below)
        .addRest(0, Theory.NoteLength.Half, { staffPos: "D5" })
        .addChord(0, ["A4", "C#5", "F#5"], Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Tie, 2)

        .addMeasure()
        .addNote(1, "D4", Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Down })
        .addChord(0, ["A4", "C#5", "F#5"], Theory.NoteLength.Half, { dotted: true, stem: Score.Stem.Up })

        .addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Half, { dotted: true }).addConnective(Score.Connective.Tie, 3)
        .endRow()

        .addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Half, { dotted: true })

        .addMeasure()
        .addNote(0, "D4", Theory.NoteLength.Half, { dotted: true })
        .endRow()

        .addMeasure()
        .setKeySignature("E", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .addNote(0, "E4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 2)
        .addNote(0, "F#4", Theory.NoteLength.Eighth)
        .addNote(0, "G#4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 2)
        .addNote(0, "A4", Theory.NoteLength.Eighth)
        .addNote(0, "B4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 4)
        .addNote(0, "C#5", Theory.NoteLength.Eighth)
        .addNote(0, "D#5", Theory.NoteLength.Eighth)
        .addNote(0, "E5", Theory.NoteLength.Eighth)

        .addMeasure()
        .addNote(0, "E4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 8)
        .addNote(0, "F#4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 2)
        .addNote(0, "G#4", Theory.NoteLength.Eighth)
        .addNote(0, "A4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 2)
        .addNote(0, "B4", Theory.NoteLength.Eighth)
        .addNote(0, "C#5", Theory.NoteLength.Eighth).addConnective(Score.Connective.Slur, 2)
        .addNote(0, "D#5", Theory.NoteLength.Eighth)
        .addNote(0, "E5", Theory.NoteLength.Eighth)
        .endRow()

        .addMeasure()
        .setTimeSignature("3/4")
        .setKeySignature("C", Theory.ScaleType.Major)
        .addNote(0, "A4", Theory.NoteLength.Half)
        .addNote(0, "E5", Theory.NoteLength.Quarter)
        .addNote(1, "A3", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Tie, Score.TieType.Stub, Score.NoteAnchor.Below)
        .addNote(1, "E4", Theory.NoteLength.Half)

        .addMeasure()
        .addNote(0, "A4", Theory.NoteLength.Eighth)
        .addNote(0, "E4", Theory.NoteLength.Eighth)
        .addNote(0, "A4", Theory.NoteLength.Eighth)
        .addNote(0, "B4", Theory.NoteLength.Eighth).addConnective(Score.Connective.Tie, Score.TieType.ToMeasureEnd)
        .addNote(0, "C5", Theory.NoteLength.Eighth).addConnective(Score.Connective.Tie, Score.TieType.ToMeasureEnd)
        .addNote(0, "E5", Theory.NoteLength.Eighth).addConnective(Score.Connective.Tie, Score.TieType.ToMeasureEnd)
        .addNote(1, "A3", Theory.NoteLength.Half, { dotted: true }).addConnective(Score.Connective.Tie, 2, Score.NoteAnchor.Below)

        .addMeasure()
        .addNote(0, "A4", Theory.NoteLength.Half, { dotted: true })
        .addNote(1, "A3", Theory.NoteLength.Half, { dotted: true })
        .endRow()

        .addMeasure()
        .addNote(0, "F4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Slide, Score.NoteAnchor.Center)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "F4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Slide, Score.NoteAnchor.Center)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .addMeasure()
        .addNote(0, "F4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }).addConnective(Score.Connective.Slide, Score.NoteAnchor.Below)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addNote(0, "F4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }).addConnective(Score.Connective.Slide, Score.NoteAnchor.Above)
        .addNote(0, "A4", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .getDocument();
}
