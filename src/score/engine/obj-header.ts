import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { ObjText } from "./obj-text";
import { DivRect, MHeader } from "../pub";
import { ObjDocument } from "./obj-document";
import { ObjTab } from "./obj-staff-and-tab";
import { SymbolSet } from "theory/types";

export class ObjHeader extends MusicObject {
    private titleText?: ObjText;
    private composerText?: ObjText;
    private arrangerText?: ObjText;
    private tuningText?: ObjText;

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

        if (doc.getFirstRow()) {
            let tuningText: string = "";
            let tabs = doc.getFirstRow()!.getTabs();

            tabs.forEach((tab, tabIndex) => {
                if (tabs.length > 1) {
                    tuningText += `Tab ${(tabIndex + 1)}:\n`;
                }
                tuningText += `Tuning: ${tab.getTuningName() ?? ""}\n`;
                tuningText += tab.getTuningStrings().slice().reverse().map(n => n.formatOmitOctave(SymbolSet.Ascii)).join(" - ");
                if (tabIndex < tabs.length - 1) {
                    tuningText += "\n\n";
                }
            });

            this.tuningText = new ObjText(this, tuningText, 0, 0);
        }
        else {
            this.tuningText = undefined;
        }
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

        if (this.tuningText) {
            let arr = this.tuningText.pick(x, y);
            if (arr) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layoutWidth(renderer: Renderer, width: number) {
        let top = 0;
        let tuningTop = 0;

        this.rect = new DivRect(0, width, 0, 0);

        if (this.titleText) {
            this.titleText.layout(renderer);
            this.titleText.offset(width / 2, top);
            top += this.titleText.getRect().height;
            tuningTop = top;
            this.rect.expandInPlace(this.titleText.getRect());
        }

        if (this.composerText) {
            this.composerText.layout(renderer);
            this.composerText.offset(width, top)
            top += this.composerText.getRect().height;
            this.rect.expandInPlace(this.composerText.getRect());
        }

        if (this.arrangerText) {
            this.arrangerText.layout(renderer);
            this.arrangerText.offset(width, top)
            top += this.arrangerText.getRect().height;
            this.rect.expandInPlace(this.arrangerText.getRect());
        }

        if (this.tuningText) {
            this.tuningText.layout(renderer);
            this.tuningText.offset(0, tuningTop)
            this.rect.expandInPlace(this.tuningText.getRect());
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

        if (this.tuningText) {
            this.tuningText.offset(dx, dy);
        }

        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        if (this.titleText) {
            this.titleText.draw(renderer);
        }

        if (this.composerText) {
            this.composerText.draw(renderer);
        }

        if (this.arrangerText) {
            this.arrangerText.draw(renderer);
        }

        if (this.tuningText) {
            this.tuningText.draw(renderer);
        }
    }
}
