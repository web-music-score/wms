import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createBeamsTupletsDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Beams: Tuplets")
        .setScoreConfiguration("guitarTreble")

        .addMeasure()
        .setKeySignature("G", "Major")
        .setTimeSignature("4/4")
        .setTempo(80)

        .addTuplet(0, Theory.Tuplet.Triplet, notes => notes.addNote(["G3", "B3", "D4"], "8n"))

        .addNote(0, "D4", "8n")
        .addNote(0, "A3", "8n")

        .addTuplet(0, Theory.Tuplet.Triplet, notes => {
            notes.addNote("D4", "8n");
            notes.addNote("B3", "8n");
            notes.addNote("G3", "8n");
        })

        .addNote(0, "B3", "4n")

        .addMeasure()
        .addNote(0, "D4", "8n")
        .addNote(0, ["G3", "B3", "D4"], "8t")
        .addNote(0, "A3", "8n")

        .addNote(0, "D4", "16t", { stem: "down" })
        .addNote(0, "C4", "16t")
        .addNote(0, "B3", "16t")
        .addNote(0, "A3", "16t", { stem: "down" })
        .addNote(0, "G3", "16t")
        .addNote(0, "F#3", "16t")
        .addNote(0, "B3", "4n")
        .endRow()

        .addMeasure()
        .addNote(0, "D4", "8t", { stem: "up" })
        .addNote(0, "D4", "8t")
        .addNote(0, "D4", "8t")

        .addNote(0, "D4", "8t", { stem: "up" })
        .addNote(0, "D4", "8t")
        .addNote(0, "D4", "8t")

        .addNote(0, "D4", "8t", { stem: "up" })
        .addNote(0, "D4", "8t")
        .addNote(0, "D4", "8t")

        .addNote(0, "D4", "8t", { stem: "up" })
        .addNote(0, "D4", "8t")
        .addNote(0, "D4", "8t")

        .addNote(1, "G3", "4n", { stem: "down" })

        .addNote(1, "G3", "8n", { stem: "down" })
        .addNote(1, "G3", "8n", { stem: "down" })

        .addNote(1, "G3", "8t", { stem: "down" })
        .addNote(1, "G3", "8t")
        .addNote(1, "G3", "8t")

        .addNote(1, "G3", "16n", { stem: "down" })
        .addNote(1, "G3", "16n", { stem: "down" })
        .addNote(1, "G3", "16n", { stem: "down" })
        .addNote(1, "G3", "16n", { stem: "down" })
        .endRow()

        .addMeasure()
        .addNote(0, "G3", "8t")
        .addNote(0, "B3", "8t")
        .addNote(0, "D4", "8t")

        .addRest(0, "8t")
        .addNote(0, "B3", "8t")
        .addNote(0, "D4", "8t")

        .addNote(0, "G3", "8t", { stem: "down" })
        .addRest(0, "8t")
        .addNote(0, "D4", "8t")

        .addNote(0, "G3", "8t", { stem: "up" })
        .addNote(0, "B3", "8t")
        .addRest(0, "8t")

        .addMeasure()
        .addRest(0, "8t")
        .addRest(0, "8t")
        .addNote(0, "D4", "8t")

        .addNote(0, "G3", "8t", { stem: "down" })
        .addRest(0, "8t")
        .addRest(0, "8t")

        .addRest(0, "8t")
        .addNote(0, "B3", "8t", { stem: "up" })
        .addRest(0, "8t")

        .addRest(0, "8t")
        .addRest(0, "8t")
        .addRest(0, "8t")
        .endRow()

        .addMeasure()
        .setTimeSignature("3/4")
        .addNote(0, "G3", "4t")
        .addNote(0, "D4", "8t")

        .addNote(0, "G3", "8t")
        .addNote(0, "D4", "4t")

        .addNote(0, "G3", "4t")
        .addRest(0, "8t")

        .addMeasure()
        .addNote(0, "G3", "8t")
        .addRest(0, "4t")

        .addRest(0, "4t")
        .addNote(0, "G3", "8t")

        .addRest(0, "8t")
        .addNote(0, "G3", "4t")
        .endRow()

        .addMeasure()
        .addNote(0, "G3", "4t")
        .addNote(0, "B3", "4t")
        .addNote(0, "D4", "4t")

        .addNote(0, "G3", "4t")
        .addNote(0, "B3", "2t")

        .addMeasure()
        .addNote(0, "G3", "2t")
        .addNote(0, "B3", "2t")
        .addNote(0, "D4", "2t")

        .getDocument();
}
