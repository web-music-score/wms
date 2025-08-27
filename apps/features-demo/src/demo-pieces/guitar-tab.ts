import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGuitarTabDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.GuitarTab)
        .setHeader("Guitar Tab")

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("6/8")
        .addNote(0, "E2", Theory.NoteLength.Eighth, { string: 6 })
        .addNote(0, "B2", Theory.NoteLength.Eighth, { string: 5 })
        .addNote(0, "E3", Theory.NoteLength.Eighth, { string: 4 })
        .addNote(0, "G3", Theory.NoteLength.Eighth, { string: 3 })
        .addNote(0, "B3", Theory.NoteLength.Eighth, { string: 2 })
        .addNote(0, "E4", Theory.NoteLength.Eighth, { string: 1 })

        .addMeasure()
        .addChord(0, ["E2", "B2", "E3", "G3", "B3", "E4"], Theory.NoteLength.Whole, { string: [6, 5, 4, 3, 2, 1], arpeggio: true })

        .getDocument();
}
