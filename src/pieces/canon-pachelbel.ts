import { DocumentBuilder, MDocument } from "@tspro/web-music-score/score";

/**
 * Create Canon in D by Pachelbel music piece.<br />
 * <br />
 * Source: https://musescore.com/user/3349846/scores/1376056
 * 
 * @returns - Music document.
 */
export function createCanonInD(): MDocument {
    return new DocumentBuilder()
        .setHeader("Canon in D", "Pachelbel")
        .setScoreConfiguration([
            { type: "staff", clef: "G", voiceId: 0 },
            { type: "staff", clef: "F", voiceId: 1 }
        ])

        .addMeasure() // 1
        .setKeySignature("D Major")
        .setTimeSignature("4/4")
        .setTempo(50, "2n")

        .completeRests(0)
        .addNote(1, ["D3", "F#3", "A3", "D4"], "8n")
        .addNote(1, ["A2", "C#3", "E3", "A3"], "8n")

        .addMeasure({ showNumber: true })
        .completeRests(0)
        .addNote(1, ["B2", "D3", "F#3", "B3"], "8n")
        .addNote(1, ["F#2", "A2", "C#3", "F#3"], "8n")

        .addMeasure()
        .completeRests(0)
        .addNote(1, ["G2", "B2", "D3", "G3"], "8n")
        .addNote(1, ["D2", "F#2", "A2", "D3"], "8n")

        .addMeasure({ showNumber: true })
        .completeRests(0)
        .addNote(1, ["G2", "B2", "D3", "G3"], "8n")
        .addNote(1, ["A2", "C#3", "E3", "A3"], "8n")

        .addMeasure()
        .addNote(0, ["F#5", "E5"], "2n")
        .addNote(1, ["D3", "F#3", "A3", "D4"], "8n")
        .addNote(1, ["A2", "C#3", "E3", "A3"], "8n")
        .endRow()

        .addMeasure({ showNumber: true }) // 6
        .addNote(0, ["D5", "C#5"], "2n")
        .addNote(1, ["B2", "D3", "F#3", "B3"], "8n")
        .addNote(1, ["F#2", "A2", "C#3", "F#3"], "8n")

        .addMeasure()
        .addNote(0, ["B4", "A4"], "2n")
        .addNote(1, ["G2", "B2", "D3", "G3"], "8n")
        .addNote(1, ["D2", "F#2", "A2", "D3"], "8n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["B4", "C#5"], "2n")
        .addNote(1, ["G2", "B2", "D3", "G3"], "8n")
        .addNote(1, ["A2", "C#3", "E3", "A3"], "8n")

        .addMeasure()
        .addChord(0, ["F#5", "D5"], "2n")
        .addChord(0, ["E5", "C#5"], "2n")
        .addNote(1, ["D3", "F#3", "A3", "D4"], "8n")
        .addNote(1, ["A2", "C#3", "E3", "A3"], "8n")

        .addMeasure({ showNumber: true })
        .addChord(0, ["D5", "B4"], "2n")
        .addChord(0, ["C#5", "A4"], "2n")
        .addNote(1, ["B2", "D3", "F#3", "B3"], "8n")
        .addNote(1, ["F#2", "A2", "C#3", "F#3"], "8n")
        .endRow()

        .addMeasure({ showNumber: false }) // 11
        .addChord(0, ["B4", "G4"], "2n")
        .addChord(0, ["A4", "F#4"], "2n")
        .addNote(1, ["G2", "B2", "D3", "G3"], "8n")
        .addNote(1, ["D2", "F#2", "A2", "D3"], "8n")

        .addMeasure({ showNumber: true })
        .addChord(0, ["B4", "G4"], "2n")
        .addChord(0, ["C#5", "A4"], "2n")
        .addNote(1, ["G2", "B2", "D3", "G3"], "8n")
        .addNote(1, ["A2", "C#3", "E3", "A3"], "8n")

        .addMeasure()
        .addNote(0, ["D4", "F#4", "A4", "G4"], "4n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["F#4", "D4", "F#4", "E4"], "4n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, ["D4", "B3", "D4", "A4"], "4n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["G4", "B4", "A4", "G4"], "4n")
        .addNote(1, ["G2", "A2"], "2n")

        .addMeasure()
        .addNote(0, ["F#4", "D4", "E4", "C#5"], "4n")
        .addNote(1, ["D3", "A2"], "2n")
        .endRow()

        .addMeasure({ showNumber: true }) // 18
        .addNote(0, ["D5", "F#5", "A5", "A4"], "4n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, ["B4", "G4", "A4", "F#4"], "4n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["D4", "D5", "C#5"], "4n")
        .addRest(0, "4n")
        .addNote(1, ["G2", "A2"], "2n")

        .addMeasure()
        .addNote(0, ["D5", "C#5", "D5", "D4"], "8n")
        .addNote(0, ["C#4", "A4", "E4", "F#4"], "8n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["D4", "D5", "C#5", "B4"], "8n")
        .addNote(0, ["C#5", "F#5", "A5", "B5"], "8n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, ["G5", "F#5", "E5", "G5"], "8n")
        .addNote(0, ["F#5", "E5", "D5", "C#5"], "8n")
        .addNote(1, ["G2", "D2"], "2n")
        .endRow()

        .addMeasure({ showNumber: true }) // 24
        .addNote(0, ["B4", "A4", "G4", "F#4"], "8n")
        .addNote(0, ["E4", "G4", "F#4", "E4"], "8n")
        .addNote(1, ["G2", "A2"], "2n")

        .addMeasure()
        .addNote(0, ["D4", "E4", "F#4", "G4"], "8n")
        .addNote(0, ["A4", "E4", "A4", "G4"], "8n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["F#4", "B4", "A4", "G4"], "8n")
        .addNote(0, ["A4", "G4", "F#4", "E4"], "8n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, ["D4", "B3", "B4", "C#5"], "8n")
        .addNote(0, ["D5", "C#5", "B4", "A4"], "8n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["G4", "F#4", "E4", "B4"], "8n")
        .addNote(0, ["A4", "B4", "A4", "G4"], "8n")
        .addNote(1, ["G2", "A2"], "2n")
        .endRow()

        // Second page
        .addMeasure({ showNumber: false }) // 29
        .addNote(0, "F#4", "4n")
        .addNote(0, "F#5", "4n")
        .addNote(0, "E5", "2n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addRest(0, "4n", { staffPos: "B4" })
        .addNote(0, "D5", "4n")
        .addNote(0, "F#5", "2n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, ["B5", "A5"], "2n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["B5", "C#6"], "2n")
        .addNote(1, ["G2", "A2"], "2n")

        .addMeasure()
        .addNote(0, ["D6", "D5"], "4n")
        .addNote(0, "C#5", "2n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addRest(0, "4n", { staffPos: "B4" })
        .addNote(0, "B4", "4n")
        .addNote(0, "D5", "2n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, "D5", "2n")
        .addRest(0, "4n", { staffPos: "B4" })
        .addNote(0, "D5", "4n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["D5", "F#5", "E5", "A5"], "4n")
        .addNote(1, ["G2", "A2"], "2n")
        .endRow()

        .addMeasure({ showNumber: false }) // 37
        .addNote(0, "A5", "8n")
        .addNote(0, ["F#5", "G5"], "16n")
        .addNote(0, "A5", "8n")
        .addNote(0, ["F#5", "G5"], "16n")
        .addNote(0, ["A5", "A4", "B4", "C#5"], "16n")
        .addNote(0, ["D5", "E5", "F#5", "G5"], "16n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, "F#5", "8n")
        .addNote(0, ["D5", "E5"], "16n")
        .addNote(0, "F#5", "8n")
        .addNote(0, ["F#4", "G4"], "16n")
        .addNote(0, ["A4", "B4", "A4", "G4"], "16n")
        .addNote(0, ["A4", "F#4", "G4", "A4"], "16n")
        .addNote(1, ["B2", "F#2"], "2n")

        .addMeasure()
        .addNote(0, "G4", "8n")
        .addNote(0, ["B4", "A4"], "16n")
        .addNote(0, "G4", "8n")
        .addNote(0, ["F#4", "E4"], "16n")
        .addNote(0, ["F#4", "E4", "D4", "E4"], "16n")
        .addNote(0, ["F#4", "G4", "A4", "B4"], "16n")
        .addNote(1, ["G2", "D2"], "2n")
        .endRow()

        .addMeasure({ showNumber: true }) // 40
        .addNote(0, "G4", "8n")
        .addNote(0, ["B4", "A4"], "16n")
        .addNote(0, "B4", "8n")
        .addNote(0, ["C#5", "D5"], "16n")
        .addNote(0, ["A4", "B4", "C#5", "D5"], "16n")
        .addNote(0, ["E5", "F#5", "G5", "A5"], "16n")
        .addNote(1, ["G2", "A2"], "2n")

        .addMeasure()
        .addNote(0, "F#5", "8n")
        .addNote(0, ["D5", "E5"], "16n")
        .addNote(0, "F#5", "8n")
        .addNote(0, ["E5", "D5"], "16n")
        .addNote(0, ["E5", "C#5", "D5", "E5"], "16n")
        .addNote(0, ["F#5", "E5", "D5", "C#5"], "16n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, "D5", "8n")
        .addNote(0, ["B4", "C#5"], "16n")
        .addNote(0, "D5", "8n")
        .addNote(0, ["D4", "E4"], "16n")
        .addNote(0, ["F#4", "G4", "F#4", "E4"], "16n")
        .addNote(0, ["F#4", "D5", "C#5", "D5"], "16n")
        .addNote(1, ["B2", "F#2"], "2n")
        .endRow()

        .addMeasure({ showNumber: false }) // 43
        .addNote(0, "B4", "8n")
        .addNote(0, ["D5", "C#5"], "16n")
        .addNote(0, "B4", "8n")
        .addNote(0, ["A4", "G4"], "16n")
        .addNote(0, ["A4", "G4", "F#4", "G4"], "16n")
        .addNote(0, ["A4", "B4", "C#5", "D5"], "16n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, "B4", "8n")
        .addNote(0, ["D5", "C#5"], "16n")
        .addNote(0, "D5", "8n")
        .addNote(0, ["C#5", "B4"], "16n")
        .addNote(0, ["C#5", "D5", "E5", "D5"], "16n")
        .addNote(0, ["C#5", "D5", "B4", "C#5"], "16n")
        .addNote(1, ["G2", "A2"], "2n")

        .addMeasure()
        .addNavigation("startRepeat")
        .addNote(0, "D5", "4.")
        .addNote(0, "A5", "8n")
        .addNote(0, ["A5", "B5", "A5", "G5"], "8n")
        .addNote(1, ["D3", "A2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, "F#5", "4.")
        .addNote(0, "F#5", "8n")
        .addNote(0, ["F#5", "G5", "F#5", "E5"], "8n")
        .addNote(1, ["B2", "F#2"], "2n")
        .endRow()

        .addMeasure({ showNumber: false }) // 47
        .addNote(0, "D5", "4.")
        .addNote(0, "D5", "8n")
        .addNote(0, ["D5", "A5"], "4n")
        .addNote(1, ["G2", "D2"], "2n")

        .addMeasure({ showNumber: true })
        .addNote(0, ["D5", "C5", "B5", "C5"], "8n")
        .addNote(0, "C#5", "2n")
        .addNote(1, ["G2", "A2"], "2n")
        .addNavigation("endRepeat")

        .addMeasure()
        .addNote(0, "D5", "1n")
        .addNote(1, "D3", "1n")

        .getDocument();
}
