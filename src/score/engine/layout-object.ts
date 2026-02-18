import { VerticalPosition } from "../pub";
import { MusicObject } from "./music-object";
import { ObjEnding } from "./obj-ending";
import { ObjFermata } from "./obj-symbol";
import { ObjMeasure } from "./obj-measure";
import { ObjSpecialText } from "./obj-special-text";
import { ObjText } from "./obj-text";
import { ObjScoreRow } from "./obj-score-row";
import { View } from "./view";
import { ObjExtensionLine } from "./obj-extension-line";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { ObjLyrics } from "./obj-lyrics";
import { ObjTabRhythm } from "./obj-tab-rhythm";
import { AnchoredRect, asMulti, IndexArray, UniMap } from "@tspro/ts-utils-lib";
import { ScoreError } from "./error-utils";

/** Layout group ids in order, first is closest to staff, last is furthest from staff. */
export enum LayoutGroupId {
    TabRhythm,
    Annotation_Label_PitchLabel,    // Below staff by default.
    Annotation_Articulation,
    Annotation_Technique,
    Annotation_Ornament,
    Annotation_Temporal_Fermata,
    Annotation_Dynamics,            // Below staff by default.
    Annotation_Expression,
    Annotation_Tempo,
    Annotation_Temporal,
    Annotation_Navigation,
    Annotation_Navigation_Ending,
    Annotation_Label,
    Annotation_Label_ChordLabel,
    Annotation_Misc,
    LyricsVerse1,
    LyricsVerse2,
    LyricsVerse3
}

const LayoutGroupIdAttrs = new UniMap<LayoutGroupId, { rowAlign?: boolean, padding?: number }>([
    [LayoutGroupId.TabRhythm, { rowAlign: true }],
    [LayoutGroupId.Annotation_Label_PitchLabel, { padding: 1 }],
    [LayoutGroupId.Annotation_Articulation, { padding: 1 }],
    [LayoutGroupId.Annotation_Technique, { padding: 1 }],
    [LayoutGroupId.Annotation_Ornament, { padding: 1 }],
    [LayoutGroupId.Annotation_Temporal_Fermata, { padding: 1 }],
    [LayoutGroupId.Annotation_Dynamics, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Expression, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Tempo, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Temporal, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Navigation, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Navigation_Ending, { rowAlign: true, padding: 2 }],
    [LayoutGroupId.Annotation_Label, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Label_ChordLabel, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.Annotation_Misc, { rowAlign: true, padding: 1 }],
    [LayoutGroupId.LyricsVerse1, { rowAlign: true }],
    [LayoutGroupId.LyricsVerse2, { rowAlign: true }],
    [LayoutGroupId.LyricsVerse3, { rowAlign: true }],
]);

function requireParentMeasure(p: MusicObject | undefined): ObjMeasure {
    while (p) {
        if (p instanceof ObjMeasure) {
            return p;
        }

        p = p.getParent();
    }

    throw new ScoreError("Parent measure is required but not found!");
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
            throw new ScoreError("Parent music object is required as an anchor.");
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

    resolveClosestToStaffY(view: View): number {
        const { musicObj, measure, verticalPos, line, layoutGroup } = this;
        const padding = layoutGroup.getPadding(view);

        let lineTop = line.getTopLineY() - view.unitSize;
        let lineBottom = line.getBottomLineY() + view.unitSize;

        let y = verticalPos === VerticalPos.Below
            ? lineBottom + musicObj.getRect().toph
            : lineTop - musicObj.getRect().bottomh;

        let staticObjects = measure.getStaticObjects(line);
        let objShapeRects = musicObj.getShapeRects().map(r =>
            new AnchoredRect(r.left, r.anchorX, r.right, r.top - padding, r.anchorY, r.bottom + padding)
        );

        staticObjects.forEach(staticObj => {
            let staticShapeRects = staticObj.getShapeRects();

            objShapeRects.forEach(objR => {
                staticShapeRects.forEach(staticR => {
                    if (AnchoredRect.overlapX(objR, staticR)) {
                        y = verticalPos === VerticalPos.Below
                            ? Math.max(y, staticR.bottom + objR.toph + objR.anchorY)
                            : Math.min(y, staticR.top - objR.bottomh - objR.anchorY);
                    }
                });
            });
        });

        return y;
    }

    layout(view: View) {
        this.line.addObject(this);
    }

    offset(dx: number, dy: number) {
        this.musicObj.offset(dx, dy);
    }

    setAnchorY(y: number) {
        this.musicObj.setAnchorY(y);
    }

    getRect(): AnchoredRect {
        return this.musicObj.getRect();
    }
}

export class LayoutGroup {
    // key = VerticalPos
    private readonly layoutObject = asMulti(new IndexArray<LayoutObjectWrapper[]>());

    readonly rowAlign: boolean
    readonly padding: number;

    constructor(readonly layoutGroupId: number) {
        this.rowAlign = LayoutGroupIdAttrs.get(layoutGroupId)?.rowAlign === true;
        this.padding = LayoutGroupIdAttrs.get(layoutGroupId)?.padding ?? 0;
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

    layout(view: View) {
        for (const w of this.layoutObject.values()) {
            w.resetPositionResolved();
            w.musicObj.layout(view);
        }
    }

    getPadding(view: View) {
        return this.padding * view.unitSize;
    }
}
