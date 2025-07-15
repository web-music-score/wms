import { Arpeggio, DivRect } from "../pub";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { MArpeggio } from "../pub/interface";

export class ObjArpeggio extends MusicObject {
    private topArrowHeight: number = 0;
    private bottomArrowHeight: number = 0;

    private static NumCycles = 5;
    private cycleHeight: number = 0;

    private color = "black";

    readonly mi: MArpeggio;

    constructor(readonly col: ObjRhythmColumn, readonly arpeggioDir: Arpeggio) {
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

        this.cycleHeight = unitSize * 2;

        let width = unitSize * 2;
        let height = ObjArpeggio.NumCycles * this.cycleHeight + this.topArrowHeight + this.bottomArrowHeight;

        this.rect = new DivRect(-width / 2, width / 2, -height / 2, height / 2);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        let { lineWidth, unitSize } = renderer;
        let { rect, topArrowHeight, bottomArrowHeight } = this;

        renderer.drawDebugRect(this.rect);

        ctx.strokeStyle = ctx.fillStyle = this.color;
        ctx.lineWidth = lineWidth * 2;

        ctx.beginPath();
        for (let i = 0; i < ObjArpeggio.NumCycles; i++) {
            let y = rect.top + topArrowHeight + i * this.cycleHeight;
            ctx.moveTo(rect.centerX, y);
            ctx.quadraticCurveTo(rect.left, y + this.cycleHeight / 4, rect.centerX, y + this.cycleHeight / 2);
            ctx.quadraticCurveTo(rect.right, y + this.cycleHeight * 3 / 4, rect.centerX, y + this.cycleHeight);
        }
        ctx.stroke();

        if (topArrowHeight > 0) {
            ctx.beginPath();
            ctx.moveTo(rect.centerX, rect.top);
            ctx.lineTo(rect.right, rect.top + unitSize);
            ctx.lineTo(rect.left, rect.top + unitSize);
            ctx.fill();
        }

        if (bottomArrowHeight > 0) {
            ctx.beginPath();
            ctx.moveTo(rect.centerX, rect.bottom);
            ctx.lineTo(rect.left, rect.bottom - unitSize);
            ctx.lineTo(rect.right, rect.bottom - unitSize);
            ctx.fill();
        }
    }
}
