import { Guard, Utils } from "@tspro/ts-utils-lib";
import { Annotation, AnnotationText, Arpeggio, ArticulationAnnotation, BaseConfig, Clef, Connective, Fermata, getStringNumbers, isStringNumber, isVerseNumber, isVoiceId, Label, LyricsAlign, LyricsHyphen, LyricsOptions, MeasureOptions, Navigation, NoteAnchor, NoteOptions, RestOptions, ScoreConfiguration, StaffConfig, StaffPreset, StaffTabOrGroups, Stem, StringNumber, TabConfig, TieType, TupletOptions, VerseNumber, VerticalPosition, VoiceId } from "./types";
import { MDocument } from "./mobjects";
import { ObjDocument } from "../engine/obj-document";
import { BeamGrouping, isNoteLength, isTupletRatio, KeySignature, Note, NoteLength, NoteLengthStr, RhythmProps, Scale, ScaleType, SymbolSet, TimeSignature, TimeSignatures, TuningNameList, TupletRatio, validateNoteLength, validateTupletRatio } from "web-music-score/theory";
import { MusicError, MusicErrorType } from "web-music-score/core";
import { ObjMeasure } from "../engine/obj-measure";
import { RhythmSymbol } from "../engine/obj-rhythm-column";
import { ObjBeamGroup } from "../engine/obj-beam-group";
import { getAnnotation } from "../engine/element-data";
import { AssertUtil, warnDeprecated } from "shared-src";

function assertObjHasNoProp(obj: Record<string, unknown>, prop: string, msg: string) {
    AssertUtil.assertMsg(!Guard.isTypedObject(obj, [prop]), msg);
}

function assertBaseConfig(baseConfig: BaseConfig) {
    AssertUtil.assert(
        Guard.isObject(baseConfig),
        Guard.isStringOrUndefined(baseConfig.name),
        Guard.isUndefined(baseConfig.voiceId) || isVoiceId(baseConfig.voiceId) || Guard.isArray(baseConfig.voiceId) && baseConfig.voiceId.every(voiceId => isVoiceId(voiceId))
    );

    assertObjHasNoProp(baseConfig, "voiceIds", "Baseconfig.voiceIds was removed. Use BaseConfig.voiceId instead.");

    if (Guard.isArray(baseConfig.voiceId)) {
        baseConfig.voiceId = Utils.Arr.removeDuplicates(baseConfig.voiceId);
    }

    AssertUtil.assert(Guard.isStringOrUndefined(baseConfig.instrument));
}

function assertStaffConfig(staffConfig: StaffConfig) {
    assertBaseConfig(staffConfig);

    AssertUtil.assert(
        Guard.isObject(staffConfig),
        Guard.isStrictEqual(staffConfig.type, "staff"),
        Guard.isEnumValue(staffConfig.clef, Clef),
        Guard.isBooleanOrUndefined(staffConfig.isOctaveDown),
        Guard.isUndefined(staffConfig.minNote) || Note.isNote(staffConfig.minNote),
        Guard.isUndefined(staffConfig.maxNote) || Note.isNote(staffConfig.maxNote),
        Guard.isStringOrUndefined(staffConfig.grandId)
    );

    assertObjHasNoProp(staffConfig, "isGrand", "StaffConfig.isGrand was removed. Use StaffConfig.grandId instead.");
}


function assertTabConfig(tabConfig: TabConfig) {
    assertBaseConfig(tabConfig);

    AssertUtil.assert(
        Guard.isObject(tabConfig),
        Guard.isStrictEqual(tabConfig.type, "tab"),
        (
            Guard.isUndefined(tabConfig.tuning) ||
            Guard.isString(tabConfig.tuning) && Guard.isIncluded(tabConfig.tuning, TuningNameList) ||
            Guard.isArray(tabConfig.tuning) && Guard.isStrictEqual(tabConfig.tuning.length, getStringNumbers().length && tabConfig.tuning.every(s => Note.isNote(s)))
        )
    );
}

