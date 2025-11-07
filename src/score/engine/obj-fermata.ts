import { MFermata } from "../pub";
import { MusicObject } from "./music-object";
import { RenderContext } from "./render-context";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineRight } from "./obj-bar-line";
import { VerticalPos } from "./layout-object";
import { AnchoredRect } from "@tspro/ts-utils-lib";
import { DocumentColor } from "./settings";

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

        if (row.getTopStaff() !== row.getBottomStaff()) {
            return [VerticalPos.Above, VerticalPos.Below];
        }
        else {
            return [VerticalPos.Above];
        }
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        let { unitSize } = ctx;

        let width = unitSize * 4;
        let height = unitSize * 3;

        this.rect = new AnchoredRect(-width / 2, width / 2, -height, 0);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        let { unitSize } = ctx;
        let upsideDown = this.pos === VerticalPos.Below;

        let dy = (upsideDown ? unitSize : -unitSize) * 0.7;

        let left = this.rect.left;
        let right = this.rect.right;
        let top = (upsideDown ? this.rect.bottom : this.rect.top) + dy;
        let bottom = (upsideDown ? this.rect.top : this.rect.bottom) + dy;
        let height = bottom - top;

        ctx.drawDebugRect(this.rect);

        ctx.color(DocumentColor.Fermata).lineWidth(1);

        ctx.beginPath();
        ctx.moveTo(left, bottom);
        ctx.bezierCurveTo(left, top, right, top, right, bottom);
        ctx.bezierCurveTo(right, top + height / 5, left, top + height / 5, left, bottom);
        ctx.stroke();
        ctx.fill();

        let r = height / 6;

        ctx.fillCircle((left + right) / 2, bottom - r, Math.abs(r));
    }
}
