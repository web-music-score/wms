import { Accidental, Note } from "web-music-score/theory";
import { RhythmProps } from "web-music-score/theory";
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
import { ObjBarLineRight, ObjBarLineLeft, ObjStaffBarLine } from "../engine/obj-bar-line";
import { ObjTabNoteGroup, ObjNoteGroup, ObjStaffNoteGroup } from "../engine/obj-note-group";
import { ObjRest, ObjStaffRest } from "../engine/obj-rest";
import { ObjRhythmColumn } from "../engine/obj-rhythm-column";
import { ObjScoreRow } from "../engine/obj-score-row";
import { ObjStaffSignature, ObjTabSignature } from "../engine/obj-signature";
import { ObjText } from "../engine/obj-text";
import { Guard } from "@tspro/ts-utils-lib";
import { ObjBeamGroup, ObjStaffBeamGroup } from "../engine/obj-beam-group";
import { ObjSpecialText } from "../engine/obj-special-text";
import { ObjExtensionLine } from "../engine/obj-extension-line";
import { PlayStateChangeListener, VoiceId, isVoiceId } from "./types";
import { MusicError, MusicErrorType } from "web-music-score/core";
import { ObjStaff, ObjTab } from "../engine/obj-staff-and-tab";
import { ObjLyrics } from "../engine/obj-lyrics";
import { ObjTabRhythm } from "../engine/obj-tab-rhythm";
import { ObjScoreRowGroup } from "../engine/obj-score-row-group";
import { isWmsViewHTMLElement } from "../custom-element/wms-view";
import { isWmsControlsHTMLElement } from "../custom-element/wms-controls";
import { Player } from "./player";
import { AssertUtil } from "shared-src";

function getMStaffOrMTab(line: unknown): MStaff | MTab {
    if (line instanceof ObjStaff || line instanceof ObjTab) {
        return line.getMusicInterface()
    }
    else {
        throw new MusicError(MusicErrorType.Score, `Object is not staff or tab.`);
    }
}
/** Abstract music interface object class. */
export abstract class MusicInterface {
    /**
     * Create new music interface object.
     * @param name - OBject name.
     */
    constructor(readonly name: string) { }

    /** @internal */
    abstract getMusicObject(): MusicObject;

    /**
     * Get parent object.
     * @returns - Parent object or undefined.
     */
    getParent(): MusicInterface | undefined {
        return this.getMusicObject().getParent()?.getMusicInterface();
    }
}

/** Accidental object. */
export class MAccidental extends MusicInterface {
    /** Object name. */
    static readonly Name = "Accidental";

    /** @internal */
    constructor(private readonly obj: ObjAccidental) {
        super(MAccidental.Name);
    }

    /** @internal */
    getMusicObject(): ObjAccidental {
        return this.obj;
    }

    /**
     * Get accidental.
     * @returns - Accidental (e.g. 1 = #).
     */
    getAccidental(): Accidental {
        return this.obj.accidental;
    }
}

/** Connective object. */
export class MConnective extends MusicInterface {
    /** Object name. */
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

/** Arpeggio object. */
export class MArpeggio extends MusicInterface {
    /** Object name. */
    static readonly Name = "Arpeggio";

    /** @internal */
    constructor(private readonly obj: ObjArpeggio) {
        super(MArpeggio.Name);
    }

    /** @internal */
    getMusicObject(): ObjArpeggio {
        return this.obj;
    }

    /**
     * Get rhythm column this arpeggio is in.
     * @returns - Rhythm column.
     */
    getRhythmColumn(): MRhythmColumn {
        return this.obj.col.getMusicInterface();
    }

    /**
     * Get notation line this arpeggio is in.
     * @returns - Staff or tab object.
     */
    getNotationLine(): MStaff | MTab {
        return getMStaffOrMTab(this.obj.line);
    }
}

/** Beam group object. */
export class MBeamGroup extends MusicInterface {
    /** OBject name. */
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

/** Beam group object of certain staff. */
export class MStaffBeamGroup extends MusicInterface {
    /** Object name. */
    static readonly Name = "StaffBeamGroup";

