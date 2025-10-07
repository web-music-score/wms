import { Utils } from "@tspro/ts-utils-lib";
import { Annotation, AnnotationText, Arpeggio, BaseConfig, Clef, Connective, Fermata, getStringNumbers, getVerseNumbers, getVoiceIds, Label, LyricsAlign, LyricsHyphen, LyricsOptions, Navigation, NoteAnchor, NoteOptions, RestOptions, ScoreConfiguration, StaffConfig, StaffPreset, StaffTabOrGroups, Stem, StringNumber, TabConfig, TieType, TupletOptions, VerseNumber, VerticalPosition, VoiceId } from "./types";
import { MDocument } from "./music-objects";
import { ObjDocument } from "../engine/obj-document";
import { BeamGrouping, KeySignature, Note, NoteLength, NoteLengthStr, RhythmProps, Scale, ScaleType, SymbolSet, TimeSignature, TimeSignatures, TuningNameList, TupletRatio, validateNoteLength, validateTupletRatio } from "@tspro/web-music-score/theory";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjMeasure } from "score/engine/obj-measure";
import { RhythmSymbol } from "score/engine/obj-rhythm-column";
import { ObjBeamGroup } from "score/engine/obj-beam-group";
import { getAnnotation } from "score/engine/element-data";

function assertArg(condition: boolean, argName: string, argValue: unknown) {
    if (!condition) {
        throw new MusicError(MusicErrorType.Score, `Invalid arg: ${argName} = ${argValue}`);
    }
}

function isNote(note: string): boolean {
    if (typeof note !== "string") {
        return false;
    }
    else {
        let p = Note.parseNote(note);
        return p !== undefined && p.octave !== undefined;
    }
}

function isVoiceId(value: unknown): value is VoiceId {
    return Utils.Is.isNumber(value) && (<number[]>getVoiceIds()).indexOf(value) >= 0;
}

function isStringNumber(value: unknown): value is StringNumber {
    return Utils.Is.isNumber(value) && (<number[]>getStringNumbers()).indexOf(value) >= 0;
}

function isVerseNumber(value: unknown): value is VerseNumber {
    return Utils.Is.isNumber(value) && (<number[]>getVerseNumbers()).indexOf(value) >= 0;
}

function assertBaseConfig(baseConfig: BaseConfig) {
    assertArg(Utils.Is.isObject(baseConfig), "baseConfig", baseConfig);
    assertArg(Utils.Is.isStringOrUndefined(baseConfig.name), "baseConfig.name", baseConfig.name);
    assertArg(Utils.Is.isUndefined(baseConfig.voiceIds) || Utils.Is.isArray(baseConfig.voiceIds) && baseConfig.voiceIds.every(voiceId => Utils.Is.isNumber(voiceId)), "baseConfig.voiceIds", baseConfig.voiceIds);
}

function assertStaffConfig(staffConfig: StaffConfig) {
    assertBaseConfig(staffConfig);
    assertArg(Utils.Is.isObject(staffConfig), "staffConfig", staffConfig);
    assertArg(staffConfig.type === "staff", "staffConfig.type", staffConfig.type);
    assertArg(Utils.Is.isEnumValue(staffConfig.clef, Clef), "staffConfig.clef", staffConfig.clef);
    assertArg(Utils.Is.isBooleanOrUndefined(staffConfig.isOctaveDown), "staffConfig.isOctaveDown", staffConfig.isOctaveDown);
    assertArg(Utils.Is.isUndefined(staffConfig.minNote) || isNote(staffConfig.minNote), "staffConfig.minNote", staffConfig.minNote);
    assertArg(Utils.Is.isUndefined(staffConfig.maxNote) || isNote(staffConfig.maxNote), "staffConfig.maxNote", staffConfig.maxNote);
    assertArg(Utils.Is.isStringOrUndefined(staffConfig.grandId), "staffConfig.grandId", staffConfig.grandId);
    assertArg(Utils.Is.isBooleanOrUndefined(staffConfig.isGrand), "staffConfig.isGrand", staffConfig.isGrand);
}

function assertTabConfig(tabConfig: TabConfig) {
    assertBaseConfig(tabConfig);
    assertArg(Utils.Is.isObject(tabConfig), "tabConfig", tabConfig);
    assertArg(tabConfig.type === "tab", "tabConfig.type", tabConfig.type);
    if (Utils.Is.isString(tabConfig.tuning)) {
        assertArg(TuningNameList.includes(tabConfig.tuning), "tabConfig.tuning", tabConfig.tuning);
    }
    else if (Utils.Is.isArray(tabConfig.tuning)) {
        assertArg(tabConfig.tuning.length === getStringNumbers().length && tabConfig.tuning.every(s => isNote(s)), "tabConfig.tuning", tabConfig.tuning);
    }
}

