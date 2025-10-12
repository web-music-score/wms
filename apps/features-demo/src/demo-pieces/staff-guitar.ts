import * as Score from "@tspro/web-music-score/score";

export function createStaffConfigGuitarDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Staff Config: Guitar (Combined)")
        .setScoreConfiguration([
            { type: "staff", clef: "G", isOctaveDown: true, voiceId: [0, 1] },
            { type: "tab", tuning: "Drop D", voiceId: [0, 1] }
        ])

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("4/4")
        .setTempo(60)
        .addNote(1, "G3", "8n", { string: 3 })
        .addNote(1, "G3", "8n", { string: 3 })
        .addNote(1, "C4", "8n", { string: 2 })

        .addMeasure()
        .addNavigation("startRepeat")
        .addChord(0, ["E4", "C3"], "8n", { string: [1, 5] }).addLabel("chord", "C")
        .addNote(0, "E3", "8n", { string: 4 })
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "C4", "8n", { string: 2 })
        .addChord(0, ["D4", "G3", "F3", "C3"], "8n", { string: [2, 3, 4, 5] }).addLabel("chord", "Csus4")
        .addNote(0, "C4", "8n", { string: 2 })
        .addNote(0, "C4", "8n")
        .addNote(0, "A3", "8n", { string: 3 })

        .addMeasure()
        .addChord(0, ["G3", "C3"], "8n", { string: [3, 5] }).addLabel("chord", "C")
        .addNote(0, "C4", "8n", { string: 2 })
        .addNote(0, "E3", "8n", { string: 4 })
        .addNote(0, "G3", "8n", { string: 3 })
        .addNote(0, "C3", "8n", { string: 5 })
        .addNote(0, "C4", "8n", { string: 2 })
        .addChord(0, ["C4", "G3"], "8n", { string: [2, 3] })
        .addNote(0, "E4", "8n", { string: 1 })
        .endRow()

        .addMeasure()
        .addNote(0, "F3", "2n", { string: 4 }).addConnective("tie")
        .addNote(0, "F3", "2n", { string: 4 })

        .addMeasure()
        .addNote(0, "F3", "4n", { string: 4 }).addConnective("slur")
        .addNote(0, "A3", "4n", { string: 4 })
        .addNote(0, "A3", "4n", { string: 4 }).addConnective("slur")
        .addNote(0, "F3", "4n", { string: 4 })

        .addMeasure()
        .addNote(0, "F3", "4n", { string: 4 }).addConnective("slide")
        .addNote(0, "A3", "4n", { string: 4 })
        .addNote(0, "A3", "4n", { string: 4 }).addConnective("slide")
        .addNote(0, "F3", "4n", { string: 4 })
        .endRow()

        .addMeasure()
        .addNote(0, "F3", "2n", { string: 4 }).addConnective("tie", "stub")
        .addNote(0, "A3", "2n", { string: 4 }).addConnective("tie")

        .addMeasure()
        .addNote(0, "A3", "2n", { string: 4 })
        .addNote(0, "F3", "2n", { string: 4 }).addConnective("tie", "toMeasureEnd")

        .getDocument();
}