    /** @internal */
    constructor(private readonly obj: ObjStaffBeamGroup) {
        super(MStaffBeamGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffBeamGroup {
        return this.obj;
    }

    /**
     * Get staff this beam group is in.
     * @returns - Staff object.
     */
    getStaff(): MStaff {
        return this.obj.staff.getMusicInterface();
    }
}

/** Document object. */
export class MDocument extends MusicInterface {
    /** Object name. */
    static readonly Name = "Document";

    private defaultPlayer?: Player;

    /** @internal */
    constructor(private readonly obj: ObjDocument) {
        super(MDocument.Name);
    }

    /** @internal */
    getMusicObject(): ObjDocument {
        return this.obj;
    }

    /**
     * Get title.
     * @returns - Title string or undefined.
     */
    getTitle(): string | undefined {
        return this.obj.getTitle();
    }

    /**
     * Get composer.
     * @returns - Composer string or undefined.
     */
    getComposer(): string | undefined {
        return this.obj.getComposer(); 3
    }

    /**
     * Get arranger.
     * @returns - Arranger string or undefined.
     */
    getArranger(): string | undefined {
        return this.obj.getArranger();
    }

    /**
     * Get score rows.
     * @returns - Array or score rows.
     */
    getRows(): ReadonlyArray<MScoreRow> {
        return this.obj.getRows().map(r => r.getMusicInterface());
    }

    /**
     * Get measures.
     * @returns - Array of measures.
     */
    getMeasures(): ReadonlyArray<MMeasure> {
        return this.obj.getMeasures().map(m => m.getMusicInterface());
    }

    /**
     * Play this document.
     * @param playStateChangeListener - Play state change listener function or undefined.
     * @returns - Player instance.
     */
    play(playStateChangeListener?: PlayStateChangeListener): Player {
        AssertUtil.assertVar(Guard.isFunctionOrUndefined(playStateChangeListener), "playStateChangeListener", playStateChangeListener);

        const player = this.getDefaultPlayer();

        //player.stop();

        if (playStateChangeListener)
            player.setPlayStateChangeListener(playStateChangeListener);

        player.play();

        return player;
    }

    /**
     * Get default player.
     * @returns - Player.
     */
    getDefaultPlayer(): Player {
        if (!this.defaultPlayer)
            this.defaultPlayer = new Player(this);

        return this.defaultPlayer;
    }

    /**
     * Bind this document to custom HTML element.
     * @param elem - HTML element id or element.
     */
    bindElement(elem: string | HTMLElement) {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsViewHTMLElement(el) || isWmsControlsHTMLElement(el)) {
            this.obj.bindElement(el);
        }
        else
            throw new MusicError(MusicErrorType.Score, "Bind element must be <wms-view> or <wms-controls>!");
    }

    /**
     * Unbind this document from custom HTML element.
     * @param elem - HTML element id or element.
     */
    unbindElement(elem: string | HTMLElement) {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsViewHTMLElement(el) || isWmsControlsHTMLElement(el)) {
            this.obj.unbindElement(el);
        }
        else
            throw new MusicError(MusicErrorType.Score, "Unbind element must be <wms-view> or <wms-controls>!");
    }
}

/** Ending object. */
export class MEnding extends MusicInterface {
    /** Object name. */
    static readonly Name = "Ending";

    /** @internal */
    constructor(private readonly obj: ObjEnding) {
        super(MEnding.Name);
    }

    /** @internal */
    getMusicObject(): ObjEnding {
        return this.obj;
    }

    /**
     * Get passages.
     * @returns - Array of passage numbers, e.g. passage number 1 means that this ending is played on first pass.
     */
    getPassages(): ReadonlyArray<number> {
        return this.obj.passages;
    }

