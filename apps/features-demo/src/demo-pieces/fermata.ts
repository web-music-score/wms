import * as Score from "web-music-score/score";

export function createFermataDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Fermata")
        .setScoreConfiguration("bass")

        .addStaffGroup("doubleFermata", 0, "both")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n")
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n")
        .addFermata("atMeasureEnd")

        .addMeasure()
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n").addFermata()
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addNote(0, "C3", "4n").addFermata("atNote")

        .addMeasure()
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addRest(0, "4n").addFermata()
        .addNote(0, "C3", "8n")
        .addNote(0, "D3", "8n")
        .addRest(0, "4n")
        .addFermataTo("doubleFermata", "atMeasureEnd")

        .getDocument();
}
