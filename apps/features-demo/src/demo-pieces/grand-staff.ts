import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGrandStaffDemo() {

    let scale = Theory.getScale("Cb", "Major");

    return new Score.DocumentBuilder()
        .setHeader("Grand Staff")
        .setScoreConfiguration("grand")
        .setMeasuresPerRow(4)

        .setTimeSignature("6/8")
        .setKeySignature(scale)
        .addScaleArpeggio(scale, "C2", 4)
        .endSection()

        .addMeasure()
        .addChord(0, ["Gb3", "Bb3", "Db4"], "4n")
        .addChord(0, ["Ab3", "Cb4", "Eb4"], "4n")

        .getDocument();
}
