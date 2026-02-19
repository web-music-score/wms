import { getTuningStrings, Note, resolveTuningName } from "web-music-score/theory";
import { ImageAsset, View } from "./view";
import { Clef, getVoiceIds, MStaff, MTab, StaffConfig, TabConfig, VoiceId } from "../pub";
import { MusicObject } from "./music-object";
import { ObjScoreRow } from "./obj-score-row";
import { DocumentSettings } from "./settings";
import { AnchoredRect, Guard, Rect, UniMap, Utils } from "@tspro/ts-utils-lib";
import { LayoutGroup, LayoutGroupId, LayoutObjectWrapper, VerticalPos } from "./layout-object";
import { ObjEnding } from "./obj-ending";
import { ObjExtensionLine } from "./obj-extension-line";
import { ObjTabRhythm } from "./obj-tab-rhythm";
import { ObjScoreRowGroup } from "./obj-score-row-group";
import { ScoreError } from "./error-utils";

type NotationLineObject = {
    getRect: () => AnchoredRect;
    offset?: (dx: number, dy: number) => void;
    offsetInPlace?: (dx: number, dy: number) => void;
}

export abstract class ObjNotationLine extends MusicObject {
    protected readonly objects: NotationLineObject[] = [];

    public abstract readonly id: number;
    public abstract readonly name: string;

    // index = VerticalPos
    private layoutGroups: UniMap<LayoutGroupId, LayoutGroup>[] = [];

    constructor(readonly row: ObjScoreRow) {
        super(row);
    }

    getRowGroup(): ObjScoreRowGroup {
        return this.row.getRowGroupByLineId(this.id);
    }

    addObject(o: NotationLineObject) {
        this.objects.push(o);
    }

    removeObjects() {
        this.objects.length = 0;
    }

    getLayoutGroup(lauoutGroupId: LayoutGroupId, verticalPos: VerticalPos): LayoutGroup {
        if (this.layoutGroups[verticalPos] === undefined)
            this.layoutGroups[verticalPos] = new UniMap();

        return this.layoutGroups[verticalPos].getOrCreate(lauoutGroupId, () => new LayoutGroup(lauoutGroupId, verticalPos));
    }

    resetLayoutGroups(view: View) {
        // Clear resolved position and layout objects
        for (const verticalPos of [VerticalPos.Above, VerticalPos.Below]) {
            if (!this.layoutGroups[verticalPos])
                continue;

            this.layoutGroups[verticalPos].forEach(layoutGroup => layoutGroup.layout(view));
        }
    }

    layoutAllLayoutGroups(view: View) {
        for (const verticalPos of [VerticalPos.Above, VerticalPos.Below]) {
            if (!this.layoutGroups[verticalPos])
                continue;

            // Layout in correct order of LayoutGroupId values.
            for (const groupId of Utils.Enum.getEnumValues(LayoutGroupId)) {
                const layoutGroup = this.layoutGroups[verticalPos].get(groupId);
                if (layoutGroup) {
                    this.layoutSingleLayoutGroup(view, layoutGroup);
                }
            }
        }
    }

    private setObjectY(layoutObj: LayoutObjectWrapper, y: number | undefined) {
        if (y === undefined) {
            return;
        }

        // Set y-position
        layoutObj.setAnchorY(y - layoutObj.getRect().anchorY);

        // Position resolved
        layoutObj.setPositionResolved();
    }

