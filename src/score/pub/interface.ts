import * as Audio from "@tspro/web-music-score/audio";
import { Accidental, Note, NoteLength, KeySignature, TimeSignature, TimeSignatureString } from "@tspro/web-music-score/theory";
import { RhythmProps, Scale, ScaleType, SymbolSet } from "@tspro/web-music-score/theory";
import { MusicObject } from "../engine/music-object";
import { ObjAccidental } from "../engine/obj-accidental";
import { ObjArc } from "../engine/obj-arc";
import { ObjArpeggio } from "../engine/obj-arpeggio";
import { ObjDocument } from "../engine/obj-document";
import { ObjEnding } from "../engine/obj-ending";
import { ObjFermata } from "../engine/obj-fermata";
import { ObjHeader } from "../engine/obj-header";
import { ObjImage } from "../engine/obj-image";
import { ObjMeasure } from "../engine/obj-measure";
import { ObjBarLineRight, ObjBarLineLeft } from "../engine/obj-bar-line";
import { ObjNoteGroup } from "../engine/obj-note-group";
import { ObjRest } from "../engine/obj-rest";
import { ObjRhythmColumn } from "../engine/obj-rhythm-column";
import { ObjScoreRow } from "../engine/obj-score-row";
import { ObjSignature } from "../engine/obj-signature";
import { ObjText } from "../engine/obj-text";
import { Utils } from "@tspro/ts-utils-lib";
import { DivRect } from "./div-rect";
import { Player } from "../engine/player";
import { Renderer } from "../engine/renderer";
import { ObjBeamGroup } from "../engine/obj-beam-group";
import { ObjSpecialText } from "../engine/obj-special-text";
import { ObjExtensionLine } from "../engine/obj-extension-line";
import { DocumentOptions, PlayStateChangeListener, Stem, StringNumber, TieType, VoiceId, getStringNumbers, getVoiceIds } from "./types";
import { NoteAnchor, Arpeggio } from "./types";
import { ScoreEventListener } from "./event";
import { NoteOptions, RestOptions, StaffPreset, Fermata, Navigation, Annotation, Label, PlayState } from "./types";
import { isNumber } from "tone";
import { MusicError } from "@tspro/web-music-score/core";

function assertArg(condition: boolean, message: string) {
    if (!condition) {
        throw new MusicError("Invalid Arg: " + message);
    }
}

function require_t<T>(t: T | undefined | null, message?: string): T {
    if (t === undefined || t === null) {
        throw new TypeError(message);
    }
    else {
        return t;
    }
}

function isVoiceId(value: unknown): value is VoiceId {
    return isNumber(value) && (<number[]>getVoiceIds()).indexOf(value) >= 0;
}

function isStringNumber(value: unknown): value is StringNumber {
    return isNumber(value) && (<number[]>getStringNumbers()).indexOf(value) >= 0;
}

function assertNoteOptions(options: NoteOptions) {
    assertArg(Utils.Is.isObject(options), "noteOptions");
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted), "noteOptions.dotted");
    assertArg(Utils.Is.isEnumValueOrUndefined(options.stem, Stem), "noteOptions.stem");
    assertArg(Utils.Is.isStringOrUndefined(options.color), "noteOptions.color");
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted), "noteOptions.dotted");
    assertArg(Utils.Is.isBooleanOrUndefined(options.arpeggio) || Utils.Is.isEnumValue(options.arpeggio, Arpeggio), "noteOptions.arpeggio");
    assertArg(Utils.Is.isBooleanOrUndefined(options.staccato), "noteOptions.staccato");
    assertArg(Utils.Is.isBooleanOrUndefined(options.diamond), "noteOptions.diamond");
    assertArg(Utils.Is.isEnumValueOrUndefined(options.tieSpan, TieType) || Utils.Is.isIntegerGte(options.tieSpan, 1), "noteOptions.tieSpan");
    assertArg(Utils.Is.isEnumValueOrUndefined(options.tieAnchor, NoteAnchor), "noteOptions.tieAnchor");
    assertArg(Utils.Is.isUndefined(options.slurSpan) || Utils.Is.isIntegerGte(options.slurSpan, 1), "noteOptions.slurSpan");
    assertArg(Utils.Is.isEnumValueOrUndefined(options.slurAnchor, NoteAnchor), "noteOptions.slurAnchor");
    assertArg(Utils.Is.isBooleanOrUndefined(options.triplet), "noteOptions.triplet");
    assertArg((
        Utils.Is.isUndefined(options.string) ||
        isStringNumber(options.string) ||
        Utils.Is.isArray(options.string) && options.string.length > 0 && options.string.every(string => isStringNumber(string))
    ), "noteOptions.string");
}

