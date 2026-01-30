import { Guard, IndexArray, UniMap, TriMap, ValueSet, Utils, asMulti, AnchoredRect } from "@tspro/ts-utils-lib";
import * as Theory from "web-music-score/theory";
import { Tempo, getDefaultTempo, TimeSignature, getDefaultTimeSignature } from "web-music-score/theory";
import { MusicObject } from "./music-object";
import * as Pub from "../pub";
import { View } from "./view";
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
import { ObjText } from "./obj-text";
import { ObjSpecialText } from "./obj-special-text";
import { ObjFermata } from "./obj-fermata";
import { LayoutGroupId, LayoutObjectWrapper, LayoutableMusicObject, VerticalPos } from "./layout-object";
import { getAnnotationColor, getAnnotationDefaultVerticalPos, getAnnotationLayoutGroupId, getAnnotationTextReplacement, getNavigationString } from "./annotation-utils";
import { Extension, ExtensionLinePos, ExtensionLineStyle } from "./extension";
import { ObjExtensionLine } from "./obj-extension-line";
import { MusicError, MusicErrorType } from "web-music-score/core";
import { ConnectiveProps } from "./connective-props";
import { ObjStaff, ObjNotationLine, ObjTab } from "./obj-staff-and-tab";
import { ObjLyrics } from "./obj-lyrics";
import { ObjTabRhythm } from "./obj-tab-rhythm";

export function getExtensionAnchorY(linePos: ExtensionLinePos) {
    switch (linePos) {
        case "bottom": return 0.8;
        case "middle": return 0.5;
    }
}

type AlterTempo = {
    beatsPerMinute: number,
    options?: {
        beatLength: Theory.NoteLength,
        dotCount?: number
    }
}

