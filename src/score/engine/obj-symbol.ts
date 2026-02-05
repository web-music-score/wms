import { MSymbol, MFermata } from "../pub";
import { MusicObject } from "./music-object";
import { DrawSymbol, View } from "./view";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineLeft, ObjBarLineRight } from "./obj-bar-line";
import { Rect } from "@tspro/ts-utils-lib";

export class ObjSymbol extends MusicObject {
    readonly mi: MSymbol;

    constructor(parent: ObjRhythmColumn | ObjBarLineLeft | ObjBarLineRight, readonly symbol: DrawSymbol, readonly flipX: boolean, readonly flipY: boolean, readonly color: string) {
        super(parent);

        this.mi = this instanceof ObjFermata ? new MFermata(this) : new MSymbol(this);
    }

    getMusicInterface(): MSymbol {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        this.rect = view.getSymbolRect(this.symbol);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.color(this.color);
        view.drawSymbol(this.symbol, this.rect, this.flipX, this.flipY);
    }
}

/** @dprecated - Merge to ObjSymbol. */
export class ObjFermata extends ObjSymbol {
    constructor(parent: ObjRhythmColumn | ObjBarLineRight, flipY: boolean, color: string) {
        super(parent, DrawSymbol.Fermata, false, flipY, color);
    }

    getMusicInterface(): MFermata {
        return this.mi;
    }
}
