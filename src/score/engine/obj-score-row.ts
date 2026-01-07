import { Note } from "web-music-score/theory";
import { ObjMeasure } from "./obj-measure";
import { getVoiceIds, MScoreRow, StaffConfig, Stem, TabConfig } from "../pub";
import { MusicObject } from "./music-object";
import { ObjDocument } from "./obj-document";
import { RenderContext } from "./render-context";
import { ObjTab, ObjStaff, ObjNotationLine } from "./obj-staff-and-tab";
import { MusicError, MusicErrorType } from "web-music-score/core";
import { AnchoredRect, Guard, Utils } from "@tspro/ts-utils-lib";
import { RhythmSymbol } from "./obj-rhythm-column";
import { ObjRest } from "./obj-rest";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjScoreRowGroup } from "./obj-score-row-group";
import { ObjFermata } from "./obj-fermata";

export class ScoreRowRegions {
    public instrWidth = 0;
    public staffWidth = 0;

    resetWidths() { this.instrWidth = this.staffWidth = 0; }
    addRowInstrWidth(w: number) { this.instrWidth = Math.max(this.instrWidth, w); }
    addRowstaffWidth(w: number) { this.staffWidth = Math.max(this.staffWidth, w); }

    get instrLeft() { return 0; }
    get instrRight() { return this.instrWidth; }

    get staffLeft() { return this.instrRight; }
    get staffRight() { return this.staffLeft + this.staffWidth; }

    get left() { return this.instrLeft; }
    get right() { return this.staffRight; }

    get width() { return this.instrWidth + this.staffWidth; }
}

export class ObjScoreRow extends MusicObject {
    private nextRow?: ObjScoreRow;

    private readonly notationLines: ReadonlyArray<ObjNotationLine>;
    private readonly rowGroups: ReadonlyArray<ObjScoreRowGroup>;
    private readonly staves: ReadonlyArray<ObjStaff>;
    private readonly tabs: ReadonlyArray<ObjTab>;
    private readonly measures: ObjMeasure[] = [];

    private rowGroupByLine: ObjScoreRowGroup[];

    private needLayout = true;

    readonly mi: MScoreRow;