function assertNoteOptions(noteOptions: NoteOptions) {
    assertArg(Utils.Is.isObject(noteOptions), "noteOptions", noteOptions);
    assertArg(Utils.Is.isBooleanOrUndefined(noteOptions.dotted) || Utils.Is.isIntegerGte(noteOptions.dotted, 0), "noteOptions.dotted", noteOptions.dotted);
    assertArg(Utils.Is.isEnumValueOrUndefined(noteOptions.stem, Stem), "noteOptions.stem", noteOptions.stem);
    assertArg(Utils.Is.isStringOrUndefined(noteOptions.color), "noteOptions.color", noteOptions.color);
    assertArg(Utils.Is.isBooleanOrUndefined(noteOptions.arpeggio) || Utils.Is.isEnumValue(noteOptions.arpeggio, Arpeggio), "noteOptions.arpeggio", noteOptions.arpeggio);
    assertArg(Utils.Is.isBooleanOrUndefined(noteOptions.staccato), "noteOptions.staccato", noteOptions.staccato);
    assertArg(Utils.Is.isBooleanOrUndefined(noteOptions.diamond), "noteOptions.diamond", noteOptions.diamond);
    assertArg(Utils.Is.isBooleanOrUndefined(noteOptions.triplet), "noteOptions.triplet", noteOptions.triplet);
    assertArg((
        Utils.Is.isUndefined(noteOptions.string) ||
        isStringNumber(noteOptions.string) ||
        Utils.Is.isNonEmptyArray(noteOptions.string) && noteOptions.string.every(string => isStringNumber(string))
    ), "noteOptions.string", noteOptions.string);

    assertArg(Utils.Is.isUndefined((noteOptions as any).tieSpan), "NoteOptions.tieSpan was removed. Use addConnective(\"tie\", tieSpan)", "");
    assertArg(Utils.Is.isUndefined((noteOptions as any).slurSpan), "NoteOptions.slurSpan was removed. Use addConnective(\"slur\", slurSpan)", "");
}

function assertRestOptions(restOptions: RestOptions) {
    assertArg(Utils.Is.isObject(restOptions), "restOptions", restOptions);
    assertArg(Utils.Is.isBooleanOrUndefined(restOptions.dotted) || Utils.Is.isIntegerGte(restOptions.dotted, 0), "restOptions.dotted", restOptions.dotted);
    assertArg(Utils.Is.isStringOrUndefined(restOptions.staffPos) || Utils.Is.isInteger(restOptions.staffPos) || restOptions.staffPos instanceof Note, "restOptions.staffPos", restOptions.staffPos);
    assertArg(Utils.Is.isStringOrUndefined(restOptions.color), "restOptions.color", restOptions.color);
    assertArg(Utils.Is.isBooleanOrUndefined(restOptions.hide), "restOptions.hide", restOptions.hide);
    assertArg(Utils.Is.isBooleanOrUndefined(restOptions.triplet), "restOptions.triplet", restOptions.triplet);
}

function assertLyricsOptions(lyricsOptions: LyricsOptions) {
    assertArg(Utils.Is.isObject(lyricsOptions), "lyricsOptions", lyricsOptions);
    assertArg(Utils.Is.isEnumValueOrUndefined(lyricsOptions.align, LyricsAlign), "lyricsOptions.align", lyricsOptions.align);
    assertArg(Utils.Is.isEnumValueOrUndefined(lyricsOptions.hyphen, LyricsHyphen), "lyricsOptions.hyphen", lyricsOptions.hyphen);
}

function assertStaffTabOrGRoups(staffTabOrGroups: StaffTabOrGroups | undefined) {
    assertArg(
        Utils.Is.isStringOrUndefined(staffTabOrGroups) || Utils.Is.isIntegerGte(staffTabOrGroups, 0) ||
        Utils.Is.isNonEmptyArray(staffTabOrGroups) && staffTabOrGroups.every(staffTabOrGroup =>
            Utils.Is.isString(staffTabOrGroup) || Utils.Is.isIntegerGte(staffTabOrGroup, 0)
        )
        , "staffTabOrGroup", staffTabOrGroups
    );
}

function isNoteLength(noteLen: unknown): noteLen is NoteLength {
    try {
        validateNoteLength(noteLen);
        return true;
    }
    catch (e) {
        return false;
    }
}

function isTupletRatio(tupletRatio: unknown): tupletRatio is TupletRatio {
    try {
        validateTupletRatio(tupletRatio);
        return true;
    }
    catch (e) {
        return false;
    }
}

/** Tuplet builder type. */
export type TupletBuilder = {
    /**
     * Add note to a tuplet.
     * @param note - Instance of Note or string, single value (e.g. "C4") or array (e.g. ["C4", "E4", "G4"]).
     * @param noteLength - Note length (e.g. "4n").
     * @param noteOptions - Note options.
     * @returns - This tuplet builder object.
     */
    addNote: (note: Note | string | (Note | string)[], noteLength: NoteLength | NoteLengthStr, noteOptions?: NoteOptions) => TupletBuilder,
    /**
     * Add chord to a tuplet.
     * @param notes - Array of notes, each instance of Note or string (e.g. "D4"). 
     * @param noteLength - Note length (e.g. "4n"). 
     * @param noteOptions - Note options. 
     * @returns - This tuplet builder object. 
     */
    addChord: (notes: (Note | string)[], noteLength: NoteLength | NoteLengthStr, noteOptions?: NoteOptions) => TupletBuilder,
    /**
     * Add rest to a tuplet.
     * @param restLength - Rest length (e.g. "4n").  
     * @param restOptions - Rest options.
     * @returns - This tuplet builder object. 
     */
    addRest: (restLength: NoteLength | NoteLengthStr, restOptions?: RestOptions) => TupletBuilder
}

/** Etension builder type. */
export type ExtensionBuilder = {
    /**
     * Increase extension length by note length multiplied by number of notes.
     * @param noteLength - Length of note (e.g. "2n").
     * @param noteCount - Number of note lengths (default = 1).
     * @returns - this extension builder object.
     */
    notes: (noteLength: NoteLength | NoteLengthStr, noteCount?: number) => ExtensionBuilder,
    /**
     * Increase length of extension length by given number of measures.
     * @param measureCount - Number of measures.
     * @returns - this extension builder object.
     */
    measures: (measureCount: number) => ExtensionBuilder,
    /**
     * Create as long extension line as possible.
     * @returns - this extension builder object.
     */
    infinity: () => ExtensionBuilder,
    /**
     * Create an invisible extension.
     * @returns - this extension builder object.
     */
    hide: () => ExtensionBuilder
}

