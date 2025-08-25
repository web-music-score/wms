import { getTuningStrings, Note, validateTuningName } from "@tspro/web-music-score/theory";
import { ImageAsset, Renderer } from "./renderer";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Clef, DivRect, MStaff, MTab, StaffConfig, TabConfig } from "../pub";
import { MusicObject } from "./music-object";
import { ObjScoreRow } from "./obj-score-row";
import { DocumentSettings } from "./settings";
import { Utils } from "@tspro/ts-utils-lib";

type NotationLineObject = {
    getRect: () => DivRect,
    offset?: (dx: number, dy: number) => void
    offsetInPlace?: (dx: number, dy: number) => void
}

export class ObjStaff extends MusicObject {
    readonly clefImageAsset: ImageAsset;
    readonly clefLineDiatonicId: number;
    readonly topLineDiatonicId: number;
    readonly middleLineDiatonicId: number;
    readonly bottomLineDiatonicId: number;
    readonly minDiatonicId?: number;
    readonly maxDiatonicId?: number;

    private joinedGrandStaff?: ObjStaff;

    private topLineY: number = 0;
    private bottomLineY: number = 0;

    private readonly objects: NotationLineObject[] = [];

    readonly mi: MStaff;

    constructor(readonly row: ObjScoreRow, readonly staffConfig: StaffConfig) {
        super(row);

        const getDiatonicId = (noteName: string, isOctaveDown: boolean) => Note.getNote(noteName).diatonicId - (isOctaveDown ? 7 : 0);

        if (staffConfig.clef === Clef.G) {
            this.clefImageAsset = ImageAsset.TrebleClefPng;
            this.clefLineDiatonicId = getDiatonicId("G4", staffConfig.isOctaveDown === true);
            this.middleLineDiatonicId = this.clefLineDiatonicId + 2;
        }
        else {
            this.clefImageAsset = ImageAsset.BassClefPng;
            this.clefLineDiatonicId = getDiatonicId("F3", staffConfig.isOctaveDown === true);
            this.middleLineDiatonicId = this.clefLineDiatonicId - 2;
        }

        this.topLineDiatonicId = this.middleLineDiatonicId + 4;
        this.bottomLineDiatonicId = this.middleLineDiatonicId - 4;

        this.minDiatonicId = staffConfig.minNote !== undefined ? Math.min(getDiatonicId(staffConfig.minNote, false), this.bottomLineDiatonicId) : undefined;
        this.maxDiatonicId = staffConfig.maxNote !== undefined ? Math.max(getDiatonicId(staffConfig.maxNote, false), this.topLineDiatonicId) : undefined;

        this.mi = new MStaff(this);
    }

    getMusicInterface(): MStaff {
        return this.mi;
    }

    get isOctaveDown(): boolean {
        return this.staffConfig.isOctaveDown === true;
    }

    getTopLineY(): number {
        return this.topLineY;
    }

    getMiddleLineY(): number {
        return (this.topLineY + this.bottomLineY) / 2;
    }

    getBottomLineY(): number {
        return this.bottomLineY;
    }

    joinGrandStaff(staff: ObjStaff) {
        if (staff !== this) {
            this.joinedGrandStaff = staff;
        }
    }

    getLineSpacing(): number {
        return (this.bottomLineY - this.topLineY) / 4;
    }

    getDiatonicSpacing(): number {
        return this.getLineSpacing() / 2;
    }

    containsDiatonicId(diatonicId: number): boolean {
        Note.validateDiatonicId(diatonicId);

        return (this.minDiatonicId === undefined || diatonicId >= this.minDiatonicId) &&
            (this.maxDiatonicId === undefined || diatonicId <= this.maxDiatonicId);
    }

    getDiatonicIdY(diatonicId: number): number {
        if (this.containsDiatonicId(diatonicId)) {
            return this.bottomLineY + (this.bottomLineDiatonicId - diatonicId) * this.getDiatonicSpacing();
        }
        else if (this.joinedGrandStaff && this.joinedGrandStaff.containsDiatonicId(diatonicId)) {
            return this.joinedGrandStaff.getDiatonicIdY(diatonicId);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Staff does not contain diatonicId " + diatonicId);
        }
    }

    getActualStaff(diatonicId: number): ObjStaff | undefined {
        if (this.containsDiatonicId(diatonicId)) {
            return this;
        }
        else if (this.joinedGrandStaff && this.joinedGrandStaff.containsDiatonicId(diatonicId)) {
            return this.joinedGrandStaff;
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Staff does not contain diatonicId " + diatonicId);
        }
    }

    getDiatonicIdAt(y: number): number | undefined {
        let diatonicId = Math.round(this.bottomLineDiatonicId - (y - this.bottomLineY) / this.getDiatonicSpacing());

        return this.containsDiatonicId(diatonicId) ? diatonicId : undefined;
    }