function assertRestOptions(options: RestOptions) {
    assertArg(Utils.Is.isObject(options), "restOptions");
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted), "restOptions.dotted");
    assertArg(Utils.Is.isStringOrUndefined(options.staffPos) || Utils.Is.isInteger(options.staffPos) || options.staffPos instanceof Note, "restOptions.staffPos");
    assertArg(Utils.Is.isStringOrUndefined(options.color), "restOptions.color");
    assertArg(Utils.Is.isBooleanOrUndefined(options.hide), "restOptions.hide");
    assertArg(Utils.Is.isBooleanOrUndefined(options.triplet), "restOptions.triplet");
}

/** @public */
export abstract class MusicInterface {
    constructor(readonly name: string) { }

    /** @internal */
    abstract getMusicObject(): MusicObject;

    getParent(): MusicInterface | undefined {
        return this.getMusicObject().getParent()?.getMusicInterface();
    }
}

/** @public */
export class MAccidental extends MusicInterface {
    static readonly Name = "Accidental";

    /** @internal */
    constructor(private readonly obj: ObjAccidental) {
        super(MAccidental.Name);
    }

    /** @internal */
    getMusicObject(): ObjAccidental {
        return this.obj;
    }

    getAccidental(): Accidental {
        return this.obj.accidental;
    }
}

/** @public */
export class MArc extends MusicInterface {
    static readonly Name = "Arc";

    /** @internal */
    constructor(private readonly obj: ObjArc) {
        super(MArc.Name);
    }

    /** @internal */
    getMusicObject(): ObjArc {
        return this.obj;
    }
}

/** @public */
export class MArpeggio extends MusicInterface {
    static readonly Name = "Arpeggio";

    /** @internal */
    constructor(private readonly obj: ObjArpeggio) {
        super(MArpeggio.Name);
    }

    /** @internal */
    getMusicObject(): ObjArpeggio {
        return this.obj;
    }
}

/** @public */
export class MBeamGroup extends MusicInterface {
    static readonly Name = "BeamGroup";

