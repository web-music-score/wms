import * as Score from "web-music-score/score";

export function createNavigationDSAlCodaDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Navigation: D.S. al Coda")
        .setScoreConfiguration("treble")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("Segno")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .endRow()

        .addMeasure()
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("toCoda")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .endRow()

        .addMeasure()
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("D.S. al Coda")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("Coda")

        .getDocument();
}
