import { Note } from "@tspro/web-music-score/theory";
import { ObjMeasure } from "./obj-measure";
import { DivRect, MScoreRow, StaffPreset } from "../pub";
import { MusicObject } from "./music-object";
import { ObjDocument } from "./obj-document";
import { Renderer } from "./renderer";
import { Clef, GuitarTab, MusicStaff } from "./staff-and-tab";
import { LayoutObjectWrapper, LayoutGroup, VerticalPos } from "./layout-object";
import { ObjEnding } from "./obj-ending";
import { ObjExtensionLine } from "./obj-extension-line";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

const p = (noteName: string) => Note.getNote(noteName).diatonicId;

const createStaff_Treble = () => new MusicStaff(Clef.Treble, p("G4"), p("B4"), p("C3"), p("C7"));
const createStaff_GuitarTreble = () => new MusicStaff(Clef.Treble, p("G3"), p("B3"), p("C2"), p("C6"));
const createStaff_Bass = () => new MusicStaff(Clef.Bass, p("F3"), p("D3"), p("C1"), p("C5"));
const createStaff_Grand_Treble = () => new MusicStaff(Clef.Treble, p("G4"), p("B4"), p("C4"), p("C7"));
const createStaff_Grand_Bass = () => new MusicStaff(Clef.Bass, p("F3"), p("D3"), p("C1"), p("C4") - 1);

export class ObjScoreRow extends MusicObject {
    public readonly staffPreset: StaffPreset;

    private prevRow?: ObjScoreRow;
    private nextRow?: ObjScoreRow;

    private minWidth = 0;

    private readonly staves: MusicStaff[] = [];
    private tab?: GuitarTab;

    private readonly measures: ObjMeasure[] = [];

    private needLayout = true;

    readonly mi: MScoreRow;

    constructor(readonly doc: ObjDocument) {
        super(doc);

        this.staffPreset = doc.staffPreset;

        switch (this.staffPreset) {
            case StaffPreset.Treble:
                this.staves[0] = createStaff_Treble();
                break;
            case StaffPreset.Bass:
                this.staves[0] = createStaff_Bass();
                break;
            case StaffPreset.Grand:
                this.staves[0] = createStaff_Grand_Treble();
                this.staves[1] = createStaff_Grand_Bass();
                break;
            case StaffPreset.GuitarTreble:
                this.staves[0] = createStaff_GuitarTreble();
                break;
            case StaffPreset.GuitarTab:
                this.tab = new GuitarTab();
                break;
            case StaffPreset.GuitarCombined:
                this.staves[0] = createStaff_GuitarTreble();
                this.tab = new GuitarTab();
                break;
            default:
                throw new MusicError(MusicErrorType.Score, "Invalid staffPreset: " + this.staffPreset);
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

    get hasStaff(): boolean {
        return this.staves[0] !== undefined;
    }

    get hasTab(): boolean {
        return this.tab !== undefined;
    }

    getTab(): GuitarTab | undefined {
        return this.tab;
    }

    getStaves(): ReadonlyArray<MusicStaff> {
        return this.staves;
    }

    getTopStaff(): MusicStaff {
        let staff = this.staves[0];
        if (!staff) {
            throw new MusicError(MusicErrorType.Score, "Top staff is required!");
        }
        else {
            return staff;
        }
    }

    getBottomStaff(): MusicStaff {
        let staff = this.staves[this.staves.length - 1];
        if (!staff) {
            throw new MusicError(MusicErrorType.Score, "Bottom staff is required!");
        }
        else {
            return staff;
        }
    }

    getStaff(diatonicId: number): MusicStaff | undefined {
        Note.validateDiatonicId(diatonicId);

        for (let i = 0; i < this.staves.length; i++) {
            let staff = this.staves[i];
            if (staff.containsDiatonicId(diatonicId)) {
                return staff;
            }
        }

        return undefined;
    }

    getLowestDiatonicId(): number | undefined {
        if (!this.hasStaff) {
            return undefined;
        }
        else if (this.doc.fullDiatonicRange) {
            return this.getBottomStaff().minDiatonicId;
        }
        else {
            let diatonicId = this.getBottomStaff().bottomLineDiatonicId;
            return Math.min(diatonicId, ...this.measures.map(m => m.getLowestDiatonicId(diatonicId)));
        }
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

    getConnectivesContentRect(): DivRect {
        let r = this.rect;

        let firstMeasure = this.getFirstMeasure();
        let left = firstMeasure ? firstMeasure.getColumnsContentRect().left : r.left;

        return new DivRect(left, (left + r.right) / 2, r.right, r.top, r.centerY, r.bottom);
    }

    getDiatonicIdAt(y: number): number | undefined {
        for (let i = 0; i < this.staves.length; i++) {
            let diatonicId = this.staves[i].getDiatonicIdAt(y);

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

        let { unitSize } = renderer;

        this.rect = new DivRect();

        let lineSpacing = unitSize * 2;

        // Compute staff top/bottom line y
        this.staves.forEach(staff => {
            staff.topLineY = -lineSpacing * 2;
            staff.bottomLineY = lineSpacing * 2;
        });

        if (this.staves.length === 2) {
            this.staves[0].topLineY -= lineSpacing * 4;
            this.staves[0].bottomLineY -= lineSpacing * 4;
            this.staves[1].topLineY += lineSpacing * 4;
            this.staves[1].bottomLineY += lineSpacing * 4;
        }

        // Compute toph and bottomh
        let rect = new DivRect();

        this.staves.forEach(staff => rect.expandInPlace(new DivRect(0, 0, staff.topLineY, staff.bottomLineY)));

        if (this.hasStaff && this.doc.fullDiatonicRange) {
            this.staves.forEach(staff => {
                let top = staff.getDiatonicIdY(staff.maxDiatonicId) - staff.getLineSpacing();
                let bottom = staff.getDiatonicIdY(staff.minDiatonicId) + staff.getLineSpacing();
                rect.expandInPlace(new DivRect(0, 0, top, bottom));
            });
        }

        if (this.tab) {
            let lowestDiatonicId = this.getLowestDiatonicId();
            let lowestY = lowestDiatonicId !== undefined ? this.getStaff(lowestDiatonicId)?.getDiatonicIdY(lowestDiatonicId) : undefined;
            this.tab.top = lowestY !== undefined ? lowestY + unitSize * 8 : 0;
            this.tab.bottom = this.tab.top + unitSize * DocumentSettings.GuitarTabHeight;
            rect.expandInPlace(new DivRect(0, 0, this.tab.top, this.tab.bottom));
        }

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

    layoutConnectivesAndBeams(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout connectives
        this.measures.forEach(m => {
            m.layoutConnectives(renderer);
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
        this.staves.forEach(s => s.offset(dx, dy));
        if (this.tab) {
            this.tab.offset(dx, dy);
        }
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
        if (this.getFirstMeasure() && (this.staves.length > 1 || this.tab)) {
            let left = this.getFirstMeasure()!.getStaffLineLeft();

            let top: number, bottom: number;

            if (this.hasStaff) {
                top = this.getTopStaff().topLineY;
                bottom = this.tab ? this.tab.getStringY(5) : this.getBottomStaff().bottomLineY;
            }
            else if (this.tab) {
                top = this.tab.getStringY(0);
                bottom = this.tab.getStringY(5);
            }
            else {
                top = bottom = 0;
            }

            renderer.drawLine(left, top, left, bottom);
        }

        // Draw measures
        this.measures.forEach(m => m.draw(renderer));

        ctx.restore();
    }
}
