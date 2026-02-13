import { Guard, Utils } from "@tspro/ts-utils-lib";
import * as Types from "./types";
import { MDocument } from "./mobjects";
import { ObjDocument } from "../engine/obj-document";
import * as Theory from "web-music-score/theory";
import { ObjMeasure } from "../engine/obj-measure";
import { RhythmSymbol } from "../engine/obj-rhythm-column";
import { ObjBeamGroup } from "../engine/obj-beam-group";
import { resolveAnnotationGroup, resolveAnnotationKind } from "../engine/annotation-utils";
import { AssertUtil, warnDeprecated, resolveEnumValue } from "shared-src";

function assertObjHasNoProp(obj: Record<string, unknown>, prop: string, msg: string) {
    AssertUtil.assertMsg(!Guard.isTypedObject(obj, [prop]), msg);
}

function assertDocumentOptions(options: Types.DocumentOptions) {
    AssertUtil.assert(
        Guard.isObject(options),
        Guard.isBooleanOrUndefined(options.showMeasureNumbers),
        Guard.isStringOrUndefined(options.background),
        Guard.isStringOrUndefined(options.color),
    );
}

function assertBaseConfig(baseConfig: Types.BaseConfig) {
    AssertUtil.assert(
        Guard.isObject(baseConfig),
        Guard.isStringOrUndefined(baseConfig.name),
        Guard.isUndefined(baseConfig.voiceId) || Types.isVoiceId(baseConfig.voiceId) || Guard.isArray(baseConfig.voiceId) && baseConfig.voiceId.every(voiceId => Types.isVoiceId(voiceId))
    );

    assertObjHasNoProp(baseConfig, "voiceIds", "Baseconfig.voiceIds was removed. Use BaseConfig.voiceId instead.");

    if (Guard.isArray(baseConfig.voiceId)) {
        baseConfig.voiceId = Utils.Arr.removeDuplicates(baseConfig.voiceId);
    }

    AssertUtil.assert(Guard.isStringOrUndefined(baseConfig.instrument));
}

function assertStaffConfig(staffConfig: Types.StaffConfig) {
    assertBaseConfig(staffConfig);

    AssertUtil.assert(
        Guard.isObject(staffConfig),
        Guard.isStrictEqual(staffConfig.type, "staff"),
        Guard.isEnumValue(staffConfig.clef, Types.Clef),
        Guard.isBooleanOrUndefined(staffConfig.isOctaveDown),
        Guard.isUndefined(staffConfig.minNote) || Theory.Note.isNote(staffConfig.minNote),
        Guard.isUndefined(staffConfig.maxNote) || Theory.Note.isNote(staffConfig.maxNote),
        Guard.isStringOrUndefined(staffConfig.grandId)
    );

    assertObjHasNoProp(staffConfig, "isGrand", "StaffConfig.isGrand was removed. Use StaffConfig.grandId instead.");
}


function assertTabConfig(tabConfig: Types.TabConfig) {
    assertBaseConfig(tabConfig);

    AssertUtil.assert(
        Guard.isObject(tabConfig),
        Guard.isStrictEqual(tabConfig.type, "tab"),
        (
            Guard.isUndefined(tabConfig.tuning) ||
            Guard.isString(tabConfig.tuning) && Guard.isIncluded(tabConfig.tuning, Theory.TuningNameList) ||
            Guard.isArray(tabConfig.tuning) && Guard.isStrictEqual(tabConfig.tuning.length, Types.getStringNumbers().length) && tabConfig.tuning.every(s => Theory.Note.isNote(s))
        )
    );
}

function assertNoteOptions(noteOptions: Types.NoteOptions) {
    AssertUtil.assert(
        Guard.isObject(noteOptions),
        Guard.isEnumValueOrUndefined(noteOptions.stem, Types.Stem),
        Guard.isStringOrUndefined(noteOptions.color),
        Guard.isBooleanOrUndefined(noteOptions.arpeggio) || Guard.isEnumValue(noteOptions.arpeggio, Types.Arpeggio),
        Guard.isBooleanOrUndefined(noteOptions.staccato),
        Guard.isBooleanOrUndefined(noteOptions.diamond),
        (
            Guard.isUndefined(noteOptions.string) ||
            Types.isStringNumber(noteOptions.string) ||
            Guard.isEmptyArray(noteOptions.string) ||
            Guard.isNonEmptyArray(noteOptions.string) && noteOptions.string.every(string => Types.isStringNumber(string))
        )
    );

    assertObjHasNoProp(noteOptions, "dotted", "NoteOptions.dotted was removed.");
    assertObjHasNoProp(noteOptions, "triplet", "NoteOptions.triplet was removed.");
    assertObjHasNoProp(noteOptions, "tieSpan", `NoteOptions.tieSpan was removed. Use addConnective("tie", tieSpan)`);
    assertObjHasNoProp(noteOptions, "slurSpan", `NoteOptions.slurSpan was removed. Use addConnective("slur", slurSpan)`);
}

function assertRestOptions(restOptions: Types.RestOptions) {
    AssertUtil.assert(
        Guard.isObject(restOptions),
        Guard.isStringOrUndefined(restOptions.staffPos) || Guard.isInteger(restOptions.staffPos) || restOptions.staffPos instanceof Theory.Note,
        Guard.isStringOrUndefined(restOptions.color),
        Guard.isBooleanOrUndefined(restOptions.hide)
    );

    assertObjHasNoProp(restOptions, "dotted", "RestOptions.dotted was removed.");
    assertObjHasNoProp(restOptions, "triplet", "RestOptions.triplet was removed.");
}

