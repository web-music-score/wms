import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createDalSegnoDemo() {
    return new Score.DocumentBuilder()
        .setHeader("Dal Segno Navigation")
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
