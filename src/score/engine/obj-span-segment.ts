import { View } from "./view";
import { MusicObject } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBarLineLeft, ObjBarLineRight } from "./obj-bar-line";
import { ObjMeasure } from "./obj-measure";
import { SpanProps } from "./span-props";
import { MSpanSegment } from "../pub";
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
            if (obj === mcols[0])
                return obj.measure.getRect().left;
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

        this.rect = new AnchoredRect(lineLeft, lineRight, -recth / 2, recth / 2);
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

        let { rect } = this;

        if (this.spanProps.getLineStyle() === "dashed")
            view.setLineDash([7, 3]);

        view.color(this.color).lineWidth(1);

        view.strokeLine(rect.left, rect.anchorY, rect.right, rect.anchorY);

        view.setLineDash([]);

        // Draw tip end of last line
        let { spanSegments } = this.spanProps;
        let last = spanSegments[spanSegments.length - 1];

        if (this === last && !isSpanStopObject(this.getRightObj())) {
            let tipH = rect.anchorY > this.line.getRect().anchorY ? -view.unitSize : view.unitSize;
            view.strokeLine(rect.right, rect.anchorY, rect.right, rect.anchorY + tipH);
        }
    }
}