function assertLyricsOptions(lyricsOptions: Types.LyricsOptions) {
    AssertUtil.assert(
        Guard.isObject(lyricsOptions),
        Guard.isEnumValueOrUndefined(lyricsOptions.align, Types.LyricsAlign),
        Guard.isEnumValueOrUndefined(lyricsOptions.hyphen, Types.LyricsHyphen)
    );
}

function assertMeasureOptions(measureOptions: Types.MeasureOptions) {
    AssertUtil.assert(
        Guard.isObject(measureOptions),
        Guard.isBooleanOrUndefined(measureOptions.showNumber)
    );
}

function assertStaffTargets(staffTargets: Types.StaffTargets | undefined) {
    AssertUtil.assert(
        Guard.isStringOrUndefined(staffTargets) || Guard.isIntegerGte(staffTargets, 0) ||
        Guard.isNonEmptyArray(staffTargets) && staffTargets.every(staffTarget => Guard.isString(staffTarget) || Guard.isIntegerGte(staffTarget, 0))
    );
}

function assertAnnotationOptions(annotationOptions: Types.AnnotationOptions) {
    AssertUtil.assert(
        Guard.isObject(annotationOptions),
        Guard.isEnumValueOrUndefined(annotationOptions.group, Types.AnnotationGroup),
        Guard.isEnumValueOrUndefined(annotationOptions.anchor, Types.AnnotationAnchor),
        Guard.isUndefined(annotationOptions.repeatCount) || Guard.isIntegerGte(annotationOptions.repeatCount, 1),
        (
            Guard.isUndefined(annotationOptions.endingPassages) || Guard.isIntegerGte(annotationOptions.endingPassages, 1) ||
            Guard.isArray(annotationOptions.endingPassages) && annotationOptions.endingPassages.every(p => Guard.isIntegerGte(p, 1))
        ),
        Guard.isNonEmptyStringOrUndefined(annotationOptions.labelText),
        Guard.isStringOrUndefined(annotationOptions.color),
    );
}

/** Tuplet builder type. */
export type TupletBuilder = {
    /**
     * Add note to a tuplet.
     * @param note - Instance of Theory.Note or string, single value (e.g. "C4") or array (e.g. ["C4", "E4", "G4"]).
     * @param noteLength - Theory.Note length (e.g. "4n").
     * @param noteOptions - Theory.Note options.
     * @returns - This tuplet builder object.
     */
    addNote: (note: Theory.Note | string | (Theory.Note | string)[], noteLength: Theory.NoteLengthValue, noteOptions?: Types.NoteOptions) => TupletBuilder,
    /**
     * Add chord to a tuplet.
     * @param notes - Array of notes, each instance of Theory.Note or string (e.g. "D4"). 
     * @param noteLength - Theory.Note length (e.g. "4n"). 
     * @param noteOptions - Theory.Note options. 
     * @returns - This tuplet builder object. 
     */
    addChord: (notes: (Theory.Note | string)[], noteLength: Theory.NoteLengthValue, noteOptions?: Types.NoteOptions) => TupletBuilder,
    /**
     * Add rest to a tuplet.
     * @param restLength - Rest length (e.g. "4n").  
     * @param restOptions - Rest options.
     * @returns - This tuplet builder object. 
     */
    addRest: (restLength: Theory.NoteLengthValue, restOptions?: Types.RestOptions) => TupletBuilder
}

