import { MusicObject } from "./music-object";
import { RenderContext } from "./render-context";
import { ObjText } from "./obj-text";
import { MHeader } from "../pub";
import { ObjDocument } from "./obj-document";
import { AnchoredRect } from "@tspro/ts-utils-lib";

export class ObjHeader extends MusicObject {
    private titleText?: ObjText;
    private composerText?: ObjText;
    private arrangerText?: ObjText;

    readonly mi: MHeader;

    constructor(doc: ObjDocument, readonly title?: string, readonly composer?: string, readonly arranger?: string) {
        super(doc);

        this.mi = new MHeader(this);

        this.titleText = this.title
            ? new ObjText(this, { text: this.title, scale: 2 }, 0.5, 0)
            : undefined;

        this.composerText = this.composer
            ? new ObjText(this, this.composer, 1, 0)
            : undefined;

        this.arrangerText = this.arranger
            ? new ObjText(this, "Arr.: " + this.arranger, 1, 0)
            : undefined;
    }

    getMusicInterface(): MHeader {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        if (this.titleText) {
            let arr = this.titleText.pick(x, y);
            if (arr) {
                return [this, ...arr];
            }
        }

        if (this.composerText) {
            let arr = this.composerText.pick(x, y);
            if (arr) {
                return [this, ...arr];
            }
        }

        if (this.arrangerText) {
            let arr = this.arrangerText.pick(x, y);
            if (arr) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layoutWidth(ctx: RenderContext, left: number, right: number) {
        let top = 0;

        this.rect = new AnchoredRect(left, right, 0, 0);

        if (this.titleText) {
            this.titleText.layout(ctx);
            this.titleText.offset((left + right) / 2, top);
            top += this.titleText.getRect().height;
            this.rect.expandInPlace(this.titleText.getRect());
        }

        if (this.composerText) {
            this.composerText.layout(ctx);
            this.composerText.offset(right, top)
            top += this.composerText.getRect().height;
            this.rect.expandInPlace(this.composerText.getRect());
        }

        if (this.arrangerText) {
            this.arrangerText.layout(ctx);
            this.arrangerText.offset(right, top)
            top += this.arrangerText.getRect().height;
            this.rect.expandInPlace(this.arrangerText.getRect());
        }
    }

    offset(dx: number, dy: number) {
        if (this.titleText) {
            this.titleText.offset(dx, dy);
        }

        if (this.composerText) {
            this.composerText.offset(dx, dy);
        }

        if (this.arrangerText) {
            this.arrangerText.offset(dx, dy);
        }

        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        if (this.titleText) {
            this.titleText.draw(ctx);
        }

        if (this.composerText) {
            this.composerText.draw(ctx);
        }

        if (this.arrangerText) {
            this.arrangerText.draw(ctx);
        }
    }
}
