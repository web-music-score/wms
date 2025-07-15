import { DivRect, MFermata } from "../pub";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { StaffKind } from "../pub/types";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineRight } from "./obj-bar-line";
import { VerticalPos } from "./layout-object";

export class ObjFermata extends MusicObject {
    private color = "black";

    readonly mi: MFermata;

    constructor(parent: ObjRhythmColumn | ObjBarLineRight, readonly pos: VerticalPos) {
        super(parent);

        this.mi = new MFermata(this);
    }

    getMusicInterface(): MFermata {
        return this.mi;
    }

    static getFermataPositions(anchor: ObjRhythmColumn | ObjBarLineRight): VerticalPos[] {
        let { measure } = anchor;
        let { row } = measure;

        if (row.staffKind === StaffKind.Grand) {
            return [VerticalPos.AboveStaff, VerticalPos.BelowStaff];
        }
        else {
            return [VerticalPos.AboveStaff];
        }
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let { unitSize } = renderer;

        let width = unitSize * 4;
        let height = unitSize * 3;

        this.rect = new DivRect(-width / 2, width / 2, -height, 0);
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
        let upsideDown = this.pos === VerticalPos.BelowStaff;

        let dy = (upsideDown ? unitSize : -unitSize) * 0.7;

        let left = this.rect.left;
        let right = this.rect.right;
        let top = (upsideDown ? this.rect.bottom : this.rect.top) + dy;
        let bottom = (upsideDown ? this.rect.top : this.rect.bottom) + dy;
        let height = bottom - top;

        renderer.drawDebugRect(this.rect);

        ctx.strokeStyle = ctx.fillStyle = this.color;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(left, bottom);
        ctx.bezierCurveTo(left, top, right, top, right, bottom);
        ctx.bezierCurveTo(right, top + height / 5, left, top + height / 5, left, bottom);
        ctx.stroke();
        ctx.fill();

        let r = height / 6;

        renderer.fillCircle((left + right) / 2, bottom - r, Math.abs(r));
    }
}