function assertNoteOptions(noteOptions: NoteOptions) {
    AssertUtil.assert(
        Guard.isObject(noteOptions),
        Guard.isEnumValueOrUndefined(noteOptions.stem, Stem),
        Guard.isStringOrUndefined(noteOptions.color),
        Guard.isBooleanOrUndefined(noteOptions.arpeggio) || Guard.isEnumValue(noteOptions.arpeggio, Arpeggio),
        Guard.isBooleanOrUndefined(noteOptions.staccato),
        Guard.isBooleanOrUndefined(noteOptions.diamond),
        (
            Guard.isUndefined(noteOptions.string) ||
            isStringNumber(noteOptions.string) ||
            Guard.isEmptyArray(noteOptions.string) ||
            Guard.isNonEmptyArray(noteOptions.string) && noteOptions.string.every(string => isStringNumber(string))
        )
    );

    assertObjHasNoProp(noteOptions, "dotted", "NoteOptions.dotted was removed.");
    assertObjHasNoProp(noteOptions, "triplet", "NoteOptions.triplet was removed.");
    assertObjHasNoProp(noteOptions, "tieSpan", `NoteOptions.tieSpan was removed. Use addConnective("tie", tieSpan)`);
    assertObjHasNoProp(noteOptions, "slurSpan", `NoteOptions.slurSpan was removed. Use addConnective("slur", slurSpan)`);
}

function assertRestOptions(restOptions: RestOptions) {
    AssertUtil.assert(
        Guard.isObject(restOptions),
        Guard.isStringOrUndefined(restOptions.staffPos) || Guard.isInteger(restOptions.staffPos) || restOptions.staffPos instanceof Note,
        Guard.isStringOrUndefined(restOptions.color),
        Guard.isBooleanOrUndefined(restOptions.hide)
    );

    assertObjHasNoProp(restOptions, "dotted", "RestOptions.dotted was removed.");
    assertObjHasNoProp(restOptions, "triplet", "RestOptions.triplet was removed.");
}

function assertLyricsOptions(lyricsOptions: LyricsOptions) {
    AssertUtil.assert(
        Guard.isObject(lyricsOptions),
        Guard.isEnumValueOrUndefined(lyricsOptions.align, LyricsAlign),
        Guard.isEnumValueOrUndefined(lyricsOptions.hyphen, LyricsHyphen)
    );
}

function assertMeasureOptions(measureOptions: MeasureOptions) {
    AssertUtil.assert(
        Guard.isObject(measureOptions),
        Guard.isBooleanOrUndefined(measureOptions.showNumber)
    );
}

