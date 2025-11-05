import * as Score from "@tspro/web-music-score/score";

export function createNoteOptionsDemo() {
    return new Score.DocumentBuilder()
        .setScoreConfiguration("treble")
        .setHeader("Note Options")

        .addMeasure()
        .setKeySignature("E Natural Minor")
        .setTimeSignature("4/4")

        .addNote(0, "B4", "4n", { stem: "up" }).addLyrics(1, "4n", "stem", { align: "left" })
        .addNote(1, "E4", "4n", { stem: "down" })
        .addNote(0, "B4", "4n")
        .addNote(1, "E4", "4n")

        .addMeasure()
        .addNote(0, "B4", "4n", { color: "red" }).addLyrics(1, "4n", "color")
        .addNote(1, "E4", "4n", { color: "green" })
        .addNote(0, "B4", "4n", { color: "blue" })
        .addNote(1, "E4", "4n", { color: "yellow" })

        .addMeasure()
        .addChord(0, ["C4", "E4", "G4", "B4", "C5"], "2n", { arpeggio: "up" }).addLyrics(1, "2n", "arpeggio")
        .addChord(0, ["C4", "E4", "G4", "B4", "C5"], "2n", { arpeggio: "down" })

        .addMeasure()
        .addNote(0, "E4", "8n", { staccato: true, stem: "up" }).addLyrics(1, "8n", "staccato")
        .addNote(0, "F#4", "8n", { staccato: true })
        .addNote(0, "G4", "4n", { staccato: true })
        .addNote(0, "B4", "8n", { staccato: true, stem: "down" })
        .addNote(0, "C5", "8n", { staccato: true })
        .addNote(0, "D5", "4n", { staccato: true })

        .addMeasure()
        .addNote(0, "E4", "8n", { diamond: true }).addLyrics(1, "8n", "diamond")
        .addNote(0, "F#4", "8n", { diamond: true })
        .addNote(0, "G4", "4n", { diamond: true })
        .addNote(0, "B4", "8n", { diamond: true })
        .addNote(0, "C5", "8n", { diamond: true })
        .addNote(0, "D5", "4n", { diamond: true })
        .endRow()

        .addMeasure()
        .addNote(0, "E4", "1n", { stem: "up" }).addLyrics(1, "8n", "notes lengths")

        .addMeasure()
        .addNote(0, "E4", "2n")
        .addNote(0, ["E4", "E4"], "4n")

        .addMeasure()
        .addNote(0, ["E4", "E4"], "8n")
        .addNote(0, ["E4", "E4", "E4", "E4"], "16n")
        .completeRests()

        .addMeasure()
        .addNote(0, ["E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4"], "32n")
        .completeRests()

        .endRow()

        .addMeasure()
        .addNote(0, ["E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4", "E4"], "64n")
        .completeRests()

        .addMeasure()
        .addNote(0, "E4", "8n").addLyrics(1, "8n", "flags")
        .addNote(0, "E4", "16n").addLyrics(1, "16n")
        .addNote(0, "E4", "32n").addLyrics(1, "32n")
        .addNote(0, "E4", "64n").addLyrics(1, "64n")
        .addNote(0, "E4", "8.").addLyrics(1, "8n", "dots")
        .addNote(0, "E4", "8..")
        .addNote(0, "E4", "8...")
        .completeRests()

        .endRow()

        .setScoreConfiguration("guitarTreble")
        .addMeasure()
        .setKeySignature("D Major")
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
        .endRow()

        .addMeasure()
        .setKeySignature("C Major")
        .addNote(0, "Gbb3", "4n")
        .addNote(0, "Gb3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G3", "4n")
        .addNote(0, "G#3", "4n")
        .addNote(0, "Gx3", "4n")

        .getDocument();
}
