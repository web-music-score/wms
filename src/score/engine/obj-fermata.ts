import { MFermata } from "../pub";
import { MusicObject } from "./music-object";
import { DrawSymbol, View } from "./view";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineRight } from "./obj-bar-line";
import { VerticalPos } from "./layout-object";
import { AnchoredRect, Rect } from "@tspro/ts-utils-lib";

export class ObjFermata extends MusicObject {
    readonly mi: MFermata;

    constructor(parent: ObjRhythmColumn | ObjBarLineRight, readonly flipY: boolean, readonly color: string) {
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
        this.rect = view.getSymbolRect(DrawSymbol.Fermata);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.drawSymbol(DrawSymbol.Fermata, this.rect, false, this.flipY);
    }
}
