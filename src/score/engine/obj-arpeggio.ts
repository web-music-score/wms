import { Arpeggio, DivRect, MArpeggio } from "../pub";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjStaff, ObjTab } from "./obj-staff-and-tab";

export class ObjArpeggio extends MusicObject {
    private topArrowHeight: number = 0;
    private bottomArrowHeight: number = 0;

    private cycleHeight: number = 0;
    private numCycles: number = 0;

    private color = "black";

    readonly mi: MArpeggio;

    constructor(readonly col: ObjRhythmColumn, readonly line: ObjStaff | ObjTab, readonly arpeggioDir: Arpeggio) {
        super(col);
        this.mi = new MArpeggio(this);
    }

    getMusicInterface(): MArpeggio {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let { unitSize } = renderer;

        this.topArrowHeight = this.arpeggioDir === Arpeggio.Up ? unitSize : 0;
        this.bottomArrowHeight = this.arpeggioDir === Arpeggio.Down ? unitSize : 0;

        let top = this.line instanceof ObjStaff ? this.line.getTopLineY() : this.line.getTopStringY();
        let bottom = this.line instanceof ObjStaff ? this.line.getBottomLineY() : this.line.getBottomStringY();

        this.cycleHeight = unitSize * 2;
        this.numCycles = Math.ceil((bottom - top) / this.cycleHeight) + 2;

        let width = unitSize * 2;
        let height = this.numCycles * this.cycleHeight;

        this.rect = new DivRect(-width / 2, width / 2, -height / 2 - this.topArrowHeight, height / 2 + this.bottomArrowHeight);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        let { lineWidth } = renderer;
        let { rect, topArrowHeight, bottomArrowHeight } = this;

        renderer.drawDebugRect(this.rect);

        ctx.strokeStyle = ctx.fillStyle = this.color;
        ctx.lineWidth = lineWidth * 2;

        ctx.beginPath();
        for (let i = 0, y = rect.top + topArrowHeight; i < this.numCycles; i++, y += this.cycleHeight) {
            ctx.moveTo(rect.centerX, y);
            ctx.quadraticCurveTo(rect.left, y + this.cycleHeight / 4, rect.centerX, y + this.cycleHeight / 2);
            ctx.quadraticCurveTo(rect.right, y + this.cycleHeight * 3 / 4, rect.centerX, y + this.cycleHeight);
        }
        ctx.stroke();

        if (topArrowHeight > 0) {
            ctx.beginPath();
            ctx.moveTo(rect.centerX, rect.top);
            ctx.lineTo(rect.right, rect.top + topArrowHeight);
            ctx.lineTo(rect.left, rect.top + topArrowHeight);
            ctx.fill();
        }

        if (bottomArrowHeight > 0) {
            ctx.beginPath();
            ctx.moveTo(rect.centerX, rect.bottom);
            ctx.lineTo(rect.left, rect.bottom - bottomArrowHeight);
            ctx.lineTo(rect.right, rect.bottom - bottomArrowHeight);
            ctx.fill();
        }
    }
}
