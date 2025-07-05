import { ObjMeasure } from "./obj-measure";
import { DivRect, MScoreRow, StaffKind } from "../pub";
import { MusicObject } from "./music-object";
import { ObjDocument } from "./obj-document";
import { Renderer } from "./renderer";
import { Note } from "../../music-theory/note";
import { ClefKind, StaffLine } from "./staff-line";
import { LayoutObjectWrapper, LayoutGroup, VerticalPos } from "./layout-object";
import { ObjEnding } from "./obj-ending";
import { ObjExtensionLine } from "./obj-extension-line";

const p = (noteName: string) => Note.getNote(noteName).pitch;

const StaffLine_Treble = new StaffLine(ClefKind.Treble, p("G4"), p("B4"), 0, p("C3"), p("C7"));
const StaffLine_GuitarTreble = new StaffLine(ClefKind.Treble, p("G3"), p("B3"), 0, p("C2"), p("C6"));
const StaffLine_Bass = new StaffLine(ClefKind.Bass, p("F3"), p("D3"), 0, p("C1"), p("C5"));
const StaffLine_Grand_Treble = new StaffLine(ClefKind.Treble, p("G4"), p("B4"), -4, p("C4"), p("C7"));
const StaffLine_Grand_Bass = new StaffLine(ClefKind.Bass, p("F3"), p("D3"), 4, p("C1"), p("C4") - 1);

export class ObjScoreRow extends MusicObject {
    public readonly staffKind: StaffKind;

    private prevRow?: ObjScoreRow;
    private nextRow?: ObjScoreRow;

    private pitchSpacing = 0;
    private lineSpacing = 0;
    private minWidth = 0;

    private readonly staffLines: StaffLine[] = [];
    private readonly measures: ObjMeasure[] = [];

    private readonly closestStaffLineCache: StaffLine[/* pitch */] = [];
    private readonly cachedPitchY: number[/* pitch */] = [];

    private needLayout = true;

    readonly mi: MScoreRow;