    resolveNearestY(view: View, layoutObj: LayoutObjectWrapper): number {
        const { musicObj, measure, verticalPos, line, layoutGroup } = layoutObj;
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

    private resolveIndividualObject(view: View, layoutGroup: LayoutGroup, layoutObj: LayoutObjectWrapper) {
        const { verticalPos } = layoutGroup;
        let layoutObjects = [layoutObj];

        let link = layoutObj.musicObj.getLink();
        if (link) {
            if (link.getHead() === layoutObj.musicObj) {
                let objectParts = [link.getHead(), ...link.getTails()];
                layoutObjects = layoutGroup.getLayoutObjects().filter(layoutObj => objectParts.some(o => o === layoutObj.musicObj));
            }
            else {
                layoutObjects = [];
            }
        }

        if (layoutObjects.length === 0)
            return;

        let yArr = layoutObjects.map(layoutObj => {
            return this.resolveNearestY(view, layoutObj) +
                layoutObj.layoutGroup.getPadding(view) * (verticalPos === VerticalPos.Below ? 1 : -1);
        });

        const rowY = verticalPos === VerticalPos.Below
            ? Math.max(...yArr)
            : Math.min(...yArr);

        layoutObjects.forEach(layoutObj => this.setObjectY(layoutObj, rowY));
    }

    private resolveLaneObjects(view: View, layoutGroup: LayoutGroup) {
        const { verticalPos } = layoutGroup;
        const layoutObjects = layoutGroup.getLayoutObjects();

        if (layoutObjects.length === 0)
            return;

        let yArr = layoutObjects.map(layoutObj => {
            return this.resolveNearestY(view, layoutObj) +
                layoutObj.layoutGroup.getPadding(view) * (verticalPos === VerticalPos.Below ? 1 : -1);
        });

        const rowY = verticalPos === VerticalPos.Below
            ? Math.max(...yArr)
            : Math.min(...yArr);

        layoutObjects.forEach(layoutObj => this.setObjectY(layoutObj, rowY));
    }

    private layoutSingleLayoutGroup(view: View, layoutGroup: LayoutGroup) {
        // Get this row's objects
        let layoutGroupObjects = layoutGroup.getLayoutObjects().filter(layoutObj => !layoutObj.isPositionResolved());

        // Positioning horizontally to anchor
        layoutGroupObjects.forEach(layoutObj => {
            let { musicObj, anchor } = layoutObj;

            if (musicObj instanceof ObjEnding || musicObj instanceof ObjExtensionLine || musicObj instanceof ObjTabRhythm) {
                musicObj.layoutFitToMeasure(view);
            }
            else {
                musicObj.setAnchorX(anchor.getRect().anchorX);
            }
        });

        if (layoutGroup.rowAlign) {
            // Resolve lane objects
            this.resolveLaneObjects(view, layoutGroup);
        }
        else {
            // Resolve individual objects
            for (const layoutObj of layoutGroupObjects)
                this.resolveIndividualObject(view, layoutGroup, layoutObj);
        }
    }

    drawVerticalLine(view: View, left: number, width: number, isSystemBarLine = false) {
        const color = this.row.doc.getColorWithKey(
            this.getConfig().type === "tab" ? "tab.frame" : "staff.frame"
        );

        view.color(color);

        const i = this.row.getNotationLines().indexOf(this);
        const nextLine = i >= 0 ? this.row.getNotationLines()[i + 1] : undefined;
        const isGroupLine = this.getRowGroup().lines.length > 1;
        const isGrandTreble = this instanceof ObjStaff && this.isGrandTreble();

        // SystemBarLine is the left mose vertical bar line.

        const top = this.getTopLineY();
        const bottom = nextLine && (isSystemBarLine || isGroupLine || isGrandTreble)
            ? nextLine.getTopLineY()
            : this.getBottomLineY();

        view.fillRect(left, top, width, bottom - top);
    }

    abstract getConfig(): StaffConfig | TabConfig;

    abstract calcTop(): number;
    abstract calcBottom(): number;

    abstract getTopLineY(): number;
    abstract getBottomLineY(): number;

    abstract containsVoiceId(voiceId: number): boolean;
    abstract containsDiatonicId(diatonicId: number): boolean;

    abstract layoutWidth(view: View): void;
    abstract layoutHeight(view: View): void;
    abstract offset(dx: number, dy: number): void;
    abstract draw(view: View, clipRect?: Rect): void;
}

export class ObjStaff extends ObjNotationLine {
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

    readonly mi: MStaff;

