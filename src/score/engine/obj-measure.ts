import { Utils } from "@tspro/ts-utils-lib";
import { getScale, Scale, validateScaleType, Note, NoteLength, RhythmProps, KeySignature, getDefaultKeySignature, PitchNotation, SymbolSet, TupletRatio, NoteLengthStr, getNoteLength, getNoteLengthDotCount } from "@tspro/web-music-score/theory";
import { Tempo, getDefaultTempo, TimeSignature, TimeSignatureString, getDefaultTimeSignature } from "@tspro/web-music-score/theory";
import { MusicObject } from "./music-object";
import { Fermata, Navigation, NoteOptions, RestOptions, Stem, Annotation, Label, StringNumber, DivRect, MMeasure, getVoiceIds, VoiceId, Connective, NoteAnchor, TieType, Clef, VerticalPosition, StaffTabOrGroups, StaffTabOrGroup } from "../pub";
import { Renderer } from "./renderer";
import { AccidentalState } from "./acc-state";
import { ObjSignature } from "./obj-signature";
import { ObjBarLineRight, ObjBarLineLeft } from "./obj-bar-line";
import { ObjRhythmColumn, RhythmSymbol } from "./obj-rhythm-column";
import { ObjEnding } from "./obj-ending";
import { ObjConnective } from "./obj-connective";
import { ObjScoreRow } from "./obj-score-row";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjRest } from "./obj-rest";
import { ObjBeamGroup } from "./obj-beam-group";
import { DebugSettings, DocumentSettings } from "./settings";
import { ObjText, TextProps } from "./obj-text";
import { ObjSpecialText } from "./obj-special-text";
import { ObjFermata } from "./obj-fermata";
import { LayoutGroupId, LayoutObjectWrapper, LayoutableMusicObject, VerticalPos } from "./layout-object";
import { getNavigationString } from "./element-data";
import { Extension, ExtensionLinePos, ExtensionLineStyle } from "./extension";
import { ObjExtensionLine } from "./obj-extension-line";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ConnectiveProps } from "./connective-props";
import { ObjStaff, ObjNotationLine, ObjTab } from "./obj-staff-and-tab";

type AlterTempo = {
    beatsPerMinute: number,
    options?: {
        beatLength: NoteLength,
        dotCount?: number
    }
}

export function validateVoiceId(voiceId: number): VoiceId {
    if ((<number[]>getVoiceIds()).indexOf(voiceId) < 0) {
        throw new MusicError(MusicErrorType.Score, "Invalid voiceId: " + voiceId);
    }
    else {
        return voiceId as VoiceId;
    }
}

function getExtensionTicks(extensionLength: number | NoteLengthStr | (NoteLengthStr | number)[]): number {
    if (typeof extensionLength === "string") {
        extensionLength = [extensionLength];
    }
    if (Utils.Is.isArray(extensionLength)) {
        let totalTicks = 0;
        for (let i = 0; i < extensionLength.length;) {
            let str = extensionLength[i];
            let num = extensionLength[i + 1];
            if (typeof str === "string") {
                i++;
                let ticks = new RhythmProps(str).ticks;
                if (typeof num === "number") {
                    i++;
                    ticks *= num;
                }
                totalTicks += ticks;
            }
            else {
                i++;
            }
        }
        return totalTicks;
    }
    else {
        return extensionLength;
    }
}

export class ObjMeasure extends MusicObject {
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
    private tabStringNotes: ObjText[] = [];
    private barLineLeft: ObjBarLineLeft;
    private columns: ObjRhythmColumn[] = [];
    private barLineRight: ObjBarLineRight;
    private connectives: ObjConnective[] = [];
    private beamGroups: ObjBeamGroup[] = [];

    private tabStringNotesWidth = 0;

    private measureId: number;

    private needLayout = true;

    private leftSolidAreaWidth = 0;
    private minColumnsAreaWidth = 0;
    private rightSolidAreaWidth = 0;

    private useDiatonicId: (number | undefined)[/* voiceId */] = [];
    private useStemDir: (Stem | undefined)[/* voiceId */] = [];
    private useString: (StringNumber[] | undefined)[/* voiceId */] = [];

    private voiceSymbols: RhythmSymbol[/* voiceId */][] = [];

    private lastAddedRhythmColumn?: ObjRhythmColumn;
    private lastAddedRhythmSymbol?: RhythmSymbol;
    private addExtensionToMusicObjects: MusicObject[] = [];

    private layoutObjects: LayoutObjectWrapper[] = [];

    private postMeasureBreakWidth = 0;

    private passCount = 0; // How many times player has passed this measure.

    private needBeamsUpdate = true;

