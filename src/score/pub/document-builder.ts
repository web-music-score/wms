import { Utils } from "@tspro/ts-utils-lib";
import { Annotation, Arpeggio, Clef, Connective, Fermata, getStringNumbers, getVoiceIds, Label, Navigation, NoteAnchor, NoteOptions, RestOptions, ScoreConfiguration, StaffConfig, StaffPreset, StaffTabOrGroups, Stem, StringNumber, TabConfig, TieType, TupletOptions, VerticalPosition, VoiceId } from "./types";
import { MDocument } from "./interface";
import { ObjDocument } from "../engine/obj-document";
import { getNoteLength, KeySignature, MaxTupletRatioParts, Note, NoteLength, NoteLengthStr, Scale, ScaleType, SymbolSet, TimeSignature, TimeSignatureString, TuningNameList, TupletRatio } from "@tspro/web-music-score/theory";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjMeasure } from "score/engine/obj-measure";
import { RhythmSymbol } from "score/engine/obj-rhythm-column";
import { ObjBeamGroup } from "score/engine/obj-beam-group";

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

function assertStaffConfig(staffConfig: StaffConfig) {
    assertArg(Utils.Is.isObject(staffConfig), "staffConfig", staffConfig);
    assertArg(staffConfig.type === "staff", "staffConfig.type", staffConfig.type);
    assertArg(Utils.Is.isEnumValue(staffConfig.clef, Clef), "staffConfig.clef", staffConfig.clef);
    assertArg(Utils.Is.isBooleanOrUndefined(staffConfig.isOctaveDown), "staffConfig.isOctaveDown", staffConfig.isOctaveDown);
    assertArg(Utils.Is.isUndefined(staffConfig.minNote) || isNote(staffConfig.minNote), "staffConfig.minNote", staffConfig.minNote);
    assertArg(Utils.Is.isUndefined(staffConfig.maxNote) || isNote(staffConfig.maxNote), "staffConfig.maxNote", staffConfig.maxNote);
    assertArg(Utils.Is.isUndefined(staffConfig.voiceIds) || Utils.Is.isArray(staffConfig.voiceIds) && staffConfig.voiceIds.every(voiceId => Utils.Is.isNumber(voiceId)), "staffConfig.voiceIds", staffConfig.voiceIds);
    assertArg(Utils.Is.isBooleanOrUndefined(staffConfig.isGrand), "staffConfig.isGrand", staffConfig.isGrand);
}

function assertTabConfig(tabConfig: TabConfig) {
    assertArg(Utils.Is.isObject(tabConfig), "tabConfig", tabConfig);
    assertArg(tabConfig.type === "tab", "tabConfig.type", tabConfig.type);
    if (typeof tabConfig.tuning === "string") {
        assertArg(TuningNameList.includes(tabConfig.tuning), "tabConfig.tuning", tabConfig.tuning);
    }
    else if (Utils.Is.isArray(tabConfig.tuning)) {
        assertArg(tabConfig.tuning.length === 6 && tabConfig.tuning.every(s => isNote(s)), "tabConfig.tuning", tabConfig.tuning);
    }
    assertArg(Utils.Is.isUndefined(tabConfig.voiceIds) || Utils.Is.isArray(tabConfig.voiceIds) && tabConfig.voiceIds.every(voiceId => Utils.Is.isNumber(voiceId)), "tabConfig.voiceIds", tabConfig.voiceIds);
}

function assertNoteOptions(options: NoteOptions) {
    assertArg(Utils.Is.isObject(options), "noteOptions", options);
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted) || Utils.Is.isIntegerGte(options.dotted, 0), "noteOptions.dotted", options.dotted);
    assertArg(Utils.Is.isEnumValueOrUndefined(options.stem, Stem), "noteOptions.stem", options.stem);
    assertArg(Utils.Is.isStringOrUndefined(options.color), "noteOptions.color", options.color);
    assertArg(Utils.Is.isBooleanOrUndefined(options.arpeggio) || Utils.Is.isEnumValue(options.arpeggio, Arpeggio), "noteOptions.arpeggio", options.arpeggio);
    assertArg(Utils.Is.isBooleanOrUndefined(options.staccato), "noteOptions.staccato", options.staccato);
    assertArg(Utils.Is.isBooleanOrUndefined(options.diamond), "noteOptions.diamond", options.diamond);
    assertArg(Utils.Is.isBooleanOrUndefined(options.triplet), "noteOptions.triplet", options.triplet);
    assertArg((
        Utils.Is.isUndefined(options.string) ||
        isStringNumber(options.string) ||
        Utils.Is.isArray(options.string) && options.string.length > 0 && options.string.every(string => isStringNumber(string))
    ), "noteOptions.string", options.string);
}

