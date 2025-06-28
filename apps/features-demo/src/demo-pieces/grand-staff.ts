import * as Score from "@tspro/web-music-score";

export function createGrandStaffDemo() {
    let doc = Score.MDocument.createSimpleScaleArpeggio(
        Score.StaffKind.Grand,
        Score.getScale("Cb", Score.ScaleType.Major),
        "C2", 4);

    doc.setHeader("Grand Staff");

    return doc;
}
