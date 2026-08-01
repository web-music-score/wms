import { MSymbol } from "../pub";
import { MusicObject } from "./music-object";
import { DrawSymbol, View } from "./view";
import { Rect } from "@tspro/ts-utils-lib";

export class ObjSymbol extends MusicObject {
    readonly mi: MSymbol;

    constructor(parent: MusicObject, readonly symbol: DrawSymbol, readonly flipX: boolean, readonly flipY: boolean, readonly color: string) {
        super(parent);

        this.mi = new MSymbol(this);
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
