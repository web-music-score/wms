import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGrandStaffDemo() {
    let doc = Score.MDocument.createSimpleScaleArpeggio(
        Score.StaffPreset.Grand,
        Theory.getScale("Cb", Theory.ScaleType.Major),
        "C2", 4);

    doc.setHeader("Grand Staff");

    doc.endRow();

    doc.addMeasure()
        .addChord(0, ["Gb3", "Bb3", "Db4"], Theory.NoteLength.Quarter)
        .addChord(0, ["Ab3", "Cb4", "Eb4"], Theory.NoteLength.Quarter)

    return doc;
}
