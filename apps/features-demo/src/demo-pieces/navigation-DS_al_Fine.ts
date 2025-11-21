import * as Score from "web-music-score/score";

export function createNavigationDSAlFineDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Navigation: D.S. al Fine")
        .setScoreConfiguration("treble")

        .addMeasure()
        .setKeySignature("C", "Major")
        .setTimeSignature("2/4")
        .setTempo(120)
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNavigation("Segno")
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("Fine")
        .endRow()

        .addMeasure()
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNote(0, "G4", "2n")

        .addMeasure()
        .addNote(0, "G4", "2n")
        .addNavigation("D.S. al Fine")

        .getDocument();
}
