import * as Score from "web-music-score/score";

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
        .endRow()

        .addMeasure()
        .setTimeSignature("2/4")
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "Hyp", { hyphen: "-" })

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "hen")

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "Ext", { hyphen: "---" })

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "ender")

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "Hyp", { hyphen: "-" })
        .endRow()

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "2n", "hen")


        .addMeasure()
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "1. La").addLyrics(2, "4n", "2. Aa", { hyphen: "---" }).addLyrics(3, "4n", "3. Hal", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "4n", "La").addLyrics(2, "4n", "aa", { hyphen: "---" }).addLyrics(3, "4n", "le", { hyphen: "-" })
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "La").addLyrics(2, "4n", "aa", { hyphen: "---" }).addLyrics(3, "4n", "lu", { hyphen: "-" })
        .addNote(0, "C4", "4n").addLyrics(1, "4n", "La").addLyrics(2, "4n", "aa").addLyrics(3, "4n", "jah.")

        .getDocument();
}
