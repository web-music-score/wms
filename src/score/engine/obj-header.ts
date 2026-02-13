import { MusicObject } from "./music-object";
import { View } from "./view";
import { ObjText } from "./obj-text";
import { colorKey, MHeader } from "../pub";
import { ObjDocument } from "./obj-document";
import { AnchoredRect } from "@tspro/ts-utils-lib";

export class ObjHeader extends MusicObject {
    private titleText?: ObjText;
    private composerText?: ObjText;
    private arrangerText?: ObjText;

    readonly mi: MHeader;

    constructor(readonly doc: ObjDocument, readonly title?: string, readonly composer?: string, readonly arranger?: string) {
        super(doc);

        this.mi = new MHeader(this);

        this.titleText = this.title
            ? new ObjText(this, { text: this.title, color: colorKey("header.title"), scale: 2 }, 0.5, 0)
            : undefined;

        this.composerText = this.composer
            ? new ObjText(this, { text: this.composer, color: colorKey("header.composer") }, 1, 0)
            : undefined;

        this.arrangerText = this.arranger
            ? new ObjText(this, { text: "Arr.: " + this.arranger, color: colorKey("header.arranger") }, 1, 0)
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
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.composerText) {
            let arr = this.composerText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.arrangerText) {
            let arr = this.arrangerText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layout(view: View) {
        const p = view.unitSize;

        let top = p;
        const left = this.doc.regions.staffLeft + p;
        const right = this.doc.regions.staffRight - p;

        const rect = new AnchoredRect(left, right, top, top);

        if (this.titleText) {
            this.titleText.layout(view);
            this.titleText.setCenterX((left + right) / 2);
            this.titleText.setTop(top);
            top += this.titleText.getRect().height;
            rect.unionInPlace(this.titleText.getRect());
        }

        if (this.composerText) {
            this.composerText.layout(view);
            this.composerText.setRight(right);
            this.composerText.setTop(top);
            top += this.composerText.getRect().height;
            rect.unionInPlace(this.composerText.getRect());
        }

        if (this.arrangerText) {
            this.arrangerText.layout(view);
            this.arrangerText.setRight(right);
            this.arrangerText.setTop(top);
            top += this.arrangerText.getRect().height;
            rect.unionInPlace(this.arrangerText.getRect());
        }

        this.rect = rect.inflateCopy(p);
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

    draw(view: View) {
        if (this.titleText) {
            this.titleText.draw(view);
        }

        if (this.composerText) {
            this.composerText.draw(view);
        }

        if (this.arrangerText) {
            this.arrangerText.draw(view);
        }
    }
}