function assertStaffTabOrGRoups(staffTabOrGroups: StaffTabOrGroups | undefined) {
    AssertUtil.assert(
        Guard.isStringOrUndefined(staffTabOrGroups) || Guard.isIntegerGte(staffTabOrGroups, 0) ||
        Guard.isNonEmptyArray(staffTabOrGroups) && staffTabOrGroups.every(staffTabOrGroup =>
            Guard.isString(staffTabOrGroup) || Guard.isIntegerGte(staffTabOrGroup, 0))
    );
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
        AssertUtil.setClassFunc("DocumentBuilder", "setScoreConfiguration", config);
        if (Guard.isEnumValue(config, StaffPreset)) {
            // Ok
            this.doc.setScoreConfiguration(config);
        }
        else if (Guard.isObject(config) && config.type === "staff") {
            assertStaffConfig(config);
            this.doc.setScoreConfiguration(config);
        }
        else if (Guard.isObject(config) && config.type === "tab") {
            assertTabConfig(config);
            this.doc.setScoreConfiguration(config);
        }
        else if (Guard.isNonEmptyArray(config)) {
            config.forEach(c => {
                if (Guard.isObject(c) && c.type === "staff") {
                    assertStaffConfig(c);
                }
                else if (Guard.isObject(c) && c.type === "tab") {
                    assertTabConfig(c);
                }
                else {
                    AssertUtil.assert(false);
                }
            });
            this.doc.setScoreConfiguration(config);
        }
        else {
            AssertUtil.assert(false);
        }

        return this;
    }

    private static DefaultMeasureOptions: MeasureOptions = {}

    private getMeasure(): ObjMeasure {
        return this.doc.getLastMeasure() ?? this.doc.addMeasure(DocumentBuilder.DefaultMeasureOptions);
    }

    /**
     * Get music document after finished building.
     * @returns - Music document.
     */
    getDocument(): MDocument {
        this.getMeasure(); // Ensures document has at least one measure.
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
        AssertUtil.setClassFunc("DocumentBuilder", "setHeader", title, composer, arranger);
        AssertUtil.assert(
            Guard.isStringOrUndefined(title),
            Guard.isStringOrUndefined(composer),
            Guard.isStringOrUndefined(arranger)
        );
        this.doc.setHeader(title, composer, arranger);
        return this;
    }

    /**
     * Automatically limit number of measures per score row.
     * @param measuresPerRow - Number of measures per row. Must be integer >=1 or Infinity.
     * @returns - This document builder instance.
     */
    setMeasuresPerRow(measuresPerRow: number): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "setMeasuresPerRow", measuresPerRow);
        AssertUtil.assert(Guard.isIntegerGte(measuresPerRow, 1) || Guard.isPosInfinity(measuresPerRow));
        this.doc.setMeasuresPerRow(measuresPerRow);
        return this;
    }

    /**
     * Add new measure.
     * @param measureOptions - Measure options.
     * @returns - This document builder instance.
     */
    addMeasure(measureOptions?: MeasureOptions): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "addMeasure", measureOptions);
        measureOptions ??= {};
        assertMeasureOptions(measureOptions);
        this.doc.addMeasure(measureOptions);
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
        AssertUtil.setClassFunc("DocumentBuilder", "setKeySignature", ...args);

        AssertUtil.assert((
            args[0] instanceof Scale ||
            args[0] instanceof KeySignature ||
            Guard.isNonEmptyString(args[0]) && Guard.isEnumValueOrUndefined(args[1], ScaleType)
        ));

        this.getMeasure().setKeySignature(...args);

        return this;
    }

    /**
     * Set common time signature "C" for current measure and forward.
     * @param timeSignature - "C".
     * @returns - This document builder instance.
     */
    setTimeSignature(timeSignature: "C"): DocumentBuilder;
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
        AssertUtil.setClassFunc("DocumentBuilder", "setTimeSignature", ...args);

        if (args[0] === "C") {
            this.getMeasure().setTimeSignature(new TimeSignature("C"));
        }
        else if (args[0] instanceof TimeSignature) {
            this.getMeasure().setTimeSignature(args[0]);
        }
        else if (Guard.isEnumValue(args[0], TimeSignatures) && Guard.isEnumValueOrUndefined(args[1], BeamGrouping)) {
            this.getMeasure().setTimeSignature(new TimeSignature(args[0], args[1]));
        }
        else if (Guard.isIntegerGte(args[0], 1) && Guard.isIntegerGte(args[1], 1) && Guard.isEnumValueOrUndefined(args[2], BeamGrouping)) {
            this.getMeasure().setTimeSignature(new TimeSignature(args[0], args[1], args[2]));
        }
        else {
            AssertUtil.assert(false);
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
    setTempo(beatsPerMinute: number, beatLength?: NoteLength | NoteLengthStr): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "setTempo", beatsPerMinute, beatLength);

        AssertUtil.assert(
            Guard.isIntegerGte(beatsPerMinute, 1),
            Guard.isUndefined(beatLength) || isNoteLength(beatLength)
        );

        this.getMeasure().setTempo(beatsPerMinute, beatLength);

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
        AssertUtil.setClassFunc("DocumentBuilder", "addNote", voiceId, note, noteLength, noteOptions);

        AssertUtil.assert(
            isVoiceId(voiceId),
            (
                note instanceof Note || Guard.isNonEmptyString(note) ||
                Guard.isArray(note) && note.every(note => note instanceof Note || Guard.isNonEmptyString(note))
            ),
            isNoteLength(noteLength)
        );

        noteOptions ??= {}
        assertNoteOptions(noteOptions);

        if (Guard.isArray(note)) {
            let string = noteOptions.string;
            note.forEach((note, noteId) => {
                noteOptions.string = Guard.isArray(string) ? string[noteId] : string;
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
        AssertUtil.setClassFunc("DocumentBuilder", "addChord", voiceId, notes, noteLength, noteOptions);

        AssertUtil.assert(
            isVoiceId(voiceId),
            Guard.isNonEmptyArray(notes) && notes.every(note => note instanceof Note || Guard.isNonEmptyString(note)),
            isNoteLength(noteLength)
        );

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
        AssertUtil.setClassFunc("DocumentBuilder", "addRest", voiceId, restLength, restOptions);

        AssertUtil.assert(
            isVoiceId(voiceId),
            isNoteLength(restLength)
        );

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
        AssertUtil.setClassFunc("DocumentBuilder", "addTuplet", voiceId, tupletRatio);

        AssertUtil.assert(
            isVoiceId(voiceId),
            Guard.isFunction(tupletBuilder),
            isTupletRatio(tupletRatio) && Guard.isBooleanOrUndefined(tupletRatio.showRatio)
        );

        let tupletSymbols: RhythmSymbol[] = [];

        const helper: TupletBuilder = {
            addNote: (note, noteLength, noteOptions) => {
                AssertUtil.setClassFunc("DocumentBuilder", "addTuplet => addNote", note, noteLength, noteOptions);
                AssertUtil.assert(
                    note instanceof Note || Guard.isNonEmptyString(note) || Guard.isArray(note) && note.every(note => note instanceof Note || Guard.isNonEmptyString(note)),
                    isNoteLength(noteLength)
                );

                noteOptions ??= {}
                assertNoteOptions(noteOptions);

                if (Guard.isArray(note)) {
                    let string = noteOptions.string;
                    note.forEach((note, noteId) => {
                        noteOptions.string = Guard.isArray(string) ? string[noteId] : string;
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
                AssertUtil.setClassFunc("DocumentBuilder", "addTuplet => addChord", notes, noteLength, noteOptions);

                AssertUtil.assert(
                    Guard.isNonEmptyArray(notes) && notes.every(note => note instanceof Note || Guard.isNonEmptyString(note)),
                    isNoteLength(noteLength)
                );

                noteOptions ??= {}
                assertNoteOptions(noteOptions);

                let s = this.getMeasure().addNoteGroup(voiceId, notes, noteLength, noteOptions, tupletRatio);
                tupletSymbols.push(s);

                return helper;
            },
            addRest: (restLength, restOptions) => {
                AssertUtil.setClassFunc("DocumentBuilder", "addTuplet => addRest", restLength, restOptions);

                AssertUtil.assert(isNoteLength(restLength));

                restOptions ??= {}
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

    private addLyricsInternal(staffTabOrGroups: StaffTabOrGroups | undefined, verse: VerseNumber, lyricsText: string | string[], lyricsLength: NoteLength | NoteLengthStr, lyricsOptions?: LyricsOptions): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);

        AssertUtil.assert(
            isVerseNumber(verse),
            Guard.isEnumValue(lyricsLength, NoteLength),
            Guard.isString(lyricsText) || Guard.isArray(lyricsText) && lyricsText.every(text => Guard.isString(text))
        );

        lyricsOptions ??= {}
        assertLyricsOptions(lyricsOptions);

        if (lyricsOptions.align !== undefined) {
            this.currentLyricsAlign = lyricsOptions.align;
        }
        else {
            lyricsOptions.align ??= this.currentLyricsAlign;
        }

        if (Guard.isArray(lyricsText)) {
            lyricsText.forEach(text => this.getMeasure().addLyrics(staffTabOrGroups, verse, text, lyricsLength, lyricsOptions));
        }
        else {
            this.getMeasure().addLyrics(staffTabOrGroups, verse, lyricsText, lyricsLength, lyricsOptions);
        }

        return this;
    }

    /**
     * Add lyrics to current measure.
     * @param verse - Verse number (e.g. 1).
     * @param lyricsText - Lyrics text (empty space if omitted), single value or array.
     * @param lyricsLength - Lyrics text length (e.g. "2n").
     * @param lyricsOptions - Lyrics options.
     * @returns - This document builder instance.
     */
    addLyrics(verse: VerseNumber, lyricsText: string | string[], lyricsLength: NoteLength | NoteLengthStr, lyricsOptions?: LyricsOptions): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "addLyrics", verse, lyricsLength, lyricsText, lyricsOptions);
        return this.addLyricsInternal(undefined, verse, lyricsText, lyricsLength, lyricsOptions);
    }

    /**
     * Add lyrics to current measure to given staff/tab/group.
     * @param staffTabOrGroups - staff/tab index (0=top), staff/tab name, or staff group name.
     * @param verse - Verse number (e.g. 1).
     * @param lyricsText - Lyrics text (empty space if omitted), single value or array.
     * @param lyricsLength - Lyrics text length (e.g. "2n").
     * @param lyricsOptions - Lyrics options.
     * @returns - This document builder instance.
     */
    addLyricsTo(staffTabOrGroups: StaffTabOrGroups, verse: VerseNumber, lyricsText: string | string[], lyricsLength: NoteLength | NoteLengthStr, lyricsOptions?: LyricsOptions): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "addLyricsTo", verse, lyricsLength, lyricsText, lyricsOptions);
        return this.addLyricsInternal(staffTabOrGroups, verse, lyricsText, lyricsLength, lyricsOptions);
    }

    private addFermataInternal(staffTabOrGroups: StaffTabOrGroups | undefined, fermata: Fermata | `${Fermata}`): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        AssertUtil.assert(Guard.isEnumValue(fermata, Fermata));
        switch (fermata) {
            case "atNote":
                this.getMeasure().addAnnotation(staffTabOrGroups, Annotation.Articulation, ArticulationAnnotation.fermata);
                break;
            case "atMeasureEnd":
                this.getMeasure().addAnnotation(staffTabOrGroups, Annotation.Articulation, ArticulationAnnotation.measureEndFermata);
                break;
        }
        return this;
    }

    /**
     * @deprecated - addFermata() is deprecated. Will be removed in future release. Use addAnnotation() instead.
     */
    addFermata(fermata: Fermata | `${Fermata}` = Fermata.AtNote): DocumentBuilder {
        warnDeprecated("addFermata() is deprecated. Will be removed in future release. Use addAnnotation() instead.");

        AssertUtil.setClassFunc("DocumentBuilder", "addFermata", fermata);
        return this.addFermataInternal(undefined, fermata);
    }

    /**
     * @deprecated - addFermataTo() is deprecated. Will be removed in future release. Use addAnnotationTo() instead.
     */
    addFermataTo(staffTabOrGroups: StaffTabOrGroups, fermata: Fermata | `${Fermata}` = Fermata.AtNote): DocumentBuilder {
        warnDeprecated("addFermataTo() is deprecated. Will be removed in future release. Use addAnnotationTo() instead.");

        AssertUtil.setClassFunc("DocumentBuilder", "addFermataTo", staffTabOrGroups, fermata);
        return this.addFermataInternal(staffTabOrGroups, fermata);
    }

    private addNavigationInternal(staffTabOrGroups: StaffTabOrGroups | undefined, navigation: Navigation | `${Navigation}`, ...args: unknown[]): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        AssertUtil.assert(
            Guard.isStrictEqual(navigation, Navigation.EndRepeat) && Guard.isStrictEqual(args.length, 1) ||
            Guard.isStrictEqual(navigation, Navigation.Ending) && Guard.isIntegerGte(args.length, 1) && args.every(passage => Guard.isIntegerGte(passage, 1)) ||
            Guard.isEnumValue(navigation, Navigation) && Guard.isEmptyArray(args)
        );

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
        AssertUtil.setClassFunc("DocumentBuilder", "addNavigation", navigation, ...args);
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
        AssertUtil.setClassFunc("DocumentBuilder", "addNavigationTo", staffTabOrGroups, navigation, ...args);
        return this.addNavigationInternal(staffTabOrGroups, navigation, ...args);
    }

    private addAnnotationInternal(staffTabOrGroups: StaffTabOrGroups | undefined, annotation: Annotation | `${Annotation}` | undefined, text: string): DocumentBuilder {
        annotation ??= getAnnotation(text);

        if (annotation === undefined) {
            throw new MusicError(MusicErrorType.Score, `Annotation text "${text}" is not known annotation.`);
        }

        assertStaffTabOrGRoups(staffTabOrGroups);

        AssertUtil.assert(
            Guard.isEnumValue(annotation, Annotation),
            Guard.isNonEmptyString(text)
        );

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
    addAnnotation(annotation: Annotation | `${Annotation}`, text: AnnotationText | string): DocumentBuilder;
    addAnnotation(...args: [string] | [Annotation | `${Annotation}`, string]): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "addAnnotation", ...args);
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
        AssertUtil.setClassFunc("DocumentBuilder", "addAnnotationTo", staffTabOrGroups, ...args);
        if (args.length === 1) {
            return this.addAnnotationInternal(staffTabOrGroups, undefined, args[0]);
        }
        else {
            return this.addAnnotationInternal(staffTabOrGroups, args[0], args[1]);
        }
    }

    private addLabelInternal(staffTabOrGroups: StaffTabOrGroups | undefined, label: Label | `${Label}`, text: string): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);

        AssertUtil.assert(
            Guard.isEnumValue(label, Label),
            Guard.isNonEmptyString(text)
        );

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
        AssertUtil.setClassFunc("DocumentBuilder", "addLabel", label, text);
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
        AssertUtil.setClassFunc("DocumentBuilder", "addLabelTo", staffTabOrGroups, label, text);
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
        AssertUtil.setClassFunc("DocumentBuilder", "addConnective", connective, ...args);

        AssertUtil.assert(Guard.isEnumValue(connective, Connective));

        if (connective === Connective.Tie) {
            AssertUtil.assert(Guard.isIntegerOrUndefined(args[0]) || Guard.isEnumValue(args[0], TieType));
            AssertUtil.assert(Guard.isEnumValueOrUndefined(args[1], NoteAnchor));
            let tieSpan = args[0] as number | TieType | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective as Connective.Tie, tieSpan, noteAnchor);
        }
        else if (connective === Connective.Slur) {
            AssertUtil.assert(Guard.isIntegerOrUndefined(args[0]));
            AssertUtil.assert(Guard.isEnumValueOrUndefined(args[1], NoteAnchor));
            let slurSpan = args[0] as number | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective as Connective.Slur, slurSpan, noteAnchor);
        }
        else if (connective === Connective.Slide) {
            AssertUtil.assert(Guard.isEnumValueOrUndefined(args[0], NoteAnchor));
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
        AssertUtil.setClassFunc("DocumentBuilder", "addExtension");

        AssertUtil.assertMsg(Guard.isFunctionOrUndefined(extensionBuilder), "addExtension() has new usage, e.g. addExtension(ext => ext.measures(2)).");

        let ticks: number = 0;
        let visible: boolean = true;

        const helper: ExtensionBuilder = {
            notes: (noteLength, noteCount) => {
                AssertUtil.setClassFunc("DocumentBuilder", "addExtension.notes", noteLength, noteCount);
                AssertUtil.assert(isNoteLength(noteLength));
                AssertUtil.assert(Guard.isUndefined(noteCount) || Guard.isNumber(noteCount) && noteCount >= 0);
                ticks += RhythmProps.get(noteLength).ticks * (noteCount ?? 1);
                return helper;
            },
            measures: (measureCount) => {
                AssertUtil.setClassFunc("DocumentBuilder", "addExtension.measures", measureCount);
                AssertUtil.assert(Guard.isNumber(measureCount) && measureCount >= 1);
                ticks += this.getMeasure().getMeasureTicks() * measureCount;
                return helper;
            },
            infinity: () => {
                AssertUtil.setClassFunc("DocumentBuilder", "addExtension.infinity");
                ticks = Infinity;
                return helper;
            },
            hide: () => {
                AssertUtil.setClassFunc("DocumentBuilder", "addExtension.hide");
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
        AssertUtil.setClassFunc("DocumentBuilder", "addStaffGroup", groupName, staffsTabsAndGroups, verticalPosition);

        AssertUtil.assert(
            Guard.isNonEmptyString(groupName),
            (
                Guard.isNonEmptyString(staffsTabsAndGroups) || Guard.isIntegerGte(staffsTabsAndGroups, 0) ||
                Guard.isNonEmptyArray(staffsTabsAndGroups) && staffsTabsAndGroups.every(line => Guard.isNonEmptyString(line) || Guard.isIntegerGte(line, 0))
            ),
            Guard.isEnumValue(verticalPosition, VerticalPosition)
        );

        this.doc.addStaffGroup(groupName, staffsTabsAndGroups, verticalPosition as VerticalPosition);

        return this;
    }

    /**
     * Add song end. Adds certain bar line at the end of measure.
     * @returns - This document builder instance.
     */
    endSong(): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "endSong");
        this.getMeasure().endSong();
        return this;
    }

    /**
     * Add section end. Adds certain bar line at the end of measure.
     * @returns - This document builder instance.
     */
    endSection(): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "endSection");
        this.getMeasure().endSection();
        return this;
    }

    /**
     * End current score row. Next measure will start new row.
     * @returns - This document builder instance.
     */
    endRow(): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "endRow");
        this.doc.getLastMeasure()?.endRow();
        return this;
    }

    /**
     * Fill current measure with rests.
     * @param voiceId - Voice id to add rests to. Single value, array or all if omitted.
     * @returns - This document builder instance.
     */
    fillWithRests(...voiceId: VoiceId[]): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "fillWithRests", ...voiceId);

        AssertUtil.assert(Guard.isArray(voiceId) && (voiceId.length === 0 || voiceId.every(id => isVoiceId(id))));

        this.getMeasure().fillWithRests(...voiceId);
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
        AssertUtil.setClassFunc("DocumentBuilder", "addScaleArpeggio", scale, bottomNote, numOctaves);

        AssertUtil.assert(
            Guard.isNonEmptyString(bottomNote),
            Guard.isIntegerGte(numOctaves, 1)
        );

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

    /**
     * Add and repeat builder section.
     * @param times - Repeat count.
     * @param repeatCreator - Repeat creator function.
     * @returns - This document builder instance.
     */
    repeat(times: number, repeatCreator: (builder: DocumentBuilder) => void): DocumentBuilder {
        AssertUtil.setClassFunc("DocumentBuilder", "repeat", repeatCreator);

        AssertUtil.assert(
            Guard.isIntegerGte(times, 0),
            Guard.isFunction(repeatCreator)
        );

        for (let i = 0; i < times; i++)
            repeatCreator(this);

        return this;
    }
}