import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGrandStaffDemo() {

    let scale = Theory.getScale("Cb", Theory.ScaleType.Major);

    return new Score.DocumentBuilder(Score.StaffPreset.Grand, { measuresPerRow: 4 })

        .setHeader("Grand Staff")
        .setTimeSignature("6/8")
        .setKeySignature(scale)
        .addScaleArpeggio(scale, "C2", 4)
        .endSection()

        .addMeasure()
        .addChord(0, ["Gb3", "Bb3", "Db4"], Theory.NoteLength.Quarter)
        .addChord(0, ["Ab3", "Cb4", "Eb4"], Theory.NoteLength.Quarter)

        .getDocument();
}
