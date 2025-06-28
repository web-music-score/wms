import { Accidental, Note } from "../../music-theory/note";
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
import { SymbolSet } from "../../music-theory/types";
import { NoteLength, RhythmProps } from "../../music-theory/rhythm";
import { Scale, ScaleType } from "../../music-theory/scale";
import { Audio } from "../../audio";
import { DivRect } from "./div-rect";
import { Player } from "../engine/player";
import { Renderer } from "../engine/renderer";
import { ObjBeamGroup } from "../engine/obj-beam-group";
import { ObjSpecialText } from "../engine/obj-special-text";
import { KeySignature } from "../../music-theory/key-signature";
import { TimeSignature, TimeSignatureString } from "../../music-theory/time-signature";
import { ObjExtensionLine } from "../engine/obj-extension-line";
import { ClickObjectListener, ClickObjectSelector, ClickPitchListener, PlayStateChangeListener } from "./types";
import { NoteOptions, RestOptions, StaffKind } from "./types";
import { Fermata, Navigation, Annotation, Label } from "./types";

export abstract class MusicInterface {
    constructor(readonly name: string) { }

    /** @hidden */
    abstract getMusicObject(): MusicObject;

    getParent(): MusicInterface | undefined {
        return this.getMusicObject().getParent()?.getMusicInterface();
    }
}

export class MAccidental extends MusicInterface {
    static readonly Name = "Accidental";

    /** @hidden */
    constructor(private readonly obj: ObjAccidental) {
        super(MAccidental.Name);
    }

    /** @hidden */
    getMusicObject(): ObjAccidental {
        return this.obj;
    }

    getAccidental(): Accidental {
        return this.obj.accidental;
    }
}

export class MArc extends MusicInterface {
    static readonly Name = "Arc";

    /** @hidden */
    constructor(private readonly obj: ObjArc) {
        super(MArc.Name);
    }

    /** @hidden */
    getMusicObject(): ObjArc {
        return this.obj;
    }
}

export class MArpeggio extends MusicInterface {
    static readonly Name = "Arpeggio";

    /** @hidden */
    constructor(private readonly obj: ObjArpeggio) {
        super(MArpeggio.Name);
    }

    /** @hidden */
    getMusicObject(): ObjArpeggio {
        return this.obj;
    }
}

export class MBeamGroup extends MusicInterface {
    static readonly Name = "BeamGroup";

    /** @hidden */
    constructor(private readonly obj: ObjBeamGroup) {
        super(MBeamGroup.Name);
    }

    /** @hidden */
    getMusicObject(): ObjBeamGroup {
        return this.obj;
    }
}

export class MDocument extends MusicInterface {
    static readonly Name = "Document";

    /** @hidden */
    readonly obj: ObjDocument;

    constructor(staffKind: StaffKind, measuresPerRow?: number) {
        super(MDocument.Name);
        this.obj = new ObjDocument(this, staffKind, measuresPerRow);

        if (measuresPerRow !== undefined) {
            Assert.int_gte(measuresPerRow, 1, "Cannot create music document because invalid measures per row value: " + measuresPerRow);
        }
    }

    /** @hidden */
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

export class MEnding extends MusicInterface {
    static readonly Name = "Ending";

    /** @hidden */
    constructor(private readonly obj: ObjEnding) {
        super(MEnding.Name);
    }

    /** @hidden */
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

export class MFermata extends MusicInterface {
    static readonly Name = "Fermata";

    /** @hidden */
    constructor(private readonly obj: ObjFermata) {
        super(MFermata.Name);
    }

    /** @hidden */
    getMusicObject(): ObjFermata {
        return this.obj;
    }
}

export class MHeader extends MusicInterface {
    static readonly Name = "Header";

    /** @hidden */
    constructor(private readonly obj: ObjHeader) {
        super(MHeader.Name);
    }

    /** @hidden */
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

export class MImage extends MusicInterface {
    static readonly Name = "Image";

