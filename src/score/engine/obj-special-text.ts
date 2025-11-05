import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { MSpecialText } from "../pub";
import { AnchoredRect } from "@tspro/ts-utils-lib";

export class ObjSpecialText extends MusicObject {
    public static toCoda = "𝄌 toCoda";
    public static Coda = "Coda 𝄌";
    public static Segno = "𝄋";

    private components: ObjText[] = [];

    readonly mi: MSpecialText;

    constructor(parent: MusicObject, readonly text: string) {
        super(parent);

        switch (this.text) {
            case ObjSpecialText.Coda:
                this.components = [
                    new ObjText(this, { text: "𝄌", scale: 1.7 }, 0.5, 0.3,),
                    new ObjText(this, " Coda", 0, 1)
                ];
                break;
            case ObjSpecialText.toCoda:
                this.components = [
                    new ObjText(this, "toCoda ", 1, 1),
                    new ObjText(this, { text: "𝄌", scale: 1.7 }, 0.5, 0.3)
                ];
                break;
            case ObjSpecialText.Segno:
                this.components = [new ObjText(this, { text: "𝄋", scale: 1.1 }, 0.5, 1)];
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

    layout(ctx: RenderContext) {
        switch (this.text) {
            case ObjSpecialText.Coda: {
                let codaSym = this.components[0];
                let codaText = this.components[1];
                codaSym.layout(ctx);
                codaText.layout(ctx);
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
                toCodaText.layout(ctx);
                codaSym.layout(ctx);
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
                text.layout(ctx);
                this.rect = text.getRect().clone();
                break;
            }
        }
    }

    offset(dx: number, dy: number) {
        this.components.forEach(c => c.offset(dx, dy));

        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        ctx.drawDebugRect(this.rect);

        this.components.forEach(c => c.draw(ctx));
    }
}
