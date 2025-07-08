import { Assert, Utils } from "@tspro/ts-utils-lib";
import { MusicObject } from "./music-object";
import { Fermata, Navigation, NoteOptions, RestOptions, Stem, Annotation, Label, StringNumber } from "../pub";
import { Renderer } from "./renderer";
import { AccidentalState } from "./acc-state";
import { Note, NoteLength, RhythmProps } from "../../music-theory";
import { getScale, Scale, validateScaleType } from "../../music-theory/scale";
import { ObjSignature } from "./obj-signature";
import { ObjBarLineRight, ObjBarLineLeft } from "./obj-bar-line";
import { ObjRhythmColumn, RhythmSymbol } from "./obj-rhythm-column";
import { ObjEnding } from "./obj-ending";
import { ObjArc } from "./obj-arc";
import { ObjScoreRow } from "./obj-score-row";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjRest } from "./obj-rest";
import { ObjBeamGroup } from "./obj-beam-group";
import { DebugSettings, DocumentSettings } from "./settings";
import { ObjText, TextProps } from "./obj-text";
import { ObjSpecialText } from "./obj-special-text";
import { ObjFermata } from "./obj-fermata";
import { KeySignature, getDefaultKeySignature } from "../../music-theory/key-signature";
import { TimeSignature, TimeSignatureString, getDefaultTimeSignature } from "../../music-theory/time-signature";
import { AlterTempo, Tempo, getDefaultTempo } from "../../music-theory/tempo";
import { LayoutGroupId, LayoutObjectWrapper, LayoutableMusicObject, VerticalPos } from "./layout-object";
import { getNavigationString } from "./element-data";
import { Extension, ExtensionLinePos, ExtensionLineStyle } from "./extension";
import { ObjExtensionLine } from "./obj-extension-line";
import { DivRect, MMeasure } from "../pub";

export class ObjMeasure extends MusicObject {
    static readonly VoiceIdList = [0, 1, 2, 3];

    static readonly MinFlexContentWidth = 10;

    private prevMeasure: ObjMeasure | undefined;
    private nextMeasure: ObjMeasure | undefined;

    private keySignature: KeySignature = getDefaultKeySignature();
    private timeSignature: TimeSignature = getDefaultTimeSignature();
    private tempo: Tempo = getDefaultTempo();

    private alterKeySignature?: KeySignature;
    private alterTimeSignature?: TimeSignature;
    private alterTempo?: AlterTempo;

    private signatures: ObjSignature[] = [];
    private barLineLeft: ObjBarLineLeft;
    private columns: ObjRhythmColumn[] = [];
    private barLineRight: ObjBarLineRight;
    private arcs: ObjArc[] = [];
    private beamGroups: ObjBeamGroup[] = [];

    private measureId: number;

    private needLayout = true;

    private leftSolidAreaWidth = 0;
    private minColumnsAreaWidth = 0;
    private rightSolidAreaWidth = 0;

    private usePitch: (number | undefined)[/* voiceId */] = [];
    private useStemDir: (Stem | undefined)[/* voiceId */] = [];
    private useString: (StringNumber[] | undefined)[/* voiceId */] = [];

    private voiceSymbols: RhythmSymbol[/* voiceId */][] = [];

    private lastAddedRhythmColumn?: ObjRhythmColumn;
    private addExtensionToMusicObject?: MusicObject;

    private layoutObjects: LayoutObjectWrapper[] = [];

    private postMeasureBreakWidth = 0;

    private passCount = 0; // How many times player has passed this measure.

    private needBeamsUpdate = true;

    private navigationSet = new Set<Navigation>();
    private isEndSong: boolean = false;
    private isEndSection: boolean = false;
    private endRepeatCount: number = 1;
    private endRepeatCountText?: ObjText;

    readonly mi: MMeasure;

    constructor(readonly row: ObjScoreRow) {
        super(row);

        this.mi = new MMeasure(this);

        // Set prevMeasure
        this.prevMeasure = row.doc.getLastMeasure();

        // nextMeasure of prevMeasure is this
        if (this.prevMeasure) {
            this.prevMeasure.nextMeasure = this;
        }

        this.barLineLeft = new ObjBarLineLeft(this);
        this.barLineRight = new ObjBarLineRight(this);

        this.measureId = this.prevMeasure ? this.prevMeasure.measureId + 1 : 0;

        this.updateKeySignature();
        this.updateTimeSignature();
        this.updateTempo();
    }

    getMusicInterface(): MMeasure {
        return this.mi;
    }

    get doc() {
        return this.row.doc;
    }

    isPartialMeasure() {
        return this.getConsumedTicks() < this.getMeasureTicks();
    }

    resetPassCount() {
        this.passCount = 0;
    }

    incPassCount() {
        this.passCount++;
    }

    getPassCount() {
        return this.passCount;
    }

