import { View } from "./view";
import { MusicObject } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineLeft, ObjBarLineRight } from "./obj-bar-line";
import { ObjMeasure } from "./obj-measure";
import { SpanProps, SpanType } from "./span-props";
import { AnnotationKind, MSpanSegment } from "../pub";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { AnchoredRect, Rect } from "@tspro/ts-utils-lib";
import { ObjScoreRow } from "./obj-score-row";
import { ObjDocument } from "./obj-document";
import { ObjAnnotation } from "./obj-annotation";

export type SpanStartObject = ObjAnnotation;
export type SpanSegmentLeftObject = ObjBarLineLeft | MusicObject;
export type SpanSegmentRightObject = ObjRhythmColumn | ObjBarLineRight;
export type SpanStopObject = ObjBarLineRight | ObjAnnotation;
export type SpanPartObject = SpanStartObject | SpanSegmentLeftObject | SpanSegmentRightObject | SpanStopObject;

function getRow(obj: SpanPartObject | undefined): ObjScoreRow | undefined {
    let o: MusicObject | undefined = obj;

    while (o) {
        if ((o as any).row instanceof ObjScoreRow)
            return (o as any).row;
        if ((o as any).measure instanceof ObjMeasure)
            return (o as any).measure.row;
        o = o.getParent();
    }

    return undefined;
}

function isSpanStartObject(obj: unknown) {
    return obj instanceof ObjAnnotation;
}

function isSpanStopObject(obj: unknown) {
    return obj instanceof ObjBarLineRight || obj instanceof ObjAnnotation;
}

export class ObjSpanSegment extends MusicObject {
    readonly mi: MSpanSegment;

    constructor(readonly measure: ObjMeasure, readonly line: ObjNotationLine, readonly spanProps: SpanProps, readonly cols: SpanPartObject[]) {
        super(measure);

        spanProps.addSpanSegment(this);

        this.mi = new MSpanSegment(this);
    }

    get row(): ObjScoreRow {
        return this.measure.row;
    }

    get doc(): ObjDocument {
        return this.measure.row.doc;
    }

    get color(): string {
        return (this.spanProps.headObj.musicObj as { color?: string }).color ?? this.doc.color;
    }

    get type(): SpanType {
        return this.spanProps.type;
    }

    getMusicInterface(): MSpanSegment {
        return this.mi;
    }

    private getLeftObj(): SpanPartObject {
        return this.cols[0];
    }

    private getLineLeft(view: View): number {
        let obj = this.getLeftObj();

        if (isSpanStartObject(obj))
            return obj.getRect().right + view.unitSize;

        if (obj instanceof ObjBarLineLeft)
            return obj.getRect().anchorX;

        if (obj instanceof ObjRhythmColumn) {
            const mcols = obj.measure.getColumns();
            if (obj === mcols[0]) {
                if (obj.measure.isFirstMeasureInRow())
                    return obj.measure.getColumnsContentRect().left;
                else
                    return obj.measure.getRect().left;
            }
        }

        return obj.getRect().right;
    }

    private getRightObj(): SpanPartObject {
        const obj = this.cols[this.cols.length - 1];

        if (isSpanStopObject(obj)) {
            const objRow = getRow(obj);

            const prevObj = this.cols[this.cols.length - 2];
            const prevObjRow = getRow(prevObj);

            return objRow && prevObjRow && objRow !== prevObjRow
                ? prevObj
                : obj;
        }

        return obj;
    }

    private getLineRight(view: View): number {
        let obj = this.getRightObj();

        if (isSpanStopObject(obj))
            return obj.getRect().left - view.unitSize;

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

    layoutFitToMeasure(view: View) {
        let recth = view.unitSize;

        let lineLeft = this.getLineLeft(view);
        let lineRight = this.getLineRight(view);

        [lineLeft, lineRight] = [Math.min(lineLeft, lineRight), Math.max(lineLeft, lineRight)];

        this.rect = new AnchoredRect(lineLeft, lineRight, -recth, recth);

        if (this.type === SpanType.Line) {
            let offsetY: number;

            switch (this.spanProps.linePos) {
                case "bottom":
                    offsetY = view.unitSize * 1.1;
                    break;
                case "middle":
                default:
                    offsetY = 0;
                    break;
            }

            this.rect.anchorY -= offsetY;
        }
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        this.rect = new AnchoredRect();
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        const rowSegments = this.spanProps.spanSegments.filter(s => s.row === this.row);

        if (rowSegments.length === 0)
            return;

        const left = rowSegments[0];
        const right = rowSegments[rowSegments.length - 1];

        const thisRect = this.getRect();
        const leftRect = left.getRect();
        const rightRect = right.getRect();

        view.color(this.color).lineWidth(1);

        view.save();
        view.clipRect(thisRect.left, thisRect.top, thisRect.width, thisRect.height);

        if (this.type === SpanType.Line) {

            if (this.spanProps.lineStyle === "dashed")
                view.setLineDash([7, 3]);

            view.strokeLine(leftRect.left, leftRect.centerY, rightRect.right, rightRect.centerY);

            view.setLineDash([]);

            // Draw tip end of last line
            if (this === right && !isSpanStopObject(this.getRightObj())) {
                let tipY = rightRect.centerY > this.line.getRect().anchorY ? rightRect.top : rightRect.bottom;
                view.strokeLine(rightRect.right, rightRect.centerY, rightRect.right, tipY);
            }
        }
        else if (this.type === SpanType.Hairpin) {
            if (this.spanProps.annotationObj.kind === "<") {
                view.strokeLine(leftRect.left, leftRect.centerY, rightRect.right, rightRect.centerY - rightRect.height / 2 * 0.75);
                view.strokeLine(leftRect.left, leftRect.centerY, rightRect.right, rightRect.centerY + rightRect.height / 2 * 0.75);
            }
            else if (this.spanProps.annotationObj.kind === ">") {
                view.strokeLine(rightRect.right, rightRect.centerY, leftRect.left, leftRect.centerY - leftRect.height / 2 * 0.75);
                view.strokeLine(rightRect.right, rightRect.centerY, leftRect.left, leftRect.centerY + leftRect.height / 2 * 0.75);
            }
        }

        view.restore();
    }
}
