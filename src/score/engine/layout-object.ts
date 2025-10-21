import { DivRect, VerticalPosition } from "../pub";
import { MusicObject } from "./music-object";
import { ObjEnding } from "./obj-ending";
import { ObjFermata } from "./obj-fermata";
import { ObjMeasure } from "./obj-measure";
import { ObjSpecialText } from "./obj-special-text";
import { ObjText } from "./obj-text";
import { ObjScoreRow } from "./obj-score-row";
import { RenderContext } from "./render-context";
import { ObjExtensionLine } from "./obj-extension-line";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { ObjLyrics } from "./obj-lyrics";
import { ObjTabRhythm } from "./obj-tab-rhythm";
import { asMulti, IndexArray } from "@tspro/ts-utils-lib";

export enum LayoutGroupId {
    TabRhythm,
    Fermata,
    NoteLabel,
    Navigation,
    Ending,
    TempoAnnotation,
    DynamicsAnnotation,
    ChordLabel,
    LyricsVerse1,
    LyricsVerse2,
    LyricsVerse3
}

const WidenColumnList = [
    LayoutGroupId.NoteLabel,
    LayoutGroupId.ChordLabel
];;

const RowAlignList = [
    LayoutGroupId.TabRhythm,
    LayoutGroupId.Navigation,
    LayoutGroupId.Ending,
    LayoutGroupId.TempoAnnotation,
    LayoutGroupId.DynamicsAnnotation,
    LayoutGroupId.ChordLabel,
    LayoutGroupId.LyricsVerse1,
    LayoutGroupId.LyricsVerse2,
    LayoutGroupId.LyricsVerse3
];

function requireParentMeasure(p: MusicObject | undefined): ObjMeasure {
    while (p) {
        if (p instanceof ObjMeasure) {
            return p;
        }

        p = p.getParent();
    }

    throw new MusicError(MusicErrorType.Score, "Parent measure is required but not found!");
}

export enum VerticalPos { Above = 0, Below = 1 }

export type LayoutableMusicObject = ObjText | ObjSpecialText | ObjExtensionLine | ObjFermata | ObjEnding | ObjLyrics | ObjTabRhythm;

export class StaffGroup {
    constructor(readonly groupName: string, readonly staffsTabsAndGroups: number | string | (number | string)[], readonly verticalPosition: VerticalPosition) { }
}

export class LayoutObjectWrapper {
    readonly anchor: MusicObject;
    readonly measure: ObjMeasure;
    readonly row: ObjScoreRow;
    readonly layoutGroup: LayoutGroup;

    private positionResolved = true;

    constructor(readonly musicObj: LayoutableMusicObject, readonly line: ObjNotationLine, readonly layoutGroupId: LayoutGroupId, readonly verticalPos: VerticalPos) {
        this.measure = requireParentMeasure(this.musicObj);
        this.row = this.measure.row;

        let anchor = this.musicObj.getParent();

        if (!anchor) {
            throw new MusicError(MusicErrorType.Score, "Parent music object is required as an anchor.");
        }

        this.anchor = anchor;
        this.anchor.addAnchoredLayoutObject(this);

        this.layoutGroup = this.line.getLayoutGroup(layoutGroupId);
        this.layoutGroup.add(this);
    }

    resetPositionResolved() {
        this.positionResolved = false;
    }

    setPositionResolved() {
        this.positionResolved = true;
    }

    isPositionResolved() {
        return this.positionResolved;
    }

    resolveClosestToStaffY(ctx: RenderContext): number {
        let { musicObj, measure, verticalPos, line } = this;

        let lineTop = line.getTopLineY();
        let lineBottom = line.getBottomLineY();
        let linePadding = ctx.unitSize * 2;

        let y = verticalPos === VerticalPos.Below
            ? lineBottom + linePadding + musicObj.getRect().toph
            : lineTop - linePadding - musicObj.getRect().bottomh;

        let staticObjects = measure.getStaticObjects(line);
        let objShapeRects = musicObj.getShapeRects();

        staticObjects.forEach(staticObj => {
            let staticShapeRects = staticObj.getShapeRects();

            objShapeRects.forEach(objR => {
                staticShapeRects.forEach(staticR => {
                    if (DivRect.overlapX(objR, staticR)) {
                        y = verticalPos === VerticalPos.Below
                            ? Math.max(y, staticR.bottom + objR.toph + objR.anchorY)
                            : Math.min(y, staticR.top - objR.bottomh - objR.anchorY);
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

    layout(ctx: RenderContext) {
        this.line.addObject(this);
    }

    offset(dx: number, dy: number) {
        this.musicObj.offset(dx, dy);
    }

    getRect(): DivRect {
        return this.musicObj.getRect();
    }
}

export class LayoutGroup {
    // key = VerticalPos
    private readonly layoutObject = asMulti(new IndexArray<LayoutObjectWrapper[]>());

    readonly rowAlign: boolean
    readonly widensColumn: boolean;

    constructor(readonly layoutGroupId: number) {
        this.rowAlign = RowAlignList.indexOf(layoutGroupId) >= 0;
        this.widensColumn = WidenColumnList.indexOf(layoutGroupId) >= 0;
    }

    getLayoutObjects(verticalPos: VerticalPos): Readonly<LayoutObjectWrapper[]> {
        return this.layoutObject.getAll(verticalPos);
    }

    add(layoutObj: LayoutObjectWrapper) {
        this.layoutObject.add(layoutObj.verticalPos, layoutObj);
    }

    remove(layoutObj: LayoutObjectWrapper) {
        this.layoutObject.remove(layoutObj.verticalPos, layoutObj);
    }

    layout(ctx: RenderContext) {
        for (const w of this.layoutObject.values()) {
            w.resetPositionResolved();
            w.musicObj.layout(ctx);
        }
    }
}