/**
 * Document builder class.
 * ```ts
 * // Example
 * let doc = new Score.DocumentBuilder()
 *     .addScoreConfiguration({ type: "staff", clef: "G", isOctavewDown: true })
 *     .setMeasuresPerRow(4)
 *     .addMeasure()
 *     .addNote(1, "C3", "4n")
 *     .addChord(1, ["C3", "E3", "G3"], "4n").addLabel("chord", "C")
 *     .addRest(1, "4n")
 *     // etc.
 *     .getDEocument();
 * ```
 */
export class DocumentBuilder {
    private readonly doc: ObjDocument;

    /**
     * Create new document builder instance.
     */
    constructor() {
        this.doc = new ObjDocument();
    }

    /**
     * Use staff preset values to set score confguration. This call will request new score row.
     * @param staffPreset - Staff preset (e.g. "treble").
     */
    setScoreConfiguration(staffPreset: StaffPreset | `${StaffPreset}`): DocumentBuilder;
    /**
     * Use staff preset values to set score confguration. This call will request new score row.
     * @param config - Score configuration (e.g. { type: "staff", clef: "G", isOctavewDown: true }).
     */
    setScoreConfiguration(config: ScoreConfiguration): DocumentBuilder;
    setScoreConfiguration(config: StaffPreset | `${StaffPreset}` | ScoreConfiguration): DocumentBuilder {
        if (Utils.Is.isEnumValue(config, StaffPreset)) {
            // Ok
            this.doc.setScoreConfiguration(config);
        }
        else if (Utils.Is.isObject(config) && config.type === "staff") {
            assertStaffConfig(config);
            this.doc.setScoreConfiguration(config);
        }
        else if (Utils.Is.isObject(config) && config.type === "tab") {
            assertTabConfig(config);
            this.doc.setScoreConfiguration(config);
        }
        else if (Utils.Is.isNonEmptyArray(config)) {
            config.forEach(c => {
                if (Utils.Is.isObject(c) && c.type === "staff") {
                    assertStaffConfig(c);
                }
                else if (Utils.Is.isObject(c) && c.type === "tab") {
                    assertTabConfig(c);
                }
                else {
                    assertArg(false, "config", config);
                }
            });
            this.doc.setScoreConfiguration(config);
        }
        else {
            assertArg(false, "config", config);
        }

        return this;
    }

    private getMeasure(): ObjMeasure {
        return this.doc.getLastMeasure() ?? this.doc.addMeasure();
    }

    /**
     * Get music document after finished building.
     * @returns - Music document.
     */
    getDocument(): MDocument {
        return this.doc.getMusicInterface();
    }

    /**
     * Set header texts.
     * @param title - Title of this docmument/musical piece.
     * @param composer - Composer of this document/musical piece.
     * @param arranger - Arranger of this document/musical piece.
     * @returns - This document builder instance.
     */
    setHeader(title?: string, composer?: string, arranger?: string): DocumentBuilder {
        assertArg(Utils.Is.isStringOrUndefined(title), "title", title);
        assertArg(Utils.Is.isStringOrUndefined(composer), "composer", composer);
        assertArg(Utils.Is.isStringOrUndefined(arranger), "arranger", arranger);
        this.doc.setHeader(title, composer, arranger);
        return this;
    }

    /**
     * Automatically limit number of measures per score row.
     * @param measuresPerRow - Number of measures per row. Must be integer >=1 or Infinity.
     * @returns - This document builder instance.
     */
    setMeasuresPerRow(measuresPerRow: number): DocumentBuilder {
        assertArg(Utils.Is.isIntegerGte(measuresPerRow, 1) || Utils.Is.isPosInfinity(measuresPerRow), "measuresPerRow", measuresPerRow);
        this.doc.setMeasuresPerRow(measuresPerRow);
        return this;
    }

    /**
     * Add new measure.
     * @returns - This document builder instance.
     */
    addMeasure(): DocumentBuilder {
        this.doc.addMeasure();
        return this;
    }

    /**
     * Set key signature for current measure and forward.
     * @param tonic - Tonic note (e.g. "C").
     * @param scaleType - Scale type (e.g. string "Major" or ScaleType.Major).
     * @returns - This document builder instance.
     */
    setKeySignature(tonic: string, scaleType: ScaleType | `${ScaleType}`): DocumentBuilder;
    /**
     * Set key signature for current measure and forward.
     * @param keySignature - KeySignature object instance.
     * @returns - This document builder instance.
     */
    setKeySignature(keySignature: KeySignature): DocumentBuilder;
    /**
     * Set key signature for current measure and forward.
     * @param keySignature - Key signature string (e.g. "C Major").
     * @returns - This document builder instance.
     */
    setKeySignature(keySignature: string): DocumentBuilder;
    /**
     * Set key signature for current measure and forward.
     * @param scale - Scale object instance.
     * @returns - This document builder instance.
     */
    setKeySignature(scale: Scale): DocumentBuilder;
    setKeySignature(...args: unknown[]): DocumentBuilder {
        assertArg((
            args[0] instanceof Scale ||
            args[0] instanceof KeySignature ||
            Utils.Is.isNonEmptyString(args[0]) && (args.length === 1 || Utils.Is.isEnumValue(args[1], ScaleType))
        ), "keySignature", args);
        this.getMeasure().setKeySignature(...args);
        return this;
    }