    /**
     * Has passage number?
     * @param passage - Passage number to find out.
     * @returns - Boolean whether this ending has asked passage number.
     */
    hasPassage(passage: number): boolean {
        AssertUtil.assertVar(Guard.isIntegerGte(passage, 1), "passage", passage);
        return this.obj.hasPassage(passage);
    }
}

/** Fermata object. */
export class MFermata extends MusicInterface {
    /** OBject name. */
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

/** Header object. */
export class MHeader extends MusicInterface {
    /** OBject name. */
    static readonly Name = "Header";

    /** @internal */
    constructor(private readonly obj: ObjHeader) {
        super(MHeader.Name);
    }

    /** @internal */
    getMusicObject(): ObjHeader {
        return this.obj;
    }

    /**
     * Get title.
     * @returns - Title string or undefined.
     */
    getTitle(): string | undefined {
        return this.obj.title;
    }

    /**
     * Get composer.
     * @returns - Composer string or undefined.
     */
    getComposer(): string | undefined {
        return this.obj.composer;
    }

    /**
     * Get arranger.
     * @returns - Arranger string or undefined.
     */
    getArranger(): string | undefined {
        return this.obj.arranger;
    }
}

/** Image object. */
export class MImage extends MusicInterface {
    /** Object name. */
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

/** Measure object. */
export class MMeasure extends MusicInterface {
    /** OBject name. */
    static readonly Name = "Measure";

    /** @internal */
    constructor(private readonly obj: ObjMeasure) {
        super(MMeasure.Name);
    }

    /** @internal */
    getMusicObject(): ObjMeasure {
        return this.obj;
    }

    /**
     * Get measure number.
     * @returns - Measure number starting from 1, or 0 if upbeat.
     */
    getMeasureNumber(): number {
        return this.obj.getMeasureNumber();
    }

    /**
     * Get rhythm columns.
     * @returns - Array of rhythm columns.
     */
    getRhythmColumns(): ReadonlyArray<MRhythmColumn> {
        return this.obj.getColumns().map(col => col.getMusicInterface());
    }

    /**
     * Get score row that this measure is in.
     * @returns - Score row.
     */
    getRow(): MScoreRow {
        return this.obj.row.getMusicInterface();
    }
}

/** Right bar line object. */
export class MBarLineRight extends MusicInterface {
    /** OBject name. */
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

/** Left bar line object. */
export class MBarLineLeft extends MusicInterface {
    /** Object name. */
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

/** Bar line object for certain staff or tab. */
export class MStaffBarLine extends MusicInterface {
    /** Object name. */
    static readonly Name = "StaffBarLine";

