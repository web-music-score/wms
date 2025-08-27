import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createFermataDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration(Score.StaffPreset.Bass)
        .setHeader("Fermata")

        .addMeasure()
        .setKeySignature("C", Theory.ScaleType.Major)
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "C3", Theory.NoteLength.Eighth)
        .addNote(0, "D3", Theory.NoteLength.Eighth)
        .addNote(0, "C3", Theory.NoteLength.Quarter)
        .addNote(0, "C3", Theory.NoteLength.Eighth)
        .addNote(0, "D3", Theory.NoteLength.Eighth)
        .addNote(0, "C3", Theory.NoteLength.Quarter)
        .addFermata(Score.Fermata.AtMeasureEnd)

        .addMeasure()
        .addNote(0, "C3", Theory.NoteLength.Eighth)
        .addNote(0, "D3", Theory.NoteLength.Eighth)
        .addNote(0, "C3", Theory.NoteLength.Quarter).addFermata()
        .addNote(0, "C3", Theory.NoteLength.Eighth)
        .addNote(0, "D3", Theory.NoteLength.Eighth)
        .addNote(0, "C3", Theory.NoteLength.Quarter).addFermata(Score.Fermata.AtNote)

        .addMeasure()
        .addNote(0, "C3", Theory.NoteLength.Eighth)
        .addNote(0, "D3", Theory.NoteLength.Eighth)
        .addRest(0, Theory.NoteLength.Quarter).addFermata()
        .addNote(0, "C3", Theory.NoteLength.Eighth)
        .addNote(0, "D3", Theory.NoteLength.Eighth)
        .addRest(0, Theory.NoteLength.Quarter)
        .addFermata(Score.Fermata.AtMeasureEnd)

        .getDocument();
}
