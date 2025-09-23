import * as Score from "@tspro/web-music-score/score";

export function createSignatureChangeDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Signature Change")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("Db", "Major")
        .setTimeSignature("4/4")
        .setTempo(100, "8...")
        .addNote(0, "Db3", "4n")
        .addNote(0, "Db3", "4n")
        .addNote(0, "Db3", "4n")
        .addNote(0, "Db3", "4n")

        .addMeasure()
        .setKeySignature("A", "Major")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "4n")
        .endRow()

        .addMeasure()
        .setKeySignature("G", "Major")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .setTimeSignature("6/8")
        .setTempo(200)
        .addNote(0, "G3", "8n")
        .addNote(0, "B3", "8n")
        .addNote(0, "D4", "8n")
        .addNote(0, "G3", "8n")
        .addNote(0, "B3", "8n")
        .addNote(0, "D4", "8n")

        .getDocument();
}