    updateOwnAvgPitch(voiceId: number, setPitch?: string | number | Note): number {
        if (typeof setPitch == "string") {
            this.usePitch[voiceId] = Note.getNote(setPitch).pitch;
        }
        else if (typeof setPitch == "number") {
            this.usePitch[voiceId] = setPitch;
        }
        else if (setPitch instanceof Note) {
            this.usePitch[voiceId] = setPitch.pitch;
        }
        else if (this.usePitch[voiceId] === undefined) {
            let prevMeasure = this.getPrevMeasure();

            if (prevMeasure && prevMeasure.usePitch[voiceId] !== undefined) {
                this.usePitch[voiceId] = prevMeasure.usePitch[voiceId];
            }
        }

        let pitch = this.usePitch[voiceId];

        if (pitch === undefined) {
            if (this.row.hasStaff) {
                pitch = this.row.getTopStaff().middleLinePitch;
            }
            else {
                pitch = Note.getNote("C4").pitch;
            }
        }

        return this.usePitch[voiceId] = Note.validatePitch(pitch);
    }

    updateOwnStemDir(symbol: RhythmSymbol, setStemDir?: Stem): Stem.Up | Stem.Down {
        let { voiceId } = symbol;

        if (setStemDir !== undefined) {
            this.useStemDir[voiceId] = setStemDir;
        }
        else if (this.useStemDir[voiceId] === undefined) {
            this.useStemDir[voiceId] = this.getPrevMeasure()?.useStemDir[voiceId] ?? Stem.Auto;
        }

        let stemDir = this.useStemDir[voiceId];

        if (stemDir === Stem.Auto || stemDir === undefined) {
            let staff = this.row.getStaff(symbol.ownAvgPitch);
            if (staff) {
                return symbol.ownAvgPitch > staff.middleLinePitch ? Stem.Down : Stem.Up;
            }
            else {
                return Stem.Up;
            }
        }
        else {
            return stemDir;
        }
    }