function assertRestOptions(options: RestOptions) {
    assertArg(Utils.Is.isObject(options), "restOptions", options);
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted) || Utils.Is.isIntegerGte(options.dotted, 0), "restOptions.dotted", options.dotted);
    assertArg(Utils.Is.isStringOrUndefined(options.staffPos) || Utils.Is.isInteger(options.staffPos) || options.staffPos instanceof Note, "restOptions.staffPos", options.staffPos);
    assertArg(Utils.Is.isStringOrUndefined(options.color), "restOptions.color", options.color);
    assertArg(Utils.Is.isBooleanOrUndefined(options.hide), "restOptions.hide", options.hide);
    assertArg(Utils.Is.isBooleanOrUndefined(options.triplet), "restOptions.triplet", options.triplet);
}

function assertStaffTabOrGRoups(staffTabOrGroups: StaffTabOrGroups | undefined) {
    assertArg(
        Utils.Is.isStringOrUndefined(staffTabOrGroups) || Utils.Is.isIntegerGte(staffTabOrGroups, 0) ||
        Utils.Is.isArray(staffTabOrGroups) && staffTabOrGroups.every(staffTabOrGroup =>
            Utils.Is.isString(staffTabOrGroup) || Utils.Is.isIntegerGte(staffTabOrGroup, 0)
        )
        , "staffTabOrGroup", staffTabOrGroups
    );
}

function isNoteLengthStr(str: unknown): boolean {
    if (typeof str !== "string") {
        return false;
    }
    try {
        getNoteLength(str as NoteLengthStr);
        return true;
    }
    catch (e) {
        return false;
    }
}

export type TupletBuilder = {
    addNote: (note: Note | string, noteLength: NoteLength | NoteLengthStr, options?: NoteOptions) => void,
    addChord: (notes: (Note | string)[], noteLength: NoteLength | NoteLengthStr, options?: NoteOptions) => void,
    addRest: (restLength: NoteLength | NoteLengthStr, options?: RestOptions) => void
}

export class DocumentBuilder {
    private readonly doc: ObjDocument;

    constructor() {
        this.doc = new ObjDocument();
    }

    setScoreConfiguration(staffPreset: StaffPreset): DocumentBuilder;
    setScoreConfiguration(config: ScoreConfiguration): DocumentBuilder;
    setScoreConfiguration(config: StaffPreset | ScoreConfiguration): DocumentBuilder {
        if (Utils.Is.isEnumValue(config, StaffPreset)) {
            // Ok
        }
        else if (Utils.Is.isObject(config) && config.type === "staff") {
            assertStaffConfig(config);
        }
        else if (Utils.Is.isObject(config) && config.type === "tab") {
            assertTabConfig(config);
        }
        else if (Utils.Is.isArray(config)) {
            assertArg(config.length > 0, "config", config);
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
        }
        else {
            assertArg(false, "config", config);
        }

        this.doc.setScoreConfiguration(config);

        return this;
    }

    private getMeasure(): ObjMeasure {
        return this.doc.getLastMeasure() ?? this.doc.addMeasure();
    }

    getDocument(): MDocument {
        return this.doc.getMusicInterface();
    }

    setHeader(title?: string, composer?: string, arranger?: string): DocumentBuilder {
        assertArg(Utils.Is.isStringOrUndefined(title), "title", title);
        assertArg(Utils.Is.isStringOrUndefined(composer), "composer", composer);
        assertArg(Utils.Is.isStringOrUndefined(arranger), "arranger", arranger);
        this.doc.setHeader(title, composer, arranger);
        return this;
    }

    setMeasuresPerRow(measuresPerRow: number): DocumentBuilder {
        assertArg(Utils.Is.isIntegerGte(measuresPerRow, 1) || measuresPerRow === Infinity, "measuresPerRow", measuresPerRow);
        this.doc.setMeasuresPerRow(measuresPerRow);
        return this;
    }

    addMeasure(): DocumentBuilder {
        this.doc.addMeasure();
        return this;
    }