    /**
     * Set time signature for current measure and forward.
     * @param timeSignature - TimeSignature object instance.
     * @returns - This document builder instance.
     */
    setTimeSignature(timeSignature: TimeSignature): DocumentBuilder;
    /**
     * Set time signature for current measure and forward.
     * @param timeSignature - TimeSignatures enum value or string (e.g. "3/4").
     * @param beamGrouping - Beam grouping (e.g. "3-2" for time signature "5/8").
     * @returns - This document builder instance.
     */
    setTimeSignature(timeSignature: TimeSignatures | `${TimeSignatures}`, beamGrouping?: BeamGrouping | `${BeamGrouping}`): DocumentBuilder;
    /**
     * Set time signature for current measure and forward.
     * @param beatCount - Beat count of time signature (e.g. 3 in "3/4").
     * @param beatSize - Beat size of time signature (e.g. 4 in "3/4").
     * @param beamGrouping - Beam grouping (e.g. "3-2" for time signature "5/8").
     * @returns - This document builder instance.
     */
    setTimeSignature(beatCount: number, beatSize: number, beamGrouping?: BeamGrouping | `${BeamGrouping}`): DocumentBuilder;
    setTimeSignature(...args: unknown[]): DocumentBuilder {
        if (args[0] instanceof TimeSignature) {
            this.getMeasure().setTimeSignature(args[0]);
        }
        else if (Utils.Is.isEnumValue(args[0], TimeSignatures) && Utils.Is.isEnumValueOrUndefined(args[1], BeamGrouping)) {
            this.getMeasure().setTimeSignature(new TimeSignature(args[0], args[1]));
        }
        else if (Utils.Is.isIntegerGte(args[0], 1) && Utils.Is.isIntegerGte(args[1], 1) && Utils.Is.isEnumValueOrUndefined(args[2], BeamGrouping)) {
            this.getMeasure().setTimeSignature(new TimeSignature(args[0], args[1], args[2]));
        }
        else {
            assertArg(false, "timeSignature args", args);
        }

        return this;
    }

    /**
     * Set tempo.
     * @param beatsPerMinute - Tempo beats per minute.
     * @returns - This document builder instance.
     */
    setTempo(beatsPerMinute: number): DocumentBuilder;
    /**
     * Set tempo.
     * @param beatsPerMinute - Tempo beats per minute.
     * @param beatLength - Length of one beat.
     * @returns - This document builder instance.
     */
    setTempo(beatsPerMinute: number, beatLength: NoteLength | NoteLengthStr): DocumentBuilder;
    /**
     * @deprecated - Use dotted beatLength instead (e.g. "4..").
     * @param beatsPerMinute - Tempo beats per minute.
     * @param beatLength - Length of one beat.
     * @param dotted - Dot count of length of one beat.
     * @returns - This document builder instance.
     */
    setTempo(beatsPerMinute: number, beatLength: NoteLength | NoteLengthStr, dotted: boolean | number): DocumentBuilder;
    setTempo(beatsPerMinute: number, beatLength?: NoteLength | NoteLengthStr, dotted?: boolean | number): DocumentBuilder {
        assertArg(Utils.Is.isIntegerGte(beatsPerMinute, 1), "beatsPerMinute", beatsPerMinute);
        if (beatLength === undefined) {
            assertArg(Utils.Is.isUndefined(dotted), "dotted", dotted);
        }
        else {
            assertArg(Utils.Is.isEnumValue(beatLength, NoteLength) || isNoteLength(beatLength), "beatLength", beatLength);
            assertArg(Utils.Is.isBooleanOrUndefined(dotted) || Utils.Is.isIntegerGte(dotted, 0), "dotted", dotted);
        }
        this.getMeasure().setTempo(beatsPerMinute, beatLength, dotted);
        return this;
    }

