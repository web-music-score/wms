import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { DivRect, MSpecialText } from "../pub";

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
                codaSym.offset(0, (codaText.getRect().top + codaText.getRect().bottom) / 2);
                codaText.offset(codaSym.getRect().right, 0);
                this.rect = new DivRect(
                    codaSym.getRect().left, codaSym.getRect().centerX, codaText.getRect().right,
                    codaText.getRect().top, codaText.getRect().centerY, codaText.getRect().bottom
                );
                break;
            }
            case ObjSpecialText.toCoda: {
                let toCodaText = this.components[0];
                let codaSym = this.components[1];
                toCodaText.layout(ctx);
                codaSym.layout(ctx);
                codaSym.offset(0, (toCodaText.getRect().top + toCodaText.getRect().bottom) / 2);
                toCodaText.offset(codaSym.getRect().left, 0);
                this.rect = new DivRect(
                    toCodaText.getRect().left, codaSym.getRect().centerX, codaSym.getRect().right,
                    toCodaText.getRect().top, toCodaText.getRect().centerY, toCodaText.getRect().bottom
                );
                break;
            }
            default: {
                let text = this.components[0];
                text.layout(ctx);
                this.rect = text.getRect().copy();
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