    constructor(readonly doc: ObjDocument) {
        super(doc);

        this.staffKind = doc.staffKind;

        switch (this.staffKind) {
            case StaffKind.GuitarTreble:
                this.staffLines[0] = StaffLine_GuitarTreble;
                break;
            case StaffKind.Treble:
            default:
                this.staffLines[0] = StaffLine_Treble;
                break;
            case StaffKind.Bass:
                this.staffLines[0] = StaffLine_Bass;
                break;
            case StaffKind.Grand:
                this.staffLines[0] = StaffLine_Grand_Treble;
                this.staffLines[1] = StaffLine_Grand_Bass;
                break;
        }

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

    get minPitch() {
        return this.getBottomStaffLine().minPitch;
    }

    get maxPitch() {
        return this.getTopStaffLine().maxPitch;
    }

    getStaffLines() {
        return this.staffLines;
    }

    getTopStaffLine() {
        return this.staffLines[0];
    }

    getBottomStaffLine() {
        return this.staffLines[this.staffLines.length - 1];
    }

    getClosestStaffLine(pitch: number): StaffLine {
        Note.validatePitch(pitch);

        if (this.closestStaffLineCache[pitch] === undefined) {
            let closestDistToPitch = Math.abs(pitch - this.staffLines[0].middleLinePitch);
            let closestStaffLine = this.staffLines[0];

            for (let i = 1; i < this.staffLines.length; i++) {
                let dist = Math.abs(pitch - this.staffLines[i].middleLinePitch);
                if (dist < closestDistToPitch) {
                    closestDistToPitch = dist;
                    closestStaffLine = this.staffLines[i];
                }
            }

            this.closestStaffLineCache[pitch] = closestStaffLine;
        }

        return this.closestStaffLineCache[pitch];
    }

    isPitchLine(pitch: number) {
        return pitch % 2 === this.staffLines[0].middleLinePitch % 2;
    }

    isPitchSpace(pitch: number) {
        return pitch % 2 !== this.staffLines[0].middleLinePitch % 2;
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

        return [this];
    }

    getArcsContentRect() {
        let r = this.rect;

        let firstMeasure = this.getFirstMeasure();
        let left = firstMeasure ? firstMeasure.getColumnsContentRect().left : r.left;

        return new DivRect(left, (left + r.right) / 2, r.right, r.top, r.centerY, r.bottom);
    }

    getPitchSpacing() {
        return this.pitchSpacing;
    }

    getLineSpacing() {
        return this.lineSpacing;
    }

    getPitchY(pitch: number): number {
        Note.validatePitch(pitch);

        if (this.cachedPitchY[pitch] === undefined) {
            let staffLine = this.staffLines.length === 1 || pitch >= this.staffLines[0].minPitch
                ? this.staffLines[0]
                : this.staffLines[1];

            let { pitchSpacing, lineSpacing } = this;

            let offsetY = staffLine.middleLineOffset * lineSpacing;

            this.cachedPitchY[pitch] = offsetY - (pitch - staffLine.middleLinePitch) * pitchSpacing;
        }

        return this.cachedPitchY[pitch] + this.rect.centerY;
    }

    getPitchAt(y: number): number | undefined {
        let { pitchSpacing, lineSpacing } = this;

        for (let i = 0; i < this.staffLines.length; i++) {
            let staffLine = this.staffLines[i];

            let offsetY = staffLine.middleLineOffset * lineSpacing;

            let pitch = Math.round(staffLine.middleLinePitch - (y - this.rect.centerY - offsetY) / pitchSpacing);

            if (pitch >= staffLine.minPitch && pitch <= staffLine.maxPitch) {
                return pitch;
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

    getTopStaffLineTop() {
        return this.getPitchY(this.getTopStaffLine().topLinePitch);
    }

    getBottomStaffLineBottom() {
        return this.getPitchY(this.getBottomStaffLine().bottomLinePitch);
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

        let { unitSize } = renderer;

        this.rect = new DivRect();

        if (this.pitchSpacing !== unitSize) {
            this.pitchSpacing = unitSize;
            this.lineSpacing = this.pitchSpacing * 2;

            // pitch spacing changed, clear pitch y cache.
            this.cachedPitchY.length = 0;
        }


        // Layout measures
        this.measures.forEach(m => m.layout(renderer));

        // Compute toph and bottomh
        let toph = 0, bottomh = 0;

        if (this.doc.needFullPitchRange()) {
            toph = -this.getPitchY(this.maxPitch + 1);
            bottomh = this.getPitchY(this.minPitch - 1);
        }
        else {
            toph = -this.getPitchY(this.getTopStaffLine().topLinePitch + 1);
            bottomh = this.getPitchY(this.getBottomStaffLine().bottomLinePitch - 1);
        }

        this.minWidth = 0;

        this.measures.forEach(m => {
            toph = Math.max(toph, m.getRect().toph);
            bottomh = Math.max(bottomh, m.getRect().bottomh);

            this.minWidth += m.getMinWidth();
            this.minWidth += m.getPostMeasureBreakWidth();
        });

        this.rect = new DivRect(0, 0, 0, -toph, 0, bottomh);
    }

    layoutWidth(renderer: Renderer, width: number) {
        if (!this.needLayout) {
            return;
        }

        let rowWidth = Math.max(width, this.minWidth);

        this.rect = new DivRect(
            this.rect.left, this.rect.left + rowWidth / 2, this.rect.left + rowWidth,
            this.rect.top, this.rect.centerY, this.rect.bottom);

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

    layoutArcsAndBeams(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout arcs
        this.measures.forEach(m => {
            m.layoutArcs(renderer);
            this.rect.expandInPlace(m.getRect());
        });

        // Layout beams
        this.measures.forEach(m => {
            m.layoutBeams(renderer);
            this.rect.expandInPlace(m.getRect());
        });
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

        // For multiple staff lines draw vertical start line (which is not drawn by measures)
        if (this.getFirstMeasure() && this.staffLines.length > 1) {
            let left = this.getFirstMeasure()!.getStaffLineLeft();
            let top = this.getPitchY(this.getTopStaffLine().topLinePitch);
            let bottom = this.getPitchY(this.getBottomStaffLine().bottomLinePitch);
            renderer.drawLine(left, top, left, bottom);
        }

        // Draw measures
        this.measures.forEach(m => m.draw(renderer));

        ctx.restore();
    }
}
