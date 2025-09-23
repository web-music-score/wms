import * as Score from "@tspro/web-music-score/score";

export function createNoteHeadsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Note Heads")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("A", "Natural Minor")
        .setTimeSignature("4/4")
        .setTempo(80)
        .addNote(0, "A3", "1n")

        .addMeasure()
        .addNote(0, "A3", "2n")
        .addNote(0, "B3", "4n")
        .addNote(0, "A3", "8n")
        .addNote(0, "A3", "8n")

        .addMeasure()
        .addNote(0, "A3", "1n", { diamond: true })

        .addMeasure()
        .addNote(0, "A3", "2n", { diamond: true })
        .addNote(0, "B3", "4n", { diamond: true })
        .addNote(0, "A3", "8n", { diamond: true })
        .addNote(0, "A3", "8n", { diamond: true })

        .addMeasure()
        .addNote(0, "A3", "4.")
        .addNote(0, "A3", "4.")
        .addNote(0, "A3", "8n")
        .addNote(0, "A3", "8n")
        .endRow()

        .addMeasure()
        .setKeySignature("D", "Major")
        .setTimeSignature("3/4")
        .addNote(0, "D4", "4n", { stem: "up" })
        .addRest(1, "4n", { staffPos: "D3" })
        .addNote(0, "D3", "4n", { stem: "up" }) // Stem up... 
        .addNote(1, "D3", "4n", { stem: "down" }) // ...and down
        .addRest(1, "4n", { staffPos: "B3" })

        .addMeasure()
        .setKeySignature("G", "Major")
        .setTimeSignature("2/4")
        .addNote(0, "C3", "16n", { stem: "up" })
        .addNote(0, "E4", "16n")
        .addNote(0, "B2", "16n")
        .addNote(0, "D4", "16n")
        .addNote(0, "A2", "16n")
        .addNote(0, "C4", "16n")
        .addNote(0, "G2", "16n")
        .addNote(0, "B3", "16n")
        .addNote(1, "C3", "8n", { stem: "down" })
        .addNote(1, "B2", "8n")
        .addNote(1, "A2", "8n")
        .addNote(1, "G2", "8n")

        .addMeasure()
        .addChord(0, ["C3", "E3", "F#3", "A3", "B3", "C4"], "4n", { stem: "up" })
        .addChord(0, ["C3", "E3", "F#3", "A3", "B3", "C4"], "4n", { stem: "down" })

        .getDocument();
}
