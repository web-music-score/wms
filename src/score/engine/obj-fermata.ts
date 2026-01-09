import { MFermata } from "../pub";
import { MusicObject } from "./music-object";
import { View } from "./view";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineRight } from "./obj-bar-line";
import { VerticalPos } from "./layout-object";
import { AnchoredRect } from "@tspro/ts-utils-lib";

export class ObjFermata extends MusicObject {
    readonly mi: MFermata;

    constructor(parent: ObjRhythmColumn | ObjBarLineRight, readonly pos: VerticalPos, readonly color: string) {
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

    layout(view: View) {
        let { unitSize } = view;

        let width = unitSize * 4;
        let height = unitSize * 3;

        this.rect = AnchoredRect.createCentered(0, 0, width, height);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View) {
        let { unitSize } = view;
        let upsideDown = this.pos === VerticalPos.Below;

        let dy = (upsideDown ? unitSize : -unitSize) * 0.7;

        let left = this.rect.left;
        let right = this.rect.right;
        let top = (upsideDown ? this.rect.bottom : this.rect.top) + dy;
        let bottom = (upsideDown ? this.rect.top : this.rect.bottom) + dy;
        let height = bottom - top;

        view.drawDebugRect(this.rect);

        view.color(this.color).lineWidth(1);

        view.beginPath();
        view.moveTo(left, bottom);
        view.bezierCurveTo(left, top, right, top, right, bottom);
        view.bezierCurveTo(right, top + height / 5, left, top + height / 5, left, bottom);
        view.stroke();
        view.fill();

        let r = height / 6;

        view.fillCircle((left + right) / 2, bottom - r, Math.abs(r));
    }
}