    /** @internal */
    constructor(private readonly obj: ObjBeamGroup) {
        super(MBeamGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjBeamGroup {
        return this.obj;
    }
}

/** @public */
export class MDocument extends MusicInterface {
    static readonly Name = "Document";

    /** @internal */
    readonly obj: ObjDocument;

    constructor(staffPreset: StaffPreset, options?: DocumentOptions) {
        super(MDocument.Name);

        assertArg(Utils.Is.isEnumValue(staffPreset, StaffPreset), "staffPreset");
        if (options !== undefined) {
            assertArg(Utils.Is.isObject(options), "documentOptions");
            assertArg(Utils.Is.isUndefined(options.measuresPerRow) || Utils.Is.isIntegerGte(options.measuresPerRow, 1), "documentOptions.measuresPerRow");
            assertArg(Utils.Is.isStringOrUndefined(options.tuning), "documentOptions.tuning");
            assertArg(Utils.Is.isBooleanOrUndefined(options.fullDiatonicRange), "documentOptions.fullDiatonicRange");
        }

        this.obj = new ObjDocument(this, staffPreset, options);
    }

    /** @internal */
    getMusicObject(): ObjDocument {
        return this.obj;
    }

    setHeader(title?: string, composer?: string, arranger?: string): void {
        assertArg(Utils.Is.isStringOrUndefined(title), "title");
        assertArg(Utils.Is.isStringOrUndefined(composer), "composer");
        assertArg(Utils.Is.isStringOrUndefined(arranger), "arranger");
        this.obj.setHeader(title, composer, arranger);
    }

    getTitle(): string | undefined {
        return this.obj.getTitle();
    }

    addMeasure(): MMeasure {
        return this.obj.addMeasure().mi;
    }

    play(fn?: PlayStateChangeListener): MPlayer {
        assertArg(Utils.Is.isFunctionOrUndefined(fn), "playStateChangeListener");
        return new MPlayer(this, fn).play();
    }

    static createSimpleScaleArpeggio(staffPreset: StaffPreset, scale: Scale, bottomNote: string, numOctaves: number): MDocument {
        assertArg(Utils.Is.isEnumValue(staffPreset, StaffPreset), "staffPreset");
        assertArg(scale instanceof Scale, "scale");
        assertArg(Utils.Is.isString(bottomNote), "bottomNote");
        assertArg(Utils.Is.isIntegerGte(numOctaves, 1), "numOctaves");

        let doc = new MDocument(staffPreset);

        let m = doc.addMeasure().setKeySignature(scale);

        scale.getScaleNotes(bottomNote, numOctaves).forEach(note => {
            let noteName = note.formatOmitOctave(SymbolSet.Unicode);
            m.addNote(0, note, NoteLength.Quarter);
            m.addLabel(Label.Note, noteName);
        });

        return doc;
    }
}

/** @public */
export class MEnding extends MusicInterface {
    static readonly Name = "Ending";

    /** @internal */
    constructor(private readonly obj: ObjEnding) {
        super(MEnding.Name);
    }

    /** @internal */
    getMusicObject(): ObjEnding {
        return this.obj;
    }

    getPassages(): ReadonlyArray<number> {
        return this.obj.passages;
    }

    hasPassage(passage: number): boolean {
        assertArg(Utils.Is.isIntegerGte(passage, 1), "passage");
        return this.obj.hasPassage(passage);
    }
}

/** @public */
export class MFermata extends MusicInterface {
    static readonly Name = "Fermata";

    /** @internal */
    constructor(private readonly obj: ObjFermata) {
        super(MFermata.Name);
    }

    /** @internal */
    getMusicObject(): ObjFermata {
        return this.obj;
    }
}

/** @public */
export class MHeader extends MusicInterface {
    static readonly Name = "Header";

    /** @internal */
    constructor(private readonly obj: ObjHeader) {
        super(MHeader.Name);
    }

    /** @internal */
    getMusicObject(): ObjHeader {
        return this.obj;
    }

    getTitle(): string | undefined {
        return this.obj.title;
    }

    getComposer(): string | undefined {
        return this.obj.composer;
    }

    getArranger(): string | undefined {
        return this.obj.arranger;
    }
}

/** @public */
export class MImage extends MusicInterface {
    static readonly Name = "Image";

    /** @internal */
    constructor(private readonly obj: ObjImage) {
        super(MImage.Name);
    }

    /** @internal */
    getMusicObject(): ObjImage {
        return this.obj;
    }
}

/** @public */
export class MMeasure extends MusicInterface {
    static readonly Name = "Measure";

    /** @internal */
    constructor(private readonly obj: ObjMeasure) {
        super(MMeasure.Name);
    }

    /** @internal */
    getMusicObject(): ObjMeasure {
        return this.obj;
    }

    getMeasureNumber(): number {
        return this.obj.getMeasureNumber();
    }

    getRhythmColumns(): ReadonlyArray<MRhythmColumn> {
        return this.obj.getColumns().map(col => col.getMusicInterface());
    }

    setKeySignature(tonic: string, scaleType: ScaleType): MMeasure;
    setKeySignature(keySignature: KeySignature): MMeasure;
    setKeySignature(scale: Scale): MMeasure;
    setKeySignature(...args: unknown[]): MMeasure {
        assertArg((
            args[0] instanceof Scale ||
            args[0] instanceof KeySignature ||
            Utils.Is.isString(args[0]) && Utils.Is.isEnumValue(args[1], ScaleType)
        ), "keySignature");
        this.obj.setKeySignature(...args);
        return this;
    }

    setTimeSignature(timeSignature: TimeSignature | TimeSignatureString): MMeasure {
        assertArg(timeSignature instanceof TimeSignature || Utils.Is.isString(timeSignature), "timeSignature");
        this.obj.setTimeSignature(timeSignature);
        return this;
    }

    setTempo(beatsPerMinute: number, beatLength?: NoteLength, dotted?: boolean): MMeasure {
        assertArg(Utils.Is.isIntegerGte(beatsPerMinute, 1), "beatsPerMinute");
        if (beatLength === undefined) {
            assertArg(Utils.Is.isUndefined(dotted), "dotted");
        }
        else {
            assertArg(Utils.Is.isEnumValue(beatLength, NoteLength), "beatLength");
            assertArg(Utils.Is.isBooleanOrUndefined(dotted), "dotted");
        }
        this.obj.setTempo(beatsPerMinute, beatLength, dotted);
        return this;
    }

    addNote(voiceId: number, note: Note | string, noteLength: NoteLength, options?: NoteOptions): MMeasure {
        assertArg(isVoiceId(voiceId), "voiceId");
        assertArg(note instanceof Note || Utils.Is.isString(note), "note");
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength), "noteLength");
        if (options !== undefined) {
            assertNoteOptions(options);
        }
        this.obj.addNoteGroup(voiceId, [note], noteLength, options);
        return this;
    }