    constructor(row: ObjScoreRow, readonly staffConfig: StaffConfig, readonly id: number) {
        super(row);

        const getDiatonicId = (noteName: string, isOctaveDown: boolean) => Note.getNote(noteName).diatonicId - (isOctaveDown ? 7 : 0);

        if (staffConfig.clef === Clef.G) {
            this.clefImageAsset = ImageAsset.GClef;
            this.clefLineDiatonicId = getDiatonicId("G4", staffConfig.isOctaveDown === true);
            this.middleLineDiatonicId = this.clefLineDiatonicId + 2;
        }
        else if (staffConfig.clef === Clef.F) {
            this.clefImageAsset = ImageAsset.FClef;
            this.clefLineDiatonicId = getDiatonicId("F3", staffConfig.isOctaveDown === true);
            this.middleLineDiatonicId = this.clefLineDiatonicId - 2;
        }
        else {
            throw new ScoreError(`Invalid staffConfig.clef ${staffConfig.clef}.`);
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

    get name(): string {
        return this.staffConfig.name ?? "";
    }

    getConfig(): StaffConfig | TabConfig {
        return this.staffConfig;
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
        if (staff !== this)
            this.joinedGrandStaff = staff;
    }

    isGrandTreble(): boolean {
        return this.joinedGrandStaff !== undefined && this.staffConfig.clef === Clef.G;
    }

    isGrandBass(): boolean {
        return this.joinedGrandStaff !== undefined && this.staffConfig.clef === Clef.F;
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
            throw new ScoreError("Staff does not contain diatonicId " + diatonicId);
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
            throw new ScoreError("Staff does not contain diatonicId " + diatonicId);
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

    containsVoiceId(voiceId: VoiceId): boolean {
        return Guard.isUndefined(this.staffConfig.voiceId) || Utils.Arr.toArray(this.staffConfig.voiceId).includes(voiceId);
    }

    calcTop(): number {
        let top = this.topLineY;
        this.objects.forEach(o => top = Math.min(top, o.getRect().top));

        if (this.maxDiatonicId !== undefined) {
            let y = this.getDiatonicIdY(this.maxDiatonicId);
            let y2 = this.getDiatonicIdY(this.maxDiatonicId - 1);
            top = Math.min(top, y - Math.abs(y2 - y) + 1);
        }

        return top;
    }

    calcBottom(): number {
        let bottom = this.bottomLineY;
        this.objects.forEach(o => bottom = Math.max(bottom, o.getRect().bottom));

        if (this.minDiatonicId !== undefined) {
            let y = this.getDiatonicIdY(this.minDiatonicId);
            let y2 = this.getDiatonicIdY(this.minDiatonicId + 1);
            bottom = Math.max(bottom, y + Math.abs(y2 - y) - 1);
        }

        return bottom;
    }

    calcUsedDiatonicIdRange(): { minDiatonicId: number, maxDiatonicId: number } {
        let minDiatonicId = this.minDiatonicId ?? this.bottomLineDiatonicId;
        let maxDiatonicId = this.maxDiatonicId ?? this.topLineDiatonicId;

        const voiceIds = getVoiceIds().filter(voiceId => this.containsVoiceId(voiceId));

        voiceIds.forEach(voiceId => {
            this.row.getMeasures().forEach(m => {
                m.getVoiceSymbols(voiceId).forEach(s => {
                    minDiatonicId = Math.min(minDiatonicId, s.getDiatonicId());
                    maxDiatonicId = Math.max(maxDiatonicId, s.getDiatonicId());
                });
            });
        });

        return { minDiatonicId, maxDiatonicId }
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    layoutHeight(view: View) {
        let { unitSize } = view;

        let h = unitSize * DocumentSettings.StaffHeight;

        this.topLineY = -h / 2;
        this.bottomLineY = h / 2;

        this.rect = new AnchoredRect(0, 0, this.topLineY, this.bottomLineY);
    }

    layoutWidth(view: View) {
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

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;
    }
}

export class ObjTab extends ObjNotationLine {
    private top: number = 0;
    private bottom: number = 0;

    private readonly tuningName?: string;
    private readonly tuningStrings: ReadonlyArray<Note>;

    readonly mi: MTab;

    constructor(row: ObjScoreRow, readonly tabConfig: TabConfig, readonly id: number) {
        super(row);

        if (Guard.isArray(tabConfig.tuning)) {
            this.tuningName = undefined;
            this.tuningStrings = tabConfig.tuning.map(noteName => Note.getNote(noteName)).reverse();
        }
        else if (typeof tabConfig.tuning === "string") {
            this.tuningName = resolveTuningName(tabConfig.tuning);
            this.tuningStrings = getTuningStrings(this.tuningName);
        }
        else {
            this.tuningName = "Standard";
            this.tuningStrings = getTuningStrings(this.tuningName);
        }

        this.mi = new MTab(this);
    }

    getMusicInterface(): MTab {
        return this.mi;
    }

    get name(): string {
        return this.tabConfig.name ?? "";
    }

    getConfig(): StaffConfig | TabConfig {
        return this.tabConfig;
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

    getTopLineY(): number {
        return this.getTopStringY();
    }

    getBottomLineY(): number {
        return this.getBottomStringY();
    }

    getTop(): number {
        return this.top;
    }

    getBottom(): number {
        return this.bottom;
    }

    containsVoiceId(voiceId: VoiceId): boolean {
        return Guard.isUndefined(this.tabConfig.voiceId) || Utils.Arr.toArray(this.tabConfig.voiceId).includes(voiceId);
    }

    containsDiatonicId(diatonicId: number): boolean {
        return true;
    }

    calcTop(): number {
        let { top } = this;
        this.objects.forEach(o => top = Math.min(top, o.getRect().top));
        return top;
    }

    calcBottom(): number {
        let { bottom } = this;
        this.objects.forEach(o => bottom = Math.max(bottom, o.getRect().bottom));
        return bottom;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    layoutHeight(view: View) {
        let { unitSize } = view;

        let h = unitSize * DocumentSettings.TabHeight;

        this.top = -h / 2;
        this.bottom = h / 2;

        this.rect = new AnchoredRect(0, 0, this.top, this.bottom);
    }

    layoutWidth(view: View) {
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

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;
    }
}