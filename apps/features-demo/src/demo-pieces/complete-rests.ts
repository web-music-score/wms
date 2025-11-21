import * as Theory from "web-music-score/theory";
import * as Score from "web-music-score/score";

export function createCompleteRestsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Complete Rests")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "G3", "1n")
        .completeRests()

        .addMeasure()
        .completeRests()

        .addMeasure()
        .addNote(0, "B3", "2n")
        .completeRests()

        .addMeasure()
        .addNote(0, "G3", "2.")
        .completeRests()
        .endRow()

        .addMeasure()
        .addNote(0, "A3", "4n")
        .completeRests()

        .addMeasure()
        .addNote(0, "B3", "8n")
        .completeRests()

        .addMeasure()
        .addNote(0, "B3", Theory.NoteLength.Sixteenth)
        .completeRests()
        .endRow()

        .addMeasure()
        .addNote(0, "C4", "8n", { stem: "up" })
        .addNote(1, "D3", "4n", { stem: "down" })
        .completeRests()

        .addMeasure()
        .addNote(0, "E4", "2.", { stem: "up" })
        .addNote(1, "F3", "2n", { stem: "down" })
        .completeRests()

        .getDocument();
}
