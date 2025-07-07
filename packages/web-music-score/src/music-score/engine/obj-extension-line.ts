import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { MExtensionLine } from "../pub/interface";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineLeft, ObjBarLineRight } from "./obj-bar-line";
import { ObjMeasure } from "./obj-measure";
import { Extension } from "./extension";
import { DivRect } from "../pub";

export type ExtensionLineLeftObj = ObjBarLineLeft | MusicObject;
export type ExtensionLineRightObj = ObjRhythmColumn | ObjBarLineRight;

export class ObjExtensionLine extends MusicObject {
    readonly mi: MExtensionLine;

    constructor(readonly measure: ObjMeasure, readonly extension: Extension, readonly leftObj: ExtensionLineLeftObj, readonly rightObj: ExtensionLineRightObj) {
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
            return this.leftObj.getRect().centerX;
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
            return this.rightObj.getRect().centerX;
        }
    }

    layoutFitToMeasure(renderer: Renderer) {
        let { unitSize } = renderer;

        let lineLeft = this.getLineLeft();
        let lineRight = this.getLineRight();
        let lineRectH = unitSize;

        this.rect = new DivRect(lineLeft, lineRight, -lineRectH / 2, lineRectH / 2);
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        this.rect = new DivRect();
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        let { rect } = this;

        if (this.extension.getLineStyle() === "dashed") {
            ctx.setLineDash([7, 3]);
        }

        renderer.drawLine(rect.left, rect.centerY, rect.right, rect.centerY, "black", renderer.lineWidth);

        ctx.setLineDash([]);

        // Draw tip end of last line
        let tails = this.extension.getTails();
        if (tails.length > 0 && this === tails[tails.length - 1]) {
            let tipH = rect.centerY > this.measure.row.getBottomStaffBottom() ? -renderer.unitSize : renderer.unitSize;
            renderer.drawLine(rect.right, rect.centerY, rect.right, rect.centerY + tipH, "black", renderer.lineWidth);
        }
    }
}
