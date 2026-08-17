import { AnnotationKind } from "../pub";
import { MusicObject } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjMeasure } from "./obj-measure";
import { LayoutObjectWrapper } from "./layout-object";
import { SpanStopObject, ObjSpanSegment } from "./obj-span-segment";
import { ObjAnnotation } from "./obj-annotation";
import { Assert } from "@tspro/ts-utils-lib";

export type ExtensionLineStyle = "solid" | "dashed";
export type ExtensionLinePos = "bottom" | "middle";

export function getExtensionLineAnchorY(linePos: ExtensionLinePos) {
    switch (linePos) {
        case "bottom": return 0.8;
        case "middle": return 0.5;
    }
}

export class SpanRange {
    public readonly columnRange: ObjRhythmColumn[];
    public stopObject?: SpanStopObject;

    constructor(public readonly startColumn: ObjRhythmColumn) {
        this.columnRange = [startColumn];
    }

    get endColumn(): ObjRhythmColumn {
        return this.columnRange[this.columnRange.length - 1];
    }

    addColumn(col: ObjRhythmColumn) {
        if (this.endColumn !== col) this.columnRange.push(col);
    }

    setStopObject(obj: SpanStopObject) {
        this.stopObject = obj;
    }
}

export class SpanProps {
    readonly annotationObj: ObjAnnotation;
    readonly spanSegments: ObjSpanSegment[];

    private readonly length: number;
    private readonly visible: boolean;

    private readonly lineStyle: ExtensionLineStyle;
    private readonly linePos: ExtensionLinePos;

    private readonly startColumn: ObjRhythmColumn;

    constructor(readonly headObj: LayoutObjectWrapper, startColumn: ObjRhythmColumn, length: number, visible: boolean, lineStyle: ExtensionLineStyle, linePos: ExtensionLinePos) {
        Assert.assert(headObj.musicObj instanceof ObjAnnotation, "Head object must be annotation!");

        this.annotationObj = headObj.musicObj as ObjAnnotation;
        this.spanSegments = [];

        this.length = length + 1; // + 1 just to connect with following elem.
        this.visible = visible;

        this.lineStyle = lineStyle;
        this.linePos = linePos;

        this.startColumn = startColumn;
    }

    addSpanSegment(obj: ObjSpanSegment) {
        this.spanSegments.push(obj);
    }

    isVisible() {
        return this.visible;
    }

    getLineStyle(): ExtensionLineStyle {
        return this.lineStyle;
    }

    getLinePos(): ExtensionLinePos {
        return this.linePos;
    }

    private static StopNavigations = [AnnotationKind.EndRepeat, AnnotationKind.Ending];

    private whatStopped(col: ObjRhythmColumn): SpanStopObject | undefined {
        const m = col.measure;
        const cols = m.getColumns();

        const stoppingCol = col.getAnchoredLayoutObjects()
            .filter(obj => obj !== this.headObj && obj.layoutGroupId === this.headObj.layoutGroupId)
            .map(obj => obj.musicObj)
            .filter(obj => obj instanceof ObjAnnotation)[0];

        return stoppingCol ? stoppingCol : (
            col === cols[cols.length - 1] &&
            m.hasEndSection() || m.hasEndSong() || SpanProps.StopNavigations.some(nav => m.hasAnnotationKind(nav))
        ) ? m.getBarLineRight() : undefined;
    }

    getRange(): SpanRange {
        let { startColumn, length } = this;

        let curColumn: ObjRhythmColumn | undefined = startColumn;
        let range = new SpanRange(curColumn);
        let ticksLeft = Math.max(0, length - 1);

        while (true) {
            if (!curColumn || ticksLeft <= 0) return range;

            const stopObject = this.whatStopped(curColumn);
            if (stopObject !== undefined) {
                range.setStopObject(stopObject);
                return range;
            }

            range.addColumn(curColumn);

            ticksLeft -= curColumn.getTicksToNextColumn();

            curColumn = curColumn.getNextColumn();
        }
    }
}