    /**
     * Add note to current measure.
     * @param voiceId - Voice id to add note to.
     * @param note - Instance of Note or string, single value (e.g. "C4") or array (e.g. ["C4", "E4", "G4"]).
     * @param noteLength - Note length (e.g. "4n").
     * @param noteOptions - Note options.
     * @returns - This document builder instance.
     */
    addNote(voiceId: VoiceId, note: Note | string | (Note | string)[], noteLength: NoteLength | NoteLengthStr, noteOptions?: NoteOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(
            note instanceof Note || Utils.Is.isNonEmptyString(note) ||
            Utils.Is.isArray(note) && note.every(note => note instanceof Note || Utils.Is.isNonEmptyString(note)),
            "note", note);
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLength(noteLength), "noteLength", noteLength);
        noteOptions ??= {}
        assertNoteOptions(noteOptions);
        if (Utils.Is.isArray(note)) {
            let string = noteOptions.string;
            note.forEach((note, noteId) => {
                noteOptions.string = Utils.Is.isArray(string) ? string[noteId] : string;
                this.getMeasure().addNoteGroup(voiceId, [note], noteLength, noteOptions);
            });
        }
        else {
            this.getMeasure().addNoteGroup(voiceId, [note], noteLength, noteOptions);
        }
        return this;
    }

    /**
     * Add chord to current measure.
     * @param voiceId - Voice id to add chord to.
     * @param notes - Array of notes, each instance of Note or string (e.g. "D4"). 
     * @param noteLength - Note length (e.g. "4n"). 
     * @param noteOptions - Note options. 
     * @returns - This document builder instance.
     */
    addChord(voiceId: VoiceId, notes: (Note | string)[], noteLength: NoteLength | NoteLengthStr, noteOptions?: NoteOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isNonEmptyArray(notes) && notes.every(note => note instanceof Note || Utils.Is.isNonEmptyString(note)), "notes", notes);
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLength(noteLength), "noteLength", noteLength);
        noteOptions ??= {}
        assertNoteOptions(noteOptions);
        this.getMeasure().addNoteGroup(voiceId, notes, noteLength, noteOptions);
        return this;
    }

    /**
     * Add rest to current measure.
     * @param voiceId - Voice id to add rest to.
     * @param restLength - Rest length (e.g. "4n").  
     * @param restOptions - Rest options.
     * @returns - This document builder instance.
     */
    addRest(voiceId: VoiceId, restLength: NoteLength | NoteLengthStr, restOptions?: RestOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isEnumValue(restLength, NoteLength) || isNoteLength(restLength), "restLength", restLength);
        restOptions ??= {}
        assertRestOptions(restOptions);
        this.getMeasure().addRest(voiceId, restLength, restOptions);
        return this;
    }

    /**
     * Usage:
     * ```ts
     * addTuplet(0, Theory.Tuplet.Triplet, notes => {
     *     notes.addNote("G3", Theory.NoteLength.Eighth);
     *     notes.addNote("B3", Theory.NoteLength.Eighth);
     *     notes.addNote("D4", Theory.NoteLength.Eighth);
     * });
     * ```
     * 
     * @param voiceId - Voice id to add tuplet to.
     * @param tupletRatio - You can also use Theory.Tuplet presets (e.g. Theory.Tuplet.Triplet).
     * @param tupletBuilder - Tuplet builder function to build tuplet.
     * @returns - This document builder instance.
     */
    addTuplet(voiceId: VoiceId, tupletRatio: TupletRatio & TupletOptions, tupletBuilder: (notes: TupletBuilder) => void): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isFunction(tupletBuilder), "tupletBuilder", tupletBuilder);
        assertArg(isTupletRatio(tupletRatio) && Utils.Is.isBooleanOrUndefined(tupletRatio.showRatio), "tupletRatio", tupletRatio);

        let tupletSymbols: RhythmSymbol[] = [];

        const helper: TupletBuilder = {
            addNote: (note, noteLength, noteOptions) => {
                assertArg(
                    note instanceof Note || Utils.Is.isNonEmptyString(note) ||
                    Utils.Is.isArray(note) && note.every(note => note instanceof Note || Utils.Is.isNonEmptyString(note)),
                    "note", note);
                assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLength(noteLength), "noteLength", noteLength);
                noteOptions ??= {}
                delete noteOptions.triplet;
                assertNoteOptions(noteOptions);
                if (Utils.Is.isArray(note)) {
                    let string = noteOptions.string;
                    note.forEach((note, noteId) => {
                        noteOptions.string = Utils.Is.isArray(string) ? string[noteId] : string;
                        let s = this.getMeasure().addNoteGroup(voiceId, [note], noteLength, noteOptions, tupletRatio);
                        tupletSymbols.push(s);
                    });
                }
                else {
                    let s = this.getMeasure().addNoteGroup(voiceId, [note], noteLength, noteOptions, tupletRatio);
                    tupletSymbols.push(s);
                }
                return helper;
            },
            addChord: (notes, noteLength, noteOptions) => {
                assertArg(Utils.Is.isNonEmptyArray(notes) && notes.every(note => note instanceof Note || Utils.Is.isNonEmptyString(note)), "notes", notes);
                assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLength(noteLength), "noteLength", noteLength);
                noteOptions ??= {}
                delete noteOptions.triplet;
                assertNoteOptions(noteOptions);
                let s = this.getMeasure().addNoteGroup(voiceId, notes, noteLength, noteOptions, tupletRatio);
                tupletSymbols.push(s);
                return helper;
            },
            addRest: (restLength, restOptions) => {
                assertArg(Utils.Is.isEnumValue(restLength, NoteLength) || isNoteLength(restLength), "restLength", restLength);
                restOptions ??= {}
                delete restOptions.triplet;
                assertRestOptions(restOptions);
                let s = this.getMeasure().addRest(voiceId, restLength, restOptions, tupletRatio);
                tupletSymbols.push(s);
                return helper;
            }
        };

        tupletBuilder(helper);

        ObjBeamGroup.createTuplet(tupletSymbols, tupletRatio);

        return this;
    }

    private currentLyricsAlign: LyricsAlign | `${LyricsAlign}` = LyricsAlign.Center;

    private addLyricsInternal(staffTabOrGroups: StaffTabOrGroups | undefined, verse: VerseNumber, lyricsLength: NoteLength | NoteLengthStr, lyricsText: string | string[], lyricsOptions?: LyricsOptions): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(isVerseNumber(verse), "verse", verse);
        assertArg(Utils.Is.isEnumValue(lyricsLength, NoteLength), "lyricsLength", lyricsLength);
        assertArg(Utils.Is.isString(lyricsText) || Utils.Is.isArray(lyricsText) && lyricsText.every(text => Utils.Is.isString(text)), "lyricsText", lyricsText);

        lyricsOptions ??= {}

        assertLyricsOptions(lyricsOptions);

        if (lyricsOptions.align !== undefined) {
            this.currentLyricsAlign = lyricsOptions.align;
        }
        else {
            lyricsOptions.align ??= this.currentLyricsAlign;
        }

        if (Utils.Is.isArray(lyricsText)) {
            lyricsText.forEach(text => this.getMeasure().addLyrics(staffTabOrGroups, verse, lyricsLength, text, lyricsOptions));
        }
        else {
            this.getMeasure().addLyrics(staffTabOrGroups, verse, lyricsLength, lyricsText, lyricsOptions);
        }

        return this;
    }

    /**
     * Add lyrics to current measure.
     * @param verse - Verse number (e.g. 1).
     * @param lyricsLength - Lyrics text length (e.g. "2n").
     * @param lyricsText - Lyrics text (empty space if omitted), single value or array.
     * @param lyricsOptions - Lyrics options.
     * @returns - This document builder instance.
     */
    addLyrics(verse: VerseNumber, lyricsLength: NoteLength | NoteLengthStr, lyricsText?: string | string[], lyricsOptions?: LyricsOptions): DocumentBuilder {
        return this.addLyricsInternal(undefined, verse, lyricsLength, lyricsText ?? "", lyricsOptions);
    }

    /**
     * Add lyrics to current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param verse - Verse number (e.g. 1).
     * @param lyricsLength - Lyrics text length (e.g. "2n").
     * @param lyricsText - Lyrics text (empty space if omitted), single value or array.
     * @param lyricsOptions - Lyrics options.
     * @returns - This document builder instance.
     */
    addLyricsTo(staffTabOrGroups: StaffTabOrGroups, verse: VerseNumber, lyricsLength: NoteLength | NoteLengthStr, lyricsText?: string | string[], lyricsOptions?: LyricsOptions): DocumentBuilder {
        return this.addLyricsInternal(staffTabOrGroups, verse, lyricsLength, lyricsText ?? "", lyricsOptions);
    }

    private addFermataInternal(staffTabOrGroups: StaffTabOrGroups | undefined, fermata: Fermata | `${Fermata}`): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(fermata, Fermata), "fermata", fermata);
        this.getMeasure().addFermata(staffTabOrGroups, fermata as Fermata);
        return this;
    }

    /**
     * Add fermata to current measure.
     * @param fermata - Fermata type (e.g. "atNote" or Fermata.AtrNote).
     * @returns - This document builder instance.
     */
    addFermata(fermata: Fermata | `${Fermata}` = Fermata.AtNote): DocumentBuilder {
        return this.addFermataInternal(undefined, fermata);
    }

    /**
     * Add Fermata to current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param fermata - Fermata type (e.g. "atNote" or Fermata.AtrNote).
     * @returns - This document builder instance.
     */
    addFermataTo(staffTabOrGroups: StaffTabOrGroups, fermata: Fermata | `${Fermata}` = Fermata.AtNote): DocumentBuilder {
        return this.addFermataInternal(staffTabOrGroups, fermata);
    }

    private addNavigationInternal(staffTabOrGroups: StaffTabOrGroups | undefined, navigation: Navigation | `${Navigation}`, ...args: unknown[]): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(navigation, Navigation), "navigation", navigation);
        if (navigation === Navigation.EndRepeat && args.length > 0) {
            assertArg(Utils.Is.isIntegerGte(args[0], 1), "playCount", args[0]);
        }
        else if (navigation === Navigation.Ending && args.length > 0) {
            assertArg(args.every(passage => Utils.Is.isIntegerGte(passage, 1)), "passages", args);
        }
        this.getMeasure().addNavigation(staffTabOrGroups, navigation as Navigation, ...args);
        return this;
    }

    /**
     * Add navigation element to current measure.
     * @param navigation - Navigation element (e.g. "D.S. al Fine" or Navigation.DS_al_Fine).
     * @returns - This document builder instance.
     */
    addNavigation(navigation: Navigation | `${Navigation}`): DocumentBuilder;
    /**
     * Add end repeat navigation element to current measure.
     * @param navigation - End repeat navigation element ("endRepeat" or Navigation.EndRepeat).
     * @param playCount - Number of times to play the ended repeat section.
     * @returns - This document builder instance.
     */
    addNavigation(navigation: Navigation.EndRepeat | `${Navigation.EndRepeat}`, playCount: number): DocumentBuilder;
    /**
     * Add ending navigation element to current measure.
     * @param navigation - Ending navigation element ("ending" or Navigation.Ending).
     * @param passages - Passage numbers for measure marked by this ending is played.
     * @returns - This document builder instance.
     */
    addNavigation(navigation: Navigation.Ending | `${Navigation.Ending}`, ...passages: number[]): DocumentBuilder;
    addNavigation(navigation: Navigation | `${Navigation}`, ...args: unknown[]): DocumentBuilder {
        return this.addNavigationInternal(undefined, navigation, ...args);
    }

    /**
     * Add navigation element to current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param navigation 
     * @returns - This document builder instance.
     */
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation | `${Navigation}`): DocumentBuilder;
    /**
     * Add end repeat navigation element to current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param navigation 
     * @param playCount 
     * @returns - This document builder instance.
     */
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation.EndRepeat | `${Navigation.EndRepeat}`, playCount: number): DocumentBuilder;
    /**
     * Add ending navigation element to current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param navigation 
     * @param passages 
     * @returns - This document builder instance.
     */
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation.Ending | `${Navigation.Ending}`, ...passages: number[]): DocumentBuilder;
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation | `${Navigation}`, ...args: unknown[]): DocumentBuilder {
        return this.addNavigationInternal(staffTabOrGroups, navigation, ...args);
    }

    private addAnnotationInternal(staffTabOrGroups: StaffTabOrGroups | undefined, annotation: Annotation | `${Annotation}` | undefined, text: string): DocumentBuilder {
        annotation ??= getAnnotation(text);

        if (annotation === undefined) {
            throw new MusicError(MusicErrorType.Score, `Annotation text "${text}" is not known annotation.`);
        }

        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(annotation, Annotation), "annotation", annotation);
        assertArg(Utils.Is.isNonEmptyString(text), "text", text);
        this.getMeasure().addAnnotation(staffTabOrGroups, annotation as Annotation, text);
        return this;
    }

    /**
     * Add annotation text to column of last added note/chord/rest in current measure.
     * @param text - Known annotation text (e.g. "pp").
     * @returns - This document builder instance.
     */
    addAnnotation(text: AnnotationText): DocumentBuilder;
    /**
     * Add annotation text to column of last added note/chord/rest in current measure.
     * @param annotation - Annotation type (e.g. "tempo" or Annotation.Tempo).
     * @param text - Annotation text (unrestricted).
     * @returns - This document builder instance.
     */
    addAnnotation(annotation: Annotation | `${Annotation}`, text: string): DocumentBuilder;
    addAnnotation(...args: [string] | [Annotation | `${Annotation}`, string]): DocumentBuilder {
        if (args.length === 1) {
            return this.addAnnotationInternal(undefined, undefined, args[0]);
        }
        else {
            return this.addAnnotationInternal(undefined, args[0], args[1]);
        }
    }

    /**
     * Add annotation text to column of last added note/chord/rest in current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param text - Known annotation text (e.g. "pp").
     * @returns - This document builder instance.
     */
    addAnnotationTo(staffTabOrGroups: StaffTabOrGroups, text: AnnotationText): DocumentBuilder;
    /**
     * Add annotation text to column of last added note/chord/rest in current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param annotation - Annotation type (e.g. "tempo" or Annotation.Tempo).
     * @param text - Annotation text (unrestricted).
     * @returns - This document builder instance.
     */
    addAnnotationTo(staffTabOrGroups: StaffTabOrGroups, annotation: Annotation | `${Annotation}`, text: string): DocumentBuilder;
    addAnnotationTo(staffTabOrGroups: StaffTabOrGroups, ...args: [string] | [Annotation | `${Annotation}`, string]): DocumentBuilder {
        if (args.length === 1) {
            return this.addAnnotationInternal(staffTabOrGroups, undefined, args[0]);
        }
        else {
            return this.addAnnotationInternal(staffTabOrGroups, args[0], args[1]);
        }
    }

    private addLabelInternal(staffTabOrGroups: StaffTabOrGroups | undefined, label: Label | `${Label}`, text: string): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(label, Label), "label", label);
        assertArg(Utils.Is.isNonEmptyString(text), "text", text);
        this.getMeasure().addLabel(staffTabOrGroups, label as Label, text);
        return this;
    }

    /**
     * Add label text to column of last added note/chord/rest in current measure.
     * @param label - Label type (e.g. "chord" or Label.Chord).
     * @param text - label text (e.g. "Am").
     * @returns - This document builder instance.
     */
    addLabel(label: Label | `${Label}`, text: string): DocumentBuilder {
        return this.addLabelInternal(undefined, label, text);
    }

    /**
     * Add label text to column of last added note/chord/rest in current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param label - Label type (e.g. "chord" or Label.Chord).
     * @param text - label text (e.g. "Am").
     * @returns - This document builder instance.
     */
    addLabelTo(staffTabOrGroups: StaffTabOrGroups, label: Label | `${Label}`, text: string): DocumentBuilder {
        return this.addLabelInternal(staffTabOrGroups, label, text);
    }

    /**
     * Add tie starting from last added note/chord.
     * @param connective - Connective type ("tie" or Connective.Tie).
     * @param tieSpan - How many notes across this tie spans.
     * @param notAnchor - Anchor point for note and this tie.
     * @returns - This document builder instance.
     */
    addConnective(connective: Connective.Tie | `${Connective.Tie}`, tieSpan?: number | TieType | `${TieType}`, notAnchor?: NoteAnchor | `${NoteAnchor}`): DocumentBuilder;
    /**
     * Add slur starting from last added note/chord.
     * @param connective - Connective type ("slur" or Connective.Slur).
     * @param slurSpan - How many notes across this slur spans.
     * @param notAnchor - Anchor point for note and this slur.
     * @returns - This document builder instance.
     */
    addConnective(connective: Connective.Slur | `${Connective.Slur}`, slurSpan?: number, notAnchor?: NoteAnchor | `${NoteAnchor}`): DocumentBuilder;
    /**
     * Add slide starting from last added note/chord.
     * @param connective - Connective type ("slide" or Connective.Slide).
     * @param notAnchor - Anchor point for note and this slide.
     * @returns - This document builder instance.
     */
    addConnective(connective: Connective.Slide | `${Connective.Slide}`, notAnchor?: NoteAnchor | `${NoteAnchor}`): DocumentBuilder;
    addConnective(connective: Connective | `${Connective}`, ...args: unknown[]): DocumentBuilder {
        assertArg(Utils.Is.isEnumValue(connective, Connective), "connective", connective);

        if (connective === Connective.Tie) {
            assertArg(Utils.Is.isIntegerOrUndefined(args[0]) || Utils.Is.isEnumValue(args[0], TieType), "tieSpan", args[0]);
            assertArg(Utils.Is.isEnumValueOrUndefined(args[1], NoteAnchor), "noteAnchor", args[1]);
            let tieSpan = args[0] as number | TieType | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective as Connective.Tie, tieSpan, noteAnchor);
        }
        else if (connective === Connective.Slur) {
            assertArg(Utils.Is.isIntegerOrUndefined(args[0]), "slurSpan", args[0]);
            assertArg(Utils.Is.isEnumValueOrUndefined(args[1], NoteAnchor), "noteAnchor", args[1]);
            let slurSpan = args[0] as number | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective as Connective.Slur, slurSpan, noteAnchor);
        }
        else if (connective === Connective.Slide) {
            assertArg(Utils.Is.isEnumValueOrUndefined(args[0], NoteAnchor), "noteAnchor", args[0]);
            let noteAnchor = args[0] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective as Connective.Slide, noteAnchor);
        }

        return this;
    }

    /**
     * Add extension line to previously added annotation or label element.
     * ```ts
     *     // Example
     *     addExtension(ext => ext.notes("1n", 2))          // length is 2 whole notes
     *     addExtension(ext => ext.measures(3).hide())      // length is 3 measures, hidden
     *     addExtension(ext => ext.measures(1).notes("8n")) // length is 1 measure + 1 eigth note
     *     addExtension(ext => ext.infinity())              // length is as long as possible
     * ```
     * @param extensionBuilder - Extension builder function used to build exstension.
     * @returns - This document builder instance.
     */
    addExtension(extensionBuilder?: (ext: ExtensionBuilder) => void): DocumentBuilder {
        assertArg(Utils.Is.isFunctionOrUndefined(extensionBuilder), "addExtension() has new usage, for e.g. addExtension(ext => ext.measures(2)). Please refer to README or API Reference.", extensionBuilder);

        let ticks: number = 0;
        let visible: boolean = true;

        const helper: ExtensionBuilder = {
            notes: (noteLength, noteCount) => {
                assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLength(noteLength), "noteLength", noteLength);
                assertArg(Utils.Is.isUndefined(noteCount) || Utils.Is.isNumber(noteCount) && noteCount >= 0, "noteCount", noteCount);
                ticks += RhythmProps.get(noteLength).ticks * (noteCount ?? 1);
                return helper;
            },
            measures: (measureCount) => {
                assertArg(Utils.Is.isNumber(measureCount) && measureCount >= 1, "measureCount", measureCount);
                ticks += this.getMeasure().getMeasureTicks() * measureCount;
                return helper;
            },
            infinity: () => {
                ticks = Infinity;
                return helper;
            },
            hide: () => {
                visible = false;
                return helper;
            }
        };

        if (extensionBuilder) {
            extensionBuilder(helper);
        }
        else {
            ticks = Infinity;
        }

        this.getMeasure().addExtension(ticks, visible);
        return this;
    }

    /**
     * Add staff group.
     * @param groupName - Name of staff group.
     * @param staffsTabsAndGroups - staff/tab index (0=top), staff/tab name, or staff group name. Single value or array.
     * @param verticalPosition - Vertical position, are elements added above, below or both.
     * @returns - This document builder instance.
     */
    addStaffGroup(groupName: string, staffsTabsAndGroups: number | string | (number | string)[], verticalPosition: VerticalPosition | `${VerticalPosition}` = VerticalPosition.Auto): DocumentBuilder {
        assertArg(Utils.Is.isNonEmptyString(groupName), "groupName", groupName);
        assertArg(
            Utils.Is.isNonEmptyString(staffsTabsAndGroups) || Utils.Is.isIntegerGte(staffsTabsAndGroups, 0) ||
            Utils.Is.isNonEmptyArray(staffsTabsAndGroups) && staffsTabsAndGroups.every(line => Utils.Is.isNonEmptyString(line) || Utils.Is.isIntegerGte(line, 0)),
            "staffsTabsAndGroups", staffsTabsAndGroups
        );
        assertArg(Utils.Is.isEnumValue(verticalPosition, VerticalPosition), "verticalPosition", verticalPosition);
        this.doc.addStaffGroup(groupName, staffsTabsAndGroups, verticalPosition as VerticalPosition);
        return this;
    }

    /**
     * Add song end. Adds certain bar line at the end of measure.
     * @returns - This document builder instance.
     */
    endSong(): DocumentBuilder {
        this.getMeasure().endSong();
        return this;
    }

    /**
     * Add section end. Adds certain bar line at the end of measure.
     * @returns - This document builder instance.
     */
    endSection(): DocumentBuilder {
        this.getMeasure().endSection();
        return this;
    }

    /**
     * End current score row. Next measure will start new row.
     * @returns - This document builder instance.
     */
    endRow(): DocumentBuilder {
        this.doc.getLastMeasure()?.endRow();
        return this;
    }

    /**
     * Add rests to fill current measure.
     * @param voiceId - Voice id to add rests to. Single value, array or all if omitted.
     * @returns - This document builder instance.
     */
    completeRests(voiceId?: VoiceId | VoiceId[]): DocumentBuilder {
        assertArg(Utils.Is.isUndefined(voiceId) || isVoiceId(voiceId) || Utils.Is.isArray(voiceId) && voiceId.every(id => isVoiceId(id)), "voiceId", voiceId);
        this.getMeasure().completeRests(voiceId);
        return this;
    }

    /**
     * Add notes of given scale in ascending order.
     * @param scale - Scale.
     * @param bottomNote - Scale starts from note >= bottom note.
     * @param numOctaves - Number of octaves to add.
     * @returns - This document builder instance.
     */
    addScaleArpeggio(scale: Scale, bottomNote: string, numOctaves: number): DocumentBuilder {
        assertArg(Utils.Is.isNonEmptyString(bottomNote), "bottomNote", bottomNote);
        assertArg(Utils.Is.isIntegerGte(numOctaves, 1), "numOctaves", numOctaves);

        let ts = this.getMeasure().getTimeSignature();
        let notes = scale.getScaleNotes(bottomNote, numOctaves);

        for (let i = 0; i < notes.length; i++) {
            if (i % ts.beatCount === 0 && i > 0) {
                this.addMeasure();
            }

            let note = notes[i];

            this.addNote(0, note, ts.beatLength);
            this.addLabel(Label.Note, note.formatOmitOctave(SymbolSet.Unicode));
        }

        return this;
    }
}