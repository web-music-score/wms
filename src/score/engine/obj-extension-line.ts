import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineLeft, ObjBarLineRight } from "./obj-bar-line";
import { ObjMeasure } from "./obj-measure";
import { Extension } from "./extension";
import { DivRect, MExtensionLine } from "../pub";
import { ObjNotationLine } from "./obj-staff-and-tab";

export type ExtensionLineLeftObj = ObjBarLineLeft | MusicObject;
export type ExtensionLineRightObj = ObjRhythmColumn | ObjBarLineRight;

export class ObjExtensionLine extends MusicObject {
    readonly mi: MExtensionLine;

    constructor(readonly measure: ObjMeasure, readonly line: ObjNotationLine, readonly extension: Extension, readonly leftObj: ExtensionLineLeftObj, readonly rightObj: ExtensionLineRightObj) {
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

    private getLineLeft(): number {
        if (this.leftObj instanceof ObjBarLineLeft) {
            return this.leftObj.getRect().anchorX;
        }
        else {
            return this.leftObj.getRect().right;
        }
    }

    private getLineRight(): number {
        if (this.rightObj instanceof ObjRhythmColumn) {
            let col = this.rightObj;
            let nextCol = col.getNextColumn();

            if (nextCol && nextCol.measure === col.measure) {
                return (col.getRect().right + nextCol.getRect().left) / 2;
            }
            else {
                return (col.getRect().right + col.measure.getBarLineRight().getRect().left) / 2;
            }
        }
        else { // ObjBarLineRight
            return this.rightObj.getRect().anchorX;
        }
    }

    layoutFitToMeasure(ctx: RenderContext) {
        let { unitSize } = ctx;

        let lineLeft = this.getLineLeft();
        let lineRight = this.getLineRight();
        let lineRectH = unitSize;

        this.rect = new DivRect(lineLeft, lineRight, -lineRectH / 2, lineRectH / 2);
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        this.rect = new DivRect();
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        let { rect } = this;

        if (this.extension.getLineStyle() === "dashed") {
            ctx.setLineDash([7, 3]);
        }

        ctx.color("black").lineWidth(1);

        ctx.strokeLine(rect.left, rect.anchorY, rect.right, rect.anchorY);

        ctx.setLineDash([]);

        // Draw tip end of last line
        let tails = this.extension.getTails();
        if (tails.length > 0 && this === tails[tails.length - 1]) {
            let tipH = rect.anchorY > this.line.getRect().anchorY ? -ctx.unitSize : ctx.unitSize;
            ctx.strokeLine(rect.right, rect.anchorY, rect.right, rect.anchorY + tipH);
        }
    }
}
