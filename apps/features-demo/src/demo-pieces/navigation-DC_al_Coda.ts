import * as Score from "web-music-score/score";

export function createNavigationDCAlCodaDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Navigation: D.C. al Coda")
        .setScoreConfiguration("treble")

        .addMeasure()
        .setKeySignature("C Major")
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", "2n")

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
        .addNavigation("D.C. al Coda")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("Coda")

        .getDocument();
}
