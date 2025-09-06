import { DivRect } from "../pub";
import { MusicObject } from "./music-object";
import { ObjEnding } from "./obj-ending";
import { ObjFermata } from "./obj-fermata";
import { ObjMeasure } from "./obj-measure";
import { ObjSpecialText } from "./obj-special-text";
import { ObjText } from "./obj-text";
import { ObjScoreRow } from "./obj-score-row";
import { Renderer } from "./renderer";
import { ObjExtensionLine } from "./obj-extension-line";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjNotationLine, ObjStaff } from "./obj-staff-and-tab";

export enum LayoutGroupId {
    Fermata,
    NoteLabel,
    Navigation,
    Ending,
    TempoAnnotation,
    DynamicsAnnotation,
    ChordLabel
}

const WidenColumnList = [LayoutGroupId.NoteLabel, LayoutGroupId.ChordLabel];
const RowAlignList = [LayoutGroupId.Navigation, LayoutGroupId.Ending, LayoutGroupId.TempoAnnotation, LayoutGroupId.DynamicsAnnotation, LayoutGroupId.ChordLabel];

function requireParentMeasure(p: MusicObject | undefined): ObjMeasure {
    while (p) {
        if (p instanceof ObjMeasure) {
            return p;
        }

        p = p.getParent();
    }

    throw new MusicError(MusicErrorType.Score, "Parent measure is required but not found!");
}

export enum VerticalPos { AboveStaff, BelowStaff }

export type LayoutableMusicObject = ObjText | ObjSpecialText | ObjExtensionLine | ObjFermata | ObjEnding;

export class LayoutObjectWrapper {
    readonly anchor: MusicObject;
    readonly measure: ObjMeasure;
    readonly row: ObjScoreRow;
    readonly layoutGroup: LayoutGroup;

    private positionResolved = true;

    constructor(readonly musicObj: LayoutableMusicObject, readonly line: ObjNotationLine, readonly layoutGroupId: LayoutGroupId, readonly verticalPos: VerticalPos) {
        this.measure = requireParentMeasure(musicObj);
        this.row = this.measure.row;

        let anchor = this.musicObj.getParent();

        if (!anchor) {
            throw new MusicError(MusicErrorType.Score, "Parent music object is required as an anchor.");
        }

        this.anchor = anchor;

        this.anchor.addAnchoredLayoutObject(this);

        this.layoutGroup = this.line.getLayoutGroup(layoutGroupId);

        this.layoutGroup.add(this);

        this.line.addObject(this.musicObj);
    }

    clearPositionResolved() {
        this.positionResolved = false;
    }

    setPositionResolved() {
        this.positionResolved = true;
    }

    isPositionResolved() {
        return this.positionResolved;
    }

    resolveClosestToStaffY(renderer: Renderer): number {
        let { musicObj, measure, verticalPos, line } = this;

        let staffTop = line.getTopLineY();
        let staffBottom = line.getBottomLineY();
        let staffPadding = renderer.unitSize * 2;

        let y = verticalPos === VerticalPos.BelowStaff
            ? staffBottom + staffPadding + musicObj.getRect().toph
            : staffTop - staffPadding - musicObj.getRect().bottomh;

        let staticObjects = measure.getStaticObjects(line);
        let objShapeRects = musicObj.getShapeRects();

        staticObjects.forEach(staticObj => {
            let staticShapeRects = staticObj.getShapeRects();

            objShapeRects.forEach(objR => {
                staticShapeRects.forEach(staticR => {
                    if (DivRect.overlapX(objR, staticR)) {
                        y = verticalPos === VerticalPos.BelowStaff
                            ? Math.max(y, staticR.bottom + objR.toph + objR.centerY)
                            : Math.min(y, staticR.top - objR.bottomh - objR.centerY);
                    }
                });
            });
        });

        return y;
    }

    getTextContent(): string | undefined {
        if (this.musicObj instanceof ObjText || this.musicObj instanceof ObjSpecialText) {
            return this.musicObj.getText();
        }
        else {
            return undefined;
        }
    }
}

export class LayoutGroup {
    private readonly layoutObjectTable: LayoutObjectWrapper[/* VerticalPos */][/* Object Array */] = [];

    readonly rowAlign: boolean
    readonly widensColumn: boolean;

    constructor(readonly layoutGroupId: number) {
        this.layoutObjectTable[VerticalPos.AboveStaff] = [];
        this.layoutObjectTable[VerticalPos.BelowStaff] = [];

        this.rowAlign = RowAlignList.indexOf(layoutGroupId) >= 0;
        this.widensColumn = WidenColumnList.indexOf(layoutGroupId) >= 0;
    }

    getLayoutObjects(verticalPos: VerticalPos): Readonly<LayoutObjectWrapper[]> {
        return this.layoutObjectTable[verticalPos];
    }

    add(layoutObj: LayoutObjectWrapper) {
        this.layoutObjectTable[layoutObj.verticalPos].push(layoutObj);
    }

    remove(layoutObj: LayoutObjectWrapper) {
        this.layoutObjectTable.forEach(layoutObjects => {
            let i = layoutObjects.indexOf(layoutObj);
            if (i >= 0) {
                layoutObjects.splice(i, 1);
            }
        });
    }

    clearPositionAndLayout(renderer: Renderer) {
        this.layoutObjectTable.forEach(layoutObjects => {
            layoutObjects.forEach(layoutObj => {
                layoutObj.clearPositionResolved();
                layoutObj.musicObj.layout(renderer);
            });
        });
    }
}