    setKeySignature(tonic: string, scaleType: ScaleType): DocumentBuilder;
    setKeySignature(keySignature: KeySignature): DocumentBuilder;
    setKeySignature(scale: Scale): DocumentBuilder;
    setKeySignature(...args: unknown[]): DocumentBuilder {
        assertArg((
            args[0] instanceof Scale ||
            args[0] instanceof KeySignature ||
            Utils.Is.isString(args[0]) && Utils.Is.isEnumValue(args[1], ScaleType)
        ), "keySignature", args);
        this.getMeasure().setKeySignature(...args);
        return this;
    }

    setTimeSignature(timeSignature: TimeSignature | TimeSignatureString): DocumentBuilder {
        assertArg(timeSignature instanceof TimeSignature || Utils.Is.isString(timeSignature), "timeSignature", timeSignature);
        this.getMeasure().setTimeSignature(timeSignature);
        return this;
    }

    setTempo(beatsPerMinute: number, beatLength?: NoteLength | NoteLengthStr, dotted?: boolean | number): DocumentBuilder {
        assertArg(Utils.Is.isIntegerGte(beatsPerMinute, 1), "beatsPerMinute", beatsPerMinute);
        if (beatLength === undefined) {
            assertArg(Utils.Is.isUndefined(dotted), "dotted", dotted);
        }
        else {
            assertArg(Utils.Is.isEnumValue(beatLength, NoteLength) || isNoteLengthStr(beatLength), "beatLength", beatLength);
            assertArg(Utils.Is.isBooleanOrUndefined(dotted) || Utils.Is.isIntegerGte(dotted, 0), "dotted", dotted);
        }
        this.getMeasure().setTempo(beatsPerMinute, beatLength, dotted);
        return this;
    }