    /** @internal */
    constructor(private readonly obj: ObjStaffBarLine) {
        super(MStaffBarLine.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffBarLine {
        return this.obj;
    }

    /**
     * Get parent bar line object.
     * @returns - Parent bar line object.
     */
    getBarLine(): MBarLineLeft | MBarLineRight {
        let barLine = this.obj.barLine;
        if (barLine instanceof ObjBarLineLeft || barLine instanceof ObjBarLineRight) {
            return barLine.getMusicInterface()
        }
        else {
            throw new MusicError(MusicErrorType.Score, `Bar line not left nor right.`);
        }
    }

    /**
     * Get staff or tab this bar lien object is in.
     * @returns - Staff or tab.
     */
    getNotationLine(): MStaff | MTab {
        return getMStaffOrMTab(this.obj.line);
    }
}

/** Note group object. */
export class MNoteGroup extends MusicInterface {
    /** Object name. */
    static readonly Name = "NoteGroup";

    /** @internal */
    constructor(private readonly obj: ObjNoteGroup) {
        super(MNoteGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjNoteGroup {
        return this.obj;
    }

    /**
     * Get notes of this note group.
     * @returns - Array of Note instances.
     */
    getNotes(): ReadonlyArray<Note> {
        return this.obj.notes;
    }

    /**
     * Get rhythm props of this note group.
     * @returns - Rhythm props.
     */
    getRhythmProps(): RhythmProps {
        return this.obj.rhythmProps;
    }

    /**
     * Get rhythm column this note group is in.
     * @returns - Rhythm column.
     */
    getRhythmColumn(): MRhythmColumn {
        return this.obj.col.getMusicInterface();
    }

    /**
     * Get the measure this note group is in.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.obj.measure.getMusicInterface();
    }
}

/** Note group object of certain staff. */
export class MStaffNoteGroup extends MusicInterface {
    /** Object name. */
    static readonly Name = "StaffNoteGroup";

    /** @internal */
    constructor(private readonly obj: ObjStaffNoteGroup) {
        super(MStaffNoteGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffNoteGroup {
        return this.obj;
    }

    /**
     * Get parent note group.
     * @returns - Parent note group.
     */
    getNoteGroup(): MNoteGroup {
        return this.obj.noteGroup.getMusicInterface();
    }

    /**
     * Get rhythm column this note group is in.
     * @returns - Rhythm column.
     */
    getRhythmColumn(): MRhythmColumn {
        return this.getNoteGroup().getRhythmColumn();
    }

    /**
     * Get the measure this note group is in.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.getNoteGroup().getMeasure();
    }

    /**
     * Get staff notation line this note group is in.
     * @returns - Staff object.
     */
    getStaff(): MStaff {
        return this.obj.staff.getMusicInterface();
    }
}

/** Note group object of certain tab. Contains fret numbers for tab. */
export class MTabNoteGroup extends MusicInterface {
    /** OBject name. */
    static readonly Name = "TabNoteGroup";

    /** @internal */
    constructor(private readonly obj: ObjTabNoteGroup) {
        super(MTabNoteGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjTabNoteGroup {
        return this.obj;
    }

    /**
     * Get parent note group.
     * @returns - Parent note group.
     */
    getNoteGroup(): MNoteGroup {
        return this.obj.noteGroup.getMusicInterface();
    }

    /**
     * Get rhythm column this note group is in.
     * @returns - Rhythm column.
     */
    getRhythmColumn(): MRhythmColumn {
        return this.getNoteGroup().getRhythmColumn();
    }

    /**
     * Get the measure this note group is in.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.getNoteGroup().getMeasure();
    }

    /**
     * Get guitar tab this note group is in.
     * @returns - Tab object.
     */
    getTab(): MTab {
        return this.obj.tab.getMusicInterface();
    }
}

/** Rest object. */
export class MRest extends MusicInterface {
    /** OBject name. */
    static readonly Name = "Rest";

    /** @internal */
    constructor(private readonly obj: ObjRest) {
        super(MRest.Name);
    }

    /** @internal */
    getMusicObject(): ObjRest {
        return this.obj;
    }

    /**
     * Get rhythm props of this rest.
     * @returns - Rhythm props.
     */
    getRhythmProps(): RhythmProps {
        return this.obj.rhythmProps;
    }

    /**
     * Get rhythm column this rest is in.
     * @returns - Rhythm column.
     */
    getRhythmColumn(): MRhythmColumn {
        return this.obj.col.getMusicInterface();
    }

    /**
     * Get the measure this rest is in.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.obj.measure.getMusicInterface();
    }
}

/** Rest object for certain tab. */
export class MStaffRest extends MusicInterface {
    /** Object name. */
    static readonly Name = "StaffRest";

    /** @internal */
    constructor(private readonly obj: ObjStaffRest) {
        super(MStaffRest.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffRest {
        return this.obj;
    }

    /**
     * Get parent rest object.
     * @returns - Parent rest object.
     */
    getRest(): MRest {
        return this.obj.rest.getMusicInterface();
    }

    /**
     * Get rhythm column this rest is in.
     * @returns - Rhythm column.
     */
    getRhythmColumn(): MRhythmColumn {
        return this.getRest().getRhythmColumn();
    }

    /**
     * Get the measure this rest is in.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.getRest().getMeasure();
    }

    /**
     * Get staff notation line this rest is in.
     * @returns - Staff object.
     */
    getStaff(): MStaff {
        return this.obj.staff.getMusicInterface();
    }
}

/** Rhythm column object. */
export class MRhythmColumn extends MusicInterface {
    /** OBject name. */
    static readonly Name = "RhythmColumn";

    /** @internal */
    constructor(private readonly obj: ObjRhythmColumn) {
        super(MRhythmColumn.Name);
    }

    /** @internal */
    getMusicObject(): ObjRhythmColumn {
        return this.obj;
    }

    /**
     * Get symbol (note group or rest) of this column for given voice id.
     * @param voiceId - Voice id.
     * @returns - Note group, rest or undefined.
     */
    getRhythmSymbol(voiceId: VoiceId): MNoteGroup | MRest | undefined {
        AssertUtil.assertVar(isVoiceId(voiceId), "voiceId", voiceId);

        return this.obj.getVoiceSymbol(voiceId)?.getMusicInterface();
    }

    /**
     * Get the measure this rhythm column is in.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.obj.measure.getMusicInterface();
    }
}

/** Score row object. */
export class MScoreRow extends MusicInterface {
    /** Object name. */
    static readonly Name = "ScoreRow";

    /** @internal */
    constructor(private readonly obj: ObjScoreRow) {
        super(MScoreRow.Name);
    }

    /** @internal */
    getMusicObject(): ObjScoreRow {
        return this.obj;
    }

    /**
     * Parent music document.
     * @returns - Parent music document.
     */
    getDocument(): MDocument {
        return this.obj.doc.getMusicInterface();
    }

    /**
     * Get measures of this score row.
     * @returns - Array of measures.
     */
    getMeasures(): ReadonlyArray<MMeasure> {
        return this.obj.getMeasures().map(m => m.getMusicInterface());
    }

    /**
     * Get notation lines (staves and tabs) of this score row.
     * @returns - Array of staves and tabs.
     */
    getNotationLines(): ReadonlyArray<MStaff | MTab> {
        return this.obj.getNotationLines().map(line => getMStaffOrMTab(line));
    }
}

/** Score row group object. */
export class MScoreRowGroup extends MusicInterface {
    /** Object name. */
    static readonly Name = "ScoreRowGroup";

    /** @internal */
    constructor(private readonly obj: ObjScoreRowGroup) {
        super(MScoreRowGroup.Name);
    }

    /** @internal */
    getMusicObject(): ObjScoreRowGroup {
        return this.obj;
    }

    /**
     * Get instrument name.
     * @returns - instrument name.
     */
    getInstrument(): string {
        return this.obj.instrument;
    }
}

/** Staff notatio line object. */
export class MStaff extends MusicInterface {
    /** Object name. */
    static readonly Name = "Staff";

    /** @internal */
    constructor(private readonly obj: ObjStaff) {
        super(MStaff.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaff {
        return this.obj;
    }

    /**
     * Get index of this staff in score row.
     * @returns - Index (0=top notation line).
     */
    getId(): number {
        return this.obj.id;
    }

    /**
     * Get name of this staff.
     * @returns - Staff name.
     */
    getName(): string | undefined {
        return this.obj.name.length > 0 ? this.obj.name : undefined;
    }

    /**
     * Get the score row this staff is in.
     * @returns - Score row.
     */
    getRow(): MScoreRow {
        return this.obj.row.getMusicInterface();
    }
}

/** Guitar tab notation line object. */
export class MTab extends MusicInterface {
    /** Object name. */
    static readonly Name = "Tab";

    /** @internal */
    constructor(private readonly obj: ObjTab) {
        super(MTab.Name);
    }

    /** @internal */
    getMusicObject(): ObjTab {
        return this.obj;
    }

    /**
     * Get index of this guitar tab in score row.
     * @returns - Index (0=top notation line).
     */
    getId(): number {
        return this.obj.id;
    }

    /**
     * Get name of this guitar tab.
     * @returns - Staff name.
     */
    getName(): string | undefined {
        return this.obj.name.length > 0 ? this.obj.name : undefined;
    }

    /**
     * Get the score row this guitar tab is in.
     * @returns - Score row.
     */
    getRow(): MScoreRow {
        return this.obj.row.getMusicInterface();
    }
}

/** Staff signature object contains clef, key signature, time signature, tempo and measure number, all optional depending on measure. */
export class MStaffSignature extends MusicInterface {
    /** Object name. */
    static readonly Name = "StaffSignature";

    /** @internal */
    constructor(private readonly obj: ObjStaffSignature) {
        super(MStaffSignature.Name);
    }

    /** @internal */
    getMusicObject(): ObjStaffSignature {
        return this.obj;
    }

    /**
     * Get staff notation line this signature is in.
     * @returns - Staff object.
     */
    getStaff(): MStaff {
        return this.obj.staff.getMusicInterface();
    }
}

/** Tab signature object contains time signature, tempo and measure number, all optional depending on measure. */
export class MTabSignature extends MusicInterface {
    /** Object name. */
    static readonly Name = "TabSignature";

    /** @internal */
    constructor(private readonly obj: ObjTabSignature) {
        super(MTabSignature.Name);
    }

    /** @internal */
    getMusicObject(): ObjTabSignature {
        return this.obj;
    }

    /**
     * Get tab notation line this signature is in.
     * @returns - Tab object.
     */
    getTab(): MTab {
        return this.obj.tab.getMusicInterface();
    }
}

/** Tab rhythm object. */
export class MTabRhythm extends MusicInterface {
    /** Object name. */
    static readonly Name = "TabRhythm";

    /** @internal */
    constructor(private readonly obj: ObjTabRhythm) {
        super(MTabRhythm.Name);
    }

    /** @internal */
    getMusicObject(): ObjTabRhythm {
        return this.obj;
    }

    /**
     * Get measure.
     * @returns - Measure.
     */
    getMeasure(): MMeasure {
        return this.obj.measure.getMusicInterface();
    }

    /**
     * Get tab.
     * @returns - Tab.
     */
    getTab(): MTab {
        return this.obj.tab.getMusicInterface();
    }
}

/** Spacial text object contains text and possibly special symbols (e.g. Segno or Coda). */
export class MSpecialText extends MusicInterface {
    /** Object name. */
    static readonly Name = "SpecialText";

    /** @internal */
    constructor(private readonly obj: ObjSpecialText) {
        super(MSpecialText.Name);
    }

    /** @internal */
    getMusicObject(): ObjSpecialText {
        return this.obj;
    }

    /**
     * Get text content.
     * @returns - Text content.
     */
    getText(): string {
        return this.obj.getText();
    }
}

/** Text object. */
export class MText extends MusicInterface {
    /** Object name. */
    static readonly Name = "Text";

    /** @internal */
    constructor(private readonly obj: ObjText) {
        super(MText.Name);
    }

    /** @internal */
    getMusicObject(): ObjText {
        return this.obj;
    }

    /**
     * Get text content.
     * @returns - Text content.
     */
    getText(): string {
        return this.obj.getText();
    }
}

/** Lyrics object. */
export class MLyrics extends MusicInterface {
    /** Object name. */
    static readonly Name = "Lyrics";

    /** @internal */
    constructor(private readonly obj: ObjLyrics) {
        super(MLyrics.Name);
    }

    /** @internal */
    getMusicObject(): ObjLyrics {
        return this.obj;
    }

    /**
     * Get lyrics text.
     * @returns - Lyrics text.
     */
    getText(): string {
        return this.obj.getText();
    }
}

/** Extension line object. */
export class MExtensionLine extends MusicInterface {
    /** OBject name. */
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
