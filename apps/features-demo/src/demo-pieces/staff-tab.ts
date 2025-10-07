import * as Score from "@tspro/web-music-score/score";

export function createStaffConfigTabDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Staff Config: Tab")
        .setScoreConfiguration("guitarTab")

        .addMeasure()
        .setKeySignature("C Major")
        .setTimeSignature(4, 4)
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "B3", "8n", { string: 2 })
        .addNote(0, "C4", "8n", { string: 2 })

        .addMeasure()
        .setTimeSignature("6/8")
        .addNote(0, "E2", "8n", { string: 6 })
        .addNote(0, "B2", "8n", { string: 5 })
        .addNote(0, "E3", "8n", { string: 4 })
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "B3", "8n", { string: 2 })
        .addNote(0, "E4", "8n", { string: 1 })

        .addMeasure()
        .addChord(0, ["E2", "B2", "E3", "G3", "B3", "E4"], "1n", { string: [6, 5, 4, 3, 2, 1], arpeggio: true })
        .endRow()

        .addMeasure()
        .setTimeSignature(4, 4)
        .addNote(0, "G3", "1n", { string: 3 })

        .addMeasure()
        .addNote(0, "G3", "2n", { string: 3 })
        .addNote(0, "G3", "4n", { string: 3 })
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "G3", "16n", { string: 3 })
        .addNote(0, "G3", "32n", { string: 3 })
        .addNote(0, "G3", "64n", { string: 3 })
        .completeRests()

        .addMeasure()
        .addNote(0, ["G3", "G3", "G3", "G3"], "8n", { string: 3 })
        .addNote(0, ["G3", "G3"], "8n", { string: 3 })
        .addNote(0, "G3", "4n", { string: 3 })

        .addMeasure()
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, ["G3", "G3"], "16n", { string: 3 })

        .addNote(0, ["G3", "G3"], "32n", { string: 3 })
        .addNote(0, "G3", "16n", { string: 3 })
        .addNote(0, "G3", "8n", { string: 3 })

        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "G3", "16n", { string: 3 })
        .addNote(0, "G3", "32n", { string: 3 })
        .addNote(0, ["G3", "G3"], "64n", { string: 3 })
        .completeRests()
        .endRow()

        .addMeasure()
        .addNote(0, "G3", "8.", { string: 3 })
        .addNote(0, "G3", "16n", { string: 3 })
        .addNote(0, "G3", "16n", { string: 3 })
        .addNote(0, "G3", "8.", { string: 3 })
        .addNote(0, "G3", "8..", { string: 3 })
        .addNote(0, "G3", "32n", { string: 3 })
        .addNote(0, "G3", "64n", { string: 3 })
        .addNote(0, "G3", "8...", { string: 3 })

        .addMeasure()
        .addNote(0, "G3", "8.", { string: 3 })
        .addNote(0, "G3", "8..", { string: 3 })
        .addNote(0, "G3", "8...", { string: 3 })
        .completeRests()

        .addMeasure()
        .addRest(0, "1n")

        .addMeasure()
        .addRest(0, "2n")
        .addRest(0, "4n")
        .addRest(0, "8n")
        .addRest(0, "16n")
        .addRest(0, "32n")
        .addRest(0, "64n")
        .completeRests()

        .addMeasure()
        .addRest(0, "8.")
        .addRest(0, "8..")
        .addRest(0, "8...")
        .completeRests()
        .endRow()

        .addMeasure()
        .setTimeSignature("2/4")
        .setTempo(160)
        .addNote(0, "G3", "2n", { string: 3 })
        .addNote(0, "G3", "2n", { string: 3 })
        .addNavigation("startRepeat")

        .addMeasure()
        .addNote(0, "G3", "2n", { string: 3 })
        .addNote(0, "G3", "2n", { string: 3 })
        .addNavigation("ending", 1)
        .addNavigation("endRepeat")

        .addMeasure()
        .addNote(0, "G3", "2n", { string: 3 })
        .addNote(0, "G3", "2n", { string: 3 })
        .addNavigation("ending", 2)

        .getDocument();
}
