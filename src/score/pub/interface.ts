import * as Audio from "@tspro/web-music-score/audio";
import { Accidental, Note, NoteLength, KeySignature, TimeSignature, TimeSignatureString, TuningNameList } from "@tspro/web-music-score/theory";
import { RhythmProps, Scale, ScaleType, SymbolSet } from "@tspro/web-music-score/theory";
import { MusicObject } from "../engine/music-object";
import { ObjAccidental } from "../engine/obj-accidental";
import { ObjConnective } from "../engine/obj-connective";
import { ObjArpeggio } from "../engine/obj-arpeggio";
import { ObjDocument } from "../engine/obj-document";
import { ObjEnding } from "../engine/obj-ending";
import { ObjFermata } from "../engine/obj-fermata";
import { ObjHeader } from "../engine/obj-header";
import { ObjImage } from "../engine/obj-image";
import { ObjMeasure } from "../engine/obj-measure";
import { ObjBarLineRight, ObjBarLineLeft, ObjStaffTabBarLine } from "../engine/obj-bar-line";
import { ObjTabNoteGroup, ObjNoteGroup, ObjStaffNoteGroup } from "../engine/obj-note-group";
import { ObjRest, ObjStaffRest } from "../engine/obj-rest";
import { ObjRhythmColumn } from "../engine/obj-rhythm-column";
import { ObjScoreRow } from "../engine/obj-score-row";
import { ObjSignature } from "../engine/obj-signature";
import { ObjText } from "../engine/obj-text";
import { Utils } from "@tspro/ts-utils-lib";
import { DivRect } from "./div-rect";
import { Player } from "../engine/player";
import { Renderer } from "../engine/renderer";
import { ObjBeamGroup, ObjStaffBeamGroup } from "../engine/obj-beam-group";
import { ObjSpecialText } from "../engine/obj-special-text";
import { ObjExtensionLine } from "../engine/obj-extension-line";
import { Clef, Connective, ConnectiveSpan, PlayStateChangeListener, StaffConfig, Stem, StringNumber, TabConfig, TieType, VoiceId, getStringNumbers, getVoiceIds } from "./types";
import { NoteAnchor, Arpeggio } from "./types";
import { ScoreEventListener } from "./event";
import { NoteOptions, RestOptions, StaffPreset, Fermata, Navigation, Annotation, Label, PlayState } from "./types";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjStaff, ObjTab } from "score/engine/obj-staff-and-tab";
import { DocumentBuilder } from "./document-builder";