    addChord(voiceId: number, notes: (Note | string)[], noteLength: NoteLength, options?: NoteOptions): MMeasure {
        assertArg(isVoiceId(voiceId), "voiceId");
        assertArg(Utils.Is.isArray(notes) && notes.length >= 1 && notes.every(note => note instanceof Note || Utils.Is.isString(note)), "notes");
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength), "noteLength");
        if (options !== undefined) {
            assertNoteOptions(options);
        }
        this.obj.addNoteGroup(voiceId, notes, noteLength, options);
        return this;
    }

    addRest(voiceId: number, restLength: NoteLength, options?: RestOptions): MMeasure {
        assertArg(isVoiceId(voiceId), "voiceId");
        assertArg(Utils.Is.isEnumValue(restLength, NoteLength), "restLength");
        if (options !== undefined) {
            assertRestOptions(options);
        }
        this.obj.addRest(voiceId, restLength, options);
        return this;
    }

    addFermata(fermata?: Fermata): MMeasure {
        assertArg(Utils.Is.isEnumValueOrUndefined(fermata, Fermata), "fermata");
        this.obj.addFermata(fermata ?? Fermata.AtNote);
        return this;
    }

    addNavigation(navigation: Navigation): MMeasure;
    addNavigation(navigation: Navigation.EndRepeat, repeatCount: number): MMeasure;
    addNavigation(navigation: Navigation.Ending, ...passages: number[]): MMeasure;
    addNavigation(navigation: Navigation, ...args: unknown[]): MMeasure {
        assertArg(Utils.Is.isEnumValue(navigation, Navigation), "navigation");
        if (navigation === Navigation.EndRepeat && args.length > 0) {
            assertArg(Utils.Is.isIntegerGte(args[0], 1), "repeatCount");
        }
        else if (navigation === Navigation.Ending && args.length > 0) {
            assertArg(args.every(passage => Utils.Is.isIntegerGte(passage, 1)), "passages");
        }
        this.obj.addNavigation(navigation, ...args);
        return this;
    }

    addLabel(label: Label, text: string): MMeasure {
        assertArg(Utils.Is.isEnumValue(label, Label), "label");
        assertArg(Utils.Is.isString(text), "text");
        this.obj.addLabel(label, text);
        return this;
    }

    addAnnotation(annotation: Annotation, text: string): MMeasure {
        assertArg(Utils.Is.isEnumValue(annotation, Annotation), "annotation");
        assertArg(Utils.Is.isString(text), "text");
        this.obj.addAnnotation(annotation, text);
        return this;
    }

    addExtension(extensionLength: NoteLength | number, extensionVisible?: boolean): MMeasure {
        assertArg((
            Utils.Is.isIntegerGte(extensionLength, 0) ||
            extensionLength === Infinity ||
            Utils.Is.isEnumValue(extensionLength, NoteLength)
        ), "extendionLength");
        assertArg(Utils.Is.isBooleanOrUndefined(extensionVisible), "extensionVisible");
        this.obj.addExtension(extensionLength, extensionVisible ?? true);
        return this;
    }

    endSong(): MMeasure {
        this.obj.endSong();
        return this;
    }

    endSection(): MMeasure {
        this.obj.endSection();
        return this;
    }

    endRow(): MMeasure {
        this.obj.endRow();
        return this;
    }

    completeRests(voiceId?: number): MMeasure {
        assertArg(Utils.Is.isUndefined(voiceId) || isVoiceId(voiceId), "voiceId");
        this.obj.completeRests(voiceId);
        return this;
    }
}

