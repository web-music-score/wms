import { Note } from "@tspro/web-music-score/theory";
import { ObjMeasure } from "./obj-measure";
import { DivRect, getVoiceIds, MScoreRow, StaffConfig, Stem, TabConfig, VoiceId } from "../pub";
import { MusicObject } from "./music-object";
import { ObjDocument } from "./obj-document";
import { Renderer } from "./renderer";
import { ObjTab, ObjStaff, ObjNotationLine } from "./obj-staff-and-tab";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Utils } from "@tspro/ts-utils-lib";
import { RhythmSymbol } from "./obj-rhythm-column";
import { ObjRest } from "./obj-rest";
import { ObjNoteGroup } from "./obj-note-group";

// TODO: Add this to ts-utils-lib.
function avg(...values: number[]): number {
    return Utils.Math.sum(values) / values.length;
}

export class ObjScoreRow extends MusicObject {
    private nextRow?: ObjScoreRow;

    private minWidth = 0;

    private readonly notationLines: ReadonlyArray<ObjNotationLine>;
    private readonly staves: ReadonlyArray<ObjStaff>;
    private readonly tabs: ReadonlyArray<ObjTab>;

    private readonly measures: ObjMeasure[] = [];

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

    private createNotationLines(): (ObjNotationLine)[] {
        let notationLines = this.scoreConfig.map((cfg, index) => cfg.type === "staff" ? new ObjStaff(this, cfg, index) : new ObjTab(this, cfg, index));

        for (let i = 0; i < notationLines.length - 1; i++) {
            let treble = notationLines[i];
            let bass = notationLines[i + 1];
            if (
                treble instanceof ObjStaff && bass instanceof ObjStaff &&
                treble.staffConfig.grandId !== undefined && treble.staffConfig.grandId === bass.staffConfig.grandId
            ) {
                treble.joinGrandStaff(bass);
                bass.joinGrandStaff(treble);
            }
        }

        return notationLines;
    }

    getNotationLines(): ReadonlyArray<ObjNotationLine> {
        return this.notationLines;
    }

    findMatchingLine(line: ObjNotationLine): ObjNotationLine | undefined {
        return line.row === this ? line : this.notationLines.find(curLine => (
            line.row.notationLines.length === curLine.row.notationLines.length && (line.name.length > 0 && line.name === curLine.name || line.id === curLine.id)
        ));
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

    resetLayoutGroups(renderer: Renderer) {
        // Clear resolved position and layout objects
        this.notationLines.forEach(line => line.resetLayoutGroups(renderer));
    }

    layoutLayoutGroups(renderer: Renderer) {
        this.notationLines.forEach(line => line.layoutLayoutGroups(renderer));
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

    solveAutoStemDir(symbols: ReadonlyArray<RhythmSymbol>): Stem.Up | Stem.Down {
        if (symbols.length === 0) {
            return Stem.Up;
        }
        else {
            let voiceId = symbols[0].voiceId;
            let noteGroupDiatonicIds = symbols.filter(sym => sym instanceof ObjNoteGroup).map(n => n.setDiatonicId);
            let restDiatonicIds = symbols.filter(sym => sym instanceof ObjRest && sym.setDiatonicId !== ObjRest.UndefinedDiatonicId).map(r => r.setDiatonicId);

            if (noteGroupDiatonicIds.length === 0 && restDiatonicIds.length === 0) {
                return Stem.Up;
            }

            let diatonicIds = noteGroupDiatonicIds.length > 0 ? noteGroupDiatonicIds : restDiatonicIds;
            let avgDiatonicId = Math.floor(avg(...diatonicIds));

            let staves = this.getStaves().filter(staff => staff.containsVoiceId(voiceId) && staff.containsDiatonicId(avgDiatonicId));

            return staves.length > 0
                ? (avgDiatonicId >= staves[0].middleLineDiatonicId ? Stem.Down : Stem.Up)
                : Stem.Up;
        }
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

    updateRect() {
        let left = this.measures.length > 0 ? this.measures[0].getRect().left : 0;
        let right = this.measures.length > 0 ? this.measures[this.measures.length - 1].getRect().right : 0;
        let top = this.measures.length > 0 ? Math.min(...this.measures.map(m => m.getRect().top)) : 0;
        let bottom = this.measures.length > 0 ? Math.max(...this.measures.map(m => m.getRect().bottom)) : 0;

        this.rect = new DivRect(left, right, top, bottom);
    }

    alignStemsToBeams() {
        this.measures.forEach(m => m.alignStemsToBeams());
    }

    layoutSetNotationLines(renderer: Renderer) {
        let { unitSize } = renderer;

        for (let i = 1; i < this.notationLines.length; i++) {
            let prev = this.notationLines[i - 1];
            let cur = this.notationLines[i];

            if (
                prev instanceof ObjStaff && cur instanceof ObjStaff &&
                prev.staffConfig.grandId !== undefined && prev.staffConfig.grandId === cur.staffConfig.grandId
            ) {
                let dy = prev.getBottomLineY() - cur.getTopLineY() + unitSize * 6;
                cur.offset(0, dy);
            }
            else {
                let dy = prev.calcBottom() - cur.calcTop() + unitSize * 3;
                cur.offset(0, dy);
            }
        }

        this.measures.forEach(m => {
            m.requestRectUpdate();
            m.getBarLineLeft().requestRectUpdate();
            m.getBarLineRight().requestRectUpdate();
            m.getColumns().forEach(col => {
                col.requestRectUpdate();
                getVoiceIds().forEach(voiceId => col.getVoiceSymbol(voiceId)?.requestRectUpdate());
            });
        });

        this.alignStemsToBeams();

        this.requestRectUpdate();
    }

    layoutPadding(renderer: Renderer) {
        // Add padding to rect
        let p = renderer.unitSize / 2;

        this.getRect(); // Update this.rect

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
        if (this.getFirstMeasure() && (this.notationLines.length > 1 || this.notationLines[0] instanceof ObjTab)) {
            let left = this.getFirstMeasure()!.getStaffLineLeft();

            let top = Math.min(...this.notationLines.map(line => line.getTopLineY()));
            let bottom = Math.max(...this.notationLines.map(line => line.getBottomLineY()));

            renderer.drawLine(left, top, left, bottom);
        }

        // Draw measures
        this.measures.forEach(m => m.draw(renderer));

        // Draw notation lines
        this.notationLines.forEach(m => m.draw(renderer));

        ctx.restore();
    }
}
