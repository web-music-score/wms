import { DocumentBuilder, MDocument } from "@tspro/web-music-score/score";

/**
 * Create Frere Jacques (round) music piece.<br />
 * <br />
 * Source: https://musescore.com/user/17324226/scores/7296137
 * 
 * @returns - Music document.
 */
export function createFrereJacques(): MDocument {
    return new DocumentBuilder()
        .setHeader("Frere Jacques")
        .setScoreConfiguration([
            { type: "staff", clef: "G", voiceIds: [0] },
            { type: "staff", clef: "F", voiceIds: [1] }
        ])
        .setMeasuresPerRow(2)

        .addMeasure()
        .setKeySignature("D Major")
        .setTimeSignature("4/4")

        .addNote(0, "D4", "4n", { stem: "up" })
        .addNote(0, "E4", "4n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addRest(1, "1n", { staffPos: "F3" })

        .addMeasure()
        .addNote(0, "D4", "4n")
        .addNote(0, "E4", "4n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addRest(1, "1n", { staffPos: "F3" })

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "F#4", "4n")
        .addNote(0, "G4", "4n")
        .addNote(0, "A4", "2n")
        .addNote(1, "D3", "4n", { stem: "down" })
        .addNote(1, "E3", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "D3", "4n")

        .addMeasure()
        .addNote(0, "F#4", "4n")
        .addNote(0, "G4", "4n")
        .addNote(0, "A4", "2n")
        .addNote(1, "D3", "4n")
        .addNote(1, "E3", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "D3", "4n")

        .addMeasure()
        .addNote(0, "A4", "8n")
        .addNote(0, "B4", "8n")
        .addNote(0, "A4", "8n")
        .addNote(0, "G4", "8n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "G3", "4n")
        .addNote(1, "A3", "2n")

        .addMeasure()
        .addNote(0, "A4", "8n")
        .addNote(0, "B4", "8n")
        .addNote(0, "A4", "8n")
        .addNote(0, "G4", "8n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "G3", "4n")
        .addNote(1, "A3", "2n")

        .addMeasure()
        .addNote(0, "D4", "4n")
        .addChord(0, ["C#4", "A4"], "4n")
        .addNote(0, "D4", "4n")
        .addRest(0, "4n")
        .addNote(1, "A3", "8n")
        .addNote(1, "B3", "8n")
        .addNote(1, "A3", "8n")
        .addNote(1, "G3", "8n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "D3", "4n")

        .addMeasure()
        .addNote(0, "D4", "4n")
        .addChord(0, ["C#4", "A4"], "4n")
        .addNote(0, "D4", "4n")
        .addRest(0, "4n")
        .addNote(1, "A3", "8n")
        .addNote(1, "B3", "8n")
        .addNote(1, "A3", "8n")
        .addNote(1, "G3", "8n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "D3", "4n")

        .addMeasure()
        .setMeasuresPerRow(4)
        .addNavigation("ending", 1)
        .addNote(0, "D4", "4n")
        .addNote(0, "E4", "4n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addNote(1, "D3", "4n")
        .addChord(1, ["C#3", "A3"], "4n")
        .addNote(1, "D3", "4n")
        .addRest(1, "4n")

        .addMeasure()
        .addNavigation("endRepeat")
        .addNote(0, "D4", "4n")
        .addNote(0, "E4", "4n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addNote(1, "D3", "4n")
        .addChord(1, ["C#3", "A3"], "4n")
        .addNote(1, "D3", "4n")
        .addRest(1, "4n")

        .addMeasure()
        .addNavigation("ending", 2)
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addNote(0, "F#4", "4n")
        .addNote(0, "D4", "4n")
        .addNote(1, "A3", "4n")
        .addNote(1, "F#3", "4n")
        .addNote(1, "A3", "4n")
        .addNote(1, "F#3", "4n")

        .addMeasure()
        .addNote(0, "A3", "4n")
        .addNote(0, "C#4", "8n")
        .addNote(0, "C#4", "8n")
        .addNote(0, "D4", "2n")
        .addNote(1, "D3", "4n")
        .addNote(1, "E3", "4n")
        .addNote(1, "F#3", "2n")

        .getDocument();
}
