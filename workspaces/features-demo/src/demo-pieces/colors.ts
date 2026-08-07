import * as Score from "web-music-score/score";

export function createColorsDemo() {
    return new Score.DocumentBuilder({ color: "#345", background: "#abc" })
        .setHeader("Colors")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("G Major")
        .setTimeSignature(3, 4)
        .addNote(0, "G3", "4n", { color: "red" })
        .addNote(0, "G#3", "4n", { color: "green" })
        .addNote(0, "A3", "4n", { color: "blue" })

        .addMeasure()
        .addNote(0, "G3", "4n", { color: "yellow" }).addAnnotation("staccato")
        .addNote(0, "G#3", "4n", { color: "yellow" }).addAnnotation("staccato", { color: "black" })
        .addRest(0, "4n", { color: "yellow" })

        .addMeasure()
        .setTimeSignature("C")
        .addNote(0, "G3", "4n").addAnnotation("ppp", { color: "yellow" })
        .addNote(0, "G#3", "4n").addSpan("fff", span => span.beats(2), { color: "red" })
        .addNote(0, "A3", "4n")
        .addNote(0, "A3", "4n")

        .endRow()

        .addMeasure()
        .setTimeSignature(3, 4)
        .addNote(0, "G3", "4n", { color: "#f00" }).addConnective("tie", 3, "below", { color: "lime" })
        .addNote(0, "G3", "4n", { color: "#900" })
        .addNote(0, "G3", "4n", { color: "#500" })

        .addMeasure()
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addLyrics(1, "La", "4n", { hyphen: "-", color: "red" })
        .addLyrics(1, "la", "4n", { hyphen: "---", color: "red" })
        .addLyrics(1, "laa", "4n", { color: "red" })

        .getDocument();
}
