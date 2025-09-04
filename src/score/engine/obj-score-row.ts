import { Note } from "@tspro/web-music-score/theory";
import { ObjMeasure } from "./obj-measure";
import { Clef, DivRect, getVoiceIds, MScoreRow, StaffConfig, TabConfig } from "../pub";
import { MusicObject } from "./music-object";
import { ObjDocument } from "./obj-document";
import { Renderer } from "./renderer";
import { ObjTab, ObjStaff } from "./obj-staff-and-tab";
import { LayoutObjectWrapper, LayoutGroup, VerticalPos, LayoutGroupId } from "./layout-object";
import { ObjEnding } from "./obj-ending";
import { ObjExtensionLine } from "./obj-extension-line";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class ObjScoreRow extends MusicObject {
    private nextRow?: ObjScoreRow;

    private minWidth = 0;

    private readonly notationLines: ReadonlyArray<ObjStaff | ObjTab>;
    private readonly staves: ReadonlyArray<ObjStaff>;
    private readonly tabs: ReadonlyArray<ObjTab>;

    private readonly measures: ObjMeasure[] = [];

    private layoutGroups: LayoutGroup[/* LayoutGroupOrder */] = [];

    private needLayout = true;

    readonly mi: MScoreRow;

    constructor(readonly doc: ObjDocument, private readonly prevRow: ObjScoreRow | undefined, private readonly scoreConfig: (StaffConfig | TabConfig)[]) {
        super(doc);

        this.notationLines = this.createNotationLines();
        this.staves = this.notationLines.filter(line => line instanceof ObjStaff);
        this.tabs = this.notationLines.filter(line => line instanceof ObjTab);

        // nextRow of prevRow is this
        if (this.prevRow) {
            this.prevRow.nextRow = this;
        }

        this.mi = new MScoreRow(this);
    }

    getMusicInterface(): MScoreRow {
        return this.mi;
    }

    private createNotationLines(): (ObjStaff | ObjTab)[] {
        let notationLines = this.scoreConfig.map((cfg, index) => cfg.type === "staff" ? new ObjStaff(this, cfg, index) : new ObjTab(this, cfg, index));

        for (let i = 0; i < notationLines.length - 1; i++) {
            let treble = notationLines[i];
            let bass = notationLines[i + 1];
            if (treble instanceof ObjStaff && treble.isGrand() && treble.staffConfig.clef === Clef.G &&
                bass instanceof ObjStaff && bass.isGrand() && bass.staffConfig.clef === Clef.F) {
                treble.joinGrandStaff(bass);
                bass.joinGrandStaff(treble);
            }
        }

        return notationLines;
    }

    getNotationLines(): ReadonlyArray<ObjStaff | ObjTab> {
        return this.notationLines;
    }

    getStaves(): ReadonlyArray<ObjStaff> {
        return this.staves;
    }

    getTabs(): ReadonlyArray<ObjTab> {
        return this.tabs;
    }

    get hasStaff(): boolean {
        return this.staves.length > 0;
    }

    get hasTab(): boolean {
        return this.tabs.length > 0;
    }

    getTopStaff(): ObjStaff {
        let topStaff = this.staves[0];
        if (topStaff) {
            return topStaff;
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Top staff is required!");
        }
    }

    getBottomStaff(): ObjStaff {
        let bottomStaff = this.staves[this.staves.length - 1];
        if (bottomStaff) {
            return bottomStaff;
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Bottom staff is required!");
        }
    }

    getStaff(diatonicId: number): ObjStaff | undefined {
        Note.validateDiatonicId(diatonicId);

        for (let i = 0; i < this.notationLines.length; i++) {
            let line = this.notationLines[i];
            if (line instanceof ObjStaff && line.containsDiatonicId(diatonicId)) {
                return line;
            }
        }

        return undefined;
    }

    getLayoutGroup(lauoutGroupId: LayoutGroupId): LayoutGroup {
        let layoutGroup = this.layoutGroups[lauoutGroupId];

        if (!layoutGroup) {
            layoutGroup = this.layoutGroups[lauoutGroupId] = new LayoutGroup(lauoutGroupId);
        }

        return layoutGroup;
    }

    resetLayoutGroups(renderer: Renderer) {
        // Clear resolved position and layout objects
        this.layoutGroups.forEach(layoutGroup => {
            if (layoutGroup) {
                layoutGroup.clearPositionAndLayout(renderer);
            }
        });
    }

    layoutLayoutGroups(renderer: Renderer) {
        this.layoutGroups.forEach(layoutGroup => {
            if (layoutGroup) {
                this.layoutLayoutGroup(renderer, layoutGroup, VerticalPos.AboveStaff);
                this.layoutLayoutGroup(renderer, layoutGroup, VerticalPos.BelowStaff);
            }
        });
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.measures.length; i++) {
            let arr = this.measures[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.notationLines.length; i++) {
            let arr = this.notationLines[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    getConnectivesContentRect(): DivRect {
        let r = this.getRect();

        let firstMeasure = this.getFirstMeasure();
        let left = firstMeasure ? firstMeasure.getColumnsContentRect().left : r.left;

        return new DivRect(left, (left + r.right) / 2, r.right, r.top, r.centerY, r.bottom);
    }

    getDiatonicIdAt(y: number): number | undefined {
        for (let i = 0; i < this.notationLines.length; i++) {
            let line = this.notationLines[i];
            let diatonicId = line instanceof ObjStaff ? line.getDiatonicIdAt(y) : undefined;

            if (diatonicId !== undefined) {
                return diatonicId;
            }
        }

        return undefined;
    }

    addMeasure(m: ObjMeasure) {
        this.measures.push(m);
    }

    getMeasures(): ReadonlyArray<ObjMeasure> {
        return this.measures;
    }

    isFirstRow() {
        return this === this.doc.getFirstRow();
    }

    isLastRow() {
        return this === this.doc.getLastRow();
    }

    getPrevRow(): ObjScoreRow | undefined {
        return this.prevRow;
    }

    getNextRow(): ObjScoreRow | undefined {
        return this.nextRow;
    }

    getFirstMeasure(): ObjMeasure | undefined {
        return this.measures.length > 0 ? this.measures[0] : undefined;
    }

    getLastMeasure(): ObjMeasure | undefined {
        return this.measures.length > 0 ? this.measures[this.measures.length - 1] : undefined;
    }

    getMinWidth() {
        return this.minWidth;
    }

    requestLayout() {
        if (!this.needLayout) {
            this.needLayout = true;
            this.doc.requestLayout();
        }
    }

    layout(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        this.requestRectUpdate();

        this.notationLines.forEach(line => {
            line.removeObjects();
            line.layoutHeight(renderer);
        });

        this.rect = new DivRect(0, 0, 0, 0);

        // Calc min width
        this.minWidth = 0;

        // Layout measures
        this.measures.forEach(m => {
            m.layout(renderer);
            this.rect.expandInPlace(new DivRect(0, 0, m.getRect().top, m.getRect().bottom));
            this.minWidth += m.getMinWidth();
            this.minWidth += m.getPostMeasureBreakWidth();
        });
    }

    layoutWidth(renderer: Renderer, width: number) {
        if (!this.needLayout) {
            return;
        }

        let rowWidth = Math.max(width, this.minWidth);

        this.rect.centerX = this.rect.left + rowWidth / 2;
        this.rect.right = this.rect.left + rowWidth;

        this.notationLines.forEach(line => line.layoutWidth(renderer));

        // Layout measures width
        let targetColumnsAreaWidth = rowWidth;
        let minColumnsAreaWidth = 0;

        this.measures.forEach(m => {
            targetColumnsAreaWidth -= (m.getSolidAreaWidth() + m.getPostMeasureBreakWidth());
            minColumnsAreaWidth += m.getMinColumnsAreaWidth();
        });

        let columnsAreaScale = targetColumnsAreaWidth / minColumnsAreaWidth;

        let x = 0;

        this.measures.forEach(m => {
            let newMeasureWidth = m.getSolidAreaWidth() + m.getMinColumnsAreaWidth() * columnsAreaScale;
            m.layoutWidth(renderer, newMeasureWidth);
            let r = m.getRect();
            m.offset(x - r.left, -r.centerY);
            x += r.width;
            x += m.getPostMeasureBreakWidth();
        });

        this.measures.forEach(m => {
            m.layoutConnectives(renderer);
            m.layoutBeams(renderer);
        });
    }

    alignStemsToBeams() {
        this.measures.forEach(m => m.alignStemsToBeams());
    }

    layoutPositionLines(renderer: Renderer) {
        let { unitSize } = renderer;

        for (let i = 1; i < this.notationLines.length; i++) {
            let prev = this.notationLines[i - 1];
            let cur = this.notationLines[i];

            if (
                prev instanceof ObjStaff && prev.isGrand() && prev.staffConfig.clef === Clef.G &&
                cur instanceof ObjStaff && cur.isGrand() && cur.staffConfig.clef === Clef.F
            ) {
                let sep = unitSize * 6;
                cur.offset(0, prev.getBottomLineY() - cur.getTopLineY() + sep);
            }
            else {
                let sep = unitSize * 3;
                cur.offset(0, prev.calcBottom() - cur.calcTop() + sep);
            }
        }

        this.requestRectUpdate();

        this.measures.forEach(m => {
            m.requestRectUpdate();
            m.getBarLineLeft().requestRectUpdate();
            m.getBarLineRight().requestRectUpdate();
            m.getColumns().forEach(col => {
                col.requestRectUpdate();
                getVoiceIds().forEach(voiceId => col.getVoiceSymbol(voiceId)?.requestRectUpdate());
            });
        });

        let lines = this.getNotationLines();

        this.rect.top = lines[0].calcTop();
        this.rect.bottom = lines[lines.length - 1].calcBottom();

        this.alignStemsToBeams();
    }

    updateRect() { }

    private setObjectY(layoutObj: LayoutObjectWrapper, y: number | undefined) {
        if (y === undefined) {
            return;
        }

        let { measure, musicObj } = layoutObj;

        // Set y-position
        musicObj.offset(0, y - musicObj.getRect().centerY);

        // Position resolved
        layoutObj.setPositionResolved();

        // Expand measure
        measure.getRect().expandInPlace(musicObj.getRect());

        // Expand this row
        this.rect.expandInPlace(measure.getRect());
    }

    private alignObjectsY(renderer: Renderer, layoutObjArr: LayoutObjectWrapper[]) {
        layoutObjArr = layoutObjArr.filter(layoutObj => !layoutObj.isPositionResolved());

        let rowY: number | undefined;

        layoutObjArr.forEach(layoutObj => {
            let y = layoutObj.resolveClosestToStaffY(renderer);

            rowY = layoutObj.verticalPos === VerticalPos.BelowStaff
                ? Math.max(y, rowY ?? y)
                : Math.min(y, rowY ?? y);
        });

        layoutObjArr.forEach(layoutObj => this.setObjectY(layoutObj, rowY));
    }

    layoutLayoutGroup(renderer: Renderer, layoutGroup: LayoutGroup, verticalPos: VerticalPos) {
        // Get this row's objects
        let rowLayoutObjs = layoutGroup.getLayoutObjects(verticalPos).filter(layoutObj => !layoutObj.isPositionResolved());

        // Positioning horizontally to anchor
        rowLayoutObjs.forEach(layoutObj => {
            let { musicObj, anchor } = layoutObj;

            if (musicObj instanceof ObjEnding || musicObj instanceof ObjExtensionLine) {
                musicObj.layoutFitToMeasure(renderer);
            }
            else {
                musicObj.offset(anchor.getRect().centerX - musicObj.getRect().centerX, 0);
            }
        });

        if (layoutGroup.rowAlign) {
            // Resolve row-aligned objects
            this.alignObjectsY(renderer, rowLayoutObjs);
        }
        else {
            // Resolve non-row-aligned objects
            rowLayoutObjs.forEach(layoutObj => {
                let link = layoutObj.musicObj.getLink();
                if (link && link.getHead() === layoutObj.musicObj) {
                    let objectParts = [link.getHead(), ...link.getTails()];
                    let layoutObjs = rowLayoutObjs.filter(layoutObj => objectParts.some(o => o === layoutObj.musicObj));
                    this.alignObjectsY(renderer, layoutObjs);
                }
                else {
                    this.alignObjectsY(renderer, [layoutObj]);
                }
            });
        }
    }

    layoutPadding(renderer: Renderer) {
        // Add padding to rect
        let p = renderer.unitSize / 2;

        this.rect.left -= p;
        this.rect.right += p;
        this.rect.top -= p;
        this.rect.bottom += p;
    }

    layoutDone() {
        this.measures.forEach(m => m.layoutDone());

        this.needLayout = false;
    }

    offset(dx: number, dy: number) {
        this.measures.forEach(m => m.offset(dx, dy));
        this.rect.offsetInPlace(dx, dy);
        this.notationLines.forEach(l => l.offset(dx, dy));
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        renderer.drawDebugRect(this.getRect());

        // Set clip rect for this row
        ctx.save();
        ctx.rect(this.getRect().left, this.getRect().top, this.getRect().width, this.getRect().height);
        ctx.clip();

        // For multiple notation lines draw vertical start line (which is not drawn by measures)
        if (this.getFirstMeasure() && this.notationLines.length > 1 || this.notationLines.length === 1 && this.notationLines[0] instanceof ObjTab) {
            let left = this.getFirstMeasure()!.getStaffLineLeft();

            let tops: number[] = [];
            let bottoms: number[] = [];

            this.notationLines.forEach(line => {
                if (line instanceof ObjStaff) {
                    tops.push(line.getTopLineY());
                    bottoms.push(line.getBottomLineY());
                }
                else {
                    tops.push(line.getTopStringY());
                    bottoms.push(line.getBottomStringY());
                }
            });

            let top = Math.min(...tops);
            let bottom = Math.max(...bottoms);

            renderer.drawLine(left, top, left, bottom);
        }

        // Draw measures
        this.measures.forEach(m => m.draw(renderer));

        // Draw notation lines
        this.notationLines.forEach(m => m.draw(renderer));

        ctx.restore();
    }
}
