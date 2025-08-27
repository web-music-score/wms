import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createCompleteRestsDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.GuitarTreble)
        .setHeader("Complete Rests")

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "G3", Theory.NoteLength.Whole)
        .completeRests()

        .addMeasure()
        .completeRests()

        .addMeasure()
        .addNote(0, "B3", Theory.NoteLength.Half)
        .completeRests()

        .addMeasure()
        .addNote(0, "G3", Theory.NoteLength.Half, { dotted: true })
        .completeRests()
        .endRow()

        .addMeasure()
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .completeRests()

        .addMeasure()
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .completeRests()

        .addMeasure()
        .addNote(0, "B3", Theory.NoteLength.Sixteenth)
        .completeRests()
        .endRow()

        .addMeasure()
        .addNote(0, "C4", Theory.NoteLength.Eighth, { stem: Score.Stem.Up })
        .addNote(1, "D3", Theory.NoteLength.Quarter, { stem: Score.Stem.Down })
        .completeRests()

        .addMeasure()
        .addNote(0, "E4", Theory.NoteLength.Half, { stem: Score.Stem.Up, dotted: true })
        .addNote(1, "F3", Theory.NoteLength.Half, { stem: Score.Stem.Down })
        .completeRests()

        .getDocument();
}
