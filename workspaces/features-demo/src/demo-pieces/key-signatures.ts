import * as Score from "web-music-score/score";

export function createKeySignaturesDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Key Signatures")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("C Major")
        .setTimeSignature("2/4")
        .setTempo(100, "8...")
        .addNote(0, "C3", "2n")

        .addMeasure()
        .setKeySignature("G Major")
        .addNote(0, "G3", "2n")

        .addMeasure()
        .setKeySignature("D Major")
        .addNote(0, "D3", "2n")

        .addMeasure()
        .setKeySignature("A Major")
        .addNote(0, "A3", "2n")
        .endRow()

        .addMeasure()
        .setKeySignature("E Major")
        .addNote(0, "E3", "2n")

        .addMeasure()
        .setKeySignature("B Major")
        .addNote(0, "B3", "2n")

        .addMeasure()
        .setKeySignature("F# Major")
        .addNote(0, "F#3", "2n")

        .addMeasure()
        .setKeySignature("C# Major")
        .addNote(0, "C#3", "2n")

        .endRow()

        .addMeasure()
        .setKeySignature("F Major")
        .setTimeSignature("4/4")
        .setTempo(200, "4n")
        .addNote(0, "F3", "1n")

        .addMeasure()
        .setKeySignature("Bb Major")
        .addNote(0, "Bb3", "1n")

        .addMeasure()
        .setKeySignature("Eb Major")
        .addNote(0, "Eb3", "1n")

        .addMeasure()
        .setKeySignature("Ab Major")
        .addNote(0, "Ab3", "1n")
        .endRow()

        .addMeasure()
        .setKeySignature("Db Major")
        .addNote(0, "Db3", "1n")

        .addMeasure()
        .setKeySignature("Gb Major")
        .addNote(0, "Gb3", "1n")

        .addMeasure()
        .setKeySignature("Cb Major")
        .addNote(0, "Cb3", "1n")

        .getDocument();
}
