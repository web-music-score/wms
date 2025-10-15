import { Map3, Utils } from "@tspro/ts-utils-lib";
import { getScale, Scale, validateScaleType, Note, NoteLength, RhythmProps, KeySignature, getDefaultKeySignature, PitchNotation, SymbolSet, TupletRatio, NoteLengthStr, validateNoteLength, NoteLengthProps } from "@tspro/web-music-score/theory";
import { Tempo, getDefaultTempo, TimeSignature, getDefaultTimeSignature } from "@tspro/web-music-score/theory";
import { MusicObject } from "./music-object";
import { Fermata, Navigation, NoteOptions, RestOptions, Stem, Annotation, Label, StringNumber, DivRect, MMeasure, getVoiceIds, VoiceId, Connective, NoteAnchor, TieType, VerticalPosition, StaffTabOrGroups, StaffTabOrGroup, VerseNumber, getVerseNumbers, LyricsOptions, MeasureOptions } from "../pub";
import { RenderContext } from "./render-context";
import { AccidentalState } from "./acc-state";
import { ObjStaffSignature, ObjTabSignature } from "./obj-signature";
import { ObjBarLineRight, ObjBarLineLeft } from "./obj-bar-line";
import { ObjRhythmColumn, RhythmSymbol } from "./obj-rhythm-column";
import { ObjEnding } from "./obj-ending";
import { ObjConnective } from "./obj-connective";
import { ObjScoreRow } from "./obj-score-row";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjRest } from "./obj-rest";
import { ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
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
import { ObjLyrics } from "./obj-lyrics";
import { ObjTabRhythm } from "./obj-tab-rhythm";

type AlterTempo = {
    beatsPerMinute: number,
    options?: {
        beatLength: NoteLength,
        dotCount?: number
    }
}

export function validateVoiceId(voiceId: unknown): VoiceId {
    if (typeof voiceId === "number" && (<number[]>getVoiceIds()).indexOf(voiceId) < 0) {
        throw new MusicError(MusicErrorType.Score, "Invalid voiceId: " + voiceId);
    }
    else {
        return voiceId as VoiceId;
    }
}

export function validateVerseNumber(verse: number): VerseNumber {
    if (typeof verse === "number" && (<number[]>getVerseNumbers()).indexOf(verse) < 0) {
        throw new MusicError(MusicErrorType.Score, "Invalid lyrics verse: " + verse);
    }
    else {
        return verse as VerseNumber;
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
                let ticks = RhythmProps.get(str).ticks;
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

function getVerseLayoutGroupId(verse: VerseNumber): LayoutGroupId {
    switch (verse) {
        case 1: return LayoutGroupId.LyricsVerse1;
        case 2: return LayoutGroupId.LyricsVerse2;
        case 3: return LayoutGroupId.LyricsVerse3;
        default:
            throw new MusicError(MusicErrorType.Unknown, "VerseNumber is not 1, 2 or 3.");
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

    private signatures: (ObjStaffSignature | ObjTabSignature)[] = [];
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
    private lyricsObjectsCache = new Map3<ObjNotationLine, VerticalPos, VerseNumber, ObjLyrics[]>();

    readonly mi: MMeasure;

    constructor(readonly row: ObjScoreRow, private readonly options: MeasureOptions) {
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

        // Create tab rhythm objects
        this.row.getTabs().forEach(tab => {
            this.addLayoutObject(new ObjTabRhythm(this, tab), tab, LayoutGroupId.TabRhythm, VerticalPos.Above);
        });

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

    updateRunningArguments(runningArgs?: { diatonicId: number, stemDir: Stem, stringNumbers: StringNumber[] }[/* voiceId */]) {
        runningArgs ??= [];

        let numVoices = Utils.Math.sum(getVoiceIds().map(voiceId => this.getVoiceSymbols(voiceId).length > 0 ? 1 : 0));

        getVoiceIds().forEach(voiceId => {
            const getDefaultDiatonicId = (): number => {
                let staves = this.row.getStaves().filter(staff => staff.containsVoiceId(voiceId));
                let tabs = this.row.getTabs().filter(tab => tab.containsVoiceId(voiceId));
                return staves.length > 0 ? staves[0].middleLineDiatonicId : tabs.length > 0 ? tabs[0].getTuningStrings()[3].diatonicId : Note.getNote("G4").diatonicId;
            }
            const getDefaultStemDir = (): Stem => Stem.Auto;
            const getDefaultStringNumbers = (): StringNumber[] => [];

            let args = runningArgs[voiceId] ??= {
                diatonicId: getDefaultDiatonicId(),
                stemDir: getDefaultStemDir(),
                stringNumbers: getDefaultStringNumbers()
            }

            this.getVoiceSymbols(voiceId).forEach((sym, symId, symArr) => {
                if (sym.setDiatonicId === ObjRest.UndefinedDiatonicId) {
                    if (numVoices < 2) {
                        args.diatonicId = ObjRest.UndefinedDiatonicId;
                    }
                }
                else {
                    args.diatonicId = sym.setDiatonicId;
                }

                if (sym instanceof ObjNoteGroup) {
                    if (sym.setStringsNumbers) {
                        args.stringNumbers = sym.setStringsNumbers;
                    }

                    switch (sym.options?.stem) {
                        case Stem.Up:
                        case "up":
                            args.stemDir = Stem.Up;
                            break;
                        case Stem.Down:
                        case "down":
                            args.stemDir = Stem.Down;
                            break;
                        case Stem.Auto:
                        case "auto":
                            args.stemDir = Stem.Auto;
                            break;
                    }
                }

                let beamSymbols = sym.getBeamGroup()?.getSymbols();
                let setStemDir: Stem.Up | Stem.Down;

                if (beamSymbols === undefined) {
                    setStemDir = args.stemDir === Stem.Auto ? this.row.solveAutoStemDir([sym]) : args.stemDir;
                }
                else {
                    if (sym === beamSymbols[0]) {
                        setStemDir = args.stemDir === Stem.Auto ? this.row.solveAutoStemDir(beamSymbols) : args.stemDir;
                    }
                    else {
                        setStemDir = beamSymbols[0].stemDir;
                    }
                }

                sym.updateRunningArguments(args.diatonicId, setStemDir, args.stringNumbers);
            });
        });

        this.getNextMeasure()?.updateRunningArguments(runningArgs);
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
    //setKeySignature(keySignature: string): void;
    //setKeySignature(scale: Scale): void;
    setKeySignature(...args: unknown[]): void {
        this.getPrevMeasure()?.endSection();

        if (args[0] instanceof KeySignature) {
            this.alterKeySignature = args[0];
        }
        else if (args[0] instanceof Scale) {
            this.alterKeySignature = args[0];
        }
        else if (Utils.Is.isNonEmptyString(args[0])) {
            if (args.length === 1) {
                this.alterKeySignature = getScale(args[0]);
            }
            else if (args.length === 2) {
                try {
                    let tonic = "" + args[0];
                    let scaleType = validateScaleType("" + args[1]);
                    this.alterKeySignature = getScale(tonic, scaleType);
                }
                catch (e) {
                    throw new MusicError(MusicErrorType.Score, "Cannot set key signature because invalid args: " + args);
                }
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

    setTimeSignature(timeSignature: TimeSignature) {
        this.getPrevMeasure()?.endSection();

        this.alterTimeSignature = timeSignature;

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
                : dotted === true ? 1 : NoteLengthProps.get(beatLength).dotCount;

            let options = {
                beatLength: validateNoteLength(beatLength),
                dotCount: dotCount > 0 ? dotCount : undefined
            }

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
                lines[0] instanceof ObjStaff && lines[1] instanceof ObjStaff &&
                lines[0].staffConfig.grandId !== undefined && lines[0].staffConfig.grandId === lines[1].staffConfig.grandId
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

    private addRhythmSymbol(symbol: RhythmSymbol) {
        let { col, voiceId } = symbol;

        col.setVoiceSymbol(voiceId, symbol);

        this.voiceSymbols[voiceId] ??= [];
        this.voiceSymbols[voiceId].push(symbol);

        if (symbol.oldStyleTriplet) {
            this.createOldStyleTriplets(voiceId);
        }

        this.requestBeamsUpdate();

        this.lastAddedRhythmColumn = col;
        this.lastAddedRhythmSymbol = symbol;
    }

    addNoteGroup(voiceId: VoiceId, notes: (Note | string)[], noteLength: NoteLength | NoteLengthStr, options?: NoteOptions, tupletRatio?: TupletRatio): ObjNoteGroup {
        let realNotes = notes.map(note => typeof note === "string" ? Note.getNote(note) : note);
        let col = this.getRhythmColumn(voiceId);
        let noteGroup = new ObjNoteGroup(col, voiceId, realNotes, noteLength, options, tupletRatio);
        this.addRhythmSymbol(noteGroup);
        return noteGroup;
    }

    addRest(voiceId: VoiceId, restLength: NoteLength | NoteLengthStr, options?: RestOptions, tupletRatio?: TupletRatio): ObjRest {
        let col = this.getRhythmColumn(voiceId);
        let rest = new ObjRest(col, voiceId, restLength, options, tupletRatio);
        this.addRhythmSymbol(rest);
        return rest;
    }

    addLyrics(staffTabOrGroups: StaffTabOrGroups | undefined, verse: VerseNumber, lyricsLength: NoteLength | NoteLengthStr, lyricsText: string, lyricsOptions: LyricsOptions) {
        this.forEachStaffGroup(staffTabOrGroups, VerticalPos.Below, (line: ObjNotationLine, vpos: VerticalPos) => {
            let col = this.getRhythmColumn({ verse, line, vpos });

            let lyricsObj = new ObjLyrics(col, verse, line, vpos, validateNoteLength(lyricsLength), lyricsText, lyricsOptions);

            col.addLyricsObject(lyricsObj);

            let lyricsArr = this.getLyricsObjects(line, vpos, verse);
            lyricsArr.push(lyricsObj);
            lyricsArr.sort((a, b) => Utils.Math.cmp(a.col.positionTicks, b.col.positionTicks));

            lyricsObj.measure.getPrevLyricsObject(lyricsObj)?.setNextLyricsObject(lyricsObj);

            this.addLayoutObject(lyricsObj, line, getVerseLayoutGroupId(verse), vpos);

            this.lastAddedRhythmColumn = col;
        });
    }

    /**
     * 
     * @param positionTicks - get ObjRhythmColumn with positionTicks. Insert new if necessary.
     * @returns 
     */
    private getRhythmColumn(arg: VoiceId | { verse: VerseNumber, line: ObjNotationLine, vpos: VerticalPos }): ObjRhythmColumn {
        // Find next positionTicks for symbol in voiceId or lyrics object in verse.
        let positionTicks = 0;

        for (let i = this.columns.length - 1; i >= 0 && positionTicks === 0; i--) {
            let col = this.columns[i];
            let symbol = typeof arg === "number"
                ? col.getVoiceSymbol(arg)
                : col.getLyricsObject(arg.verse, arg.line, arg.vpos);

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

    getConsumedTicks(voiceId?: VoiceId) {
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

    private getLyricsObjects(line: ObjNotationLine, vpos: VerticalPos, verse: VerseNumber): ObjLyrics[] {
        let lyricsObjs = this.lyricsObjectsCache.get(line, vpos, verse);

        if (!lyricsObjs) {
            this.lyricsObjectsCache.set(line, vpos, verse, lyricsObjs = []);
        }

        return lyricsObjs;
    }

    getPrevLyricsObject(lyricsObj: ObjLyrics): ObjLyrics | undefined {
        let { line, verse, vpos } = lyricsObj;
        let lyricsArr = this.getLyricsObjects(line, vpos, verse);

        let i = lyricsArr.indexOf(lyricsObj);

        if (i > 0) {
            return lyricsArr[i - 1];
        }
        else if (i === 0) {
            let lyricsArr = lyricsObj.measure.getPrevMeasure()?.getLyricsObjects(line, vpos, verse);
            if (lyricsArr && lyricsArr.length > 0) {
                return lyricsArr[lyricsArr.length - 1];
            }
        }

        return undefined;
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
    private createOldStyleTriplets(voiceId: VoiceId) {
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

    getBeamGroups(): ReadonlyArray<ObjBeamGroup> {
        return this.beamGroups;
    }

    createBeams() {
        if (!this.needBeamsUpdate) {
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

        let ts = this.getTimeSignature();

        if (!this.needBeamsUpdate || ts.beamGroupSizes.length === 0) {
            return;
        }

        // Recreate beams
        getVoiceIds().forEach(voiceId => {
            let symbols = this.getVoiceSymbols(voiceId).slice();

            if (symbols.length < 2) {
                return;
            }

            let upBeatStartTicks = this.isUpBeat() ? Math.max(0, this.getMeasureTicks() - this.getConsumedTicks()) : 0;
            let groupStartTicks = 0;

            for (let groupId = 0; groupId < ts.beamGroupSizes.length; groupId++) {
                let beamGroupSize = ts.beamGroupSizes[groupId];

                let beamGroupSizeList: number[][] = [beamGroupSize];

                if (beamGroupSize.length > 1) {
                    beamGroupSizeList.unshift([Utils.Math.sum(beamGroupSize)]);
                }

                let beamCreated = false;
                let groupStartTicksSave = groupStartTicks;

                while (beamGroupSizeList.length > 0 && !beamCreated) {
                    let beamGroupSize2 = beamGroupSizeList.shift()!;

                    groupStartTicks = groupStartTicksSave;

                    beamGroupSize2.forEach(beamGroupSize3 => {
                        let beamGroupTicks = beamGroupSize3 * NoteLengthProps.get("8n").ticks;
                        let groupEndTicks = groupStartTicks + beamGroupTicks;

                        let groupSymbols = symbols.filter(symbol => {
                            let symbolStartTicks = upBeatStartTicks + symbol.col.positionTicks;
                            let symbolEndTicks = symbolStartTicks + symbol.rhythmProps.ticks;
                            return symbolStartTicks >= groupStartTicks && symbolEndTicks <= groupEndTicks;
                        });

                        let groupSymbolsTicks = Utils.Math.sum(groupSymbols.map(sym => sym.rhythmProps.ticks));

                        if (
                            groupSymbolsTicks === beamGroupTicks &&
                            groupSymbols.every(n => n instanceof ObjNoteGroup) &&
                            (groupSymbols.every(n => n.rhythmProps.flagCount === 1) || beamGroupSizeList.length === 0)
                        ) {
                            if (ObjBeamGroup.createBeam(groupSymbols)) {
                                beamCreated = true;
                            }
                        }

                        groupStartTicks += beamGroupTicks;
                    });
                }
            }
        });

        this.needBeamsUpdate = false;

        this.requestLayout();
    }

    getBarLineLeft() {
        return this.barLineLeft;
    }

    getBarLineRight() {
        return this.barLineRight;
    }

    getVoiceSymbols(voiceId: VoiceId): ReadonlyArray<RhythmSymbol> {
        validateVoiceId(voiceId);
        this.voiceSymbols[voiceId] ??= [];
        return this.voiceSymbols[voiceId];
    }

    completeRests(voiceId?: VoiceId | VoiceId[]) {
        if (voiceId === undefined) {
            if (this.getConsumedTicks() === 0) {
                // Whole measure is empty, add rest to voice 0.
                this.completeRests(0);
            }
            else {
                // Measure is not empty, complete rests for voices that are not empty.
                this.completeRests(getVoiceIds().filter(id => this.getConsumedTicks(id) > 0));
            }
            return;
        }
        else if (Utils.Is.isArray(voiceId)) {
            // Complete rests for given voices.
            voiceId.forEach(id => this.completeRests(id));
            return;
        }
        else {
            // Comlete rests for given voice.
            validateVoiceId(voiceId);

            let measureTicks = this.getMeasureTicks();
            let consumedTicks = this.getConsumedTicks(voiceId);
            let remainingTicks = measureTicks - consumedTicks;

            let rests: RhythmProps[] = [];

            while (remainingTicks > 0) {
                for (let noteSize = NoteLengthProps.LongestNoteSize; noteSize <= NoteLengthProps.ShortestNoteSize; noteSize *= 2) {
                    let restLength = NoteLengthProps.create(noteSize).noteLength;
                    for (let dotCount = NoteLengthProps.get(restLength).maxDotCount; dotCount >= 0; dotCount--) {
                        let restProps = RhythmProps.get(restLength, dotCount);
                        while (restProps.ticks <= remainingTicks) {
                            rests.push(restProps);
                            remainingTicks -= restProps.ticks;
                        }
                    }
                }
            }

            rests.reverse().forEach(rest => this.addRest(voiceId, rest.noteLength, { dotted: rest.dotCount }));
        }
    }

    requestLayout() {
        if (!this.needLayout) {
            this.needLayout = true;
            this.row.requestLayout();
        }
    }

    layout(ctx: RenderContext) {
        if (!this.needLayout) {
            return;
        }

        this.staticObjectsCache.clear();

        this.requestRectUpdate();

        let { unitSize } = ctx;

        this.postMeasureBreakWidth = this.hasPostMeasureBreak()
            ? DocumentSettings.PostMeasureBreakWidth * unitSize
            : 0;

        let isFirstMeasureInRow = this === this.row.getFirstMeasure();
        let isAfterMeasureBreak = this.getPrevMeasure()?.hasPostMeasureBreak() === true;

        this.tabStringNotesWidth = isFirstMeasureInRow && this.row.hasTab ? unitSize * 4 : 0;

        let showClef = isFirstMeasureInRow || isAfterMeasureBreak;
        let showMeasureNumber = this.options.showNumber === false ? false : (this.options.showNumber === true || isFirstMeasureInRow && !this.row.isFirstRow());
        let showKeySignature = isFirstMeasureInRow || isAfterMeasureBreak || !!this.alterKeySignature;
        let showTimeSignature = !!this.alterTimeSignature;
        let showTempo = !!this.alterTempo;

        this.signatures = [];

        this.row.getNotationLines().forEach((line, lineId) => {
            if (line instanceof ObjStaff && (showClef || showMeasureNumber || showKeySignature || showTimeSignature || showTempo)) {
                let oldSignature = this.signatures.filter(s => s instanceof ObjStaffSignature).find(s => s.staff === line);

                let signature = oldSignature ?? new ObjStaffSignature(this, line);

                signature.staff.addObject(signature);

                signature.updateClefImage(ctx, showClef);
                signature.updateMeasureNumber(showMeasureNumber && lineId === 0);
                signature.updateKeySignature(showKeySignature);
                signature.updateTimeSignature(showTimeSignature);
                signature.updateTempo(showTempo && lineId === 0);

                signature.layout(ctx);

                this.signatures.push(signature);
            }
            else if (line instanceof ObjTab && (showMeasureNumber || showTimeSignature || showTempo)) {
                let oldSignature = this.signatures.filter(s => s instanceof ObjTabSignature).find(s => s.tab === line);

                let signature = oldSignature ?? new ObjTabSignature(this, line);

                signature.tab.addObject(signature);

                signature.updateMeasureNumber(showMeasureNumber && lineId === 0);
                signature.updateTimeSignature(showTimeSignature);
                signature.updateTempo(showTempo && lineId === 0);

                signature.layout(ctx);

                this.signatures.push(signature);
            }
        });

        // Layout tab string notes
        this.tabStringNotes.length = 0;
        if (this === this.row.getFirstMeasure()) {
            this.row.getTabs().forEach(tab => {
                for (let stringId = 0; stringId < 6; stringId++) {
                    let note = tab.getTuningStrings()[stringId].format(PitchNotation.Helmholtz, SymbolSet.Unicode);
                    let obj = new ObjText(this, { text: note, scale: 0.8 }, 1, 0.5);

                    obj.layout(ctx);
                    obj.offset(this.tabStringNotesWidth * 0.8, tab.getStringY(stringId));

                    this.tabStringNotes.push(obj);
                    tab.addObject(obj);
                }
            });
        }

        // Layout measure start object
        this.barLineLeft.layout(ctx);

        // Layout columns
        const accState = new AccidentalState(this);
        this.columns.forEach(col => col.layout(ctx, accState));

        // Layout measure end object
        this.barLineRight.layout(ctx);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.layout(ctx);
        }

        this.layoutObjects.forEach(layoutObj => layoutObj.layout(ctx));

        let padding = ctx.unitSize;

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

    layoutWidth(ctx: RenderContext, width: number) {
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

    layoutConnectives(ctx: RenderContext) {
        if (!this.needLayout) {
            return;
        }

        // Layout connectives
        this.connectives.forEach(connective => {
            connective.layout(ctx);

            this.rect.top = Math.min(this.rect.top, connective.getRect().top);
            this.rect.bottom = Math.max(this.rect.bottom, connective.getRect().bottom);
        });
    }

    layoutBeams(ctx: RenderContext) {
        if (!this.needLayout) {
            return;
        }

        // Layout Beams
        this.beamGroups.forEach(beamGroup => {
            beamGroup.layout(ctx);

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

    draw(ctx: RenderContext) {
        ctx.drawDebugRect(this.getRect());

        // Draw staff lines
        let left = this.getStaffLineLeft();
        let right = this.getStaffLineRight();

        ctx.color("black").lineWidth(1);

        const drawLine = (y: number) => ctx.strokeLine(left, y, right, y);

        this.row.getNotationLines().forEach(line => {
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

        this.signatures.forEach(signature => signature.draw(ctx));

        this.tabStringNotes.forEach(obj => obj.draw(ctx));

        this.barLineLeft.draw(ctx);

        this.columns.forEach(col => col.draw(ctx));

        this.barLineRight.draw(ctx);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.draw(ctx);
        }

        this.connectives.forEach(connective => connective.draw(ctx));

        this.layoutObjects.forEach(layoutObj => layoutObj.musicObj.draw(ctx));

        this.beamGroups.forEach(beam => beam.draw(ctx));
    }
}
