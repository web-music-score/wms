import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Navigation } from "../pub";
import { MusicObject, MusicObjectLink } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjText } from "./obj-text";
import { ObjSpecialText } from "./obj-special-text";
import { ObjMeasure } from "./obj-measure";
import { LayoutObjectWrapper } from "./layout-object";
import { ExtensionStopObject } from "./obj-extension-line";

export type ExtensionLineStyle = "solid" | "dashed";
export type ExtensionLinePos = "bottom" | "middle";

function getTextAnchorY(linePos: ExtensionLinePos) {
    switch (linePos) {
        case "bottom": return 0.8;
        case "middle": return 0.5;
    }
}

export function getTextContent(obj: MusicObject): string {
    if (obj instanceof ObjText || obj instanceof ObjSpecialText)
        return obj.getText();
    if (obj instanceof ObjMeasure)
        return "[measure]";
    return "";
}

export class ExtensionRange {
    public readonly columnRange: ObjRhythmColumn[];
    public stopObject?: ExtensionStopObject;
    constructor(public readonly startColumn: ObjRhythmColumn) {
        this.columnRange = [startColumn];
    }
    get endColumn(): ObjRhythmColumn {
        return this.columnRange[this.columnRange.length - 1];
    }
    addColumn(col: ObjRhythmColumn) {
        if (this.endColumn !== col) this.columnRange.push(col);
    }
    setStopObject(obj: ExtensionStopObject) {
        this.stopObject = obj;
    }
}

export class Extension extends MusicObjectLink {
    private readonly length: number;
    private readonly visible: boolean;

    private readonly lineStyle: ExtensionLineStyle;
    private readonly linePos: ExtensionLinePos;

    private readonly startColumn: ObjRhythmColumn;

    private readonly layoutObj?: LayoutObjectWrapper;

    constructor(readonly headObj: LayoutObjectWrapper, startColumn: ObjRhythmColumn, length: number, visible: boolean, lineStyle: ExtensionLineStyle, linePos: ExtensionLinePos) {
        super(headObj.musicObj);

        this.length = length;
        this.visible = visible;

        this.lineStyle = lineStyle;
        this.linePos = linePos;

        this.startColumn = startColumn;

        if (headObj.musicObj instanceof ObjText) {
            headObj.musicObj.updateAnchorY(getTextAnchorY(linePos));
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Update anchor's y-coordinate is only implemented for text objects.");
        }
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

    private static StopNavigations = [Navigation.EndRepeat, Navigation.Ending];

    private whatStopped(col: ObjRhythmColumn): ExtensionStopObject | undefined {
        const m = col.measure;
        const cols = m.getColumns();
        return (
            col === cols[cols.length - 1] &&
            m.hasEndSection() || m.hasEndSong() || Extension.StopNavigations.some(nav => m.hasNavigation(nav))
        )
            ? m
            : col.getAnchoredLayoutObjects()
                .filter(obj => obj !== this.headObj && obj.layoutGroupId === this.headObj.layoutGroupId)
                .map(obj => obj.musicObj)
                .filter(obj => obj instanceof ObjText || obj instanceof ObjSpecialText)[0];
    }

    getRange(): ExtensionRange {
        let { startColumn, length } = this;

        let curColumn: ObjRhythmColumn | undefined = startColumn;
        let range = new ExtensionRange(curColumn);
        let ticksLeft = length;

        while (true) {
            if (ticksLeft <= 0) return range;

            const stopObject = this.whatStopped(curColumn);
            if (stopObject !== undefined) {
                range.setStopObject(stopObject);
                return range;
            }

            ticksLeft -= curColumn.getTicksToNextColumn();

            curColumn = curColumn.getNextColumn();
            if (!curColumn) return range;

            if (ticksLeft > 0)
                range.addColumn(curColumn);
        }
    }
}
