import { MDocument, DocumentBuilder } from "web-music-score/score";

/**
 * Create Andante by A. Diabelli music piece.
 * 
 * @returns - Music document.
 */
export function createAndanteByDiabelli(): MDocument {
    return new DocumentBuilder()
        .setScoreConfiguration("guitarTreble")
        .setHeader("Andante", "A. Diabelli")

        .addMeasure()
        .setKeySignature("D", "Major")
        .setTimeSignature("3/4")
        .setTempo(80)
        .addRest(0, "8n", { staffPos: "G4" }).addAnnotation("dynamics", "p")
        .addNote(0, "F#4", "8n", { stem: "up" })
        .addNote(0, "G4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "F#4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "D4", "8n")
        .addNote(1, "D3", "2.", { stem: "down" })

        .addMeasure()
        .addNote(0, "C#4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "F#4", "8n")
        .addNote(0, "G4", "4n")
        .addNote(1, "A2", "2.")

        .addMeasure()
        .addRest(0, "8n", { staffPos: "B3" }).addAnnotation("dynamics", "f")
        .addNote(0, "A3", "8n")
        .addNote(0, "G#3", "8n").addConnective("slur", 2, "below")
        .addNote(0, "A3", "8n")
        .addNote(0, "B3", "8n")
        .addNote(0, "C#4", "8n")
        .addNote(1, "A2", "2.")
        .endRow()

        .addMeasure()
        .addNote(0, "D4", "8n", { string: 3 })
        .addNote(0, "E4", "8n")
        .addNote(0, "F#4", "8n")
        .addNote(0, "G4", "8n")
        .addNote(0, "A4", "4n")
        .addNote(1, "D3", "2.")

        .addMeasure()
        .addRest(0, "8n", { staffPos: "G4" }).addAnnotation("dynamics", "p")
        .addNote(0, "F#4", "8n")
        .addNote(0, "G4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "F#4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "D4", "8n")
        .addNote(1, "D3", "2.")

        .addMeasure()
        .addNote(0, "C#4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "F#4", "8n")
        .addNote(0, "G4", "4n")
        .addNote(1, "A2", "2.")
        .endRow()

        .addMeasure()
        .addRest(0, "8n", { staffPos: "B3" }).addAnnotation("dynamics", "f")
        .addNote(0, "A3", "8n")
        .addNote(0, "G#3", "8n").addConnective("slur", 2, "below")
        .addNote(0, "A3", "8n")
        .addNote(0, "B3", "8n")
        .addNote(0, "C#4", "8n")
        .addNote(1, "A2", "2.")

        .addMeasure()
        .addNote(0, "D4", "4n")
        .addRest(1, "4n", { staffPos: "D3" })
        .addNote(0, "D3", "4n") // Stem up...
        .addNote(1, "D3", "4n") // ...and down
        .addRest(1, "4n", { staffPos: "B3" })
        .addNavigation("endRepeat")

        .addMeasure()
        .addRest(0, "8n", { staffPos: "D4" }).addAnnotation("dynamics", "f")
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "D4", "8n")
        .addNote(0, "C#4", "8n")
        .addNote(0, "B3", "8n")
        .addNote(1, "E2", "2.")
        .endRow()

        .addMeasure()
        .addNote(0, "C#4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "F#4", "8n")
        .addNote(0, "E4", "4n")
        .addNote(1, "A2", "2.")

        .addMeasure()
        .addRest(0, "8n", { staffPos: "B3" }).addAnnotation("dynamics", "p")
        .addNote(0, "E3", "8n")
        .addNote(0, "D#3", "8n").addConnective("slur", 2, "below")
        .addNote(0, "E3", "8n")
        .addNote(0, "F#3", "8n")
        .addNote(0, "G#3", "8n")
        .addNote(1, "E2", "2.")

        .addMeasure()
        .addNote(0, "A3", "8n").addConnective("slur", 2, "below")
        .addNote(0, "G#3", "8n")
        .addNote(0, "A3", "8n")
        .addNote(0, "B3", "8n")
        .addNote(0, "C#4", "4n")
        .addNote(1, "A2", "2.")
        .endRow()

        .addMeasure()
        .addRest(0, "8n", { staffPos: "G4" }).addAnnotation("dynamics", "f")
        .addNote(0, "G4", "8n")
        .addNote(0, "A4", "8n").addConnective("slur", 2, "below")
        .addNote(0, "G4", "8n")
        .addNote(0, "F#4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(1, "A2", "2.")

        .addMeasure()
        .addNote(0, "D4", "8n")
        .addNote(0, "C#4", "8n")
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "F#4", "4n")
        .addNote(1, "D3", "2.")

        .addMeasure()
        .addRest(0, "8n", { staffPos: "B3" }).addAnnotation("dynamics", "ff")
        .addNote(0, "A3", "8n")
        .addNote(0, "G#3", "8n").addConnective("slur", 2, "below")
        .addNote(0, "A3", "8n")
        .addNote(0, "B3", "8n")
        .addNote(0, "C#4", "8n")
        .addNote(1, "A2", "2.")

        .addMeasure()
        .addNote(0, "D4", "4n")
        .addRest(1, "4n", { staffPos: "D3" })
        .addNote(0, "D3", "4n") // Stem up... 
        .addNote(1, "D3", "4n") // ...and down
        .addRest(1, "4n", { staffPos: "B3" })
        .endSong()

        .getDocument();
}
