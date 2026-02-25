import * as Score from "web-music-score/score";

export function createLyricsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Lyrics")
        .setScoreConfiguration("treble")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .addNote(0, "C4", "4n").addLyrics(1, "La", "4n")
        .addNote(0, "D4", "4n").addLyrics(1, "La", "4n")
        .addNote(0, "C4", "4n").addLyrics(1, "La", "4n")
        .addNote(0, "C4", "4n").addLyrics(1, "La", "4n")

        .addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "C4", "4n").addLyrics(1, "Right", "4n", { align: "right" })
        .addNote(0, "D4", "4n").addLyrics(1, "Center", "4n", { align: "center" })
        .addNote(0, "C4", "4n").addLyrics(1, "Left", "4n", { align: "left" })

        .addMeasure()
        .setTimeSignature("4/4")
        .addNote(0, "C4", "2n").addLyrics(1, "Hyp", "2n", { align: "center", hyphen: "-" })
        .addNote(0, "D4", "2n").addLyrics(1, "hen", "2n")

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "Ext", "2n", { hyphen: "---" })
        .addNote(0, "D4", "2n").addLyrics(1, "ender", "2n")
        .endRow()

        .addMeasure()
        .setTimeSignature("2/4")
        .addNote(0, "C4", "2n").addLyrics(1, "Hyp", "2n", { hyphen: "-" })

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "hen", "2n")

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "Ext", "2n", { hyphen: "---" })

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "ender", "2n")

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "Hyp", "2n", { hyphen: "-" })
        .endRow()

        .addMeasure()
        .addNote(0, "C4", "2n").addLyrics(1, "hen", "2n")


        .addMeasure()
        .addNote(0, "C4", "4n").addLyrics(1, "1. La", "4n").addLyrics(2, "2. Aa", "4n", { hyphen: "---" }).addLyrics(3, "3. Hal", "4n", { hyphen: "-" })
        .addNote(0, "D4", "4n").addLyrics(1, "La", "4n").addLyrics(2, "aa", "4n", { hyphen: "---" }).addLyrics(3, "le", "4n", { hyphen: "-" })
        .addNote(0, "C4", "4n").addLyrics(1, "La", "4n").addLyrics(2, "aa", "4n", { hyphen: "---" }).addLyrics(3, "lu", "4n", { hyphen: "-" })
        .addNote(0, "C4", "4n").addLyrics(1, "La", "4n").addLyrics(2, "aa", "4n").addLyrics(3, "jah.", "4n")

        .getDocument();
}
