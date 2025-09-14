import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createSignatureChangeDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.GuitarTreble)
        .setHeader("Signature Change")

        .addMeasure()
        .setKeySignature("Db", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(100, "8...")
        .addNote(0, "Db3", Theory.NoteLength.Quarter)
        .addNote(0, "Db3", Theory.NoteLength.Quarter)
        .addNote(0, "Db3", Theory.NoteLength.Quarter)
        .addNote(0, "Db3", Theory.NoteLength.Quarter)

        .addMeasure()
        .setKeySignature("A", Theory.ScaleType.Major)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .addNote(0, "A3", Theory.NoteLength.Quarter)
        .endRow()

        .addMeasure()
        .setKeySignature("G", Theory.ScaleType.Major)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter)
        .addNote(0, "G3", Theory.NoteLength.Quarter)

        .addMeasure()
        .setTimeSignature("6/8")
        .setTempo(200)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth)
        .addNote(0, "G3", Theory.NoteLength.Eighth)
        .addNote(0, "B3", Theory.NoteLength.Eighth)
        .addNote(0, "D4", Theory.NoteLength.Eighth)

        .getDocument();
}