function getExtensionTicks(extensionLength: number | Theory.NoteLengthStr | (Theory.NoteLengthStr | number)[]): number {
    if (typeof extensionLength === "string") {
        extensionLength = [extensionLength];
    }
    if (Guard.isArray(extensionLength)) {
        let totalTicks = 0;
        for (let i = 0; i < extensionLength.length;) {
            let str = extensionLength[i];
            let num = extensionLength[i + 1];
            if (typeof str === "string") {
                i++;
                let ticks = Theory.RhythmProps.get(str).ticks;
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

function getVerseLayoutGroupId(verse: Pub.VerseNumber): LayoutGroupId {
    switch (verse) {
        case 1: return LayoutGroupId.LyricsVerse1;
        case 2: return LayoutGroupId.LyricsVerse2;
        case 3: return LayoutGroupId.LyricsVerse3;
        default:
            throw new MusicError(MusicErrorType.Unknown, "VerseNumber is not 1, 2 or 3.");
    }
}

class MeasureRegions {
    tabTuning_0 = 0;
    signature_1 = 0;
    leftBarLine_2 = 0;
    padding_3 = 0;
    columnsMin_4 = 0;
    padding_5 = 0;
    rightBarLine_6 = 0;
    get leftSolid() { return this.tabTuning_0 + this.signature_1 + this.leftBarLine_2 + this.padding_3; }
    get columnsMin() { return this.columnsMin_4; }
    get rightSolid() { return this.padding_5 + this.rightBarLine_6; }
}

export class ObjMeasure extends MusicObject {
    private prevMeasure: ObjMeasure | undefined;
    private nextMeasure: ObjMeasure | undefined;

    private keySignature: Theory.KeySignature = Theory.getDefaultKeySignature();
    private timeSignature: TimeSignature = getDefaultTimeSignature();
    private tempo: Tempo = getDefaultTempo();

    private alterKeySignature?: Theory.KeySignature;
    private alterTimeSignature?: TimeSignature;
    private alterTempo?: AlterTempo;

    private signatures: (ObjStaffSignature | ObjTabSignature)[] = [];
    private tabStringNotes: ObjText[] = [];
    private barLineLeft: ObjBarLineLeft;
    private columns: ObjRhythmColumn[] = [];
    private barLineRight: ObjBarLineRight;
    private connectives: ObjConnective[] = [];
    private beamGroups: ObjBeamGroup[] = [];

    private measureId: number;

    private regions = new MeasureRegions();

    private needLayout = true;

    private voiceSymbols = asMulti(new IndexArray<RhythmSymbol[]>);

    private lastAddedRhythmColumn?: ObjRhythmColumn;
    private lastAddedRhythmSymbol?: RhythmSymbol;
    private addExtensionTo: { layoutObj: LayoutObjectWrapper, color: string }[] = [];

    private layoutObjects: LayoutObjectWrapper[] = [];

    private postMeasureBreakWidth = 0;

    private passCount = 0; // How many times player has passed this measure.

    private needBeamsUpdate = true;

    private navigationSet = new ValueSet<Pub.NavigationAnnotation>();
    private isEndSong: boolean = false;
    private isEndSection: boolean = false;
    private endRepeatPlayCount: number = 2; // play twice.
    private endRepeatPlayCountText?: ObjText;

    private staticObjectsCache = new UniMap<ObjNotationLine, MusicObject[]>();
    private lyricsObjectsCache = new TriMap<ObjNotationLine, VerticalPos, Pub.VerseNumber, ObjLyrics[]>();

    readonly mi: Pub.MMeasure;

    constructor(readonly row: ObjScoreRow, private readonly options: Pub.MeasureOptions) {
        super(row);

        this.mi = new Pub.MMeasure(this);

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

    getMusicInterface(): Pub.MMeasure {
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

    updateRunningArguments(runningArgs?: { diatonicId: number, stemDir: Pub.Stem, stringNumbers: Pub.StringNumber[] }[/* voiceId */]) {
        runningArgs ??= [];

        let numVoices = Utils.Math.sum(Pub.getVoiceIds().map(voiceId => this.getVoiceSymbols(voiceId).length > 0 ? 1 : 0));

        Pub.getVoiceIds().forEach(voiceId => {
            const getDefaultDiatonicId = (): number => {
                let staves = this.row.getStaves().filter(staff => staff.containsVoiceId(voiceId));
                let tabs = this.row.getTabs().filter(tab => tab.containsVoiceId(voiceId));
                return staves.length > 0 ? staves[0].middleLineDiatonicId : tabs.length > 0 ? tabs[0].getTuningStrings()[3].diatonicId : Theory.Note.getNote("G4").diatonicId;
            }
            const getDefaultStemDir = (): Pub.Stem => Pub.Stem.Auto;
            const getDefaultStringNumbers = (): Pub.StringNumber[] => [];

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
                        case Pub.Stem.Up:
                        case "up":
                            args.stemDir = Pub.Stem.Up;
                            break;
                        case Pub.Stem.Down:
                        case "down":
                            args.stemDir = Pub.Stem.Down;
                            break;
                        case Pub.Stem.Auto:
                        case "auto":
                            args.stemDir = Pub.Stem.Auto;
                            break;
                    }
                }

                let beamSymbols = sym.getBeamGroup()?.getSymbols();
                let setStemDir: Pub.Stem.Up | Pub.Stem.Down;

                if (beamSymbols === undefined) {
                    setStemDir = args.stemDir === Pub.Stem.Auto ? this.row.solveAutoStemDir([sym]) : args.stemDir;
                }
                else {
                    if (sym === beamSymbols[0]) {
                        setStemDir = args.stemDir === Pub.Stem.Auto ? this.row.solveAutoStemDir(beamSymbols) : args.stemDir;
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

    isFirstMeasureInRow() {
        return this === this.row.getFirstMeasure();
    }

    isLastMeasureInRow() {
        return this === this.row.getLastMeasure();
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

        if (args[0] instanceof Theory.KeySignature) {
            this.alterKeySignature = args[0];
        }
        else if (args[0] instanceof Theory.Scale) {
            this.alterKeySignature = args[0];
        }
        else if (Guard.isNonEmptyString(args[0])) {
            if (args.length === 1) {
                this.alterKeySignature = Theory.getScale(args[0]);
            }
            else if (args.length === 2) {
                try {
                    let tonic = "" + args[0];
                    let scaleType = Theory.validateScaleType("" + args[1]);
                    this.alterKeySignature = Theory.getScale(tonic, scaleType);
                }
                catch (e) {
                    throw new MusicError(MusicErrorType.Score, "Cannot set key signature because invalid args: " + args);
                }
            }
        }

        this.updateKeySignature();
    }

    updateKeySignature() {
        this.keySignature = this.prevMeasure ? this.prevMeasure.keySignature : Theory.getDefaultKeySignature();

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

    setTempo(beatsPerMinute: number, beatLength?: Theory.NoteLength | Theory.NoteLengthStr) {
        this.getPrevMeasure()?.endSection();

        if (beatLength === undefined) {
            this.alterTempo = { beatsPerMinute }
        }
        else {
            let dotCount = Theory.NoteLengthProps.get(beatLength).dotCount;

            let options = {
                beatLength: Theory.validateNoteLength(beatLength),
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

            let beatLength: Theory.NoteLength;
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

    private addLayoutObject(musicObj: LayoutableMusicObject, line: ObjNotationLine, layoutGroupId: LayoutGroupId, verticalPos: VerticalPos): LayoutObjectWrapper {
        const layoutObj = new LayoutObjectWrapper(musicObj, line, layoutGroupId, verticalPos);
        this.layoutObjects.push(layoutObj);
        this.requestLayout();
        this.requestRectUpdate();
        return layoutObj;
    }

    private forEachStaffGroup(staffTabOrGroups: Pub.StaffTabOrGroups | undefined, defaultVerticalPos: VerticalPos, addFn: (line: ObjNotationLine, vpos: VerticalPos) => void) {
        const lines = this.row.getNotationLines();

        const addToStaffTabOrGroup = (staffTabOrGroup: Pub.StaffTabOrGroup, vpos: VerticalPos, prevGroups: string[] = []): void => {
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

                        (Guard.isArray(grp.staffsTabsAndGroups) ? grp.staffsTabsAndGroups : [grp.staffsTabsAndGroups])
                            .forEach(staffTabOrGroup => {
                                switch (grp.verticalPosition) {
                                    case Pub.VerticalPosition.Above:
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Above, curGroups);
                                        break;
                                    case Pub.VerticalPosition.Below:
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Below, curGroups);
                                        break;
                                    case Pub.VerticalPosition.Both:
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Above, curGroups);
                                        addToStaffTabOrGroup(staffTabOrGroup, VerticalPos.Below, curGroups);
                                        break;
                                    case Pub.VerticalPosition.Auto:
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
        else if (Guard.isArray(staffTabOrGroups)) {
            staffTabOrGroups.forEach(staffTabOrGroup => addToStaffTabOrGroup(staffTabOrGroup, defaultVerticalPos));
        }
        else {
            addToStaffTabOrGroup(staffTabOrGroups, defaultVerticalPos);
        }
    }

    hasNavigation(n: Pub.NavigationAnnotation) {
        return this.navigationSet.has(n);
    }

    hasFermata(anchor: ObjRhythmColumn | ObjBarLineRight) {
        return this.layoutObjects.some(layoutObj => layoutObj.musicObj instanceof ObjFermata && layoutObj.anchor === anchor);
    }

    addAnnotation(staffTabOrGroups: Pub.StaffTabOrGroups | undefined, annotation: Pub.Annotation, annotationText: string, ...args: unknown[]) {
        if (!Guard.isNonEmptyString(annotationText))
            throw new MusicError(MusicErrorType.Score, `Annotation text is empty.`);

        if (Guard.isEnumValue(annotationText, Pub.LabelAnnotation) && !Guard.isNonEmptyString(args[0]))
            throw new MusicError(MusicErrorType.Score, "Cannot add label because label text is empty.");

        if(annotationText === Pub.ArticulationAnnotation.staccato && this.lastAddedRhythmColumn) {
            this.lastAddedRhythmColumn.staccato = true;
            return;
        }

        const anchorX = 0.5;
        const anchorY = getExtensionAnchorY("bottom");

        let createLayoutObject: ((line: ObjNotationLine, vpos: VerticalPos) => LayoutableMusicObject) | undefined;

        const getColor = (line: ObjNotationLine) => getAnnotationColor(line, annotation, annotationText);

        const colAnchor = this.lastAddedRhythmColumn;

        switch (annotationText) {
            case Pub.NavigationAnnotation.Ending:
                if (this.navigationSet.has(annotationText))
                    throw new MusicError(MusicErrorType.Score, "Cannot add ending becaure measure already has one.");
                createLayoutObject = (line) => {
                    const anchor = this;
                    const passages = args.map(arg => Number(arg));
                    const color = getColor(line);
                    return new ObjEnding(anchor, color, passages);
                }
                break;
            case Pub.NavigationAnnotation.DC_al_Coda:
            case Pub.NavigationAnnotation.DC_al_Fine:
            case Pub.NavigationAnnotation.DS_al_Coda:
            case Pub.NavigationAnnotation.DS_al_Fine:
                createLayoutObject = (line) => {
                    const anchor = this.barLineRight;
                    const text = getNavigationString(annotationText);
                    const color = getColor(line);
                    return new ObjText(anchor, { text, color }, 1, 1);
                }
                this.addAnnotation(staffTabOrGroups, Pub.Annotation.Navigation, Pub.NavigationAnnotation.EndRepeat);
                this.endSong();
                break;
            case Pub.NavigationAnnotation.Fine:
                createLayoutObject = (line) => {
                    const anchor = this.barLineRight;
                    const text = getNavigationString(annotationText);
                    const color = getColor(line);
                    return new ObjText(anchor, { text, color }, 1, 1);
                }
                break;
            case Pub.NavigationAnnotation.Segno:
            case Pub.NavigationAnnotation.Coda:
                createLayoutObject = (line) => {
                    const anchor = this.barLineLeft;
                    const text = getNavigationString(annotationText);
                    const color = getColor(line);
                    return new ObjSpecialText(anchor, text, color);
                }
                break;
            case Pub.NavigationAnnotation.toCoda:
                createLayoutObject = (line) => {
                    const anchor = this.barLineRight;
                    const text = getNavigationString(annotationText);
                    const color = getColor(line);
                    return new ObjSpecialText(anchor, text, color);
                }
                break;
            case Pub.NavigationAnnotation.EndRepeat:
                if (args.length === 0) {
                    this.endRepeatPlayCount = 2;
                }
                else if (Guard.isIntegerGte(args[0], 2)) {
                    this.endRepeatPlayCount = args[0];
                }
                else {
                    throw new MusicError(MusicErrorType.Score, "Invalid repeat play count: " + args[0]);
                }
                if (this.endRepeatPlayCount !== 2) {
                    const text = `${this.endRepeatPlayCount}x`;
                    const color = Pub.colorKey("staff.frame");
                    this.endRepeatPlayCountText = new ObjText(this, { text, color, scale: 0.8 }, 0.5, 1);
                }
                break;
            case Pub.NavigationAnnotation.StartRepeat:
                break;
            case Pub.TemporalAnnotation.fermata:
                if (colAnchor) {
                    createLayoutObject = (line, vpos) => new ObjFermata(colAnchor, vpos, getColor(line));
                }
                break;
            case Pub.TemporalAnnotation.measureEndFermata:
                createLayoutObject = (line, vpos) => {
                    const anchor = this.barLineRight;
                    return new ObjFermata(anchor, vpos, getColor(line));
                }
                break;
            case Pub.LabelAnnotation.ChordLabel: {
                if (colAnchor) {
                    createLayoutObject = (line, vpos) => {
                        const color = getColor(line);
                        const text = String(args[0]);
                        return new ObjText(colAnchor, { text, color }, anchorX, anchorY);
                    }
                }
                break;
            }
            case Pub.LabelAnnotation.PitchLabel: {
                if (colAnchor) {
                    createLayoutObject = (line, vpos) => {
                        const color = getColor(line);
                        const text = String(args[0]);
                        return new ObjText(colAnchor, { text, color }, anchorX, anchorY);
                    }
                }
                break;
            }
            default: {
                if (colAnchor) {
                    createLayoutObject = (line, vpos) => {
                        const color = getColor(line);
                        const text = getAnnotationTextReplacement(annotationText);
                        return new ObjText(colAnchor, { text, color, italic: true }, anchorX, anchorY);
                    }
                }
            }
        }

        this.disableExtensionLine();

        if (createLayoutObject) {
            const layoutGroupId = getAnnotationLayoutGroupId(annotation, annotationText);
            const defaultVerticalPos = getAnnotationDefaultVerticalPos(annotation, annotationText);

            this.forEachStaffGroup(staffTabOrGroups, defaultVerticalPos, (line: ObjNotationLine, vpos: VerticalPos) => {
                const layoutObj = this.addLayoutObject(createLayoutObject(line, vpos), line, layoutGroupId, vpos);
                this.enableExtensionLine(layoutObj, getColor(line));
            });
        }

        if (Guard.isEnumValue(annotationText, Pub.NavigationAnnotation))
            this.navigationSet.add(annotationText);
    }

    addConnective(connective: Pub.Connective.Tie, tieSpan?: number | Pub.TieType, notAnchor?: Pub.NoteAnchor): void;
    addConnective(connective: Pub.Connective.Slur, slurSpan?: number, notAnchor?: Pub.NoteAnchor): void;
    addConnective(connective: Pub.Connective.Slide, notAnchor?: Pub.NoteAnchor): void;
    addConnective(connective: Pub.Connective, ...args: unknown[]): void {
        let anchor = this.lastAddedRhythmSymbol;

        if (!(anchor instanceof ObjNoteGroup)) {
            throw new MusicError(MusicErrorType.Score, "Connective can be added to note group only.");
        }

        if (connective === Pub.Connective.Tie) {
            let tieSpan = Guard.isInteger(args[0]) || Guard.isEnumValue(args[0], Pub.TieType) ? args[0] : 2;
            let noteAnchor = Guard.isEnumValue(args[1], Pub.NoteAnchor) ? args[1] : Pub.NoteAnchor.Auto;
            anchor.startConnective(new ConnectiveProps(Pub.Connective.Tie, tieSpan, noteAnchor, anchor));
        }
        else if (connective === Pub.Connective.Slur) {
            let slurSpan = Guard.isInteger(args[0]) ? args[0] : 2;
            let noteAnchor = Guard.isEnumValue(args[1], Pub.NoteAnchor) ? args[1] : Pub.NoteAnchor.Auto;
            anchor.startConnective(new ConnectiveProps(Pub.Connective.Slur, slurSpan, noteAnchor, anchor));
        }
        else if (connective === Pub.Connective.Slide) {
            let noteAnchor = Guard.isEnumValue(args[0], Pub.NoteAnchor) ? args[0] : Pub.NoteAnchor.Auto;
            anchor.startConnective(new ConnectiveProps(Pub.Connective.Slide, 2, noteAnchor, anchor));
        }
    }

    addExtension(extensionLength: number | Theory.NoteLengthStr | (Theory.NoteLengthStr | number)[], extensionVisible: boolean) {
        this.addExtensionTo.forEach(data => {
            const { layoutObj, color } = data;
            const { musicObj } = layoutObj;

            musicObj.userData["extension-color"] = color;

            const anchor = musicObj.getParent();

            if (musicObj instanceof ObjText && anchor instanceof ObjRhythmColumn) {
                let lineStyle: ExtensionLineStyle = "dashed";
                let linePos: ExtensionLinePos = "bottom";

                let extension = new Extension(layoutObj, anchor, getExtensionTicks(extensionLength), extensionVisible, lineStyle, linePos);
                musicObj.setLink(extension);
            }
            else {
                throw new MusicError(MusicErrorType.Score, "Cannot add extension becaue no compatible music object to attach it to.");
            }
        });

        if (this.addExtensionTo.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Cannot add extension because music object to attach it to is undefined.");
        }

        this.disableExtensionLine();
        this.requestLayout();
    }

    private enableExtensionLine(layoutObj: LayoutObjectWrapper, color: string) {
        this.addExtensionTo.push({ layoutObj, color });
    }

    private disableExtensionLine() {
        this.addExtensionTo = [];
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
        this.disableExtensionLine();
    }

    hasEndSong() {
        return this.isEndSong;
    }

    endSection() {
        this.isEndSection = true;
        this.requestLayout();
        this.disableExtensionLine();
    }

    hasEndSection() {
        return this.isEndSection;
    }

    endRow() {
        this.doc.requestNewRow();
        this.disableExtensionLine();
    }

    private addRhythmSymbol(symbol: RhythmSymbol) {
        let { col, voiceId } = symbol;

        col.setVoiceSymbol(voiceId, symbol);

        this.voiceSymbols.add(voiceId, symbol);

        if (symbol.oldStyleTriplet) {
            this.createOldStyleTriplets(voiceId);
        }

        this.requestBeamsUpdate();

        this.lastAddedRhythmColumn = col;
        this.lastAddedRhythmSymbol = symbol;
    }

    addNoteGroup(voiceId: Pub.VoiceId, notes: (Theory.Note | string)[], noteLength: Theory.NoteLength | Theory.NoteLengthStr, options?: Pub.NoteOptions, tupletRatio?: Theory.TupletRatio): ObjNoteGroup {
        let realNotes = notes.map(note => typeof note === "string" ? Theory.Note.getNote(note) : note);
        let col = this.getRhythmColumn(voiceId);
        let noteGroup = new ObjNoteGroup(col, voiceId, realNotes, noteLength, options, tupletRatio);
        this.addRhythmSymbol(noteGroup);
        return noteGroup;
    }

    addRest(voiceId: Pub.VoiceId, restLength: Theory.NoteLength | Theory.NoteLengthStr, options?: Pub.RestOptions, tupletRatio?: Theory.TupletRatio): ObjRest {
        let col = this.getRhythmColumn(voiceId);
        let rest = new ObjRest(col, voiceId, restLength, options, tupletRatio);
        this.addRhythmSymbol(rest);
        return rest;
    }

    addLyrics(staffTabOrGroups: Pub.StaffTabOrGroups | undefined, verse: Pub.VerseNumber, lyricsText: string, lyricsLength: Theory.NoteLength | Theory.NoteLengthStr, lyricsOptions: Pub.LyricsOptions) {
        this.forEachStaffGroup(staffTabOrGroups, VerticalPos.Below, (line: ObjNotationLine, vpos: VerticalPos) => {
            let col = this.getRhythmColumn({ verse, line, vpos });

            let lyricsObj = new ObjLyrics(col, verse, line, vpos, Theory.validateNoteLength(lyricsLength), lyricsText, lyricsOptions);

            col.addLyricsObject(lyricsObj);

            let lyricsArr = this.lyricsObjectsCache.getOrCreate(line, vpos, verse, []);

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
    private getRhythmColumn(arg: Pub.VoiceId | { verse: Pub.VerseNumber, line: ObjNotationLine, vpos: VerticalPos }): ObjRhythmColumn {
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

    getConsumedTicks(voiceId?: Pub.VoiceId) {
        let measureTicks = 0;

        this.columns.forEach(col => {
            Pub.getVoiceIds().forEach(curVoiceId => {
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
        return new AnchoredRect(
            this.barLineLeft.getRect().anchorX,
            this.barLineRight.getRect().anchorX,
            this.getRect().top,
            this.getRect().bottom);
    }

    getLeftSolidWidth() {
        return this.regions.leftSolid;
    }

    getMinColumnsWidth() {
        return this.regions.columnsMin;
    }

    getRightSolidWidth() {
        return this.regions.rightSolid;
    }

    getTotalSolidWidth() {
        return this.getLeftSolidWidth() + this.getRightSolidWidth();
    }

    getMinWidth() {
        return this.getLeftSolidWidth() + this.getMinColumnsWidth() + this.getRightSolidWidth();
    }

    getStaffLineLeft() {
        let prev = this.getPrevMeasure();

        if (prev && prev.row === this.row && !prev.hasPostMeasureBreak()) {
            return prev.getStaffLineRight();
        }
        else {
            return this.getRect().left + this.regions.tabTuning_0;
        }
    }

    getStaffLineRight() {
        return this.barLineRight.getRect().anchorX;
    }

    getPrevLyricsObject(lyricsObj: ObjLyrics): ObjLyrics | undefined {
        let { line, verse, vpos } = lyricsObj;

        let lyricsArr = this.lyricsObjectsCache.getOrDefault(line, vpos, verse, []);

        let i = lyricsArr.indexOf(lyricsObj);

        if (i > 0) {
            return lyricsArr[i - 1];
        }
        else if (i === 0) {
            let lyricsArr = lyricsObj.measure.getPrevMeasure()?.lyricsObjectsCache.get(line, vpos, verse);
            if (lyricsArr && lyricsArr.length > 0) {
                return lyricsArr[lyricsArr.length - 1];
            }
        }

        return undefined;
    }

    getStaticObjects(line: ObjNotationLine): ReadonlyArray<MusicObject> {
        let layoutObjects = this.layoutObjects
            .filter(layoutObj => layoutObj.line === line && layoutObj.isPositionResolved())
            .map(layoutObj => layoutObj.musicObj);

        let staticObjects = layoutObjects.length > 0
            ? [...this.staticObjectsCache.getOrDefault(line, []), ...layoutObjects]
            : this.staticObjectsCache.getOrDefault(line, []);

        // Update rects.
        staticObjects.forEach(obj => obj.getRect());

        return staticObjects;
    }

    addStaticObject(line: ObjNotationLine, staticObj: MusicObject) {
        this.staticObjectsCache.getOrCreate(line, []).push(staticObj);
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

                if (extension.getHead() !== musicObj)
                    return;

                // Remove old extnsion lines
                extension.getTails().forEach(musicObj2 => measure.removeLayoutObjects(musicObj2));

                if (!extension.isVisible())
                    return;

                // Create new extension lines
                const range = extension.getRange();
                const rcols = range.columnRange.slice();

                for (let isFirst = true; rcols.length > 1; isFirst = false) {
                    const { measure } = rcols[0];
                    const i = rcols.findIndex(col => col.measure !== measure);
                    const mcols = rcols.splice(0, i > 0 ? i : rcols.length);
                    if (mcols.length < 2) continue;

                    const lineMatch = measure.row.findMatchingLine(line);
                    if (!lineMatch) continue;

                    const isLast = rcols.length === 0;

                    const extCols = [
                        ...(isFirst ? [musicObj] : []),
                        ...mcols,
                        ...(isLast && range.stopObject ? [range.stopObject] : [])
                    ];

                    measure.addLayoutObject(
                        new ObjExtensionLine(measure, lineMatch, extension, extCols),
                        lineMatch, layoutGroupId, verticalPos);
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
    private createOldStyleTriplets(voiceId: Pub.VoiceId) {
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
        Pub.getVoiceIds().forEach(voiceId => {
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
                        let beamGroupTicks = beamGroupSize3 * Theory.NoteLengthProps.get("8n").ticks;
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

    getVoiceSymbols(voiceId: Pub.VoiceId): ReadonlyArray<RhythmSymbol> {
        return this.voiceSymbols.getAll(voiceId);
    }

    fillWithRests(...voiceId: Pub.VoiceId[]) {
        if (voiceId.length === 0) {
            if (this.getConsumedTicks() === 0) {
                // Whole measure is empty, add rest to voice 0.
                this.fillWithRests(0);
            }
            else {
                // Measure is not empty, fill with rests for voices that are not empty.
                this.fillWithRests(...Pub.getVoiceIds().filter(id => this.getConsumedTicks(id) > 0));
            }
            return;
        }
        else if (voiceId.length > 1) {
            // Fill with rests for given voices.
            voiceId.forEach(id => this.fillWithRests(id));
            return;
        }
        else {
            const id = voiceId[0];

            // Comlete rests for given voice.
            Pub.validateVoiceId(id);

            let measureTicks = this.getMeasureTicks();
            let consumedTicks = this.getConsumedTicks(id);
            let remainingTicks = measureTicks - consumedTicks;

            let rests: Theory.RhythmProps[] = [];

            while (remainingTicks > 0) {
                for (let noteSize = Theory.NoteLengthProps.LongestNoteSize; noteSize <= Theory.NoteLengthProps.ShortestNoteSize; noteSize *= 2) {
                    let restLength = Theory.NoteLengthProps.create(noteSize).noteLength;
                    for (let dotCount = Theory.NoteLengthProps.get(restLength).maxDotCount; dotCount >= 0; dotCount--) {
                        let restProps = Theory.RhythmProps.get(restLength, dotCount);
                        while (restProps.ticks <= remainingTicks) {
                            rests.push(restProps);
                            remainingTicks -= restProps.ticks;
                        }
                    }
                }
            }

            rests.reverse().forEach(rest => this.addRest(id, Theory.NoteLengthProps.create(rest.noteLength, rest.dotCount).noteLength));
        }
    }

    requestLayout() {
        if (!this.needLayout) {
            this.needLayout = true;
            this.row.requestLayout();
        }
    }

    layout(view: View) {
        if (!this.needLayout) {
            return;
        }

        this.staticObjectsCache.clear();

        this.requestRectUpdate();

        let { unitSize } = view;

        this.postMeasureBreakWidth = this.hasPostMeasureBreak()
            ? DocumentSettings.PostMeasureBreakWidth * unitSize
            : 0;

        let isFirstMeasureInRow = this.isFirstMeasureInRow();
        let isAfterMeasureBreak = this.getPrevMeasure()?.hasPostMeasureBreak() === true;

        this.regions.tabTuning_0 = isFirstMeasureInRow && this.row.hasTab ? unitSize * 4 : 0;

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

                signature.updateClefImage(view, showClef);
                signature.updateMeasureNumber(showMeasureNumber && lineId === 0);
                signature.updateKeySignature(showKeySignature);
                signature.updateTimeSignature(view, showTimeSignature);
                signature.updateTempo(showTempo && lineId === 0);

                signature.layout(view);

                this.signatures.push(signature);
            }
            else if (line instanceof ObjTab && (showMeasureNumber || showTimeSignature || showTempo)) {
                let oldSignature = this.signatures.filter(s => s instanceof ObjTabSignature).find(s => s.tab === line);

                let signature = oldSignature ?? new ObjTabSignature(this, line);

                signature.tab.addObject(signature);

                signature.updateMeasureNumber(showMeasureNumber && lineId === 0);
                signature.updateTimeSignature(view, showTimeSignature);
                signature.updateTempo(showTempo && lineId === 0);

                signature.layout(view);

                this.signatures.push(signature);
            }
        });

        // Update tuplet rest staffPos
        Pub.getVoiceIds().forEach(voiceId => {
            const staff = this.row.getStaves()[0];

            if (!staff || !staff.containsVoiceId(voiceId))
                return;

            this.beamGroups.forEach(b => {
                const symbols = b.getSymbols();

                symbols.forEach((sym, restId) => {
                    if (!(sym instanceof ObjRest && sym.setDiatonicId === ObjRest.UndefinedDiatonicId))
                        return;

                    let leftNoteId = restId;
                    let rightNoteId = restId;

                    while (symbols[leftNoteId] instanceof ObjRest) leftNoteId--;
                    while (symbols[rightNoteId] instanceof ObjRest) rightNoteId++;

                    let newRestDiatonicId: number | undefined;

                    if (leftNoteId < 0 && rightNoteId <= symbols.length - 1) {
                        newRestDiatonicId = symbols[rightNoteId].getDiatonicId(staff);
                    }
                    else if (leftNoteId >= 0 && rightNoteId > symbols.length - 1) {
                        newRestDiatonicId = symbols[leftNoteId].getDiatonicId(staff);
                    }
                    else if (leftNoteId >= 0 && rightNoteId <= symbols.length - 1) {
                        newRestDiatonicId = Math.round(
                            (symbols[leftNoteId].getDiatonicId(staff) + symbols[rightNoteId].getDiatonicId(staff)) / 2
                        );
                    }

                    if (newRestDiatonicId !== undefined)
                        sym.updateRunningArguments(newRestDiatonicId, b.stemDir, []);
                });
            });
        });

        // Layout tab tuning notes
        this.tabStringNotes.length = 0;
        if (this.isFirstMeasureInRow()) {
            this.row.getTabs().forEach(tab => {
                for (let stringId = 0; stringId < 6; stringId++) {
                    let note = tab.getTuningStrings()[stringId].format(Theory.PitchNotation.Helmholtz, Theory.SymbolSet.Unicode);
                    let obj = new ObjText(this, { text: note, scale: 0.8, color: Pub.colorKey("tab.tuning") }, 1, 0.5);

                    obj.layout(view);
                    obj.setRight(this.regions.tabTuning_0 * 0.8);
                    obj.setCenterY(tab.getStringY(stringId));

                    this.tabStringNotes.push(obj);
                    tab.addObject(obj);
                }
            });
        }

        // Layout measure start object
        this.barLineLeft.layout(view);

        // Layout columns
        const accState = new AccidentalState(this);
        this.columns.forEach(col => col.layout(view, accState));

        // Some layout objects need to reserve space so they do not overlap with neighbors.
        this.columns.forEach(col => col.layoutReserveSpace(view));

        // Layout measure end object
        this.barLineRight.layout(view);

        if (this.endRepeatPlayCountText)
            this.endRepeatPlayCountText.layout(view);

        this.layoutObjects.forEach(obj => obj.layout(view));

        let padding = view.unitSize;

        // Calculated region widths
        // this.regions.tabTuning_0 was already set above
        this.regions.signature_1 = Math.max(0, ...this.signatures.map(signature => signature.getRect().width));
        this.regions.leftBarLine_2 = this.barLineLeft.getRect().width;
        this.regions.padding_3 = padding;

        this.regions.columnsMin_4 = Math.max(
            DocumentSettings.MinColumnsWidth * unitSize,
            this.columns.map(col => col.getRect().width).reduce((acc, cur) => (acc + cur), 0)
        );

        this.regions.padding_5 = padding;
        this.regions.rightBarLine_6 = this.barLineRight.getRect().width;
    }

    layoutWidth(view: View, width: number) {
        if (!this.needLayout) {
            return;
        }

        width = Math.max(width, this.getMinWidth());

        this.rect = new AnchoredRect();
        this.rect.anchorX = this.rect.left + width / 2;
        this.rect.right = this.rect.left + width;

        this.signatures.forEach(signature => {
            signature.setLeft(this.rect.left + this.regions.tabTuning_0);
            signature.setAnchorY(this.rect.anchorY);
        });

        let signaturesWidth = Math.max(0, ...this.signatures.map(signature => signature.getRect().width));

        this.barLineLeft.setLeft(this.rect.left + this.regions.tabTuning_0 + signaturesWidth);
        this.barLineLeft.setAnchorY(this.rect.anchorY);

        this.barLineRight.setRight(this.rect.right);
        this.barLineRight.setAnchorY(this.rect.anchorY);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.setCenterX(this.barLineRight.getRect().left);
            this.endRepeatPlayCountText.setBottom(this.barLineRight.getRect().top);
        }

        let columnsLeft = this.rect.left + this.regions.leftSolid;
        let columnsRight = this.rect.right - this.regions.rightSolid;
        let columnsWidth = columnsRight - columnsLeft;
        let columnsMinWidth = this.regions.columnsMin;

        let columnScale = columnsWidth / columnsMinWidth;
        let curColumnLeft = columnsLeft;

        this.columns.forEach(col => {
            let rect = col.getRect();
            let columnAnchorX = curColumnLeft + rect.leftw * columnScale;
            col.setAnchor(columnAnchorX, this.rect.anchorY);
            curColumnLeft += rect.width * columnScale;
        });

        // Reposition lonely rest in the middle of measure.
        Pub.getVoiceIds().forEach(voiceId => {
            const symbols = this.getVoiceSymbols(voiceId);

            const onlyRest = symbols.length === 1 && symbols[0] instanceof ObjRest ? symbols[0] : undefined;
            if (!onlyRest) return;

            const isOnlySymbolInCol = Pub.getVoiceIds()
                .map(voiceId => onlyRest.col.getVoiceSymbol(voiceId))
                .filter(sym => sym !== undefined && sym !== onlyRest)
                .length === 0;

            if (isOnlySymbolInCol) return;

            // Now relocate onlyRest middle of measure
            onlyRest.setAnchorX(this.getColumnsContentRect().centerX);
        });
    }

    layoutConnectives(view: View) {
        if (!this.needLayout) {
            return;
        }

        // Layout connectives
        this.connectives.forEach(connective => {
            connective.layout(view);

            this.rect.top = Math.min(this.rect.top, connective.getRect().top);
            this.rect.bottom = Math.max(this.rect.bottom, connective.getRect().bottom);
        });
    }

    layoutBeams(view: View) {
        if (!this.needLayout) {
            return;
        }

        // Layout Beams
        this.beamGroups.forEach(beamGroup => {
            beamGroup.layout(view);

            this.rect.top = Math.min(this.rect.top, beamGroup.getRect().top);
            this.rect.bottom = Math.max(this.rect.bottom, beamGroup.getRect().bottom);
        });
    }

    alignStemsToBeams() {
        this.beamGroups.forEach(b => b.updateNoteStemTips());
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

        if (this.isLastMeasureInRow()) {
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

        if (this.endRepeatPlayCountText)
            this.endRepeatPlayCountText.offset(dx, dy);

        this.connectives.forEach(connective => connective.offset(dx, 0));

        this.beamGroups.forEach(beam => beam.offset(dx, dy));

        this.layoutObjects.forEach(layoutObj => layoutObj.offset(dx, 0));

        this.rect.offsetInPlace(dx, dy);

        this.requestRectUpdate();
    }

    draw(view: View) {
        view.drawDebugRect(this.getRect());
        view.lineWidth(1);

        // Draw staff lines
        let left = this.getStaffLineLeft();
        let right = this.getStaffLineRight();
        const drawLine = (y: number, color: string) => view.color(color).strokeLine(left, y, right, y);

        this.row.getNotationLines().forEach(line => {
            if (line instanceof ObjStaff) {
                for (let p = line.bottomLineDiatonicId; p <= line.topLineDiatonicId; p += 2) {
                    drawLine(line.getDiatonicIdY(p), Pub.colorKey("staff.frame"));
                }
            }
            else if (line instanceof ObjTab) {
                for (let stringId = 0; stringId < 6; stringId++) {
                    drawLine(line.getStringY(stringId), Pub.colorKey("tab.frame"));
                }
            }
        });

        // For tabs draw left vertical line (if more than one lines it is drawn by row)
        if (this.isFirstMeasureInRow() && this.row.getNotationLines().length === 1) {
            this.row.getTabs().forEach(tab => {
                const grp = tab.getRowGroup();

                // Vertical line drawn by row group
                if (grp.hasBrace) return;

                const left = this.getStaffLineLeft();
                const top = tab.getTopLineY();
                const bottom = tab.getBottomLineY();

                view.color(Pub.colorKey("tab.frame"))
                    .lineWidth(1)
                    .strokeLine(left, top, left, bottom);
            });
        }

        this.signatures.forEach(signature => signature.draw(view));

        this.tabStringNotes.forEach(obj => obj.draw(view));

        this.barLineLeft.draw(view);

        this.columns.forEach(col => col.draw(view));

        this.barLineRight.draw(view);

        if (this.endRepeatPlayCountText) {
            this.endRepeatPlayCountText.draw(view);
        }

        this.connectives.forEach(connective => connective.draw(view));

        this.layoutObjects.forEach(layoutObj => layoutObj.musicObj.draw(view));

        this.beamGroups.forEach(beam => beam.draw(view));
    }
}