    addNote(voiceId: number, note: Note | string, noteLength: NoteLength | NoteLengthStr, options?: NoteOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(note instanceof Note || Utils.Is.isString(note), "note", note);
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLengthStr(noteLength), "noteLength", noteLength);
        if (options !== undefined) {
            assertNoteOptions(options);
        }
        this.getMeasure().addNoteGroup(voiceId, [note], noteLength, options);
        return this;
    }

    addChord(voiceId: number, notes: (Note | string)[], noteLength: NoteLength | NoteLengthStr, options?: NoteOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isArray(notes) && notes.length >= 1 && notes.every(note => note instanceof Note || Utils.Is.isString(note)), "notes", notes);
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLengthStr(noteLength), "noteLength", noteLength);
        if (options !== undefined) {
            assertNoteOptions(options);
        }
        this.getMeasure().addNoteGroup(voiceId, notes, noteLength, options);
        return this;
    }

    addRest(voiceId: number, restLength: NoteLength | NoteLengthStr, options?: RestOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isEnumValue(restLength, NoteLength) || isNoteLengthStr(restLength), "restLength", restLength);
        if (options !== undefined) {
            assertRestOptions(options);
        }
        this.getMeasure().addRest(voiceId, restLength, options);
        return this;
    }

    /**
     * Usage:
     * <pre>
     * addTuplet(0, Theory.Tuplet.Triplet, notes => {
     *     notes.addNote("G3", Theory.NoteLength.Eighth);
     *     notes.addNote("B3", Theory.NoteLength.Eighth);
     *     notes.addNote("D4", Theory.NoteLength.Eighth);
     * });
     * </pre>
     * 
     * @param voiceId 
     * @param tupletRatio - You can also use Theory.Tuplet presets (e.g. Theory.Tuplet.Triplet).
     * @param builder 
     * @returns 
     */
    addTuplet(voiceId: VoiceId, tupletRatio: TupletRatio & TupletOptions, builder: (notes: TupletBuilder) => void): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isObject(tupletRatio) &&
            Utils.Is.isIntegerGte(tupletRatio.parts, 2) && tupletRatio.parts <= MaxTupletRatioParts &&
            Utils.Is.isIntegerGte(tupletRatio.inTimeOf, 2) &&
            Utils.Is.isBooleanOrUndefined(tupletRatio.showRatio), "tupletRatio", tupletRatio);

        let tupletSymbols: RhythmSymbol[] = [];

        const helper: TupletBuilder = {
            addNote: (note, noteLength, options) => {
                assertArg(note instanceof Note || Utils.Is.isString(note), "note", note);
                assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLengthStr(noteLength), "noteLength", noteLength);
                if (options !== undefined) {
                    delete options.triplet;
                    assertNoteOptions(options);
                }
                let s = this.getMeasure().addNoteGroup(voiceId, [note], noteLength, options, tupletRatio);
                tupletSymbols.push(s);
            },
            addChord: (notes, noteLength, options) => {
                assertArg(Utils.Is.isArray(notes) && notes.length >= 1 && notes.every(note => note instanceof Note || Utils.Is.isString(note)), "notes", notes);
                assertArg(Utils.Is.isEnumValue(noteLength, NoteLength) || isNoteLengthStr(noteLength), "noteLength", noteLength);
                if (options !== undefined) {
                    delete options.triplet;
                    assertNoteOptions(options);
                }
                let s = this.getMeasure().addNoteGroup(voiceId, notes, noteLength, options, tupletRatio);
                tupletSymbols.push(s);
            },
            addRest: (restLength, options) => {
                assertArg(Utils.Is.isEnumValue(restLength, NoteLength) || isNoteLengthStr(restLength), "restLength", restLength);
                if (options !== undefined) {
                    delete options.triplet;
                    assertRestOptions(options);
                }
                let s = this.getMeasure().addRest(voiceId, restLength, options, tupletRatio);
                tupletSymbols.push(s);
            }
        };

        builder(helper);

        ObjBeamGroup.createTuplet(tupletSymbols, tupletRatio);

        return this;
    }

    private addFermataInternal(staffTabOrGroups: StaffTabOrGroups | undefined, fermata: Fermata | `${Fermata}`): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(fermata, Fermata), "fermata", fermata);
        this.getMeasure().addFermata(staffTabOrGroups, fermata as Fermata);
        return this;
    }

    addFermata(fermata: Fermata | `${Fermata}` = Fermata.AtNote): DocumentBuilder {
        return this.addFermataInternal(undefined, fermata);
    }

    /** @param staffTabOrGroups  - staff/tab index (0=top), staff/tab name, or staff group name. */
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

    addNavigation(navigation: Navigation | `${Navigation}`): DocumentBuilder;
    addNavigation(navigation: Navigation.EndRepeat | `${Navigation.EndRepeat}`, playCount: number): DocumentBuilder;
    addNavigation(navigation: Navigation.Ending | `${Navigation.Ending}`, ...passages: number[]): DocumentBuilder;
    addNavigation(navigation: Navigation | `${Navigation}`, ...args: unknown[]): DocumentBuilder {
        return this.addNavigationInternal(undefined, navigation, ...args);
    }

    /** @param staffTabOrGroups  - staff/tab index (0=top), staff/tab name, or staff group name. */
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation | `${Navigation}`): DocumentBuilder;
    /** @param staffTabOrGroups  - staff/tab index (0=top), staff/tab name, or staff group name. */
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation.EndRepeat | `${Navigation.EndRepeat}`, playCount: number): DocumentBuilder;
    /** @param staffTabOrGroups  - staff/tab index (0=top), staff/tab name, or staff group name. */
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation.Ending | `${Navigation.Ending}`, ...passages: number[]): DocumentBuilder;
    addNavigationTo(staffTabOrGroups: StaffTabOrGroups, navigation: Navigation | `${Navigation}`, ...args: unknown[]): DocumentBuilder {
        return this.addNavigationInternal(staffTabOrGroups, navigation, ...args);
    }

    private addAnnotationInternal(staffTabOrGroups: StaffTabOrGroups | undefined, annotation: Annotation | `${Annotation}`, text: string): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(annotation, Annotation), "annotation", annotation);
        assertArg(Utils.Is.isString(text), "text", text);
        this.getMeasure().addAnnotation(staffTabOrGroups, annotation as Annotation, text);
        return this;
    }

    addAnnotation(annotation: Annotation | `${Annotation}`, text: string): DocumentBuilder {
        return this.addAnnotationInternal(undefined, annotation, text);
    }

    /** @param staffTabOrGroups  - staff/tab index (0=top), staff/tab name, or staff group name. */
    addAnnotationTo(staffTabOrGroups: StaffTabOrGroups, annotation: Annotation | `${Annotation}`, text: string): DocumentBuilder {
        return this.addAnnotationInternal(staffTabOrGroups, annotation, text);
    }

    private addLabelInternal(staffTabOrGroups: StaffTabOrGroups | undefined, label: Label | `${Label}`, text: string): DocumentBuilder {
        assertStaffTabOrGRoups(staffTabOrGroups);
        assertArg(Utils.Is.isEnumValue(label, Label), "label", label);
        assertArg(Utils.Is.isString(text), "text", text);
        this.getMeasure().addLabel(staffTabOrGroups, label as Label, text);
        return this;
    }

    addLabel(label: Label | `${Label}`, text: string): DocumentBuilder {
        return this.addLabelInternal(undefined, label, text);
    }

    /** @param staffTabOrGroups  - staff/tab index (0=top), staff/tab name, or staff group name. */
    addLabelTo(staffTabOrGroups: StaffTabOrGroups, label: Label | `${Label}`, text: string): DocumentBuilder {
        return this.addLabelInternal(staffTabOrGroups, label, text);
    }

    addConnective(connective: Connective.Tie | `${Connective.Tie}`, tieSpan?: number | TieType | `${TieType}`, notAnchor?: NoteAnchor | `${NoteAnchor}`): DocumentBuilder;
    addConnective(connective: Connective.Slur | `${Connective.Slur}`, slurSpan?: number, notAnchor?: NoteAnchor | `${NoteAnchor}`): DocumentBuilder;
    addConnective(connective: Connective.Slide | `${Connective.Slide}`, notAnchor?: NoteAnchor | `${NoteAnchor}`): DocumentBuilder;
    addConnective(connective: Connective | `${Connective}`, ...args: unknown[]): DocumentBuilder {
        assertArg(Utils.Is.isEnumValue(connective, Connective), "connective", connective);

        if (connective === Connective.Tie) {
            assertArg(Utils.Is.isUndefined(args[0]) || Utils.Is.isInteger(args[0]) || Utils.Is.isEnumValue(args[0], TieType), "tieSpan", args[0]);
            assertArg(Utils.Is.isEnumValueOrUndefined(args[1], NoteAnchor), "noteAnchor", args[1]);
            let tieSpan = args[0] as number | TieType | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective as Connective.Tie, tieSpan, noteAnchor);
        }
        else if (connective === Connective.Slur) {
            assertArg(Utils.Is.isUndefined(args[0]) || Utils.Is.isInteger(args[0]), "slurSpan", args[0]);
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

    addExtension(extensionLength: NoteLength | number, extensionVisible?: boolean): DocumentBuilder {
        assertArg((
            Utils.Is.isIntegerGte(extensionLength, 0) ||
            extensionLength === Infinity ||
            Utils.Is.isEnumValue(extensionLength, NoteLength)
        ), "extendionLength", extensionLength);
        assertArg(Utils.Is.isBooleanOrUndefined(extensionVisible), "extensionVisible", extensionVisible);
        this.getMeasure().addExtension(extensionLength, extensionVisible ?? true);
        return this;
    }

    /**
     * 
     * @param groupName - Name of staff group.
     * @param staffsTabsAndGroups - staff/tab index (0=top), staff/tab name, or staff group name. Single value or array.
     * @param verticalPosition - Vertical position, are elements added above, below or both.
     * @returns 
     */
    addStaffGroup(groupName: string, staffsTabsAndGroups: number | string | (number | string)[], verticalPosition: VerticalPosition | `${VerticalPosition}` = VerticalPosition.Auto): DocumentBuilder {
        assertArg(Utils.Is.isString(groupName) && groupName.length > 0, "groupName", groupName);
        assertArg(
            Utils.Is.isString(staffsTabsAndGroups) && staffsTabsAndGroups.length > 0 || Utils.Is.isIntegerGte(staffsTabsAndGroups, 0) ||
            Utils.Is.isArray(staffsTabsAndGroups) && staffsTabsAndGroups.every(line => Utils.Is.isString(line) && line.length > 0 || Utils.Is.isIntegerGte(line, 0)),
            "staffsTabsAndGroups", staffsTabsAndGroups
        );
        assertArg(Utils.Is.isEnumValue(verticalPosition, VerticalPosition), "verticalPosition", verticalPosition);
        this.doc.addStaffGroup(groupName, staffsTabsAndGroups, verticalPosition as VerticalPosition);
        return this;
    }

    endSong(): DocumentBuilder {
        this.getMeasure().endSong();
        return this;
    }

    endSection(): DocumentBuilder {
        this.getMeasure().endSection();
        return this;
    }

    endRow(): DocumentBuilder {
        this.doc.getLastMeasure()?.endRow();
        return this;
    }

    completeRests(voiceId?: number): DocumentBuilder {
        assertArg(Utils.Is.isUndefined(voiceId) || isVoiceId(voiceId), "voiceId", voiceId);
        this.getMeasure().completeRests(voiceId);
        return this;
    }

    addScaleArpeggio(scale: Scale, bottomNote: string, numOctaves: number): DocumentBuilder {
        assertArg(Utils.Is.isString(bottomNote), "bottomNote", bottomNote);
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