    isLine(diatonicId: number): boolean {
        return diatonicId % 2 === this.middleLineDiatonicId % 2;
    }

    isSpace(diatonicId: number): boolean {
        return diatonicId % 2 !== this.middleLineDiatonicId % 2;
    }

    containsVoiceId(voiceId: number): boolean {
        return !this.staffConfig.voiceIds || this.staffConfig.voiceIds.includes(voiceId);
    }

    isGrand(): boolean {
        return this.staffConfig.isGrand === true;
    }

    calcTop(): number {
        let top = this.topLineY;
        this.objects.forEach(o => top = Math.min(top, o.getRect().top));
        return top;
    }

    calcBottom(): number {
        let bottom = this.bottomLineY;
        this.objects.forEach(o => bottom = Math.max(bottom, o.getRect().bottom));
        return bottom;
    }

    addObject(o: NotationLineObject) {
        this.objects.push(o);
    }

    removeObjects() {
        this.objects.length = 0;
    }

    pick(x: number, y: number): MusicObject[] {
        return [this];
    }

    layoutHeight(renderer: Renderer) {
        let { unitSize } = renderer;

        let h = unitSize * DocumentSettings.StaffHeight;

        this.topLineY = -h / 2;
        this.bottomLineY = h / 2;

        this.rect = new DivRect(0, 0, this.topLineY, this.bottomLineY);
    }

    layoutWidth(renderer: Renderer) {
        this.rect.left = this.row.getRect().left;
        this.rect.right = this.row.getRect().right;
    }

    offset(dx: number, dy: number) {
        this.topLineY += dy;
        this.bottomLineY += dy;
        this.objects.forEach(o => {
            if (o.offsetInPlace) {
                o.offsetInPlace(0, dy);
            }
            else if (o.offset) {
                o.offset(0, dy);
            }
        });
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) { }
}

export class ObjTab extends MusicObject {
    private top: number = 0;
    private bottom: number = 0;

    private readonly objects: NotationLineObject[] = [];
    private readonly tuningName?: string;
    private readonly tuningStrings: ReadonlyArray<Note>;

    readonly mi: MTab;

    constructor(readonly row: ObjScoreRow, readonly tabConfig: TabConfig) {
        super(row);

        if (Utils.Is.isArray(tabConfig.tuning)) {
            this.tuningName = undefined;
            this.tuningStrings = tabConfig.tuning.map(noteName => Note.getNote(noteName)).reverse();
        }
        else if (typeof tabConfig.tuning === "string") {
            this.tuningName = validateTuningName(tabConfig.tuning);
            this.tuningStrings = getTuningStrings(this.tuningName);
        }
        else {
            this.tuningName = row.doc.tuningName;
            this.tuningStrings = getTuningStrings(this.tuningName ?? "Standard");
        }

        this.mi = new MTab(this);
    }

    getMusicInterface(): MTab {
        return this.mi;
    }

    getTuningName(): string | undefined {
        return this.tuningName;
    }

    getTuningStrings(): ReadonlyArray<Note> {
        return this.tuningStrings;
    }

    /** Return Y coordinate of string. */
    getStringY(stringId: number): number {
        return this.top + (this.bottom - this.top) / 6 * (stringId + 0.5);
    }

    getTopStringY(): number {
        return this.getStringY(0);
    }

    getBottomStringY(): number {
        return this.getStringY(5);
    }

    getTop(): number {
        return this.top;
    }

    getBottom(): number {
        return this.bottom;
    }

    containsVoiceId(voiceId: number): boolean {
        return !this.tabConfig.voiceIds || this.tabConfig.voiceIds.includes(voiceId);
    }

    calcTop(): number {
        return this.top;
    }

    calcBottom(): number {
        return this.bottom;
    }

    addObject(o: NotationLineObject) {
        this.objects.push(o);
    }

    removeObjects() {
        this.objects.length = 0;
    }

    pick(x: number, y: number): MusicObject[] {
        return [this];
    }

    layoutHeight(renderer: Renderer) {
        let { unitSize } = renderer;

        let h = unitSize * DocumentSettings.TabHeight;

        this.top = -h / 2;
        this.bottom = h / 2;

        this.rect = new DivRect(0, 0, this.top, this.bottom);
    }

    layoutWidth(renderer: Renderer) {
        this.rect.left = this.row.getRect().left;
        this.rect.right = this.row.getRect().right;
    }

    offset(dx: number, dy: number) {
        this.top += dy;
        this.bottom += dy;
        this.objects.forEach(o => {
            if (o.offsetInPlace) {
                o.offsetInPlace(0, dy);
            }
            else if (o.offset) {
                o.offset(0, dy);
            }
        });
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) { }
}