    constructor(readonly doc: ObjDocument, private readonly prevRow: ObjScoreRow | undefined, private readonly scoreConfig: (StaffConfig | TabConfig)[]) {
        super(doc);

        this.notationLines = this.createNotationLines();
        this.staves = this.notationLines.filter(line => line instanceof ObjStaff);
        this.tabs = this.notationLines.filter(line => line instanceof ObjTab);

        let lineGroups: ObjNotationLine[][] = [];

        for (let i = 0; i < this.notationLines.length; i++) {
            let line = this.notationLines[i];
            let prevGroup = lineGroups[lineGroups.length - 1];
            if (
                prevGroup === undefined ||
                prevGroup[0].getConfig().instrument === undefined ||
                prevGroup[0].getConfig().instrument !== line.getConfig().instrument
            ) {
                lineGroups.push([line]);
            }
            else {
                prevGroup.push(line);
            }
        }

        this.rowGroups = lineGroups
            .filter(lines => lines.length > 0)
            .map(lines => new ObjScoreRowGroup(lines));

        this.rowGroupByLine = this.notationLines.map(line =>
            this.rowGroups.find(grp => grp.lines.includes(line))!);

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

    getRowGroups(): ReadonlyArray<ObjScoreRowGroup> {
        return this.rowGroups;
    }

    getRowGroupByLineId(id: number): ObjScoreRowGroup {
        return this.rowGroupByLine[id];
    }

    findMatchingLine(line: ObjNotationLine): ObjNotationLine | undefined {
        return line.row === this ? line : this.notationLines.find(curLine =>
            Utils.Obj.deepEqual(line.row.scoreConfig, curLine.row.scoreConfig) && line.id === curLine.id ||
            Guard.isNonEmptyString(line.getConfig().name) && line.getConfig().name === curLine.getConfig().name && line.getConfig().type === curLine.getConfig().type
        );
    }

    get regions(): ScoreRowRegions {
        return this.doc.regions;
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

    resetLayoutGroups(ctx: RenderContext) {
        // Clear resolved position and layout objects
        this.notationLines.forEach(line => line.resetLayoutGroups(ctx));
    }

    layoutLayoutGroups(ctx: RenderContext) {
        this.notationLines.forEach(line => line.layoutLayoutGroups(ctx));
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

        for (let i = 0; i < this.rowGroups.length; i++) {
            let arr = this.rowGroups[i].pick(x, y);
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

    getConnectivesContentRect(): AnchoredRect {
        let r = this.getRect();

        let firstMeasure = this.getFirstMeasure();
        let left = firstMeasure ? firstMeasure.getColumnsContentRect().left : r.left;

        return new AnchoredRect(left, (left + r.right) / 2, r.right, r.top, r.anchorY, r.bottom);
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
            let avgDiatonicId = Math.floor(Utils.Math.avg(...diatonicIds));

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

    layout(ctx: RenderContext) {
        if (!this.needLayout) {
            return;
        }

        this.requestRectUpdate();

        this.notationLines.forEach(line => {
            line.removeObjects();
            line.layoutHeight(ctx);
        });

        this.rowGroups.forEach(grp => {
            grp.layout(ctx);
            this.regions.addRowInstrWidth(grp.getRect().width);
        });

        // Layout measures
        this.measures.forEach(m => m.layout(ctx));

        let packedWidth = this.measures
            .map(m => (m.getMinWidth() + m.getPostMeasureBreakWidth()))
            .reduce((acc, cur) => (acc + cur));

        this.regions.addRowstaffWidth(packedWidth);
    }

    layoutStretch(ctx: RenderContext) {
        if (!this.needLayout) {
            return;
        }

        this.rect = new AnchoredRect(this.regions.left, this.regions.right, 0, 0);

        this.notationLines.forEach(line => line.layoutWidth(ctx));

        this.rowGroups.forEach(grp => grp.setRight(this.regions.instrRight));

        let targetColumnsAreaWidth = this.regions.staffWidth;
        let minColumnsAreaWidth = 0;

        this.measures.forEach(m => {
            targetColumnsAreaWidth -= (m.getTotalSolidWidth() + m.getPostMeasureBreakWidth());
            minColumnsAreaWidth += m.getMinColumnsWidth();
        });

        let columnsAreaScale = targetColumnsAreaWidth / minColumnsAreaWidth;

        let x = this.regions.staffLeft;

        this.measures.forEach(m => {
            let newMeasureWidth = m.getTotalSolidWidth() + m.getMinColumnsWidth() * columnsAreaScale;
            m.layoutWidth(ctx, newMeasureWidth);
            let r = m.getRect();
            m.setLeft(x);
            m.setAnchorY(0);
            x += r.width;
            x += m.getPostMeasureBreakWidth();
        });

        this.measures.forEach(m => {
            m.layoutConnectives(ctx);
            m.layoutBeams(ctx);
        });
    }

    updateRect() {
        let left = this.regions.left;
        let right = this.regions.right;
        let top = 0;
        let bottom = 0;

        const fermata = this.getLastMeasure()?.getBarLineRight()
            .getAnchoredLayoutObjects()
            .map(o => o.musicObj)
            .find(o => o instanceof ObjFermata);

        if (fermata) {
            right = Math.max(right, fermata.getRect().right);
        }

        if (this.measures.length > 0) {
            top = Math.min(...this.measures.map(m => m.getRect().top));
            bottom = Math.max(...this.measures.map(m => m.getRect().bottom));
        }

        this.rect = new AnchoredRect(left, right, top, bottom);
    }

    alignStemsToBeams() {
        this.measures.forEach(m => m.alignStemsToBeams());
    }

    layoutSetNotationLines(ctx: RenderContext) {
        let { unitSize } = ctx;

        for (let i = 1; i < this.notationLines.length; i++) {
            let prev = this.notationLines[i - 1];
            let cur = this.notationLines[i];

            if (
                prev instanceof ObjStaff && cur instanceof ObjStaff &&
                prev.staffConfig.grandId !== undefined && prev.staffConfig.grandId === cur.staffConfig.grandId
            ) {
                let dy = prev.getBottomLineY() - cur.getTopLineY() + unitSize * 6;
                cur.offsetY(dy);
            }
            else {
                let dy = prev.calcBottom() - cur.calcTop() + unitSize * 3;
                cur.offsetY(dy);
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

        // Layout instrument groups position
        this.rowGroups.forEach(grp => grp.layoutToNotationLines());

        this.alignStemsToBeams();

        this.requestRectUpdate();
    }

    layoutDone() {
        this.measures.forEach(m => m.layoutDone());

        this.needLayout = false;
    }

    offset(dx: number, dy: number) {
        this.measures.forEach(m => m.offset(dx, dy));
        this.rect.offsetInPlace(dx, dy);
        this.notationLines.forEach(l => l.offset(dx, dy));
        this.rowGroups.forEach(grp => grp.offset(dx, dy));
    }

    getStaffLineLeft(): number | undefined {
        return this.getFirstMeasure()?.getStaffLineLeft();
    }

    draw(ctx: RenderContext) {
        ctx.drawDebugRect(this.getRect());


        // Set clip rect for this row
        const { left, top, width, height } = this.getRect();
        const p = ctx.lineWidthPx;
        ctx.save();
        ctx.rect(left - p, top, width + 2 * p, height);
        ctx.clip();

        // Draw measures
        this.measures.forEach(m => m.draw(ctx));

        // Draw notation lines
        this.notationLines.forEach(m => m.draw(ctx));

        // Draw left vline
        const staffLeft = this.getStaffLineLeft();
        if (staffLeft !== undefined && this.notationLines.length > 1) {
            this.notationLines.forEach(line => line.drawVerticalLine(ctx, staffLeft, ctx.lineWidthPx, true));
        }

        // Draw row groups
        this.rowGroups.forEach(grp => grp.draw(ctx));

        ctx.restore();
    }
}