function assertArg(condition: boolean, argName: string, argValue: unknown) {
    if (!condition) {
        throw new MusicError(MusicErrorType.Score, `Invalid arg: ${argName} = ${argValue}`);
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
    return Utils.Is.isNumber(value) && (<number[]>getVoiceIds()).indexOf(value) >= 0;
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
export class MConnective extends MusicInterface {
    static readonly Name = "Connective";

    /** @internal */
    constructor(private readonly obj: ObjConnective) {
        super(MConnective.Name);
    }

    /** @internal */
    getMusicObject(): ObjConnective {
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
export class MStaffBeamGroup extends MusicInterface {
    static readonly Name = "StaffBeamGroup";

    /** @internal */
    constructor(private readonly obj: ObjStaffBeamGroup) {
        super(MStaffBeamGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffBeamGroup {
        return this.obj;
    }
}

/** @public */
export class MDocument extends MusicInterface {
    static readonly Name = "Document";

    /** @internal */
    constructor(private readonly obj: ObjDocument) {
        super(MDocument.Name);
    }

    /** @internal */
    getMusicObject(): ObjDocument {
        return this.obj;
    }

    getTitle(): string | undefined {
        return this.obj.getTitle();
    }

    getComposer(): string | undefined {
        return this.obj.getComposer();3
    }

    getArranger(): string | undefined {
        return this.obj.getArranger();
    }

    play(fn?: PlayStateChangeListener): MPlayer {
        assertArg(Utils.Is.isFunctionOrUndefined(fn), "playStateChangeListener", fn);
        return new MPlayer(this, fn).play();
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
        assertArg(Utils.Is.isIntegerGte(passage, 1), "passage", passage);
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
export class MStaffTabBarLine extends MusicInterface {
    static readonly Name = "StaffTabBarLine";

    /** @internal */
    constructor(private readonly obj: ObjStaffTabBarLine) {
        super(MStaffTabBarLine.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffTabBarLine {
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
export class MStaffNoteGroup extends MusicInterface {
    static readonly Name = "StaffNoteGroup";

    /** @internal */
    constructor(private readonly obj: ObjStaffNoteGroup) {
        super(MStaffNoteGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffNoteGroup {
        return this.obj;
    }

    getNoteGroup(): MNoteGroup {
        return this.obj.noteGroup.getMusicInterface();
    }
}

/** @public */
export class MTabNoteGroup extends MusicInterface {
    static readonly Name = "TabNoteGroup";

    /** @internal */
    constructor(private readonly obj: ObjTabNoteGroup) {
        super(MTabNoteGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjTabNoteGroup {
        return this.obj;
    }

    getNoteGroup(): MNoteGroup {
        return this.obj.noteGroup.getMusicInterface();
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
export class MStaffRest extends MusicInterface {
    static readonly Name = "StaffRest";

    /** @internal */
    constructor(private readonly obj: ObjStaffRest) {
        super(MStaffRest.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffRest {
        return this.obj;
    }

    getRest(): MRest {
        return this.obj.rest.getMusicInterface();
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
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);

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
export class MStaff extends MusicInterface {
    static readonly Name = "Staff";

    /** @internal */
    constructor(private readonly obj: ObjStaff) {
        super(MStaff.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaff {
        return this.obj;
    }
}

/** @public */
export class MTab extends MusicInterface {
    static readonly Name = "Tab";

    /** @internal */
    constructor(private readonly obj: ObjTab) {
        super(MTab.Name);
    }

    /** @internal */
    getMusicObject(): ObjTab {
        return this.obj;
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
        assertArg(doc instanceof MDocument, "doc", doc);
        assertArg(Utils.Is.isFunctionOrUndefined(fn), "playStateChangeListener", fn);

        this.player = new Player();

        this.player.setDocument(doc.getMusicObject());
        this.player.setCursorPositionChangeListener((cursorRect?: DivRect) => doc.getMusicObject().updateCursorRect(cursorRect));

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
        assertArg(Utils.Is.isUndefined(doc) || doc instanceof MDocument, "doc", doc);

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
        assertArg(Utils.Is.isFunctionOrUndefined(fn), "scoreEventListener", fn);
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
        assertArg(Utils.Is.isUndefined(doc) || doc instanceof MDocument, "doc", doc);

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
        assertArg(Utils.Is.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        MPlaybackButtons.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = require_t(Utils.Dom.getButton(btn), "Play button required!");
        this.playLabel = btnLabel ?? "Play";

        MPlaybackButtons.removeOnClickListeners(this.playButton, "all");
        MPlaybackButtons.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    setStopButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        assertArg(Utils.Is.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        MPlaybackButtons.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = require_t(Utils.Dom.getButton(btn), "Stop button required!");
        this.stopLabel = btnLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.stopButton, "all");
        MPlaybackButtons.addOnClickListener(this.stopButton, this.onStop);

        this.updateButtons();

        return this;
    }

    setPlayStopButton(btn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string) {
        assertArg(Utils.Is.isStringOrUndefined(playLabel), "playLabel", playLabel);
        assertArg(Utils.Is.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

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
        assertArg(Utils.Is.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

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
        assertArg(Utils.Is.isFunction(onClick), "onClick", onClick);

        btn.addEventListener("click", onClick);

        let clickListeners = this.savedOnClickListeners.get(btn) || [];

        this.savedOnClickListeners.set(btn, [...clickListeners, onClick]);
    }
}
