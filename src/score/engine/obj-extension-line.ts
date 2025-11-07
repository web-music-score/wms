import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineLeft, ObjBarLineRight } from "./obj-bar-line";
import { ObjMeasure } from "./obj-measure";
import { Extension } from "./extension";
import { MExtensionLine } from "../pub";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { AnchoredRect } from "@tspro/ts-utils-lib";
import { ObjText } from "./obj-text";
import { ObjSpecialText } from "./obj-special-text";
import { DocumentColor } from "./settings";

export type ExtensionStartObject = ObjText | ObjSpecialText;
export type ExtensionLineLeftObject = ObjBarLineLeft | MusicObject;
export type ExtensionLineRightObject = ObjRhythmColumn | ObjBarLineRight;
export type ExtensionStopObject = ObjBarLineRight | ObjText | ObjSpecialText;
export type ExtensionObjectAll = ExtensionStartObject | ExtensionLineLeftObject | ExtensionLineRightObject | ExtensionStopObject;

function isExtensionStartObject(obj: unknown) {
    return obj instanceof ObjText || obj instanceof ObjSpecialText;
}

function isExtensionStopObject(obj: unknown) {
    return obj instanceof ObjBarLineRight || obj instanceof ObjText || obj instanceof ObjSpecialText;
}

export class ObjExtensionLine extends MusicObject {
    readonly mi: MExtensionLine;

    constructor(readonly measure: ObjMeasure, readonly line: ObjNotationLine, readonly extension: Extension, readonly cols: ExtensionObjectAll[]) {
        super(measure);

        extension.addTail(this);

        this.mi = new MExtensionLine(this);
    }

    get row() {
        return this.measure.row;
    }

    getMusicInterface(): MExtensionLine {
        return this.mi;
    }

    private getLineLeft(ctx: RenderContext): number {
        let obj = this.cols[0];

        if (isExtensionStartObject(obj))
            return obj.getRect().right + ctx.unitSize;

        if (obj instanceof ObjBarLineLeft)
            return obj.getRect().anchorX;

        if (obj instanceof ObjRhythmColumn) {
            const mcols = obj.measure.getColumns();
            if (obj === mcols[0])
                return obj.measure.getRect().left;
        }

        return obj.getRect().right;
    }

    private getLineRight(ctx: RenderContext): number {
        let obj = this.cols[this.cols.length - 1];

        if (isExtensionStopObject(obj))
            return obj.getRect().left - ctx.unitSize;

        if (obj instanceof ObjRhythmColumn) {
            const mcols = obj.measure.getColumns();
            if (obj === mcols[mcols.length - 1])
                return obj.measure.getRect().right;

            let next = obj.getNextColumn();
            if (next && next.measure === obj.measure)
                return (obj.getRect().right + next.getRect().left) / 2;
        }

        return obj.getRect().anchorX;
    }

    layoutFitToMeasure(ctx: RenderContext) {
        let recth = ctx.unitSize;

        let lineLeft = this.getLineLeft(ctx);
        let lineRight = this.getLineRight(ctx);

        [lineLeft, lineRight] = [Math.min(lineLeft, lineRight), Math.max(lineLeft, lineRight)];

        this.rect = new AnchoredRect(lineLeft, lineRight, -recth / 2, recth / 2);
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        this.rect = new AnchoredRect();
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        let { rect } = this;

        const head = this.extension.headObj.musicObj;
        const color = String(head.userData["extension-color"]);

        if (this.extension.getLineStyle() === "dashed")
            ctx.setLineDash([7, 3]);

        ctx.color(color).lineWidth(1);

        ctx.strokeLine(rect.left, rect.anchorY, rect.right, rect.anchorY);

        ctx.setLineDash([]);

        // Draw tip end of last line
        let tails = this.extension.getTails();
        let last = tails[tails.length - 1];

        if (this === last && !isExtensionStopObject(this.cols[this.cols.length - 1])) {
            let tipH = rect.anchorY > this.line.getRect().anchorY ? -ctx.unitSize : ctx.unitSize;
            ctx.strokeLine(rect.right, rect.anchorY, rect.right, rect.anchorY + tipH);
        }
    }
}
