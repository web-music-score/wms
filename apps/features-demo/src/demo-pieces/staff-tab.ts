import * as Score from "@tspro/web-music-score/score";

export function createStaffConfigTabDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Staff Config: Tab")
        .setScoreConfiguration("guitarTab")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("6/8")
        .addNote(0, "E2", "8n", { string: 6 })
        .addNote(0, "B2", "8n", { string: 5 })
        .addNote(0, "E3", "8n", { string: 4 })
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "B3", "8n", { string: 2 })
        .addNote(0, "E4", "8n", { string: 1 })

        .addMeasure()
        .addChord(0, ["E2", "B2", "E3", "G3", "B3", "E4"], "1n", { string: [6, 5, 4, 3, 2, 1], arpeggio: true })

        .getDocument();
}
