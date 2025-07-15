import { Accidental, Note } from "../../theory/note";
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
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { SymbolSet } from "../../theory/types";
import { NoteLength, RhythmProps } from "../../theory/rhythm";
import { Scale, ScaleType } from "../../theory/scale";
import { Audio } from "../../audio";
import { DivRect } from "./div-rect";
import { Player } from "../engine/player";
import { Renderer } from "../engine/renderer";
import { ObjBeamGroup } from "../engine/obj-beam-group";
import { ObjSpecialText } from "../engine/obj-special-text";
import { KeySignature } from "../../theory/key-signature";
import { TimeSignature, TimeSignatureString } from "../../theory/time-signature";
import { ObjExtensionLine } from "../engine/obj-extension-line";
import { ClickObjectListener, ClickObjectSelector, ClickPitchListener, DocumentOptions, PlayStateChangeListener } from "./types";
import { NoteOptions, RestOptions, StaffKind } from "./types";
import { Fermata, Navigation, Annotation, Label, PlayState } from "./types";

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

    constructor(staffKind: StaffKind, options?: DocumentOptions) {
        super(MDocument.Name);

        this.obj = new ObjDocument(this, staffKind, options);
    }

    /** @internal */
    getMusicObject(): ObjDocument {
        return this.obj;
    }

    setHeader(title?: string, composer?: string, arranger?: string): void {
        this.obj.setHeader(title, composer, arranger);
    }

    getTitle(): string | undefined {
        return this.obj.getTitle();
    }

    addMeasure(): MMeasure {
        return this.obj.addMeasure().mi;
    }

    updateCursorRect(cursorRect?: DivRect) {
        this.obj.updateCursorRect(cursorRect);
    }

    play(playStateChangeListener?: PlayStateChangeListener): MPlayer {
        return new MPlayer(this, playStateChangeListener).play();
    }

    static createSimpleScaleArpeggio(staffKind: StaffKind, scale: Scale, lowestPitchNote: string, numOctaves: number): MDocument {
        let doc = new MDocument(staffKind);

        let m = doc.addMeasure().setKeySignature(scale);

        scale.getScaleNotes(lowestPitchNote, numOctaves).forEach(note => {
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

    setKeySignature(keyNote: string, scaleType: ScaleType): MMeasure;
    setKeySignature(keySignature: KeySignature): MMeasure;
    setKeySignature(scale: Scale): MMeasure;
    setKeySignature(...args: unknown[]): MMeasure {
        this.obj.setKeySignature(...args);
        return this;
    }

    setTimeSignature(timeSignature: TimeSignature | TimeSignatureString): MMeasure {
        this.obj.setTimeSignature(timeSignature);
        return this;
    }

    setTempo(beatsPerMinute: number, beatLength?: NoteLength, dotted?: boolean): MMeasure {
        this.obj.setTempo(beatsPerMinute, beatLength, dotted);
        return this;
    }

    addNote(voiceId: number, note: Note | string, noteLength: NoteLength, options?: NoteOptions): MMeasure {
        this.obj.addNoteGroup(voiceId, [note], noteLength, options);
        return this;
    }

    addChord(voiceId: number, notes: (Note | string)[], noteLength: NoteLength, options?: NoteOptions): MMeasure {
        this.obj.addNoteGroup(voiceId, notes, noteLength, options);
        return this;
    }

    addRest(voiceId: number, restLength: NoteLength, options?: RestOptions): MMeasure {
        this.obj.addRest(voiceId, restLength, options);
        return this;
    }

    addFermata(fermata: Fermata = Fermata.AtNote): MMeasure {
        this.obj.addFermata(fermata);
        return this;
    }

    addNavigation(navigation: Navigation): MMeasure;
    addNavigation(navigation: Navigation.EndRepeat, repeatCount: number): MMeasure;
    addNavigation(navigation: Navigation.Ending, ...passages: number[]): MMeasure;
    addNavigation(navigation: Navigation, ...args: unknown[]): MMeasure {
        this.obj.addNavigation(navigation, ...args);
        return this;
    }

    addLabel(label: Label, text: string): MMeasure {
        this.obj.addLabel(label, text);
        return this;
    }

    addAnnotation(annotation: Annotation, text: string): MMeasure {
        this.obj.addAnnotation(annotation, text);
        return this;
    }

    addExtension(extensionLength: NoteLength | number, extensionVisible?: boolean): MMeasure {
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

    constructor(doc: MDocument, playStateChangeListener?: PlayStateChangeListener) {
        this.player = new Player();

        this.player.setDocument(doc.obj);

        let cursorPositionChnageListener = (cursorRect?: DivRect) => {
            doc.updateCursorRect(cursorRect);
        }

        this.player.setCursorPositionChangeListener(cursorPositionChnageListener);

        if (playStateChangeListener) {
            this.player.setPlayStateChnageListener(playStateChangeListener);
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
        this.renderer = new Renderer();
    }

    setDocument(doc?: MDocument) {
        this.renderer.setDocument(doc);
        return this;
    }

    setCanvas(canvas: HTMLCanvasElement | string) {
        canvas = Assert.require(Utils.Dom.getCanvas(canvas), typeof canvas === "string"
            ? "Cannot set renderer canvas because invalid canvas id: " + canvas
            : "Cannot set renderer canvas because given canvas is undefined.");
        this.renderer.setCanvas(canvas);
        return this;
    }

    setClickPitchListener(fn: ClickPitchListener) {
        this.renderer.setClickPitchListener(fn);
    }

    setClickObjectSelector(fn?: ClickObjectSelector) {
        this.renderer.setClickObjectSelector(fn);
    }

    setClickObjectListener(fn?: ClickObjectListener) {
        this.renderer.setClickObjectListener(fn);
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

    setDocument(doc: MDocument | undefined) {
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
        MPlaybackButtons.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = Assert.require(Utils.Dom.getButton(btn), "Play button required!");
        this.playLabel = btnLabel ?? "Play";

        MPlaybackButtons.removeOnClickListeners(this.playButton, "all");
        MPlaybackButtons.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    setStopButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        MPlaybackButtons.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = Assert.require(Utils.Dom.getButton(btn), "Stop button required!");
        this.stopLabel = btnLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.stopButton, "all");
        MPlaybackButtons.addOnClickListener(this.stopButton, this.onStop);

        this.updateButtons();

        return this;
    }

    setPlayStopButton(btn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string) {
        MPlaybackButtons.removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = Assert.require(Utils.Dom.getButton(btn), "Play/stop button required!");
        this.playLabel = playLabel ?? "Play";
        this.stopLabel = stopLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.playStopButton, "all");
        MPlaybackButtons.addOnClickListener(this.playStopButton, this.onPlayStop);

        this.updateButtons();

        return this;
    }

    setPauseButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        MPlaybackButtons.removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = Assert.require(Utils.Dom.getButton(btn), "Pause button required!");
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
        btn.addEventListener("click", onClick);

        let clickListeners = this.savedOnClickListeners.get(btn) || [];

        this.savedOnClickListeners.set(btn, [...clickListeners, onClick]);
    }
}
