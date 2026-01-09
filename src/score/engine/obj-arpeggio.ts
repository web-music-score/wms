import { Arpeggio, colorKey, MArpeggio } from "../pub";
import { MusicObject } from "./music-object";
import { View } from "./view";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjNotationLine, ObjTab } from "./obj-staff-and-tab";
import { AnchoredRect } from "@tspro/ts-utils-lib";

export class ObjArpeggio extends MusicObject {
    private topArrowHeight: number = 0;
    private bottomArrowHeight: number = 0;

    private cycleHeight: number = 0;
    private numCycles: number = 0;

    readonly mi: MArpeggio;

    constructor(readonly col: ObjRhythmColumn, readonly line: ObjNotationLine, readonly arpeggioDir: Arpeggio) {
        super(col);
        this.mi = new MArpeggio(this);
    }

    getMusicInterface(): MArpeggio {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        let { unitSize } = view;

        this.topArrowHeight = this.arpeggioDir === Arpeggio.Up ? unitSize : 0;
        this.bottomArrowHeight = this.arpeggioDir === Arpeggio.Down ? unitSize : 0;

        let top = this.line.getTopLineY();
        let bottom = this.line.getBottomLineY();

        this.cycleHeight = unitSize * 2;
        this.numCycles = Math.ceil((bottom - top) / this.cycleHeight) + 2;

        let width = unitSize * 2;
        let height = this.numCycles * this.cycleHeight;

        this.rect = new AnchoredRect(-width / 2, width / 2, -height / 2 - this.topArrowHeight, height / 2 + this.bottomArrowHeight);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View) {
        let { rect, topArrowHeight, bottomArrowHeight } = this;

        view.drawDebugRect(this.rect);

        const color = colorKey(this.line instanceof ObjTab ? "tab.arpeggio" : "staff.arpeggio");

        view.color(color);
        view.lineWidth(2);
        view.beginPath();

        for (let i = 0, y = rect.top + topArrowHeight; i < this.numCycles; i++, y += this.cycleHeight) {
            view.moveTo(rect.anchorX, y);
            view.quadraticCurveTo(rect.left, y + this.cycleHeight / 4, rect.anchorX, y + this.cycleHeight / 2);
            view.quadraticCurveTo(rect.right, y + this.cycleHeight * 3 / 4, rect.anchorX, y + this.cycleHeight);
        }
        view.stroke();

        if (topArrowHeight > 0) {
            view.beginPath();
            view.moveTo(rect.anchorX, rect.top);
            view.lineTo(rect.right, rect.top + topArrowHeight);
            view.lineTo(rect.left, rect.top + topArrowHeight);
            view.fill();
        }

        if (bottomArrowHeight > 0) {
            view.beginPath();
            view.moveTo(rect.anchorX, rect.bottom);
            view.lineTo(rect.left, rect.bottom - bottomArrowHeight);
            view.lineTo(rect.right, rect.bottom - bottomArrowHeight);
            view.fill();
        }
    }
}
