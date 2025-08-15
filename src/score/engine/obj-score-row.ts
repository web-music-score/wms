import { Note } from "@tspro/web-music-score/theory";
import { ObjMeasure } from "./obj-measure";
import { Clef, DivRect, MScoreRow } from "../pub";
import { MusicObject } from "./music-object";
import { ObjDocument } from "./obj-document";
import { Renderer } from "./renderer";
import { ObjTab, ObjStaff } from "./obj-staff-and-tab";
import { LayoutObjectWrapper, LayoutGroup, VerticalPos } from "./layout-object";
import { ObjEnding } from "./obj-ending";
import { ObjExtensionLine } from "./obj-extension-line";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class ObjScoreRow extends MusicObject {
    private prevRow?: ObjScoreRow;
    private nextRow?: ObjScoreRow;

    private minWidth = 0;

    private readonly notationLines: (ObjStaff | ObjTab)[] = [];

    private readonly measures: ObjMeasure[] = [];

    private needLayout = true;

    readonly mi: MScoreRow;

    constructor(readonly doc: ObjDocument) {
        super(doc);

        this.notationLines = this.createNotationLines();

        // Set prevRow
        this.prevRow = doc.getLastRow();

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
        let notationLines = this.doc.config.map(cfg => cfg.type === "staff" ? new ObjStaff(this, cfg) : new ObjTab(this, cfg));

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

    get hasStaff(): boolean {
        return this.notationLines.some(line => line instanceof ObjStaff);
    }

    get hasTab(): boolean {
        return this.notationLines.some(line => line instanceof ObjTab);
    }

    getTopStaff(): ObjStaff {
        for (let i = 0; i < this.notationLines.length; i++) {
            let line = this.notationLines[i];
            if (line instanceof ObjStaff) {
                return line;
            }
        }

        throw new MusicError(MusicErrorType.Score, "Top staff is required!");
    }

    getBottomStaff(): ObjStaff {
        for (let i = this.notationLines.length - 1; i >= 0; i--) {
            let line = this.notationLines[i];
            if (line instanceof ObjStaff) {
                return line;
            }
        }

        throw new MusicError(MusicErrorType.Score, "Bottom staff is required!");
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

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
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
        let r = this.rect;

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

        this.notationLines.forEach(line => {
            line.removeObjects();
            line.layoutHeight(renderer);
        });

        let rect = new DivRect(0, 0, 0, 0);

        // Calc min width
        this.minWidth = 0;

        // Layout measures
        this.measures.forEach(m => {
            m.layout(renderer);
            rect.expandInPlace(new DivRect(0, 0, m.getRect().top, m.getRect().bottom));
            this.minWidth += m.getMinWidth();
            this.minWidth += m.getPostMeasureBreakWidth();
        });

        this.rect = rect;
    }

    layoutWidth(renderer: Renderer, width: number) {
        if (!this.needLayout) {
            return;
        }

        let rowWidth = Math.max(width, this.minWidth);

        this.rect = new DivRect(
            this.rect.left, this.rect.left + rowWidth / 2, this.rect.left + rowWidth,
            this.rect.top, this.rect.centerY, this.rect.bottom);

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
    }

    layoutConnectives(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout connectives
        this.measures.forEach(m => {
            m.layoutConnectives(renderer);
            this.rect.expandInPlace(m.getRect());
        });
    }

    layoutBeams(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout beams
        this.measures.forEach(m => {
            m.layoutBeams(renderer);
            this.rect.expandInPlace(m.getRect());
        });
    }

    layoutPositionLines(renderer: Renderer) {
        let p = renderer.unitSize * 6;

        for (let i = 1; i < this.notationLines.length; i++) {
            let prev = this.notationLines[i - 1];
            let cur = this.notationLines[i];

            cur.offset(0, prev.calcBottom() - cur.calcTop() + p);
        }

        this.updateVerticalSize();
    }

    updateVerticalSize() {
        let top = this.notationLines[0].calcTop();
        let bottom = this.notationLines[this.notationLines.length - 1].calcBottom();

        this.rect.top = top;
        this.rect.bottom = bottom;

        this.measures.forEach(m => m.updateVerticalSize(top, bottom));
    }

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
                : Math.min(y, rowY ?? y)
        });

        layoutObjArr.forEach(layoutObj => this.setObjectY(layoutObj, rowY));
    }

    layoutLayoutGroup(renderer: Renderer, layoutGroup: LayoutGroup, verticalPos: VerticalPos) {
        // Get this row's objects
        let rowLayoutObjs = layoutGroup.getLayoutObjects(verticalPos).filter(layoutObj => layoutObj.row === this && !layoutObj.isPositionResolved());

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
        let r = this.rect;
        let p = renderer.unitSize / 2;

        this.rect = new DivRect(r.left - p, r.centerX, r.right + p, r.top - p, r.centerY, r.bottom + p);
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

        renderer.drawDebugRect(this.rect);

        // Set clip rect for this row
        ctx.save();
        ctx.rect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
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
