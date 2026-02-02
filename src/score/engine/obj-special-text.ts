import { View } from "./view";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { MSpecialText } from "../pub";
import { AnchoredRect, Rect } from "@tspro/ts-utils-lib";

export class ObjSpecialText extends MusicObject {
    public static toCoda = "𝄌 toCoda";
    public static Coda = "Coda 𝄌";
    public static Segno = "𝄋";

    private components: ObjText[] = [];

    readonly mi: MSpecialText;

    constructor(parent: MusicObject, readonly text: string, readonly color = "black") {
        super(parent);

        switch (this.text) {
            case ObjSpecialText.Coda:
                this.components = [
                    new ObjText(this, { text: "𝄌", scale: 1.7, color }, 0.5, 0.3,),
                    new ObjText(this, { text: " Coda", color }, 0, 1)
                ];
                break;
            case ObjSpecialText.toCoda:
                this.components = [
                    new ObjText(this, { text: "toCoda ", color }, 1, 1),
                    new ObjText(this, { text: "𝄌", scale: 1.7, color }, 0.5, 0.3)
                ];
                break;
            case ObjSpecialText.Segno:
                this.components = [new ObjText(this, { text: "𝄋", scale: 1.1, color }, 0.5, 1)];
                break;
            default:
                this.components = [];
                break;
        }

        this.mi = new MSpecialText(this);
    }

    getMusicInterface(): MSpecialText {
        return this.mi;
    }

    getText() {
        return this.text;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        switch (this.text) {
            case ObjSpecialText.Coda: {
                let codaSym = this.components[0];
                let codaText = this.components[1];
                codaSym.layout(view);
                codaText.layout(view);
                codaSym.setAnchorY(codaText.getRect().centerY);
                codaText.setLeft(codaSym.getRect().right);
                this.rect = new AnchoredRect(
                    codaSym.getRect().left, codaSym.getRect().anchorX, codaText.getRect().right,
                    codaText.getRect().top, codaText.getRect().anchorY, codaText.getRect().bottom
                );
                break;
            }
            case ObjSpecialText.toCoda: {
                let toCodaText = this.components[0];
                let codaSym = this.components[1];
                toCodaText.layout(view);
                codaSym.layout(view);
                codaSym.setAnchorY(toCodaText.getRect().centerY);
                toCodaText.setRight(codaSym.getRect().left);
                this.rect = new AnchoredRect(
                    toCodaText.getRect().left, codaSym.getRect().anchorX, codaSym.getRect().right,
                    toCodaText.getRect().top, toCodaText.getRect().anchorY, toCodaText.getRect().bottom
                );
                break;
            }
            default: {
                let text = this.components[0];
                text.layout(view);
                this.rect = text.getRect().clone();
                break;
            }
        }
    }

    offset(dx: number, dy: number) {
        this.components.forEach(c => c.offset(dx, dy));

        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.drawDebugRect(this.rect);

        this.components.forEach(c => c.draw(view, clipRect));
    }
}