/** Etension builder type. */
export type ExtensionBuilder = {
    /**
     * Increase extension length by note length multiplied by number of notes.
     * @param noteLength - Length of note (e.g. "2n").
     * @param noteCount - Number of note lengths (default = 1).
     * @returns - this extension builder object.
     */
    notes: (noteLength: Theory.NoteLengthValue, noteCount?: number) => ExtensionBuilder,
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
 *     .addChord(1, ["C3", "E3", "G3"], "4n").addAnnotation("chordLabel", "C")
 *     .addRest(1, "4n")
 *     // etc.
 *     .getDEocument();
 * ```
 */
export class DocumentBuilder {
    private readonly doc: ObjDocument;

    private errorHandler: (e: unknown) => void = (e) => { throw e; };

    /**
     * Create new document builder instance.
     */
    constructor(options?: Types.DocumentOptions) {
        AssertUtil.setClassConstructor("DocumentBuilder", options);

        options ??= {};
        assertDocumentOptions(options);

        this.doc = new ObjDocument(options);
    }

    /**
     * Usage examples:
     * <pre>
     * // throw (default)
     * builder.setErrorHandler((e) => { throw e; });
     * // log
     * builder.setErrorHandler((e) => { console.error("Doc build failed:", e); });
     * // log and throw
     * builder.setErrorHandler((e) => { console.error("Doc build failed:", e); throw e; });
     * // Silent
     * builder.setErrorHandler((e) => { });
     * </pre>
     * @param fn - Error handler function.
     */
    setErrorHandler(fn: (e: unknown) => void): DocumentBuilder {
        this.errorHandler = fn;
        return this;
    }

    protected safe(fn: () => void): DocumentBuilder {
        try {
            fn();
        }
        catch (e) {
            this.errorHandler(e);
        }
        return this;
    }

    /**
     * Use staff preset values to set score confguration. This call will request new score row.
     * @param staffPreset - Staff preset (e.g. "treble").
     */
    setScoreConfiguration(staffPreset: Types.StaffPresetValue): DocumentBuilder;
    /**
     * Use staff preset values to set score confguration. This call will request new score row.
     * @param config - Score configuration (e.g. { type: "staff", clef: "G", isOctavewDown: true }).
     */
    setScoreConfiguration(config: Types.ScoreConfiguration): DocumentBuilder;
    setScoreConfiguration(config: Types.StaffPresetValue | Types.ScoreConfiguration): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "setScoreConfiguration", config);
            if (Guard.isEnumValue(config, Types.StaffPreset)) {
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
        });
    }

    private static DefaultMeasureOptions: Types.MeasureOptions = {}

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
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "setHeader", title, composer, arranger);
            AssertUtil.assert(
                Guard.isStringOrUndefined(title),
                Guard.isStringOrUndefined(composer),
                Guard.isStringOrUndefined(arranger)
            );
            this.doc.setHeader(title, composer, arranger);
        });
    }

    /**
     * Automatically limit number of measures per score row.
     * @param measuresPerRow - Number of measures per row. Must be integer >=1 or Infinity.
     * @returns - This document builder instance.
     */
    setMeasuresPerRow(measuresPerRow: number): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "setMeasuresPerRow", measuresPerRow);
            AssertUtil.assert(Guard.isIntegerGte(measuresPerRow, 1) || Guard.isPosInfinity(measuresPerRow));
            this.doc.setMeasuresPerRow(measuresPerRow);
        });
    }

    /**
     * Add new measure.
     * @param measureOptions - Measure options.
     * @returns - This document builder instance.
     */
    addMeasure(measureOptions?: Types.MeasureOptions): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addMeasure", measureOptions);
            measureOptions ??= {};
            assertMeasureOptions(measureOptions);
            this.doc.addMeasure(measureOptions);
        });
    }

    /**
     * Set key signature for current measure and forward.
     * @param tonic - Tonic note (e.g. "C").
     * @param scaleType - Scale type (e.g. string "Major" or ScaleType.Major).
     * @returns - This document builder instance.
     */
    setKeySignature(tonic: string, scaleType: Theory.ScaleTypeValue): DocumentBuilder;
    /**
     * Set key signature for current measure and forward.
     * @param keySignature - KeySignature object instance.
     * @returns - This document builder instance.
     */
    setKeySignature(keySignature: Theory.KeySignature): DocumentBuilder;
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
    setKeySignature(scale: Theory.Scale): DocumentBuilder;
    setKeySignature(...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "setKeySignature", ...args);

            AssertUtil.assert((
                args[0] instanceof Theory.Scale ||
                args[0] instanceof Theory.KeySignature ||
                Guard.isNonEmptyString(args[0]) && Guard.isNonEmptyStringOrUndefined(args[1])
            ));

            this.getMeasure().setKeySignature(...args);
        });
    }

    /**
     * Set common or cut time signature for current measure and forward.
     * @param timeSignature - "C" or "C|".
     * @returns - This document builder instance.
     */
    setTimeSignature(timeSignature: "C" | "C|"): DocumentBuilder;
    /**
     * Set time signature for current measure and forward.
     * @param timeSignature - TimeSignature object instance.
     * @returns - This document builder instance.
     */
    setTimeSignature(timeSignature: Theory.TimeSignature): DocumentBuilder;
    /**
     * Set time signature for current measure and forward.
     * @param timeSignature - TimeSignatures enum value or string (e.g. "3/4").
     * @param beamGrouping - Beam grouping (e.g. "3-2" for time signature "5/8").
     * @returns - This document builder instance.
     */
    setTimeSignature(timeSignature: Theory.TimeSignaturesValue, beamGrouping?: Theory.BeamGroupingValue): DocumentBuilder;
    /**
     * Set time signature for current measure and forward.
     * @param beatCount - Beat count of time signature (e.g. 3 in "3/4").
     * @param beatSize - Beat size of time signature (e.g. 4 in "3/4").
     * @param beamGrouping - Beam grouping (e.g. "3-2" for time signature "5/8").
     * @returns - This document builder instance.
     */
    setTimeSignature(beatCount: number, beatSize: number, beamGrouping?: Theory.BeamGroupingValue): DocumentBuilder;
    setTimeSignature(...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "setTimeSignature", ...args);

            if (args[0] === "C" || args[0] === "C|") {
                this.getMeasure().setTimeSignature(new Theory.TimeSignature(args[0]));
            }
            else if (args[0] instanceof Theory.TimeSignature) {
                this.getMeasure().setTimeSignature(args[0]);
            }
            else if (Guard.isEnumValue(args[0], Theory.TimeSignatures) && Guard.isEnumValueOrUndefined(args[1], Theory.BeamGrouping)) {
                this.getMeasure().setTimeSignature(new Theory.TimeSignature(args[0], args[1]));
            }
            else if (Guard.isIntegerGte(args[0], 1) && Guard.isIntegerGte(args[1], 1) && Guard.isEnumValueOrUndefined(args[2], Theory.BeamGrouping)) {
                this.getMeasure().setTimeSignature(new Theory.TimeSignature(args[0], args[1], args[2]));
            }
            else {
                AssertUtil.assert(false);
            }
        });
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
    setTempo(beatsPerMinute: number, beatLength: Theory.NoteLengthValue): DocumentBuilder;
    setTempo(beatsPerMinute: number, beatLength?: Theory.NoteLengthValue): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "setTempo", beatsPerMinute, beatLength);

            AssertUtil.assert(
                Guard.isIntegerGte(beatsPerMinute, 1),
                Guard.isUndefined(beatLength) || Theory.isNoteLength(beatLength)
            );

            this.getMeasure().setTempo(beatsPerMinute, beatLength);
        });
    }

    /**
     * Add note to current measure.
     * @param voiceId - Voice id to add note to.
     * @param note - Instance of Theory.Note or string, single value (e.g. "C4") or array (e.g. ["C4", "E4", "G4"]).
     * @param noteLength - Theory.Note length (e.g. "4n").
     * @param noteOptions - Theory.Note options.
     * @returns - This document builder instance.
     */
    addNote(voiceId: Types.VoiceId, note: Theory.Note | string | (Theory.Note | string)[], noteLength: Theory.NoteLengthValue, noteOptions?: Types.NoteOptions): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addNote", voiceId, note, noteLength, noteOptions);

            AssertUtil.assert(
                Types.isVoiceId(voiceId),
                (
                    note instanceof Theory.Note || Guard.isNonEmptyString(note) ||
                    Guard.isArray(note) && note.every(note => note instanceof Theory.Note || Guard.isNonEmptyString(note))
                ),
                Theory.isNoteLength(noteLength)
            );

            const constNoteOptions = noteOptions ?? {}
            assertNoteOptions(constNoteOptions);

            if (Guard.isArray(note)) {
                let string = constNoteOptions.string;
                note.forEach((note, noteId) => {
                    constNoteOptions.string = Guard.isArray(string) ? string[noteId] : string;
                    this.getMeasure().addNoteGroup(voiceId, [note], noteLength, noteOptions);
                });
            }
            else {
                this.getMeasure().addNoteGroup(voiceId, [note], noteLength, noteOptions);
            }
        });
    }

    /**
     * Add chord to current measure.
     * @param voiceId - Voice id to add chord to.
     * @param notes - Array of notes, each instance of Theory.Note or string (e.g. "D4"). 
     * @param noteLength - Theory.Note length (e.g. "4n"). 
     * @param noteOptions - Theory.Note options. 
     * @returns - This document builder instance.
     */
    addChord(voiceId: Types.VoiceId, notes: (Theory.Note | string)[], noteLength: Theory.NoteLengthValue, noteOptions?: Types.NoteOptions): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addChord", voiceId, notes, noteLength, noteOptions);

            AssertUtil.assert(
                Types.isVoiceId(voiceId),
                Guard.isNonEmptyArray(notes) && notes.every(note => note instanceof Theory.Note || Guard.isNonEmptyString(note)),
                Theory.isNoteLength(noteLength)
            );

            noteOptions ??= {}
            assertNoteOptions(noteOptions);

            this.getMeasure().addNoteGroup(voiceId, notes, noteLength, noteOptions);
        });
    }

    /**
     * Add rest to current measure.
     * @param voiceId - Voice id to add rest to.
     * @param restLength - Rest length (e.g. "4n").  
     * @param restOptions - Rest options.
     * @returns - This document builder instance.
     */
    addRest(voiceId: Types.VoiceId, restLength: Theory.NoteLengthValue, restOptions?: Types.RestOptions): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addRest", voiceId, restLength, restOptions);

            AssertUtil.assert(
                Types.isVoiceId(voiceId),
                Theory.isNoteLength(restLength)
            );

            restOptions ??= {}
            assertRestOptions(restOptions);

            this.getMeasure().addRest(voiceId, restLength, restOptions);
        });
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
    addTuplet(voiceId: Types.VoiceId, tupletRatio: Theory.TupletRatio & Types.TupletOptions, tupletBuilder: (notes: TupletBuilder) => void): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addTuplet", voiceId, tupletRatio);

            AssertUtil.assert(
                Types.isVoiceId(voiceId),
                Guard.isFunction(tupletBuilder),
                Theory.isTupletRatio(tupletRatio) && Guard.isBooleanOrUndefined(tupletRatio.showRatio)
            );

            let tupletSymbols: RhythmSymbol[] = [];

            const helper: TupletBuilder = {
                addNote: (note, noteLength, noteOptions) => {
                    AssertUtil.setClassFunc("DocumentBuilder", "addTuplet => addNote", note, noteLength, noteOptions);
                    AssertUtil.assert(
                        note instanceof Theory.Note || Guard.isNonEmptyString(note) || Guard.isArray(note) && note.every(note => note instanceof Theory.Note || Guard.isNonEmptyString(note)),
                        Theory.isNoteLength(noteLength)
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
                        Guard.isNonEmptyArray(notes) && notes.every(note => note instanceof Theory.Note || Guard.isNonEmptyString(note)),
                        Theory.isNoteLength(noteLength)
                    );

                    noteOptions ??= {}
                    assertNoteOptions(noteOptions);

                    let s = this.getMeasure().addNoteGroup(voiceId, notes, noteLength, noteOptions, tupletRatio);
                    tupletSymbols.push(s);

                    return helper;
                },
                addRest: (restLength, restOptions) => {
                    AssertUtil.setClassFunc("DocumentBuilder", "addTuplet => addRest", restLength, restOptions);

                    AssertUtil.assert(Theory.isNoteLength(restLength));

                    restOptions ??= {}
                    assertRestOptions(restOptions);

                    let s = this.getMeasure().addRest(voiceId, restLength, restOptions, tupletRatio);
                    tupletSymbols.push(s);

                    return helper;
                }
            };

            tupletBuilder(helper);

            ObjBeamGroup.createTuplet(tupletSymbols, tupletRatio);
        });
    }

    private currentLyricsAlign: Types.LyricsAlignValue = Types.LyricsAlign.Center;

    private addLyricsInternal(staffTargets: Types.StaffTargets | undefined, verse: Types.VerseNumber, lyricsText: string | string[], lyricsLength: Theory.NoteLengthValue, lyricsOptions?: Types.LyricsOptions) {
        assertStaffTargets(staffTargets);

        AssertUtil.assert(
            Types.isVerseNumber(verse),
            Guard.isEnumValue(lyricsLength, Theory.NoteLength),
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
            lyricsText.forEach(text => this.getMeasure().addLyrics(staffTargets, verse, text, lyricsLength, lyricsOptions));
        }
        else {
            this.getMeasure().addLyrics(staffTargets, verse, lyricsText, lyricsLength, lyricsOptions);
        }
    }

    /**
     * Add lyrics to current measure.
     * @param verse - Verse number (e.g. 1).
     * @param lyricsText - Lyrics text (empty space if omitted), single value or array.
     * @param lyricsLength - Lyrics text length (e.g. "2n").
     * @param lyricsOptions - Lyrics options.
     * @returns - This document builder instance.
     */
    addLyrics(verse: Types.VerseNumber, lyricsText: string | string[], lyricsLength: Theory.NoteLengthValue, lyricsOptions?: Types.LyricsOptions): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addLyrics", verse, lyricsLength, lyricsText, lyricsOptions);
            this.addLyricsInternal(undefined, verse, lyricsText, lyricsLength, lyricsOptions);
        });
    }

    /**
     * Add lyrics to current measure to given staff/tab/group.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param verse - Verse number (e.g. 1).
     * @param lyricsText - Lyrics text (empty space if omitted), single value or array.
     * @param lyricsLength - Lyrics text length (e.g. "2n").
     * @param lyricsOptions - Lyrics options.
     * @returns - This document builder instance.
     */
    addLyricsTo(staffTargets: Types.StaffTargets, verse: Types.VerseNumber, lyricsText: string | string[], lyricsLength: Theory.NoteLengthValue, lyricsOptions?: Types.LyricsOptions): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addLyricsTo", verse, lyricsLength, lyricsText, lyricsOptions);
            this.addLyricsInternal(staffTargets, verse, lyricsText, lyricsLength, lyricsOptions);
        });
    }

    /**
     * Add fermata to current measure.
     * @deprecated addFermata() is deprecated. Will be removed in future release. Use addAnnotation() instead.
     * @param fermata - Fermata position: "atNote" (default) or "atMeasureEnd".
     * @returns - This document builder instance.
     */
    addFermata(fermata: Types.FermataValue = Types.Fermata.AtNote): DocumentBuilder {
        return this.safe(() => {
            warnDeprecated("addFermata() is deprecated. Will be removed in future release. Use addAnnotation() instead.");

            AssertUtil.setClassFunc("DocumentBuilder", "addFermata", fermata);
            AssertUtil.assert(Guard.isEnumValue(fermata, Types.Fermata));

            if (fermata === Types.Fermata.AtNote)
                this.addAnnotation(Types.AnnotationKind.fermata, {});
            else if (fermata === Types.Fermata.AtMeasureEnd)
                this.addAnnotation(Types.AnnotationKind.fermata, { anchor: "rightBarLine" });
        });
    }

    /**
     * Add fermata to current measure.
     * @deprecated addFermataTo() is deprecated. Will be removed in future release. Use addAnnotation() instead.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param fermata - Fermata position: "atNote" (default) or "atMeasureEnd".
     * @returns - This document builder instance.
     */
    addFermataTo(staffTargets: Types.StaffTargets, fermata: Types.FermataValue = Types.Fermata.AtNote): DocumentBuilder {
        return this.safe(() => {
            warnDeprecated("addFermataTo() is deprecated. Will be removed in future release. Use addAnnotationTo() instead.");

            AssertUtil.setClassFunc("DocumentBuilder", "addFermataTo", staffTargets, fermata);
            assertStaffTargets(staffTargets);
            AssertUtil.assert(Guard.isEnumValue(fermata, Types.Fermata));

            if (fermata === Types.Fermata.AtNote)
                this.addAnnotationTo(staffTargets, Types.AnnotationKind.fermata, {});
            else if (fermata === Types.Fermata.AtMeasureEnd)
                this.addAnnotationTo(staffTargets, Types.AnnotationKind.fermata, { anchor: "rightBarLine" });
        });
    }

    /**
     * Add navigation to current measure.
     * @param navigation - Navigation annotation to add.
     * @returns - This document builder instance.
     */
    addNavigation(navigation: Types.NavigationValue): DocumentBuilder;
    /**
     * Add end repeat navigation to current measure.
     * @param navigation - Navigation annotation to add.
     * @param playCount - Play count for the repeated section.
     * @returns - This document builder instance.
     */
    addNavigation(navigation: Types.NavigationEndRepeatValue, playCount: number): DocumentBuilder;
    /**
     * Add ending navigation to current measure.
     * @param navigation - Navigation annotation to add.
     * @param passages - Passages that this ending is played.
     * @returns - This document builder instance.
     */
    addNavigation(navigation: Types.NavigationEndingValue, ...passages: number[]): DocumentBuilder;

    addNavigation(navigation: Types.NavigationValue, ...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addNavigation", navigation, ...args);
            this.addAnnotationInternal(undefined, Types.AnnotationGroup.Navigation, navigation, ...args);
        });
    }

    /**
     * Add navigation to current measure to given staff/tab/group.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param navigation - Navigation annotation to add.
     * @returns - This document builder instance.
     */
    addNavigationTo(staffTargets: Types.StaffTargets, navigation: Types.NavigationValue): DocumentBuilder;
    /**
     * Add end repeat navigation to current measure to given staff/tab/group.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param navigation - Navigation annotation to add.
     * @param playCount - Play count for the repeated section.
     * @returns - This document builder instance.
     */
    addNavigationTo(staffTargets: Types.StaffTargets, navigation: Types.NavigationEndRepeatValue, playCount: number): DocumentBuilder;
    /**
     * Add ending navigation to current measure to given staff/tab/group.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param navigation - Navigation annotation to add.
     * @param passages - Passages that this ending is played.
     * @returns - This document builder instance.
     */
    addNavigationTo(staffTargets: Types.StaffTargets, navigation: Types.NavigationEndingValue, ...passages: number[]): DocumentBuilder;

    addNavigationTo(staffTargets: Types.StaffTargets, navigation: Types.NavigationValue, ...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addNavigationTo", staffTargets, navigation, ...args);
            this.addAnnotationInternal(staffTargets, Types.AnnotationGroup.Navigation, navigation, ...args);
        });
    }

    private addAnnotationInternal(staffTargets: Types.StaffTargets | undefined, ...args: unknown[]) {
        assertStaffTargets(staffTargets);

        // If there is options, it is last arg.
        let options = (Guard.isObject(args[args.length - 1]) ? args.pop() : {}) as Types.AnnotationOptions;
        assertAnnotationOptions(options);

        let group = options.group;

        if (!group) {
            // If there is group arg, it is first.        
            let groupArg = resolveEnumValue(String(args[0]), Types.AnnotationGroup);
            if (groupArg) {
                // TODO: warnDeprecated("...");
                args.shift();
                group = groupArg;
            }
        }

        // Kind arg is after that.
        let kind = String(args.shift());

        // Resolve group from kind if there not defined so far.
        if (!group) {
            let resolvedKind = resolveAnnotationKind(kind);
            if (resolvedKind !== undefined) {
                group = resolveAnnotationGroup(resolvedKind);
                kind = resolvedKind;
            }
        }

        AssertUtil.assert(
            Guard.isEnumValue(group, Types.AnnotationGroup),
            Guard.isNonEmptyString(kind)
        );

        // Add optional args for different kinds into options.
        if (group === Types.AnnotationGroup.Label && Guard.isNullish(options.labelText) && Guard.isNonEmptyString(args[0]))
            options.labelText = Guard.isNullish(args[0]) ? undefined : String(args.shift());

        if (kind === Types.AnnotationKind.EndRepeat && Guard.isNullish(options.repeatCount) && Guard.isIntegerGte(args[0], 2))
            options.repeatCount = Guard.isNullish(args[0]) ? undefined : Number(args.shift());

        if (kind === Types.AnnotationKind.Ending && Guard.isNullish(options.endingPassages) && args.every(a => Guard.isIntegerGte(a, 1)))
            options.endingPassages = args.length > 0 ? [...args.map(a => Number(a))] : 1;

        this.getMeasure().addAnnotation(staffTargets, group as Types.AnnotationGroup, kind, options);
    }

    /**
     * Add annotation with label text to current measure.
     * @param labelKind - Annotation kind.
     * @param labelText - Label text.
     * @param options - Annotation options.
     * @returns - This document builder instance.
     */
    addAnnotation(
        labelKind: Types.AnnotationKindLabelValue,
        labelText: string,
        options?: Types.AnnotationOptions
    ): DocumentBuilder;

    /**
     * Add any annotation kind to current measure.
     * @param kind - Annotation kind (e.g. "pp").
     * @param options - Annotation options.
     * @returns - This document builder instance.
     */
    addAnnotation(
        kind: string,
        options?: Types.AnnotationOptions
    ): DocumentBuilder;

    /**
     * Catch all overload for deprecated stuff. Wil be removed in future release.
     * ```ts
     * // Deprecated:
     * addAnnotation(group: AnnotationGroup, kind: string, options?: AnnotationOptions): DocumentBuilder;
     * // Use instead:
     * addAnnotation(kind: string, { group: AnnotationGroup }): DocumentBuilder;
     * 
     * // Deprecated:
     * addAnnotation("ending", ...endingPassages: number[]): DocumentBuilder;
     * // Use instead:
     * addAnnotation("ending", { endingPassages: number | number[] }): DocumentBuilder;
     * 
     * // Deprecated:
     * addAnnotation("endRepeat", repeatCount?: number): DocumentBuilder;
     * // Use instead:
     * addAnnotation("endRepeat", { repeatCount: number }): DocumentBuilder;
     * ```
     * @deprecated Use AnnotationOptions instead for extra args. Will be removed in future release.
     */
    addAnnotation(
        ...args: (number | string | Types.AnnotationOptions)[]
    ): DocumentBuilder;

    addAnnotation(...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addAnnotation", ...args);
            this.addAnnotationInternal(undefined, ...args);
        });
    }

    /**
     * Add annotation with label text to current measure.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param labelKind - Annotation kind.
     * @param labelText - Label text.
     * @param options - Annotation options.
     * @returns - This document builder instance.
     */
    addAnnotationTo(
        staffTargets: Types.StaffTargets,
        labelKind: Types.AnnotationKindLabelValue,
        labelText: string,
        options?: Types.AnnotationOptions
    ): DocumentBuilder;

    /**
     * Add any annotation kind to current measure.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param kind - Annotation kind (e.g. "pp").
     * @param options - Annotation options.
     * @returns - This document builder instance.
     */
    addAnnotationTo(
        staffTargets: Types.StaffTargets,
        kind: string,
        options?: Types.AnnotationOptions
    ): DocumentBuilder;

    /**
     * Catch all overload for deprecated stuff. Wil be removed in future release.
     * ```ts
     * // Deprecated:
     * addAnnotation(staffTargets, group: AnnotationGroup, kind: string, options?: AnnotationOptions): DocumentBuilder;
     * // Use instead:
     * addAnnotation(staffTargets, kind: string, { group: AnnotationGroup }): DocumentBuilder;
     * 
     * // Deprecated:
     * addAnnotation(staffTargets, "ending", ...endingPassages: number[]): DocumentBuilder;
     * // Use instead:
     * addAnnotation(staffTargets, "ending", { endingPassages: number | number[] }): DocumentBuilder;
     * 
     * // Deprecated:
     * addAnnotation(staffTargets, "endRepeat", repeatCount?: number): DocumentBuilder;
     * // Use instead:
     * addAnnotation(staffTargets, "endRepeat", { repeatCount: number }): DocumentBuilder;
     * ```
     * @deprecated Use AnnotationOptions instead for extra args. Will be removed in future release.
     */
    addAnnotationTo(
        staffTargets: Types.StaffTargets,
        ...args: (number | string | Types.AnnotationOptions)[]
    ): DocumentBuilder;

    addAnnotationTo(staffTargets: Types.StaffTargets, ...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addAnnotationTo", staffTargets, ...args);
            this.addAnnotationInternal(staffTargets, ...args);
        });
    }

    /**
     * Add label text to column of last added note/chord/rest in current measure.
     * @deprecated addLabel() is deprecated. Will be removed in future release. Use addAnnotation() instead.
     * @param label - T.Label type: "chord" or "note".
     * @param text - label text.
     * @returns - This document builder instance.
     */
    addLabel(label: Types.LabelValue, text: string): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addLabel", label, text);

            AssertUtil.assert(
                Guard.isEnumValue(label, Types.Label),
                Guard.isNonEmptyString(text)
            );

            if (label === Types.Label.Chord)
                this.addAnnotation(Types.AnnotationKind.ChordLabel, text);
            else if (label === Types.Label.Note)
                this.addAnnotation(Types.AnnotationKind.PitchLabel, text);
        });
    }

    /**
     * Add label text to column of last added note/chord/rest in current measure to given staff/tab/group.
     * @deprecated addLabelTo() is deprecated. Will be removed in future release. Use addAnnotation() instead.
     * @param staffTargets - Single or multiple staff/tab/group identifiers.
     * @param label - T.Label type "chord" or "note".
     * @param text - label text.
     * @returns - This document builder instance.
     */
    addLabelTo(staffTargets: Types.StaffTargets, label: Types.LabelValue, text: string): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addLabelTo", staffTargets, label, text);

            assertStaffTargets(staffTargets);

            AssertUtil.assert(
                Guard.isEnumValue(label, Types.Label),
                Guard.isNonEmptyString(text)
            );

            if (label === Types.Label.Chord)
                this.addAnnotationTo(staffTargets, Types.AnnotationKind.ChordLabel, text);
            else if (label === Types.Label.Note)
                this.addAnnotationTo(staffTargets, Types.AnnotationKind.PitchLabel, text);
        });
    }

    /**
     * Add tie starting from last added note/chord.
     * @param connective - T.Connective type ("tie" or T.Connective.Tie).
     * @param tieSpan - How many notes across this tie spans.
     * @param notAnchor - Anchor point for note and this tie.
     * @returns - This document builder instance.
     */
    addConnective(connective: Types.ConnectiveTieValue, tieSpan?: number | Types.TieTypeValue, notAnchor?: Types.NoteAnchorValue): DocumentBuilder;
    /**
     * Add slur starting from last added note/chord.
     * @param connective - T.Connective type ("slur" or T.Connective.Slur).
     * @param slurSpan - How many notes across this slur spans.
     * @param notAnchor - Anchor point for note and this slur.
     * @returns - This document builder instance.
     */
    addConnective(connective: Types.ConnectiveSlurValue, slurSpan?: number, notAnchor?: Types.NoteAnchorValue): DocumentBuilder;
    /**
     * Add slide starting from last added note/chord.
     * @param connective - T.Connective type ("slide" or T.Connective.Slide).
     * @param notAnchor - Anchor point for note and this slide.
     * @returns - This document builder instance.
     */
    addConnective(connective: Types.ConnectiveSlideValue, notAnchor?: Types.NoteAnchorValue): DocumentBuilder;

    addConnective(connective: Types.ConnectiveValue, ...args: unknown[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addConnective", connective, ...args);

            AssertUtil.assert(Guard.isEnumValue(connective, Types.Connective));

            if (connective === Types.Connective.Tie) {
                AssertUtil.assert(Guard.isIntegerOrUndefined(args[0]) || Guard.isEnumValue(args[0], Types.TieType));
                AssertUtil.assert(Guard.isEnumValueOrUndefined(args[1], Types.NoteAnchor));
                let tieSpan = args[0] as number | Types.TieType | undefined;
                let noteAnchor = args[1] as Types.NoteAnchor | undefined;
                this.getMeasure().addConnective(connective as Types.Connective.Tie, tieSpan, noteAnchor);
            }
            else if (connective === Types.Connective.Slur) {
                AssertUtil.assert(Guard.isIntegerOrUndefined(args[0]));
                AssertUtil.assert(Guard.isEnumValueOrUndefined(args[1], Types.NoteAnchor));
                let slurSpan = args[0] as number | undefined;
                let noteAnchor = args[1] as Types.NoteAnchor | undefined;
                this.getMeasure().addConnective(connective as Types.Connective.Slur, slurSpan, noteAnchor);
            }
            else if (connective === Types.Connective.Slide) {
                AssertUtil.assert(Guard.isEnumValueOrUndefined(args[0], Types.NoteAnchor));
                let noteAnchor = args[0] as Types.NoteAnchor | undefined;
                this.getMeasure().addConnective(connective as Types.Connective.Slide, noteAnchor);
            }
        });
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
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addExtension");

            AssertUtil.assertMsg(Guard.isFunctionOrUndefined(extensionBuilder), "addExtension() has new usage, e.g. addExtension(ext => ext.measures(2)).");

            let ticks: number = 0;
            let visible: boolean = true;

            const helper: ExtensionBuilder = {
                notes: (noteLength, noteCount) => {
                    AssertUtil.setClassFunc("DocumentBuilder", "addExtension.notes", noteLength, noteCount);
                    AssertUtil.assert(Theory.isNoteLength(noteLength));
                    AssertUtil.assert(Guard.isUndefined(noteCount) || Guard.isNumber(noteCount) && noteCount >= 0);
                    ticks += Theory.RhythmProps.get(noteLength).ticks * (noteCount ?? 1);
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
        });
    }

    /**
     * Add staff group.
     * @param groupName - Name of staff group.
     * @param staffsTabsAndGroups - Single or multiple staff/tab/group identifiers. Single value or array.
     * @param verticalPosition - Vertical position, are elements added above, below or both.
     * @returns - This document builder instance.
     */
    addStaffGroup(groupName: string, staffsTabsAndGroups: number | string | (number | string)[], verticalPosition: Types.VerticalPositionValue = Types.VerticalPosition.Auto): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "addStaffGroup", groupName, staffsTabsAndGroups, verticalPosition);

            AssertUtil.assert(
                Guard.isNonEmptyString(groupName),
                (
                    Guard.isNonEmptyString(staffsTabsAndGroups) || Guard.isIntegerGte(staffsTabsAndGroups, 0) ||
                    Guard.isNonEmptyArray(staffsTabsAndGroups) && staffsTabsAndGroups.every(line => Guard.isNonEmptyString(line) || Guard.isIntegerGte(line, 0))
                ),
                Guard.isEnumValue(verticalPosition, Types.VerticalPosition)
            );

            this.doc.addStaffGroup(groupName, staffsTabsAndGroups, verticalPosition as Types.VerticalPosition);
        });
    }

    /**
     * Add song end. Adds certain bar line at the end of measure.
     * @returns - This document builder instance.
     */
    endSong(): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "endSong");
            this.getMeasure().endSong();
        });
    }

    /**
     * Add section end. Adds certain bar line at the end of measure.
     * @returns - This document builder instance.
     */
    endSection(): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "endSection");
            this.getMeasure().endSection();
        });
    }

    /**
     * End current score row. Next measure will start new row.
     * @returns - This document builder instance.
     */
    endRow(): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "endRow");
            this.doc.getLastMeasure()?.endRow();
        });
    }

    /**
     * Fill current measure with rests.
     * @param voiceId - Voice id to add rests to. Single value, array or all if omitted.
     * @returns - This document builder instance.
     */
    fillWithRests(...voiceId: Types.VoiceId[]): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "fillWithRests", ...voiceId);

            AssertUtil.assert(Guard.isArray(voiceId) && voiceId.every(id => Types.isVoiceId(id)));

            this.getMeasure().fillWithRests(...voiceId);
        });
    }

    /**
     * Add notes of given scale in ascending order.
     * @param scale - Scale.
     * @param bottomNote - Scale starts from note >= bottom note.
     * @param numOctaves - Number of octaves to add.
     * @returns - This document builder instance.
     */
    addScaleArpeggio(scale: Theory.Scale, bottomNote: string, numOctaves: number): DocumentBuilder {
        return this.safe(() => {
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
                this.addAnnotation(Types.AnnotationKind.PitchLabel, note.formatOmitOctave(Theory.SymbolSet.Unicode));
            }
        });
    }

    /**
     * Add and repeat builder section.
     * @param times - Repeat count.
     * @param repeatCreator - Repeat creator function.
     * @returns - This document builder instance.
     */
    repeat(times: number, repeatCreator: (builder: DocumentBuilder) => void): DocumentBuilder {
        return this.safe(() => {
            AssertUtil.setClassFunc("DocumentBuilder", "repeat", repeatCreator);

            AssertUtil.assert(
                Guard.isIntegerGte(times, 0),
                Guard.isFunction(repeatCreator)
            );

            for (let i = 0; i < times; i++)
                repeatCreator(this);
        });
    }
}