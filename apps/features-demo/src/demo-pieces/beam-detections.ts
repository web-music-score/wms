import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createBeamDetectionDemo() {
    return new Score.DocumentBuilder(Score.StaffPreset.GuitarTreble)

        .setHeader("Beam Detection")

        .addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .setTimeSignature("2/4")
        .setTempo(80)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Quarter)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Eighth)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .endRow()

        .addMeasure()
        .addRest(0, Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addRest(0, Theory.NoteLength.Eighth)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth, { dotted: true })
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Eighth, { dotted: true })

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .endRow()

        // Test different time signatures

        .addMeasure()
        .setTimeSignature("2/4")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)

        .addMeasure()
        .setTimeSignature("6/8")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)

        .addMeasure()
        .setTimeSignature("9/8")
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "A3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .endRow()

        // Test beams fail cases

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.ThirtySecond)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Eighth, { dotted: true })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { dotted: true })
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)
        .addNote(0, "G3", Theory.NoteLength.Sixteenth)

        .getDocument();
}
