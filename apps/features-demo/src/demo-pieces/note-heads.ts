import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createNoteHeadsDemo() {
    return new Score.DocumentBuilder(Score.StaffPreset.GuitarTreble)

        .setHeader("Note Heads")

        .addMeasure()
        .setKeySignature("A", Theory.ScaleType.NaturalMinor)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "A3", Theory.NoteLength.Whole)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Half)
        .addNote(0, "B3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Whole, { diamond: true })

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Half, { diamond: true })
        .addNote(0, "B3", Theory.NoteLength.Quarter, { diamond: true })
        .addNote(0, "A3", Theory.NoteLength.Eighth, { diamond: true })
        .addNote(0, "A3", Theory.NoteLength.Eighth, { diamond: true })

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter, { dotted: true })
        .addNote(0, "A3", Theory.NoteLength.Quarter, { dotted: true })
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .endRow()

        .addMeasure()
        .setKeySignature("D", Theory.ScaleType.Major)
        .setTimeSignature("3/4")
        .addNote(0, "D4", Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addRest(1, Theory.NoteLength.Quarter, { staffPos: "D3" })
        .addNote(0, "D3", Theory.NoteLength.Quarter, { stem: Score.Stem.Up }) // Stem up... 
        .addNote(1, "D3", Theory.NoteLength.Quarter, { stem: Score.Stem.Down }) // ...and down
        .addRest(1, Theory.NoteLength.Quarter, { staffPos: "B3" })

        .addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .setTimeSignature("2/4")
        .addNote(0, "C3", Theory.NoteLength.Sixteenth, { stem: Score.Stem.Up })
        .addNote(0, "E4", Theory.NoteLength.Sixteenth)
        .addNote(0, "B2", Theory.NoteLength.Sixteenth)
        .addNote(0, "D4", Theory.NoteLength.Sixteenth)
        .addNote(0, "A2", Theory.NoteLength.Sixteenth)
        .addNote(0, "C4", Theory.NoteLength.Sixteenth)
        .addNote(0, "G2", Theory.NoteLength.Sixteenth)
        .addNote(0, "B3", Theory.NoteLength.Sixteenth)
        .addNote(1, "C3", Theory.NoteLength.Eighth, { stem: Score.Stem.Down })
        .addNote(1, "B2", Theory.NoteLength.Eighth)
        .addNote(1, "A2", Theory.NoteLength.Eighth)
        .addNote(1, "G2", Theory.NoteLength.Eighth)

        .addMeasure()
        .addChord(0, ["C3", "E3", "F#3", "A3", "B3", "C4"], Theory.NoteLength.Quarter, { stem: Score.Stem.Up })
        .addChord(0, ["C3", "E3", "F#3", "A3", "B3", "C4"], Theory.NoteLength.Quarter, { stem: Score.Stem.Down })

        .getDocument();
}