/** @public */
export class MBarLineRight extends MusicInterface {
    static readonly Name = "BarLineRight";

    /** @internal */
    constructor(private readonly obj: ObjBarLineRight) {
        super(MBarLineRight.Name);
    }

    /** @internal */
    getMusicObject(): ObjBarLineRight {
        return this.obj;
    }
}

/** @public */
export class MBarLineLeft extends MusicInterface {
    static readonly Name = "BarLineLeft";

    /** @internal */
    constructor(private readonly obj: ObjBarLineLeft) {
        super(MBarLineLeft.Name);
    }

    /** @internal */
    getMusicObject(): ObjBarLineLeft {
        return this.obj;
    }
}

/** @public */
export class MNoteGroup extends MusicInterface {
    static readonly Name = "NoteGroup";

    /** @internal */
    constructor(private readonly obj: ObjNoteGroup) {
        super(MNoteGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjNoteGroup {
        return this.obj;
    }

    getNotes(): ReadonlyArray<Note> {
        return this.obj.notes;
    }

    getRhythmProps(): RhythmProps {
        return this.obj.rhythmProps;
    }
}

/** @public */
export class MRest extends MusicInterface {
    static readonly Name = "Rest";

    /** @internal */
    constructor(private readonly obj: ObjRest) {
        super(MRest.Name);
    }

    /** @internal */
    getMusicObject(): ObjRest {
        return this.obj;
    }

    getRhythmProps(): RhythmProps {
        return this.obj.rhythmProps;
    }
}

/** @public */
export class MRhythmColumn extends MusicInterface {
    static readonly Name = "RhythmColumn";

    /** @internal */
    constructor(private readonly obj: ObjRhythmColumn) {
        super(MRhythmColumn.Name);
    }

    /** @internal */
    getMusicObject(): ObjRhythmColumn {
        return this.obj;
    }

    getRhythmSymbol(voiceId: number): MNoteGroup | MRest | undefined {
        assertArg(isVoiceId(voiceId), "voiceId");

        return this.obj.getVoiceSymbol(voiceId)?.getMusicInterface();
    }
}

/** @public */
export class MScoreRow extends MusicInterface {
    static readonly Name = "ScoreRow";

    /** @internal */
    constructor(private readonly obj: ObjScoreRow) {
        super(MScoreRow.Name);
    }

    /** @internal */
    getMusicObject(): ObjScoreRow {
        return this.obj;
    }

    getMeasures(): ReadonlyArray<MMeasure> {
        return this.obj.getMeasures().map(m => m.getMusicInterface());
    }
}

/** @public */
export class MSignature extends MusicInterface {
    static readonly Name = "Signature";

    /** @internal */
    constructor(private readonly obj: ObjSignature) {
        super(MSignature.Name);
    }

    /** @internal */
    getMusicObject(): ObjSignature {
        return this.obj;
    }
}

/** @public */
export class MSpecialText extends MusicInterface {
    static readonly Name = "SpecialText";

    /** @internal */
    constructor(private readonly obj: ObjSpecialText) {
        super(MSpecialText.Name);
    }

    /** @internal */
    getMusicObject(): ObjSpecialText {
        return this.obj;
    }
}

/** @public */
export class MText extends MusicInterface {
    static readonly Name = "Text";

    /** @internal */
    constructor(private readonly obj: ObjText) {
        super(MText.Name);
    }

    /** @internal */
    getMusicObject(): ObjText {
        return this.obj;
    }

    getText(): string {
        return this.obj.getText();
    }
}

/** @public */
export class MExtensionLine extends MusicInterface {
    static readonly Name = "ExtensionLine";

    /** @internal */
    constructor(private readonly obj: ObjExtensionLine) {
        super(MExtensionLine.Name);
    }

    /** @internal */
    getMusicObject(): ObjExtensionLine {
        return this.obj;
    }
}

/** @public */
export class MPlayer {
    private static currentlyPlaying = new Set<MPlayer>();

    private readonly player: Player;

    constructor(doc: MDocument, fn?: PlayStateChangeListener) {
        assertArg(doc instanceof MDocument, "doc");
        assertArg(Utils.Is.isFunctionOrUndefined(fn), "playStateChangeListener");

        this.player = new Player();

        this.player.setDocument(doc.obj);
        this.player.setCursorPositionChangeListener((cursorRect?: DivRect) =>  doc.obj.updateCursorRect(cursorRect));

        if (fn) {
            this.player.setPlayStateChnageListener(fn);
        }
    }

    static stopAll() {
        this.currentlyPlaying.forEach(p => p.stop());
        Audio.stop();
    }

    play() {
        MPlayer.currentlyPlaying.add(this);

        this.player.play();

        return this;
    }

    pause() {
        this.player.pause();

        return this;
    }

    stop() {
        this.player.stop();

        MPlayer.currentlyPlaying.delete(this);

        return this;
    }
}

/** @public */
export class MRenderer {
    private readonly renderer: Renderer;

    constructor() {
        this.renderer = new Renderer(this);
    }

    setDocument(doc?: MDocument) {
        assertArg(Utils.Is.isUndefined(doc) || doc instanceof MDocument, "doc");

        this.renderer.setDocument(doc);
        return this;
    }

    setCanvas(canvas: HTMLCanvasElement | string) {

        canvas = require_t(Utils.Dom.getCanvas(canvas), typeof canvas === "string"
            ? "Cannot set renderer canvas because invalid canvas id: " + canvas
            : "Cannot set renderer canvas because given canvas is undefined.");
        this.renderer.setCanvas(canvas);
        return this;
    }

    setScoreEventListener(fn: ScoreEventListener) {
        assertArg(Utils.Is.isFunctionOrUndefined(fn), "scoreEventListener");
        this.renderer.setScoreEventListener(fn);
    }

    hilightObject(obj?: MusicInterface) {
        this.renderer.hilightObject(obj?.getMusicObject());
    }

    hilightStaffPos(staffPos?: { scoreRow: MScoreRow, diatonicId: number }) {
        this.renderer.hilightStaffPos(staffPos ? {
            scoreRow: staffPos.scoreRow.getMusicObject(),
            diatonicId: staffPos.diatonicId
        } : undefined);
    }

    draw() {
        try {
            this.renderer.draw();
        }
        catch (e) {
            console.log("Draw failed in music renderer.");
            console.log(e);
        }
    }
}

/** @public */
export class MPlaybackButtons {
    private playButton?: HTMLButtonElement;
    private stopButton?: HTMLButtonElement;
    private playStopButton?: HTMLButtonElement;
    private pauseButton?: HTMLButtonElement;

    private onPlay: () => void;
    private onStop: () => void;
    private onPlayStop: () => void;
    private onPause: () => void;

    private playLabel = "Play";
    private stopLabel = "Stop";
    private pauseLabel = "Pause";

    private playState: PlayState = PlayState.Stopped;

    private player?: MPlayer = undefined;

    constructor() {
        this.onPlay = () => this.player?.play();
        this.onStop = () => this.player?.stop();
        this.onPlayStop = () => { this.playState === PlayState.Playing ? this.player?.stop() : this.player?.play(); }
        this.onPause = () => this.player?.pause();

        this.updateButtons();
    }

    setDocument(doc?: MDocument) {
        assertArg(Utils.Is.isUndefined(doc) || doc instanceof MDocument, "doc");

        this.onStop();

        if (doc) {
            this.player = new MPlayer(doc, (playState: PlayState) => {
                this.playState = playState;
                this.updateButtons();
            });
        }
        else {
            this.player = undefined;
        }

        this.updateButtons();

        return this;
    }

    detachDocument() {
        this.setDocument(undefined);
    }

    private updateButtons() {
        if (this.playButton) {
            this.playButton.disabled = this.player ? (this.playState === PlayState.Playing) : true;
            this.playButton.innerText = this.playLabel;
        }

        if (this.stopButton) {
            this.stopButton.disabled = this.player ? (this.playState === PlayState.Stopped) : true;
            this.stopButton.innerText = this.stopLabel;
        }

        if (this.playStopButton) {
            this.playStopButton.disabled = this.player ? false : true;
            this.playStopButton.innerText = this.playState === PlayState.Playing ? this.stopLabel : this.playLabel;
        }

        if (this.pauseButton) {
            this.pauseButton.disabled = this.player ? (this.playState !== PlayState.Playing) : true;
            this.pauseButton.innerText = this.pauseLabel;
        }
    }

    setPlayButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        assertArg(Utils.Is.isStringOrUndefined(btnLabel), "btnLabel");

        MPlaybackButtons.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = require_t(Utils.Dom.getButton(btn), "Play button required!");
        this.playLabel = btnLabel ?? "Play";

        MPlaybackButtons.removeOnClickListeners(this.playButton, "all");
        MPlaybackButtons.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    setStopButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        assertArg(Utils.Is.isStringOrUndefined(btnLabel), "btnLabel");

        MPlaybackButtons.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = require_t(Utils.Dom.getButton(btn), "Stop button required!");
        this.stopLabel = btnLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.stopButton, "all");
        MPlaybackButtons.addOnClickListener(this.stopButton, this.onStop);

        this.updateButtons();

        return this;
    }