    updateOwnString(symbol: RhythmSymbol, setString?: StringNumber[]): StringNumber[] {
        let { voiceId } = symbol;

        if (setString !== undefined) {
            this.useString[voiceId] = setString;
        }
        else if (this.useString[voiceId] === undefined) {
            this.useString[voiceId] = this.getPrevMeasure()?.useString[voiceId] ?? [];
        }

        return this.useString[voiceId];
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.signatures.length; i++) {
            let arr = this.signatures[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.columns.length; i++) {
            let arr = this.columns[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.barLineLeft) {
            let arr = this.barLineLeft.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.barLineRight) {
            let arr = this.barLineRight.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.endRepeatCountText) {
            let arr = this.endRepeatCountText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.arcs.length; i++) {
            let arr = this.arcs[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.beamGroups.length; i++) {
            let arr = this.beamGroups[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.layoutObjects.length; i++) {
            let arr = this.layoutObjects[i].musicObj.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    getMeasureNumber() {
        let firstMeasure = this.doc.getFirstMeasure();

        return firstMeasure && firstMeasure.isPartialMeasure()
            ? this.measureId
            : this.measureId + 1;
    }

    getColumns(): ReadonlyArray<ObjRhythmColumn> {
        return this.columns;
    }

    getColumnCount(): number {
        return this.columns.length;
    }

    getColumn(columnId: number): ObjRhythmColumn | undefined {
        return this.getColumns()[columnId];
    }

    isFirstMeasure() {
        return this.prevMeasure === undefined;
    }

    isLastMeasure() {
        return this.nextMeasure === undefined;
    }

    getNextMeasure() {
        return this.nextMeasure;
    }

    getPrevMeasure() {
        return this.prevMeasure;
    }

    getKeySignature() {
        return this.keySignature;
    }

    // See MMeasure interface
    //setKeySignature(keyNote: string, scaleType: ScaleType): void;
    //setKeySignature(keySignature: KeySignature): void;
    //setKeySignature(scale: Scale): void;
    setKeySignature(...args: unknown[]): void {
        this.getPrevMeasure()?.endSection();

        if (args[0] instanceof KeySignature) {
            this.alterKeySignature = args[0];
        }
        else if (args[0] instanceof Scale) {
            this.alterKeySignature = args[0].getKeySignature();
        }
        else {
            try {
                let keyNote = "" + args[0];
                let scaleType = validateScaleType("" + args[1]);
                this.alterKeySignature = getScale(keyNote, scaleType).getKeySignature();
            }
            catch (e) {
                Assert.interrupt("Cannot set key signature because invalid args: " + args);
            }
        }

        this.updateKeySignature();
    }

    updateKeySignature() {
        this.keySignature = this.prevMeasure ? this.prevMeasure.keySignature : getDefaultKeySignature();

        if (this.alterKeySignature) {
            this.keySignature = this.alterKeySignature;
        }

        if (this.nextMeasure) {
            this.nextMeasure.updateKeySignature();
        }

        this.requestLayout();
    }

    getTimeSignature() {
        return this.timeSignature;
    }

    setTimeSignature(timeSignature: TimeSignature | TimeSignatureString) {
        this.getPrevMeasure()?.endSection();

        this.alterTimeSignature = timeSignature instanceof TimeSignature
            ? timeSignature
            : new TimeSignature(timeSignature);

        this.updateTimeSignature();
    }

    updateTimeSignature() {
        this.timeSignature = this.prevMeasure ? this.prevMeasure.timeSignature : getDefaultTimeSignature();

        if (this.alterTimeSignature) {
            this.timeSignature = this.alterTimeSignature;
        }

        if (this.nextMeasure) {
            this.nextMeasure.updateTimeSignature();
        }

        this.requestLayout();
    }

    getTempo() {
        return this.tempo;
    }

    setTempo(beatsPerMinute: number, beatLength?: NoteLength, dotted?: boolean) {
        this.getPrevMeasure()?.endSection();

        let options = beatLength !== undefined ? { beatLength, dotted } : undefined

        this.alterTempo = { beatsPerMinute, options }

        this.updateTempo();
    }

    updateTempo() {
        this.tempo = this.prevMeasure ? this.prevMeasure.tempo : getDefaultTempo();

        if (this.alterTempo) {
            let beatsPerMinute = this.alterTempo.beatsPerMinute;

            let beatLength: NoteLength;
            let dotted: boolean;

            if (this.alterTempo.options) {
                beatLength = this.alterTempo.options.beatLength;
                dotted = this.alterTempo.options.dotted ?? false;
            }
            else if (this.alterTimeSignature) {
                beatLength = this.alterTimeSignature.beatLength;
                dotted = false;
            }
            else {
                beatLength = this.tempo.options.beatLength;
                dotted = this.tempo.options.dotted;
            }

            this.tempo = { beatsPerMinute, options: { beatLength, dotted } }
        }

        if (this.nextMeasure) {
            this.nextMeasure.updateTempo();
        }

        this.requestLayout();
    }

    hasPostMeasureBreak() {
        return this.isEndSong && this !== this.row.getLastMeasure();
    }

    getPostMeasureBreakWidth() {
        return this.postMeasureBreakWidth;
    }

    private addLayoutObject(musicObj: LayoutableMusicObject, layoutGroupId: LayoutGroupId, verticalPos: VerticalPos) {
        let w = new LayoutObjectWrapper(musicObj, layoutGroupId, verticalPos);
        this.layoutObjects.push(w);
        this.requestLayout();
    }

    addFermata(fermata: Fermata) {
        let anchor = Assert.require(fermata === Fermata.AtMeasureEnd ? this.barLineRight : this.lastAddedRhythmColumn,
            "Cannot add Fermata because anchor is undefined.");

        let fermataObjArr = anchor.getAnchoredLayoutObjects().
            map(layoutObj => layoutObj.musicObj).
            filter(musicObj => musicObj instanceof ObjFermata);

        let hasAbove = fermataObjArr.some(obj => obj.pos === VerticalPos.AboveStaff);
        let hasBelow = fermataObjArr.some(obj => obj.pos === VerticalPos.BelowStaff);

        ObjFermata.getFermataPositions(anchor).forEach(fermataPos => {
            if (fermataPos === VerticalPos.AboveStaff && !hasAbove) {
                this.addLayoutObject(new ObjFermata(anchor, fermataPos), LayoutGroupId.Fermata, fermataPos);
            }
            else if (fermataPos === VerticalPos.BelowStaff && !hasBelow) {
                this.addLayoutObject(new ObjFermata(anchor, fermataPos), LayoutGroupId.Fermata, fermataPos);
            }
        });

        this.disableExtension();
        this.requestLayout();
    }

    hasFermata(anchor: ObjRhythmColumn | ObjBarLineRight) {
        return this.layoutObjects.some(layoutObj => layoutObj.musicObj instanceof ObjFermata && layoutObj.anchor === anchor);
    }

    addNavigation(navigation: Navigation, ...args: unknown[]) {
        switch (navigation) {
            case Navigation.Ending:
                let anchor = this;
                let passages = args.map(a => Assert.int_gte(a, 1, "Cannot add ending because invalid passage arg: " + a));
                Assert.int_gte(passages.length, 1, "Cannot add ending bacause no passages given.");
                Assert.assert(!this.navigationSet.has(navigation), "Cannot add ending beasure measure already has one.");
                this.addLayoutObject(new ObjEnding(anchor, passages), LayoutGroupId.Ending, VerticalPos.AboveStaff);
                break;
            case Navigation.DC_al_Coda:
            case Navigation.DC_al_Fine:
            case Navigation.DS_al_Coda:
            case Navigation.DS_al_Fine: {
                let anchor = this.barLineRight;
                let text = getNavigationString(navigation);
                this.addLayoutObject(new ObjText(anchor, text, 1, 1), LayoutGroupId.Navigation, VerticalPos.AboveStaff);
                this.addNavigation(Navigation.EndRepeat);
                this.endSong();
                break;
            }
            case Navigation.Fine: {
                let anchor = this.barLineRight;
                let text = getNavigationString(navigation);
                this.addLayoutObject(new ObjText(anchor, text, 1, 1), LayoutGroupId.Navigation, VerticalPos.AboveStaff);
                break;
            }
            case Navigation.Segno:
            case Navigation.Coda: {
                let anchor = this.barLineLeft;
                let text = getNavigationString(navigation);
                this.addLayoutObject(new ObjSpecialText(anchor, text), LayoutGroupId.Navigation, VerticalPos.AboveStaff);
                break;
            }
            case Navigation.toCoda: {
                let anchor = this.barLineRight;
                let text = getNavigationString(navigation);
                this.addLayoutObject(new ObjSpecialText(anchor, text), LayoutGroupId.Navigation, VerticalPos.AboveStaff);
                break;
            }
            case Navigation.EndRepeat:
                this.endRepeatCount = Math.floor(typeof args[0] === "number" ? args[0] : 1);

                Assert.int_gte(this.endRepeatCount, 1, "Cannot add end repeat because invalid end repeat count: " + this.endRepeatCount);

                if (this.endRepeatCount > 1) {
                    let textProps: TextProps = {
                        text: "" + this.endRepeatCount + "x",
                        scale: 0.8
                    }
                    this.endRepeatCountText = new ObjText(this, textProps, 0.5, 1);
                }
                break;
        }

        this.navigationSet.add(navigation);
        this.disableExtension();
    }

    hasNavigation(n: Navigation) {
        return this.navigationSet.has(n);
    }

    getEnding(): ObjEnding | undefined {
        return this.layoutObjects.map(layoutObj => layoutObj.musicObj).find(musicObj => musicObj instanceof ObjEnding);
    }

    getEndRepeatCount() {
        return this.endRepeatCount;
    }

    addLabel(label: Label, text: string) {
        let anchor = Assert.require(this.lastAddedRhythmColumn, "Cannot add label because anchor is undefined.");

        Assert.assert(text.length > 0, "Cannot add label because label text is empty.");
        let textProps: TextProps = { text }

        let layoutGroupId: LayoutGroupId;
        let verticalPos: VerticalPos;

        switch (label) {
            case Label.Note: layoutGroupId = LayoutGroupId.NoteLabel; verticalPos = VerticalPos.BelowStaff; break;
            case Label.Chord: layoutGroupId = LayoutGroupId.ChordLabel; verticalPos = VerticalPos.AboveStaff; break;
        }

        let textObj = new ObjText(anchor, textProps, 0.5, 1);
        this.addLayoutObject(textObj, layoutGroupId, verticalPos);

        this.enableExtension(textObj);
    }

    addAnnotation(annotation: Annotation, text: string) {
        let anchor = Assert.require(this.lastAddedRhythmColumn, "Cannot add annotation because anchor is undefined.");

        Assert.assert(text.length > 0, "Cannot add annotation because annotation text is empty.");
        let textProps: TextProps = { text }

        let layoutGroupId: LayoutGroupId;
        let verticalPos: VerticalPos;

        switch (annotation) {
            case Annotation.Dynamics: layoutGroupId = LayoutGroupId.DynamicsAnnotation; verticalPos = VerticalPos.AboveStaff; textProps.italic = true; break;
            case Annotation.Tempo: layoutGroupId = LayoutGroupId.TempoAnnotation; verticalPos = VerticalPos.AboveStaff; textProps.italic = true; break;
        }

        let textObj = new ObjText(anchor, textProps, 0.5, 1);
        this.addLayoutObject(textObj, layoutGroupId, verticalPos);

        this.enableExtension(textObj);
    }

    endSong() {
        this.isEndSong = true;
        this.requestLayout();
        this.disableExtension();
    }

    hasEndSong() {
        return this.isEndSong;
    }

    endSection() {
        this.isEndSection = true;
        this.requestLayout();
        this.disableExtension();
    }

    hasEndSection() {
        return this.isEndSection;
    }

    endRow() {
        this.doc.requestNewRow();
        this.disableExtension();
    }

    private enableExtension(musicObj: MusicObject) {
        this.addExtensionToMusicObject = musicObj;
    }

    private disableExtension() {
        this.addExtensionToMusicObject = undefined;
    }

    addExtension(extensionLength: number, extensionVisible: boolean) {
        let musicObj = this.addExtensionToMusicObject;
        let anchor = musicObj?.getParent();

        if (musicObj instanceof ObjText && anchor instanceof ObjRhythmColumn) {
            let lineStyle: ExtensionLineStyle = "dashed";
            let linePos: ExtensionLinePos = "bottom";

            let extension = new Extension(musicObj, anchor, extensionLength, extensionVisible, lineStyle, linePos);
            musicObj.setLink(extension);

            this.disableExtension();
            this.requestLayout();
        }
        else if (musicObj === undefined) {
            Assert.interrupt("Cannot add extension because music object to attach it to is undefined.");
        }
        else {
            Assert.interrupt("Cannot add extension becaue no compatible music object to attach it to.");
        }
    }

    private addRhythmSymbol(voiceId: number, symbol: RhythmSymbol) {
        let { col } = symbol;

        col.setVoiceSymbol(voiceId, symbol);

        this.getVoiceSymbols(voiceId); // Ensures voicesymbols[voiceId] !== undefined
        this.voiceSymbols[voiceId].push(symbol);

        this.requestBeamsUpdate();

        this.lastAddedRhythmColumn = col;

        // Collect arc data now that symbol is set
        if (symbol instanceof ObjNoteGroup) {
            this.onAddNoteGroup(symbol);
        }
    }

    addNoteGroup(voiceId: number, notes: (Note | string)[], noteLength: NoteLength, options?: NoteOptions) {
        let notes2 = notes.map(note => typeof note === "string" ? Note.getNote(note) : note);

        let col = this.getRhythmColumn(voiceId);

        this.addRhythmSymbol(voiceId, new ObjNoteGroup(col, voiceId, notes2, noteLength, options));
    }

    addRest(voiceId: number, restLength: NoteLength, options?: RestOptions) {
        let col = this.getRhythmColumn(voiceId);

        this.addRhythmSymbol(voiceId, new ObjRest(col, voiceId, restLength, options));
    }

    /**
     * 
     * @param positionTicks - get ObjRhythmColumn with positionTicks. Insert new if necessary.
     * @returns 
     */
    private getRhythmColumn(voiceId: number): ObjRhythmColumn {
        // Find next positionTicks for symbol in voiceId.
        let positionTicks = 0;

        for (let i = this.columns.length - 1; i >= 0 && positionTicks === 0; i--) {
            let col = this.columns[i];
            let symbol = col.getVoiceSymbol(voiceId);
            if (symbol) {
                positionTicks = col.positionTicks + symbol.rhythmProps.ticks;
            }
        }

        // Return existing column, or insert and return new one.
        for (let i = 0; i <= this.columns.length; i++) {
            let col = this.columns[i];
            if (col && col.positionTicks === positionTicks) {
                return col;
            }
            else if (!col || col.positionTicks > positionTicks) {
                let col = new ObjRhythmColumn(this, positionTicks);
                this.columns.splice(i, 0, col);
                this.onAddRhythmColumn(col);
                return col;
            }
        }

        Assert.interrupt("Error in rhythm column. Should never get here.");
    }

    onAddRhythmColumn(col: ObjRhythmColumn) { }

    private onAddNoteGroup(noteGroup: ObjNoteGroup) {
        noteGroup.collectArcDatas();
    }

    getMeasureTicks() {
        return this.getTimeSignature().measureTicks;
    }

    getConsumedTicks(voiceId?: number) {
        let measureTicks = 0;

        this.columns.forEach(col => {
            ObjMeasure.VoiceIdList.forEach(curVoiceId => {
                let symbol = col.getVoiceSymbol(curVoiceId);
                if (symbol && (voiceId === undefined || voiceId === curVoiceId)) {
                    measureTicks = Math.max(measureTicks, col.positionTicks + symbol.rhythmProps.ticks);
                }
            });
        });

        return measureTicks;
    }

    // Get content rect excluding signature
    getColumnsContentRect() {
        return new DivRect(
            this.barLineLeft.getRect().centerX,
            this.barLineRight.getRect().centerX,
            this.rect.top,
            this.rect.bottom);
    }

    getLeftSolidAreaWidth() {
        return this.leftSolidAreaWidth;
    }

    getMinColumnsAreaWidth() {
        return this.minColumnsAreaWidth;
    }

    getRightSolidAreaWidth() {
        return this.rightSolidAreaWidth;
    }

    getSolidAreaWidth() {
        return this.leftSolidAreaWidth + this.rightSolidAreaWidth;
    }

    getMinWidth() {
        return this.leftSolidAreaWidth + this.minColumnsAreaWidth + this.rightSolidAreaWidth;
    }

    getStaffLineLeft() {
        let prev = this.getPrevMeasure();

        if (prev && prev.row === this.row && !prev.hasPostMeasureBreak()) {
            return prev.getStaffLineRight();
        }
        else {
            return this.rect.left;
        }
    }

    getStaffLineRight() {
        return this.barLineRight.getRect().centerX;
    }

    forEachLayoutObject(fn: (layoutObject: LayoutObjectWrapper) => void) {
        this.layoutObjects.forEach(layoutObj => fn(layoutObj));
    }

    removeLayoutObjects(musicObj: MusicObject) {
        this.layoutObjects = this.layoutObjects.filter(layoutObj => {
            if (layoutObj.musicObj === musicObj) {

                let link = layoutObj.musicObj.getLink();
                if (link) {
                    link.detachTail(layoutObj.musicObj);
                }

                layoutObj.layoutGroup.remove(layoutObj);

                return false; // removed, filter out
            }
            else {
                return true; // keep
            }
        });
    }

    addArc(arc: ObjArc) {
        this.arcs.push(arc);
        this.requestLayout();
    }

    updateArcs() {
        if (!this.row.hasStaff) {
            return;
        }

        // Remove arcs
        if (this.arcs.length > 0) {
            this.arcs = [];
            this.requestLayout();
        }

        // Recreate arcs
        ObjMeasure.VoiceIdList.forEach(voiceId => {
            this.getVoiceSymbols(voiceId).forEach(symbol => {
                if (symbol instanceof ObjNoteGroup) {
                    symbol.createObjArcs();
                }
            });
        });
    }

    updateExtensions() {
        this.forEachLayoutObject(layoutObj => {
            if (layoutObj.musicObj.getLink() instanceof Extension) {
                let extension = layoutObj.musicObj.getLink() as Extension;

                if (extension.getHead() === layoutObj.musicObj) {
                    // Remove old extnsion lines
                    extension.getTails().forEach(musicObj => layoutObj.measure.removeLayoutObjects(musicObj));

                    // Create new extension lines
                    let { startColumn, endColumn } = extension.getExtensionRangeInfo();

                    if (extension.isVisible() && startColumn !== endColumn) {
                        for (let m: ObjMeasure | undefined = startColumn.measure; m !== undefined; m = m === endColumn.measure ? undefined : m.getNextMeasure()) {
                            let leftObj = m === startColumn.measure ? extension.getHead() : m.getBarLineLeft();
                            let rightObj = m === endColumn.measure ? endColumn : m.getBarLineRight();

                            m.addLayoutObject(new ObjExtensionLine(m, extension, leftObj, rightObj), layoutObj.layoutGroupId, layoutObj.verticalPos);
                        }
                    }
                }
            }
        });
    }

    addBeamGroup(beam: ObjBeamGroup) {
        this.beamGroups.push(beam);
    }

    requestBeamsUpdate() {
        this.needBeamsUpdate = true;
    }

    updateBeams() {
        if (!this.needBeamsUpdate || !this.row.hasStaff) {
            return;
        }

        // Remove old beams/triplets
        this.beamGroups.forEach(beamGroup => {
            beamGroup.getSymbols().forEach(s => s.resetBeamGroup());
        });

        this.beamGroups = [];

        // Recreate beams/triplets
        let ts = this.getTimeSignature();

        ObjMeasure.VoiceIdList.forEach(voiceId => {
            let symbols = this.getVoiceSymbols(voiceId);

            ObjMeasure.createTriplets(symbols);
            ObjMeasure.createBeams(symbols, ts);
        });

        this.needBeamsUpdate = false;

        this.requestLayout();
    }

    private static createBeams(symbols: ReadonlyArray<RhythmSymbol>, ts: TimeSignature) {
        if (DebugSettings.DisableBeams || symbols.length < 2) {
            return;
        }

        let groupSymbols: RhythmSymbol[] = [];
        let groupStartTicks = 0;
        let groupEndTicks = 0;

        symbols.forEach(symbol => {
            groupSymbols.push(symbol);

            groupEndTicks += symbol.rhythmProps.ticks;

            if (groupStartTicks === 0 && groupEndTicks === ts.beamGroupLength) {
                // Perfect group, setup beams
                ObjMeasure.setupBeamGroup(groupSymbols);
            }

            while (groupEndTicks >= ts.beamGroupLength) {
                groupSymbols = [];
                groupStartTicks = groupEndTicks = groupEndTicks - ts.beamGroupLength;
            }
        });
    }

    private static setupBeamGroup(groupSymbols: RhythmSymbol[]) {
        let groupNotes = groupSymbols.map(s => {
            return s instanceof ObjNoteGroup && s.getBeamGroup()?.isTriplet() !== true ? s : undefined;
        });

        ObjNoteGroup.setBeamCounts(groupNotes);

        // Add Beams objects
        let beamNotes: ObjNoteGroup[] = [];

        groupNotes.forEach(noteGroup => {
            if (noteGroup && noteGroup.hasBeamCount()) {
                beamNotes.push(noteGroup);
            }
            else {
                ObjBeamGroup.createBeam(beamNotes);
                beamNotes = [];
            }
        });

        ObjBeamGroup.createBeam(beamNotes);
    }

    private static createTriplets(symbols: ReadonlyArray<RhythmSymbol>) {
        for (let i = 0; i < symbols.length;) {
            let s2 = symbols.slice(i, i + 2);
            let s3 = symbols.slice(i, i + 3);

            if (s2.length === 2 && ObjBeamGroup.createTriplet(s2)) {
                i += 2;
            }
            else if (s3.length === 3 && ObjBeamGroup.createTriplet(s3)) {
                i += 3;
            }
            else {
                i++;
            }
        }
    }

    static validateVoiceId(voiceId: number): number {
        Assert.in_group(voiceId, ObjMeasure.VoiceIdList, "Invalid voice id: " + voiceId);
        return voiceId;
    }

    getBarLineLeft() {
        return this.barLineLeft;
    }

    getBarLineRight() {
        return this.barLineRight;
    }

    getVoiceSymbols(voiceId: number): ReadonlyArray<RhythmSymbol> {
        ObjMeasure.validateVoiceId(voiceId);

        if (this.voiceSymbols[voiceId] === undefined) {
            this.voiceSymbols[voiceId] = [];
        }

        return this.voiceSymbols[voiceId];
    }

    completeRests(voiceId?: number) {
        if (voiceId === undefined) {
            if (this.getConsumedTicks() === 0) {
                // Whole measure is empty.
                this.completeRests(0);
            }
            else {
                ObjMeasure.VoiceIdList.forEach(voiceId => {
                    // Complete rests for voices that are not empty
                    if (this.getConsumedTicks(voiceId) > 0) {
                        this.completeRests(voiceId);
                    }
                });
            }
            return;
        }

        let measureTicks = this.getMeasureTicks();
        let consumedTicks = this.getConsumedTicks(voiceId);
        let remainingTicks = measureTicks - consumedTicks;

        let rests: RhythmProps[] = [];

        let noteLengthValues = Utils.Enum.getEnumValues(NoteLength);

        while (remainingTicks > 0) {
            noteLengthValues.forEach(restLength => {
                let restValue = new RhythmProps(restLength, false);

                if (restValue.canDot()) {
                    let dottedRestValue = new RhythmProps(restLength, true);
                    while (dottedRestValue.ticks <= remainingTicks) {
                        rests.push(dottedRestValue);
                        remainingTicks -= dottedRestValue.ticks;
                    }
                }

                while (restValue.ticks <= remainingTicks) {
                    rests.push(restValue);
                    remainingTicks -= restValue.ticks;
                }
            });

        }

        rests.reverse().forEach(rest => this.addRest(voiceId, rest.noteLength, { dotted: rest.dotted }));
    }

    getLowestNotePitch(pitch: number): number {
        return Math.min(pitch, ...this.columns.map(c => c.getLowestNotePitch(pitch)));
    }

    requestLayout() {
        if (!this.needLayout) {
            this.needLayout = true;
            this.row.requestLayout();
        }
    }

    layout(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        let { unitSize } = renderer;

        this.postMeasureBreakWidth = this.hasPostMeasureBreak()
            ? DocumentSettings.PostMeasureBreakWidth * unitSize
            : 0;

        let isFirstMeasureInRow = this === this.row.getFirstMeasure();
        let isAfterMeasureBreak = this.getPrevMeasure()?.hasPostMeasureBreak() === true;

        let showClef = isFirstMeasureInRow || isAfterMeasureBreak;
        let showMeasureNumber = isFirstMeasureInRow && !this.row.isFirstRow();
        let showKeySignature = isFirstMeasureInRow || isAfterMeasureBreak || !!this.alterKeySignature;
        let showTimeSignature = !!this.alterTimeSignature;
        let showTempo = !!this.alterTempo;

        if (showClef || showMeasureNumber || showKeySignature || showTimeSignature || showTempo) {
            this.signatures = this.row.getStaves().map((staff, staffId) => {
                let signature = this.signatures[staffId] ?? new ObjSignature(this, staff);

                signature.updateClefImage(renderer, showClef);
                signature.updateMeasureNumber(showMeasureNumber && staffId === 0);
                signature.updateKeySignature(showKeySignature);
                signature.updateTimeSignature(showTimeSignature);
                signature.updateTempo(showTempo && staffId === 0);

                signature.layout(renderer);

                return signature;
            });
        }
        else {
            this.signatures = [];
        }

        // Layout measure start object
        this.barLineLeft.layout(renderer);

        // Layout columns
        const accState = new AccidentalState(this);
        this.columns.forEach(col => col.layout(renderer, accState));

        // Layout measure end object
        this.barLineRight.layout(renderer);

        if (this.endRepeatCountText) {
            this.endRepeatCountText.layout(renderer);
        }

        // Calc top and bottom
        let top = Math.min(
            ...this.signatures.map(signature => signature.getRect().top),
            this.barLineLeft.getRect().top,
            ...this.columns.map(col => col.getRect().top),
            this.barLineRight.getRect().top
        );

        let bottom = Math.max(
            ...this.signatures.map(signature => signature.getRect().bottom),
            this.barLineLeft.getRect().bottom,
            ...this.columns.map(col => col.getRect().bottom),
            this.barLineRight.getRect().bottom
        );

        let tab = this.row.getTab();

        if (tab) {
            top = Math.min(top, tab.top);
            bottom = Math.max(bottom, tab.bottom);
        }

        // Set rect toph and bottomh
        this.rect = new DivRect(0, 0, 0, top, 0, bottom);

        let padding = renderer.unitSize;

        // Calculated width members
        this.leftSolidAreaWidth =
            Math.max(0, ...this.signatures.map(signature => signature.getRect().width)) +
            this.barLineLeft.getRect().width +
            padding;

        this.rightSolidAreaWidth = padding + this.barLineRight.getRect().width;

        this.minColumnsAreaWidth = 0;
        this.columns.forEach(col => this.minColumnsAreaWidth += col.getRect().width);
        this.minColumnsAreaWidth = Math.max(this.minColumnsAreaWidth, ObjMeasure.MinFlexContentWidth * unitSize);
    }

    layoutWidth(renderer: Renderer, width: number) {
        if (!this.needLayout) {
            return;
        }

        width = Math.max(width, this.getMinWidth());

        this.rect = new DivRect(
            this.rect.left, this.rect.left + width / 2, this.rect.left + width,
            this.rect.top, this.rect.centerY, this.rect.bottom);

        let rect: DivRect;

        this.signatures.forEach(signature => {
            rect = signature.getRect();
            signature.offset(this.rect.left - rect.left, -rect.centerY);
        });

        let signaturesWidth = Math.max(0, ...this.signatures.map(signature => signature.getRect().width));

        rect = this.barLineLeft.getRect();
        this.barLineLeft.offset(this.rect.left + signaturesWidth - rect.left, -rect.centerY);

        rect = this.barLineRight.getRect();
        this.barLineRight.offset(this.rect.right - rect.right, -rect.centerY);

        if (this.endRepeatCountText) {
            this.endRepeatCountText.offset(this.barLineRight.getRect().left, this.barLineRight.getRect().top);
        }

        let columnsAreaLeft = this.rect.left + this.leftSolidAreaWidth;
        let columnsAreaRight = this.rect.right - this.rightSolidAreaWidth;
        let columnsAreaWidth = columnsAreaRight - columnsAreaLeft;

        let columnsWidth = Utils.Math.sum(this.columns.map(col => col.getRect().width));

        let columnScale = columnsAreaWidth / columnsWidth;

        let columnLeft = columnsAreaLeft;

        this.columns.forEach(col => {
            rect = col.getRect();
            let columnCenterX = columnLeft + rect.leftw * columnScale;
            col.offset(columnCenterX - rect.centerX, -rect.centerY);
            columnLeft += rect.width * columnScale;
        });
    }

    layoutArcs(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout arcs
        this.arcs.forEach(arc => {
            arc.layout(renderer);
            // Arcs enter neighbors, only expand height for now.
            let r = arc.getRect();

            this.rect = new DivRect(
                this.rect.left,
                this.rect.right,
                Math.min(this.rect.top, r.top),
                Math.max(this.rect.bottom, r.bottom)
            );
        });
    }

    layoutBeams(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout Beams
        this.beamGroups.forEach(beam => {
            beam.layout(renderer);

            this.rect.expandInPlace(beam.getRect());
        });
    }

    layoutDone() {
        this.columns.forEach(col => col.layoutDone());

        this.needLayout = false;
    }

    offset(dx: number, dy: number) {
        this.signatures.forEach(signature => signature.offset(dx, dy));

        this.barLineLeft.offset(dx, dy);

        this.columns.forEach(col => col.offset(dx, dy));

        this.barLineRight.offset(dx, dy);

        if (this.endRepeatCountText) {
            this.endRepeatCountText.offset(dx, dy);
        }

        this.arcs.forEach(arc => arc.offset(dx, dy));

        this.beamGroups.forEach(beam => beam.offset(dx, dy));

        this.forEachLayoutObject(layoutObj => layoutObj.musicObj.offset(dx, dy));

        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        renderer.drawDebugRect(this.rect);

        // Draw staff lines
        let left = this.getStaffLineLeft();
        let right = this.getStaffLineRight();

        const drawLine = (y: number) => renderer.drawLine(left, y, right, y);

        let { row } = this;

        row.getStaves().forEach(staff => {
            for (let p = staff.bottomLinePitch; p <= staff.topLinePitch; p += 2) {
                drawLine(staff.getPitchY(p));
            }
        });

        let tab = row.getTab();
        if (tab) {
            for (let stringId = 0; stringId < 6; stringId++) {
                drawLine(tab.getStringY(stringId));
            }
        }

        this.signatures.forEach(signature => signature.draw(renderer));

        this.barLineLeft.draw(renderer);

        this.columns.forEach(col => col.draw(renderer));

        this.barLineRight.draw(renderer);

        if (this.endRepeatCountText) {
            this.endRepeatCountText.draw(renderer);
        }

        this.arcs.forEach(arc => arc.draw(renderer));

        this.forEachLayoutObject(layoutObj => layoutObj.musicObj.draw(renderer));

        this.beamGroups.forEach(beam => beam.draw(renderer));

    }
}
