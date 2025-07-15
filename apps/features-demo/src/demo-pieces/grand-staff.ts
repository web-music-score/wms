import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";

export function createGrandStaffDemo() {
    let doc = Score.MDocument.createSimpleScaleArpeggio(
        Score.StaffKind.Grand,
        Theory.getScale("Cb", Theory.ScaleType.Major),
        "C2", 4);

    doc.setHeader("Grand Staff");

    return doc;
}