    private navigationSet = new Set<Navigation>();
    private isEndSong: boolean = false;
    private isEndSection: boolean = false;
    private endRepeatPlayCount: number = 2; // play twice.
    private endRepeatPlayCountText?: ObjText;

    private staticObjectsCache = new Map<ObjNotationLine, MusicObject[]>();

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

    isUpBeat() {
        return this === this.doc.getFirstMeasure();
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

    updateOwnDiatonicId(voiceId: number, setDiatonicId?: number): number {
        if (typeof setDiatonicId == "number") {
            this.useDiatonicId[voiceId] = setDiatonicId;
        }
        else if (this.useDiatonicId[voiceId] === undefined) {
            let prevMeasure = this.getPrevMeasure();

            if (prevMeasure && prevMeasure.useDiatonicId[voiceId] !== undefined) {
                this.useDiatonicId[voiceId] = prevMeasure.useDiatonicId[voiceId];
            }
        }

        let diatonicId = this.useDiatonicId[voiceId];

        if (diatonicId === undefined) {
            if (this.row.hasStaff) {
                diatonicId = this.row.getTopStaff().middleLineDiatonicId;
            }
            else {
                diatonicId = Note.getNote("C4").diatonicId;
            }
        }

        return this.useDiatonicId[voiceId] = Note.validateDiatonicId(diatonicId);
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
            let staff = this.row.getStaff(symbol.ownDiatonicId);
            if (staff) {
                return symbol.ownDiatonicId > staff.middleLineDiatonicId ? Stem.Down : Stem.Up;
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
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.signatures.length; i++) {
            let arr = this.signatures[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.tabStringNotes.length; i++) {
            let arr = this.tabStringNotes[i].pick(x, y);
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

        if (this.endRepeatPlayCountText) {
            let arr = this.endRepeatPlayCountText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.connectives.length; i++) {
            let arr = this.connectives[i].pick(x, y);
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
    //setKeySignature(tonic: string, scaleType: ScaleType): void;
    //setKeySignature(keySignature: KeySignature): void;
    //setKeySignature(scale: Scale): void;
    setKeySignature(...args: unknown[]): void {
        this.getPrevMeasure()?.endSection();

        if (args[0] instanceof KeySignature) {
            this.alterKeySignature = args[0];
        }
        else if (args[0] instanceof Scale) {
            this.alterKeySignature = args[0];
        }
        else {
            try {
                let tonic = "" + args[0];
                let scaleType = validateScaleType("" + args[1]);
                this.alterKeySignature = getScale(tonic, scaleType);
            }
            catch (e) {
                throw new MusicError(MusicErrorType.Score, "Cannot set key signature because invalid args: " + args);
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

    setTempo(beatsPerMinute: number, beatLength?: NoteLength | NoteLengthStr, dotted?: boolean | number) {
        this.getPrevMeasure()?.endSection();

        if (beatLength === undefined) {
            this.alterTempo = { beatsPerMinute }
        }
        else {
            let dotCount = typeof dotted === "number" && dotted > 0
                ? dotted
                : dotted === true ? 1 : getNoteLengthDotCount(beatLength);

            beatLength = getNoteLength(beatLength);

            let options = { beatLength, dotCount }

            this.alterTempo = { beatsPerMinute, options }
        }

        this.updateTempo();
    }

    updateTempo() {
        this.tempo = this.prevMeasure ? this.prevMeasure.tempo : getDefaultTempo();

        if (this.alterTempo) {
            let beatsPerMinute = this.alterTempo.beatsPerMinute;

            let beatLength: NoteLength;
            let dotCount: number;

            if (this.alterTempo.options) {
                beatLength = this.alterTempo.options.beatLength;
                dotCount = this.alterTempo.options.dotCount ?? 0;
            }
            else if (this.alterTimeSignature) {
                beatLength = this.alterTimeSignature.beatLength;
                dotCount = 0;
            }
            else {
                beatLength = this.tempo.options.beatLength;
                dotCount = this.tempo.options.dotCount;
            }

            this.tempo = { beatsPerMinute, options: { beatLength, dotCount } }
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

    private addLayoutObject(musicObj: LayoutableMusicObject, line: ObjNotationLine, layoutGroupId: LayoutGroupId, verticalPos: VerticalPos) {
        this.layoutObjects.push(new LayoutObjectWrapper(musicObj, line, layoutGroupId, verticalPos));
        this.requestLayout();
        this.requestRectUpdate();
    }

    private forEachStaffGroup(staffTabOrGroups: StaffTabOrGroups | undefined, defaultVerticalPos: VerticalPos, addFn: (line: ObjNotationLine, vpos: VerticalPos) => void) {
        const lines = this.row.getNotationLines();

        const addToStaffTabOrGroup = (staffTabOrGroup: StaffTabOrGroup, vpos: VerticalPos, prevGroups: string[] = []): void => {
            if (typeof staffTabOrGroup === "number") {
                if (lines[staffTabOrGroup]) {
                    addFn(lines[staffTabOrGroup], vpos);
                }
            }
            else if (typeof staffTabOrGroup === "string" && staffTabOrGroup.length > 0) {
                let stavesAndTabs = lines.filter(l => l.name === staffTabOrGroup);

                stavesAndTabs.forEach(line => addFn(line, vpos));

                if (stavesAndTabs.length === 0) {
                    let grp = this.doc.getStaffGroup(staffTabOrGroup);

                    if (grp && !prevGroups.includes(staffTabOrGroup)) {
                        let curGroups = [...prevGroups, staffTabOrGroup];

                        (Utils.Is.isArray(grp.staffsTabsAndGroups) ? grp.staffsTabsAndGroups : [grp.staffsTabsAndGroups])
                            .forEach(staffTabOrGroup => {
                                switch (grp.verticalPosition) {
                                    case VerticalPosition.Above:
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Above, curGroups);
                                        break;
                                    case VerticalPosition.Below:
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Below, curGroups);
                                        break;
                                    case VerticalPosition.Both:
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Above, curGroups);
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Below, curGroups);
                                        break;
                                    case VerticalPosition.Auto:
                                        addToStaffTabOrGroup(staffTabOrGroup, defaultVerticalPos, curGroups);
                                        break;
                                }
                            });
                    }
                }
            }
        }

        if (staffTabOrGroups === undefined) {
            if (
                lines.length >= 2 &&
                lines[0] instanceof ObjStaff && lines[0].staffConfig.clef === Clef.G && lines[0].isGrand() &&
                lines[1] instanceof ObjStaff && lines[1].staffConfig.clef === Clef.F && lines[1].isGrand()
            ) {
                addToStaffTabOrGroup(defaultVerticalPos === VerticalPos.Below ? 1 : 0, defaultVerticalPos);
            }
            else {
                addToStaffTabOrGroup(0, defaultVerticalPos);
            }
        }
        else if (Utils.Is.isArray(staffTabOrGroups)) {
            staffTabOrGroups.forEach(staffTabOrGroup => addToStaffTabOrGroup(staffTabOrGroup, defaultVerticalPos));
        }
        else {
            addToStaffTabOrGroup(staffTabOrGroups, defaultVerticalPos);
        }
    }

    addFermata(staffTabOrGroups: StaffTabOrGroups | undefined, fermata: Fermata) {
        let anchor = fermata === Fermata.AtMeasureEnd ? this.barLineRight : this.lastAddedRhythmColumn;

        if (!anchor) {
            throw new MusicError(MusicErrorType.Score, "Cannot add Fermata because anchor is undefined.");
        }

        this.forEachStaffGroup(staffTabOrGroups, VerticalPos.Above, (line: ObjNotationLine, vpos: VerticalPos) => {
            this.addLayoutObject(new ObjFermata(anchor, vpos), line, LayoutGroupId.Fermata, vpos);
        });

        this.disableExtension();
        this.requestLayout();
    }

    hasFermata(anchor: ObjRhythmColumn | ObjBarLineRight) {
        return this.layoutObjects.some(layoutObj => layoutObj.musicObj instanceof ObjFermata && layoutObj.anchor === anchor);
    }

    addNavigation(staffTabOrGroups: StaffTabOrGroups | undefined, navigation: Navigation, ...args: unknown[]) {
        let addLayoutObjectProps: {
            createObj: () => LayoutableMusicObject,
            layoutGroupId: LayoutGroupId,
            defaultVerticalPos: VerticalPos
        } | undefined = undefined;

        switch (navigation) {
            case Navigation.Ending:
                if (this.navigationSet.has(navigation)) {
                    throw new MusicError(MusicErrorType.Score, "Cannot add ending beasure measure already has one.");
                }
                let anchor = this;
                let passages = args as number[];
                addLayoutObjectProps = {
                    createObj: (): LayoutableMusicObject => new ObjEnding(anchor, passages),
                    layoutGroupId: LayoutGroupId.Ending,
                    defaultVerticalPos: VerticalPos.Above
                }
                break;
            case Navigation.DC_al_Coda:
            case Navigation.DC_al_Fine:
            case Navigation.DS_al_Coda:
            case Navigation.DS_al_Fine: {
                let anchor = this.barLineRight;
                let text = getNavigationString(navigation);
                addLayoutObjectProps = {
                    createObj: (): LayoutableMusicObject => new ObjText(anchor, text, 1, 1),
                    layoutGroupId: LayoutGroupId.Navigation,
                    defaultVerticalPos: VerticalPos.Above
                }
                this.addNavigation(staffTabOrGroups, Navigation.EndRepeat);
                this.endSong();
                break;
            }
            case Navigation.Fine: {
                let anchor = this.barLineRight;
                let text = getNavigationString(navigation);
                addLayoutObjectProps = {
                    createObj: (): LayoutableMusicObject => new ObjText(anchor, text, 1, 1),
                    layoutGroupId: LayoutGroupId.Navigation,
                    defaultVerticalPos: VerticalPos.Above
                }
                break;
            }
            case Navigation.Segno:
            case Navigation.Coda: {
                let anchor = this.barLineLeft;
                let text = getNavigationString(navigation);
                addLayoutObjectProps = {
                    createObj: (): LayoutableMusicObject => new ObjSpecialText(anchor, text),
                    layoutGroupId: LayoutGroupId.Navigation,
                    defaultVerticalPos: VerticalPos.Above
                }
                break;
            }
            case Navigation.toCoda: {
                let anchor = this.barLineRight;
                let text = getNavigationString(navigation);
                addLayoutObjectProps = {
                    createObj: (): LayoutableMusicObject => new ObjSpecialText(anchor, text),
                    layoutGroupId: LayoutGroupId.Navigation,
                    defaultVerticalPos: VerticalPos.Above
                }
                break;
            }
            case Navigation.EndRepeat:
                if (args.length === 0) {
                    this.endRepeatPlayCount = 2;
                }
                else if (Utils.Is.isIntegerGte(args[0], 2)) {
                    this.endRepeatPlayCount = args[0];
                }
                else {
                    throw new MusicError(MusicErrorType.Score, "Invalid end repeat play count (should be 2 or greater integer): " + args[0]);
                }

                if (this.endRepeatPlayCount !== 2) {
                    let textProps: TextProps = {
                        text: "" + this.endRepeatPlayCount + "x",
                        scale: 0.8
                    }
                    this.endRepeatPlayCountText = new ObjText(this, textProps, 0.5, 1);
                }
                break;
        }

        if (addLayoutObjectProps) {
            this.forEachStaffGroup(staffTabOrGroups, addLayoutObjectProps.defaultVerticalPos, (line: ObjNotationLine, vpos: VerticalPos) => {
                this.addLayoutObject(addLayoutObjectProps.createObj(), line, addLayoutObjectProps.layoutGroupId, vpos);
            });
        }

        this.navigationSet.add(navigation);
        this.disableExtension();
    }

    hasNavigation(n: Navigation) {
        return this.navigationSet.has(n);
    }

    addAnnotation(staffTabOrGroups: StaffTabOrGroups | undefined, annotation: Annotation, text: string) {
        let anchor = this.lastAddedRhythmColumn;

        if (!anchor) {
            throw new MusicError(MusicErrorType.Score, "Cannot add annotation because anchor is undefined.");
        }
        else if (text.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Cannot add annotation because annotation text is empty.");
        }

        let textProps: TextProps = { text }

        let layoutGroupId: LayoutGroupId;
        let defaultVerticalPos: VerticalPos;

        switch (annotation) {
            case Annotation.Dynamics: layoutGroupId = LayoutGroupId.DynamicsAnnotation; defaultVerticalPos = VerticalPos.Above; textProps.italic = true; break;
            case Annotation.Tempo: layoutGroupId = LayoutGroupId.TempoAnnotation; defaultVerticalPos = VerticalPos.Above; textProps.italic = true; break;
        }

        this.disableExtension();

        this.forEachStaffGroup(staffTabOrGroups, defaultVerticalPos, (line: ObjNotationLine, vpos: VerticalPos) => {
            let textObj = new ObjText(anchor, textProps, 0.5, 1);
            this.addLayoutObject(textObj, line, layoutGroupId, vpos);
            this.enableExtension(textObj);
        });
    }

    addLabel(staffTabOrGroups: StaffTabOrGroups | undefined, label: Label, text: string) {
        let anchor = this.lastAddedRhythmColumn;

        if (!anchor) {
            throw new MusicError(MusicErrorType.Score, "Cannot add label because anchor is undefined.");
        }
        else if (text.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Cannot add label because label text is empty.");
        }

        let textProps: TextProps = { text }

        let layoutGroupId: LayoutGroupId;
        let defaultVerticalPos: VerticalPos;

        switch (label) {
            case Label.Note: layoutGroupId = LayoutGroupId.NoteLabel; defaultVerticalPos = VerticalPos.Below; break;
            case Label.Chord: layoutGroupId = LayoutGroupId.ChordLabel; defaultVerticalPos = VerticalPos.Above; break;
        }

        this.disableExtension();

        this.forEachStaffGroup(staffTabOrGroups, defaultVerticalPos, (line: ObjNotationLine, vpos: VerticalPos) => {
            let textObj = new ObjText(anchor, textProps, 0.5, 1);
            this.addLayoutObject(textObj, line, layoutGroupId, vpos);
            this.enableExtension(textObj);
        });
    }

    addConnective(connective: Connective.Tie, tieSpan?: number | TieType, notAnchor?: NoteAnchor): void;
    addConnective(connective: Connective.Slur, slurSpan?: number, notAnchor?: NoteAnchor): void;
    addConnective(connective: Connective.Slide, notAnchor?: NoteAnchor): void;
    addConnective(connective: Connective, ...args: unknown[]): void {
        let anchor = this.lastAddedRhythmSymbol;

        if (!(anchor instanceof ObjNoteGroup)) {
            throw new MusicError(MusicErrorType.Score, "Connective can be added to note group only.");
        }

        if (connective === Connective.Tie) {
            let tieSpan = Utils.Is.isInteger(args[0]) || Utils.Is.isEnumValue(args[0], TieType) ? args[0] : 2;
            let noteAnchor = Utils.Is.isEnumValue(args[1], NoteAnchor) ? args[1] : NoteAnchor.Auto;
            anchor.startConnective(new ConnectiveProps(Connective.Tie, tieSpan, noteAnchor, anchor));
        }
        else if (connective === Connective.Slur) {
            let slurSpan = Utils.Is.isInteger(args[0]) ? args[0] : 2;
            let noteAnchor = Utils.Is.isEnumValue(args[1], NoteAnchor) ? args[1] : NoteAnchor.Auto;
            anchor.startConnective(new ConnectiveProps(Connective.Slur, slurSpan, noteAnchor, anchor));
        }
        else if (connective === Connective.Slide) {
            let noteAnchor = Utils.Is.isEnumValue(args[0], NoteAnchor) ? args[0] : NoteAnchor.Auto;
            anchor.startConnective(new ConnectiveProps(Connective.Slide, 2, noteAnchor, anchor));
        }
    }

    addExtension(extensionLength: number | NoteLengthStr | (NoteLengthStr | number)[], extensionVisible: boolean) {
        this.addExtensionToMusicObjects.forEach(musicObj => {
            let anchor = musicObj.getParent();

            if (musicObj instanceof ObjText && anchor instanceof ObjRhythmColumn) {
                let lineStyle: ExtensionLineStyle = "dashed";
                let linePos: ExtensionLinePos = "bottom";

                let extension = new Extension(musicObj, anchor, getExtensionTicks(extensionLength), extensionVisible, lineStyle, linePos);
                musicObj.setLink(extension);
            }
            else {
                throw new MusicError(MusicErrorType.Score, "Cannot add extension becaue no compatible music object to attach it to.");
            }
        });

        if (this.addExtensionToMusicObjects.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Cannot add extension because music object to attach it to is undefined.");
        }

        this.disableExtension();
        this.requestLayout();
    }

    private enableExtension(musicObject: MusicObject) {
        this.addExtensionToMusicObjects.push(musicObject);
    }

    private disableExtension() {
        this.addExtensionToMusicObjects = [];
    }

    getEnding(): ObjEnding | undefined {
        return this.layoutObjects.map(layoutObj => layoutObj.musicObj).find(musicObj => musicObj instanceof ObjEnding);
    }

    getEndRepeatPlayCount() {
        return this.endRepeatPlayCount;
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

    private addRhythmSymbol(voiceId: number, symbol: RhythmSymbol) {
        let { col } = symbol;

        col.setVoiceSymbol(voiceId, symbol);

        this.getVoiceSymbols(voiceId); // Ensures voicesymbols[voiceId] !== undefined
        this.voiceSymbols[voiceId].push(symbol);

        if (symbol.oldStyleTriplet) {
            this.createOldStyleTriplets(voiceId);
        }

        this.requestBeamsUpdate();

        this.lastAddedRhythmColumn = col;
        this.lastAddedRhythmSymbol = symbol;
    }

    addNoteGroup(voiceId: number, notes: (Note | string)[], noteLength: NoteLength | NoteLengthStr, options?: NoteOptions, tupletRatio?: TupletRatio): ObjNoteGroup {
        let realNotes = notes.map(note => typeof note === "string" ? Note.getNote(note) : note);
        let col = this.getRhythmColumn(voiceId);
        let noteGroup = new ObjNoteGroup(col, voiceId, realNotes, noteLength, options, tupletRatio);
        this.addRhythmSymbol(voiceId, noteGroup);
        return noteGroup;
    }

    addRest(voiceId: number, restLength: NoteLength | NoteLengthStr, options?: RestOptions, tupletRatio?: TupletRatio): ObjRest {
        let col = this.getRhythmColumn(voiceId);
        let rest = new ObjRest(col, voiceId, restLength, options, tupletRatio);
        this.addRhythmSymbol(voiceId, rest);
        return rest;
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
                return col;
            }
        }

        throw new MusicError(MusicErrorType.Score, "Error in rhythm column. Should never get here.");
    }

    getMeasureTicks() {
        return this.getTimeSignature().measureTicks;
    }

    getConsumedTicks(voiceId?: number) {
        let measureTicks = 0;

        this.columns.forEach(col => {
            getVoiceIds().forEach(curVoiceId => {
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
            this.getRect().top,
            this.getRect().bottom);
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
            return this.getRect().left + this.tabStringNotesWidth;
        }
    }

    getStaffLineRight() {
        return this.barLineRight.getRect().centerX;
    }

    getStaticObjects(line: ObjNotationLine): ReadonlyArray<MusicObject> {
        let staticObjects = this.staticObjectsCache.get(line);

        if (!staticObjects) {
            staticObjects = [];
            this.getColumns().forEach(col => col.getStaticObjects(line).forEach(obj => staticObjects?.push(obj)));
            this.staticObjectsCache.set(line, staticObjects);
        }

        let layoutObjects = this.layoutObjects
            .filter(layoutObj => layoutObj.line === line && layoutObj.isPositionResolved())
            .map(layoutObj => layoutObj.musicObj);

        return layoutObjects.length > 0 ? [...staticObjects, ...layoutObjects] : staticObjects;
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

    addConnectiveObject(connective: ObjConnective) {
        this.connectives.push(connective);
        this.requestLayout();
    }

    removeConnectiveObjects() {
        if (this.connectives.length > 0) {
            this.connectives = [];
            this.requestLayout();
        }
    }

    createExtensions() {
        this.layoutObjects.forEach(layoutObj => {
            let { musicObj, measure, layoutGroupId, verticalPos, line } = layoutObj;

            if (musicObj.getLink() instanceof Extension) {
                let extension = musicObj.getLink() as Extension;

                if (extension.getHead() === musicObj) {
                    // Remove old extnsion lines
                    extension.getTails().forEach(musicObj2 => measure.removeLayoutObjects(musicObj2));

                    // Create new extension lines
                    let { startColumn, endColumn } = extension.getExtensionRangeInfo();

                    if (extension.isVisible() && startColumn !== endColumn) {
                        for (let m: ObjMeasure | undefined = startColumn.measure; m !== undefined; m = m === endColumn.measure ? undefined : m.getNextMeasure()) {
                            let leftObj = m === startColumn.measure ? extension.getHead() : m.getBarLineLeft();
                            let rightObj = m === endColumn.measure ? endColumn : m.getBarLineRight();

                            const lines = m.row.getNotationLines();

                            let line2: ObjNotationLine | undefined = lines.find(l => l.name !== "" && l.name === line.name) ?? lines[line.id];

                            if (line2) {
                                m.addLayoutObject(new ObjExtensionLine(m, line2, extension, leftObj, rightObj), line2, layoutGroupId, verticalPos);
                            }
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

    // Create triplets by triplet property of NoteOptions/RestOptions.
    private createOldStyleTriplets(voiceId: number) {
        let symbols = this.getVoiceSymbols(voiceId);

        for (let i = 0; i < symbols.length;) {
            if (symbols[i].oldStyleTriplet) {
                let n = ObjBeamGroup.createOldStyleTriplet(symbols.slice(i, i + 3));
                i += (n === 0 ? 1 : n);
            }
            else {
                i++;
            }
        }

        this.requestLayout();
    }

    createBeams() {
        if (!this.needBeamsUpdate/* || !this.row.hasStaff*/) {
            return;
        }

        // Remove old beams, keep tuplets.
        this.beamGroups = this.beamGroups.filter(beamGroup => {
            if (beamGroup.isTuplet()) {
                return true;
            }
            else {
                beamGroup.detach();
                return false;
            }
        });

        // Recreate beams
        getVoiceIds().forEach(voiceId => {
            let symbols = this.getVoiceSymbols(voiceId);

            if (symbols.length <= 2) {
                return;
            }

            if (!DebugSettings.DisableBeams) {
                let groupSymbols: RhythmSymbol[] = [];
                let groupStartTicks = 0;
                let groupEndTicks = 0;

                // Is upbeat? Set starting ticks position.
                if (this.isUpBeat()) {
                    let startTicks = Math.max(0, this.getMeasureTicks() - this.getConsumedTicks());
                    groupStartTicks = groupEndTicks = startTicks;
                }

                let ts = this.getTimeSignature();

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
        });

        this.needBeamsUpdate = false;

        this.requestLayout();
    }

    private static setupBeamGroup(groupSymbols: RhythmSymbol[]) {
        let groupNotes = groupSymbols.map(s => {
            return s instanceof ObjNoteGroup && s.getBeamGroup()?.isTuplet() !== true ? s : undefined;
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

    getBarLineLeft() {
        return this.barLineLeft;
    }

    getBarLineRight() {
        return this.barLineRight;
    }

    getVoiceSymbols(voiceId: number): ReadonlyArray<RhythmSymbol> {
        validateVoiceId(voiceId);

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
                getVoiceIds().forEach(voiceId => {
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
                for (let dotCount = 6; dotCount >= 0; dotCount--) {
                    try {
                        let restValue = new RhythmProps(restLength, dotCount);
                        while (restValue.ticks <= remainingTicks) {
                            rests.push(restValue);
                            remainingTicks -= restValue.ticks;
                        }
                    }
                    catch (e) { }
                }
            });
        }

        rests.reverse().forEach(rest => this.addRest(voiceId, rest.noteLength, { dotted: rest.dotCount }));
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

        this.staticObjectsCache.clear();

        this.requestRectUpdate();

        let { unitSize } = renderer;

        this.postMeasureBreakWidth = this.hasPostMeasureBreak()
            ? DocumentSettings.PostMeasureBreakWidth * unitSize
            : 0;

        let isFirstMeasureInRow = this === this.row.getFirstMeasure();
        let isAfterMeasureBreak = this.getPrevMeasure()?.hasPostMeasureBreak() === true;

        this.tabStringNotesWidth = isFirstMeasureInRow && this.row.hasTab ? unitSize * 4 : 0;

        let showClef = isFirstMeasureInRow || isAfterMeasureBreak;
        let showMeasureNumber = isFirstMeasureInRow && !this.row.isFirstRow();
        let showKeySignature = isFirstMeasureInRow || isAfterMeasureBreak || !!this.alterKeySignature;
        let showTimeSignature = !!this.alterTimeSignature;
        let showTempo = !!this.alterTempo;

        if (showClef || showMeasureNumber || showKeySignature || showTimeSignature || showTempo) {
            this.signatures = this.row.getStaves().map((staff, staffId) => {
                let oldSignature = this.signatures.find(s => s.staff === staff);

                let signature = oldSignature ?? new ObjSignature(this, staff);

                signature.staff.addObject(signature);

                signature.updateClefImage(renderer, showClef);
                signature.updateMeasureNumber(showMeasureNumber && staffId === 0);
                signature.updateKeySignature(showKeySignature);
                signature.updateTimeSignature(showTimeSignature);
                signature.updateTempo(showTempo && staffId === 0);

                return signature;
            });
        }
        else {
            this.signatures = [];
        }

        // Layout signatures
        this.signatures.forEach(signature => signature.layout(renderer));

        // Layout tab string notes
        this.tabStringNotes.length = 0;
        if (this === this.row.getFirstMeasure()) {
            this.row.getTabs().forEach(tab => {
                for (let stringId = 0; stringId < 6; stringId++) {
                    let note = tab.getTuningStrings()[stringId].format(PitchNotation.Helmholtz, SymbolSet.Unicode);
                    let obj = new ObjText(this, { text: note, scale: 0.8 }, 1, 0.5);

                    obj.layout(renderer);
                    obj.offset(this.tabStringNotesWidth * 0.8, tab.getStringY(stringId));

                    this.tabStringNotes.push(obj);
                    tab.addObject(obj);
                }
            });
        }

        // Layout measure start object
        this.barLineLeft.layout(renderer);

        // Layout columns
        const accState = new AccidentalState(this);
        this.columns.forEach(col => col.layout(renderer, accState));

        // Layout measure end object
        this.barLineRight.layout(renderer);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.layout(renderer);
        }

        this.layoutObjects.forEach(layoutObj => layoutObj.layout(renderer));

        let padding = renderer.unitSize;

        // Calculated width members
        this.leftSolidAreaWidth =
            this.tabStringNotesWidth +
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

        this.rect = new DivRect();
        this.rect.centerX = this.rect.left + width / 2;
        this.rect.right = this.rect.left + width;

        let rect: DivRect;

        this.signatures.forEach(signature => {
            rect = signature.getRect();
            signature.offset(this.rect.left + this.tabStringNotesWidth - rect.left, -rect.centerY);
        });

        let signaturesWidth = Math.max(0, ...this.signatures.map(signature => signature.getRect().width));

        rect = this.barLineLeft.getRect();
        this.barLineLeft.offset(this.rect.left + this.tabStringNotesWidth + signaturesWidth - rect.left, -rect.centerY);

        rect = this.barLineRight.getRect();
        this.barLineRight.offset(this.rect.right - rect.right, -rect.centerY);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.offset(this.barLineRight.getRect().left, this.barLineRight.getRect().top);
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

    layoutConnectives(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout connectives
        this.connectives.forEach(connective => {
            connective.layout(renderer);

            this.rect.top = Math.min(this.rect.top, connective.getRect().top);
            this.rect.bottom = Math.max(this.rect.bottom, connective.getRect().bottom);
        });
    }

    layoutBeams(renderer: Renderer) {
        if (!this.needLayout) {
            return;
        }

        // Layout Beams
        this.beamGroups.forEach(beamGroup => {
            beamGroup.layout(renderer);

            this.rect.top = Math.min(this.rect.top, beamGroup.getRect().top);
            this.rect.bottom = Math.max(this.rect.bottom, beamGroup.getRect().bottom);
        });
    }

    alignStemsToBeams() {
        this.beamGroups.forEach(b => b.updateStemTips());
    }

    layoutDone() {
        this.columns.forEach(col => col.layoutDone());
        this.needLayout = false;
    }

    updateRect() {
        this.rect.top = Math.min(
            ...this.signatures.map(s => s.getRect().top),
            ...this.tabStringNotes.map(t => t.getRect().top),
            this.barLineLeft.getRect().top,
            ...this.columns.filter(col => !col.isEmpty()).map(col => col.getRect().top),
            this.barLineRight.getRect().top,
            ...this.connectives.map(c => c.getRect().top),
            ...this.beamGroups.filter(b => !b.isEmpty()).map(b => b.getRect().top),
            ...this.layoutObjects.filter(o => o.isPositionResolved()).map(o => o.musicObj.getRect().top)
        );

        this.rect.bottom = Math.max(
            ...this.signatures.map(s => s.getRect().bottom),
            ...this.tabStringNotes.map(t => t.getRect().bottom),
            this.barLineLeft.getRect().bottom,
            ...this.columns.filter(col => !col.isEmpty()).map(col => col.getRect().bottom),
            this.barLineRight.getRect().bottom,
            ...this.connectives.map(c => c.getRect().bottom),
            ...this.beamGroups.filter(b => !b.isEmpty()).map(b => b.getRect().bottom),
            ...this.layoutObjects.filter(o => o.isPositionResolved()).map(o => o.musicObj.getRect().bottom)
        );

        if (this === this.row.getLastMeasure()) {
            // Expand width of last measure in case there is fermata.
            this.rect.right = Math.max(
                this.rect.right,
                ...this.layoutObjects.filter(o => o.isPositionResolved() && o.musicObj instanceof ObjFermata).map(o => o.musicObj.getRect().right)
            );
        }

        this.row.getNotationLines().forEach(line => {
            this.rect.top = Math.min(this.rect.top, line.calcTop());
            this.rect.bottom = Math.max(this.rect.bottom, line.calcBottom());
        });

        this.row.requestRectUpdate();
    }

    offset(dx: number, dy: number) {
        this.signatures.forEach(signature => signature.offset(dx, 0));

        this.tabStringNotes.forEach(obj => obj.offset(dx, 0));

        this.barLineLeft.offset(dx, dy);

        this.columns.forEach(col => col.offset(dx, dy));

        this.barLineRight.offset(dx, dy);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.offset(dx, dy);
        }

        this.connectives.forEach(connective => connective.offset(dx, 0));

        this.beamGroups.forEach(beam => beam.offset(dx, dy));

        this.layoutObjects.forEach(layoutObj => layoutObj.offset(dx, 0));

        this.rect.offsetInPlace(dx, dy);

        this.requestRectUpdate();
    }

    draw(renderer: Renderer) {
        renderer.drawDebugRect(this.getRect());

        // Draw staff lines
        let left = this.getStaffLineLeft();
        let right = this.getStaffLineRight();

        const drawLine = (y: number) => renderer.drawLine(left, y, right, y);

        let { row } = this;

        row.getNotationLines().forEach(line => {
            if (line instanceof ObjStaff) {
                for (let p = line.bottomLineDiatonicId; p <= line.topLineDiatonicId; p += 2) {
                    drawLine(line.getDiatonicIdY(p));
                }
            }
            else if (line instanceof ObjTab) {
                for (let stringId = 0; stringId < 6; stringId++) {
                    drawLine(line.getStringY(stringId));
                }
            }
        });

        this.signatures.forEach(signature => signature.draw(renderer));

        this.tabStringNotes.forEach(obj => obj.draw(renderer));

        this.barLineLeft.draw(renderer);

        this.columns.forEach(col => col.draw(renderer));

        this.barLineRight.draw(renderer);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.draw(renderer);
        }

        this.connectives.forEach(connective => connective.draw(renderer));

        this.layoutObjects.forEach(layoutObj => layoutObj.musicObj.draw(renderer));

        this.beamGroups.forEach(beam => beam.draw(renderer));
    }
}
