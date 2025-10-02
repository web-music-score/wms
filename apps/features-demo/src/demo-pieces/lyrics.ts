import * as Score from "@tspro/web-music-score/score";

export function createLyricsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Lyrics")
        .setScoreConfiguration("treble")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "La")
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "La")
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "La")
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "La")

        .addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "Right", { align: "right" })
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "Center", { align: "center" })
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "Left", { align: "left" })

        .addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "Hyp", { align: "center", hyphen: "-" })
        .addNote(0, "D4", "2n").addLyrics(1, "2n", "hen")

                .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "Ext", { hyphen: "---" })
        .addNote(0, "D4", "2n").addLyrics(1, "2n", "ender")

        .getDocument();
}
