import { Assert } from "@tspro/ts-utils-lib";
import { Navigation } from "../pub";
import { isDynamicsText, isTempoText } from "./element-data";
import { MusicObject, MusicObjectLink } from "./music-object";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjText } from "./obj-text";

export type ExtensionLineStyle = "solid" | "dashed";
export type ExtensionLinePos = "bottom" | "middle";

function getTextAnchorY(linePos: ExtensionLinePos) {
    switch (linePos) {
        case "bottom": return 0.8;
        case "middle": return 0.5;
    }
}

export type ExtensionRangeInfo = {
    startColumn: ObjRhythmColumn,
    endColumn: ObjRhythmColumn,
    columnRange: ObjRhythmColumn[],
    extensionBreakText?: string
}

enum ExtensionContext { Undefined, Tempo, Volume }

function getContext(elementText: string): ExtensionContext {
    if (isDynamicsText(elementText)) {
        return ExtensionContext.Volume;
    }
    else if (isTempoText(elementText)) {
        return ExtensionContext.Tempo;
    }
    else {
        return ExtensionContext.Undefined;
    }
}

export class Extension extends MusicObjectLink {
    private readonly length: number;
    private readonly visible: boolean;

    private readonly lineStyle: ExtensionLineStyle;
    private readonly linePos: ExtensionLinePos;

    private readonly startColumn: ObjRhythmColumn;

    private readonly context: ExtensionContext;

    constructor(head: MusicObject, startColumn: ObjRhythmColumn, length: number, visible: boolean, lineStyle: ExtensionLineStyle, linePos: ExtensionLinePos) {
        super(head);

        this.length = length;
        this.visible = visible;

        this.lineStyle = lineStyle;
        this.linePos = linePos;

        this.startColumn = startColumn;

        this.context = head instanceof ObjText
            ? getContext(head.getText())
            : ExtensionContext.Undefined;

        if (head instanceof ObjText) {
            head.updateAnchorY(getTextAnchorY(linePos));
        }
        else {
            Assert.interrupt("Update anchor's y-coordinate is only implemented for text objects.");
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

    private getSpanBreakText(col: ObjRhythmColumn, context: ExtensionContext): string | undefined {
        if (col === col.measure.getColumn(0)) {
            let prevMeasure = col.measure.getPrevMeasure();
            if (prevMeasure) {
                if (prevMeasure.hasEndSection() || prevMeasure.hasEndSong()) {
                    return "section-break";
                }
                let elemArr = [Navigation.EndRepeat, Navigation.Ending];
                for (let i = 0; i < elemArr.length; i++) {
                    if (prevMeasure.hasNavigation(elemArr[i])) {
                        return "section-break";
                    }
                }
            }
        }

        if (context === ExtensionContext.Tempo) {
            let objArr = col.getAnchoredLayoutObjects();

            for (let i = 0; i < objArr.length; i++) {
                let text = objArr[i].getTextContent();

                if (text && isTempoText(text)) {
                    return text;
                }
            }
        }
        else if (context === ExtensionContext.Volume) {
            let objArr = col.getAnchoredLayoutObjects();

            for (let i = 0; i < objArr.length; i++) {
                let text = objArr[i].getTextContent();

                if (text && isDynamicsText(text)) {
                    return text;
                }
            }
        }

        return undefined;
    }

    getExtensionRangeInfo(): ExtensionRangeInfo {
        let { startColumn, length: extensionLength, context } = this;

        let columnRange: ObjRhythmColumn[] = [startColumn];

        if (extensionLength <= 0) {
            return { startColumn, endColumn: startColumn, columnRange, extensionBreakText: undefined }
        }

        let ticksLeft = extensionLength;
        let endColumn = startColumn;

        while (true) {
            let nextColumn = endColumn.getNextColumn();

            if (!nextColumn) {
                return { startColumn, endColumn, columnRange, extensionBreakText: undefined }
            }

            let extensionBreakText = this.getSpanBreakText(nextColumn, context);

            if (extensionBreakText !== undefined) {
                return { startColumn, endColumn, columnRange, extensionBreakText }
            }

            ticksLeft -= endColumn.getTicksToNextColumn();

            if (ticksLeft <= 0) {
                return { startColumn, endColumn, columnRange, extensionBreakText: undefined }
            }
            else {
                endColumn = nextColumn;
                columnRange.push(endColumn);
            }
        }
    }
}
