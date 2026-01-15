import * as Theory from "web-music-score/theory";
import * as Score from "web-music-score/score";

export function createFillWithRestsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Fill With Rests")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("C")
        .setTempo(80)
        .addNote(0, "G3", "1n")
        .fillWithRests()

        .addMeasure()
        .fillWithRests()

        .addMeasure()
        .addNote(0, "B3", "2n")
        .fillWithRests()

        .addMeasure()
        .addNote(0, "G3", "2.")
        .fillWithRests()
        .endRow()

        .addMeasure()
        .addNote(0, "A3", "4n")
        .fillWithRests()

        .addMeasure()
        .addNote(0, "B3", "8n")
        .fillWithRests()

        .addMeasure()
        .addNote(0, "B3", Theory.NoteLength.Sixteenth)
        .fillWithRests()
        .endRow()

        .addMeasure()
        .addNote(0, "C4", "8n", { stem: "up" })
        .addNote(1, "D3", "4n", { stem: "down" })
        .fillWithRests()

        .addMeasure()
        .addNote(0, "E4", "2.", { stem: "up" })
        .addNote(1, "F3", "2n", { stem: "down" })
        .fillWithRests()

        .getDocument();
}