    /** @hidden */
    constructor(private readonly obj: ObjImage) {
        super(MImage.Name);
    }

    /** @hidden */
    getMusicObject(): ObjImage {
        return this.obj;
    }
}

export class MMeasure extends MusicInterface {
    static readonly Name = "Measure";

    /** @hidden */
    constructor(private readonly obj: ObjMeasure) {
        super(MMeasure.Name);
    }

    /** @hidden */
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

export class MBarLineRight extends MusicInterface {
    static readonly Name = "BarLineRight";

    /** @hidden */
    constructor(private readonly obj: ObjBarLineRight) {
        super(MBarLineRight.Name);
    }

    /** @hidden */
    getMusicObject(): ObjBarLineRight {
        return this.obj;
    }
}

export class MBarLineLeft extends MusicInterface {
    static readonly Name = "BarLineLeft";

    /** @hidden */
    constructor(private readonly obj: ObjBarLineLeft) {
        super(MBarLineLeft.Name);
    }

    /** @hidden */
    getMusicObject(): ObjBarLineLeft {
        return this.obj;
    }
}

export class MNoteGroup extends MusicInterface {
    static readonly Name = "NoteGroup";

    /** @hidden */
    constructor(private readonly obj: ObjNoteGroup) {
        super(MNoteGroup.Name);
    }

    /** @hidden */
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

export class MRest extends MusicInterface {
    static readonly Name = "Rest";

    /** @hidden */
    constructor(private readonly obj: ObjRest) {
        super(MRest.Name);
    }

    /** @hidden */
    getMusicObject(): ObjRest {
        return this.obj;
    }

    getRhythmProps(): RhythmProps {
        return this.obj.rhythmProps;
    }
}

export class MRhythmColumn extends MusicInterface {
    static readonly Name = "RhythmColumn";

    /** @hidden */
    constructor(private readonly obj: ObjRhythmColumn) {
        super(MRhythmColumn.Name);
    }

    /** @hidden */
    getMusicObject(): ObjRhythmColumn {
        return this.obj;
    }

    getRhythmSymbol(voiceId: number): MNoteGroup | MRest | undefined {
        return this.obj.getVoiceSymbol(voiceId)?.getMusicInterface();
    }
}

export class MScoreRow extends MusicInterface {
    static readonly Name = "ScoreRow";

    /** @hidden */
    constructor(private readonly obj: ObjScoreRow) {
        super(MScoreRow.Name);
    }

    /** @hidden */
    getMusicObject(): ObjScoreRow {
        return this.obj;
    }

    getMeasures(): ReadonlyArray<MMeasure> {
        return this.obj.getMeasures().map(m => m.getMusicInterface());
    }
}

export class MSignature extends MusicInterface {
    static readonly Name = "Signature";

    /** @hidden */
    constructor(private readonly obj: ObjSignature) {
        super(MSignature.Name);
    }

    /** @hidden */
    getMusicObject(): ObjSignature {
        return this.obj;
    }
}

export class MSpecialText extends MusicInterface {
    static readonly Name = "SpecialText";

    /** @hidden */
    constructor(private readonly obj: ObjSpecialText) {
        super(MSpecialText.Name);
    }

    /** @hidden */
    getMusicObject(): ObjSpecialText {
        return this.obj;
    }
}

export class MText extends MusicInterface {
    static readonly Name = "Text";

    /** @hidden */
    constructor(private readonly obj: ObjText) {
        super(MText.Name);
    }

    /** @hidden */
    getMusicObject(): ObjText {
        return this.obj;
    }

    getText(): string {
        return this.obj.getText();
    }
}

export class MExtensionLine extends MusicInterface {
    static readonly Name = "ExtensionLine";

    /** @hidden */
    constructor(private readonly obj: ObjExtensionLine) {
        super(MExtensionLine.Name);
    }

    /** @hidden */
    getMusicObject(): ObjExtensionLine {
        return this.obj;
    }
}

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
