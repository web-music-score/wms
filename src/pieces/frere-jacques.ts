import { DocumentBuilder, MDocument, StaffPreset } from "@tspro/web-music-score/score";

export function createFrereJacques(): MDocument {
    return new DocumentBuilder()
        .setScoreConfiguration("guitarTreble")
        .setHeader("Frere Jacques")

        .addMeasure()
        .setKeySignature("G", "Major")
        .setTimeSignature("4/4")
        .addNote(0, "G3", "4n")
        .addNote(0, "A3", "4n")
        .addNote(0, "B3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .addNote(0, "G3", "4n")
        .addNote(0, "A3", "4n")
        .addNote(0, "B3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .addNote(0, "B3", "4n")
        .addNote(0, "C4", "4n")
        .addNote(0, "D4", "2n")
        .endRow()

        .addMeasure()
        .addNote(0, "B3", "4n")
        .addNote(0, "C4", "4n")
        .addNote(0, "D4", "2n")

        .addMeasure()
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "D4", "8n")
        .addNote(0, "C4", "8n")
        .addNote(0, "B3", "4n")
        .addNote(0, "G3", "4n")
        .endRow()

        .addMeasure()
        .addNote(0, "D4", "8n")
        .addNote(0, "E4", "8n")
        .addNote(0, "D4", "8n")
        .addNote(0, "C4", "8n")
        .addNote(0, "B3", "4n")
        .addNote(0, "G3", "4n")

        .addMeasure()
        .addNote(0, "G3", "4n")
        .addNote(0, "D3", "4n")
        .addNote(0, "G3", "2n")

        .addMeasure()
        .addNote(0, "G3", "4n")
        .addNote(0, "D3", "4n")
        .addNote(0, "G3", "2n")

        .getDocument();
}