    setPlayStopButton(btn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string) {
        assertArg(Utils.Is.isStringOrUndefined(playLabel), "playLabel");
        assertArg(Utils.Is.isStringOrUndefined(stopLabel), "stopLabel");

        MPlaybackButtons.removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = require_t(Utils.Dom.getButton(btn), "Play/stop button required!");
        this.playLabel = playLabel ?? "Play";
        this.stopLabel = stopLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.playStopButton, "all");
        MPlaybackButtons.addOnClickListener(this.playStopButton, this.onPlayStop);

        this.updateButtons();

        return this;
    }

    setPauseButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        assertArg(Utils.Is.isStringOrUndefined(btnLabel), "btnLabel");

        MPlaybackButtons.removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = require_t(Utils.Dom.getButton(btn), "Pause button required!");
        this.pauseLabel = btnLabel ?? "Pause";

        MPlaybackButtons.removeOnClickListeners(this.pauseButton, "all");
        MPlaybackButtons.addOnClickListener(this.pauseButton, this.onPause);

        this.updateButtons();

        return this;
    }

    private static savedOnClickListeners = new Map<HTMLButtonElement, (() => void)[]>();

    private static removeOnClickListeners(btn: HTMLButtonElement | undefined, onClick: (() => void) | "all") {
        if (btn) {
            let savedListeners = this.savedOnClickListeners.get(btn) || [];
            let remainingListeners: (() => void)[] = [];

            savedListeners.forEach(l => {
                if (onClick === l || onClick === "all") {
                    btn.removeEventListener("click", l);
                }
                else {
                    remainingListeners.push(l);
                }
            });

            this.savedOnClickListeners.set(btn, remainingListeners);
        }
    }

    private static addOnClickListener(btn: HTMLButtonElement, onClick: () => void) {
        assertArg(Utils.Is.isFunction(onClick), "onClick");

        btn.addEventListener("click", onClick);

        let clickListeners = this.savedOnClickListeners.get(btn) || [];

        this.savedOnClickListeners.set(btn, [...clickListeners, onClick]);
    }
}
