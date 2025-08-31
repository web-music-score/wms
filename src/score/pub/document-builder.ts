import { Utils } from "@tspro/ts-utils-lib";
import { Annotation, Arpeggio, Clef, Connective, ConnectiveSpan, Fermata, getStringNumbers, getVoiceIds, Label, Navigation, NoteAnchor, NoteOptions, RestOptions, ScoreConfiguration, StaffConfig, StaffPreset, Stem, StringNumber, TabConfig, TieType, VoiceId } from "./types";
import { MDocument, MMeasure } from "./interface";
import { ObjDocument } from "../engine/obj-document";
import { getScale, KeySignature, Mode, Note, NoteLength, Scale, ScaleType, SymbolSet, TimeSignature, TimeSignatureString, TuningNameList } from "@tspro/web-music-score/theory";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjMeasure } from "score/engine/obj-measure";

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
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted), "noteOptions.dotted", options.dotted);
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
    assertArg(Utils.Is.isBooleanOrUndefined(options.dotted), "restOptions.dotted", options.dotted);
    assertArg(Utils.Is.isStringOrUndefined(options.staffPos) || Utils.Is.isInteger(options.staffPos) || options.staffPos instanceof Note, "restOptions.staffPos", options.staffPos);
    assertArg(Utils.Is.isStringOrUndefined(options.color), "restOptions.color", options.color);
    assertArg(Utils.Is.isBooleanOrUndefined(options.hide), "restOptions.hide", options.hide);
    assertArg(Utils.Is.isBooleanOrUndefined(options.triplet), "restOptions.triplet", options.triplet);
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

    setTempo(beatsPerMinute: number, beatLength?: NoteLength, dotted?: boolean): DocumentBuilder {
        assertArg(Utils.Is.isIntegerGte(beatsPerMinute, 1), "beatsPerMinute", beatsPerMinute);
        if (beatLength === undefined) {
            assertArg(Utils.Is.isUndefined(dotted), "dotted", dotted);
        }
        else {
            assertArg(Utils.Is.isEnumValue(beatLength, NoteLength), "beatLength", beatLength);
            assertArg(Utils.Is.isBooleanOrUndefined(dotted), "dotted", dotted);
        }
        this.getMeasure().setTempo(beatsPerMinute, beatLength, dotted);
        return this;
    }

    addNote(voiceId: number, note: Note | string, noteLength: NoteLength, options?: NoteOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(note instanceof Note || Utils.Is.isString(note), "note", note);
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength), "noteLength", noteLength);
        if (options !== undefined) {
            assertNoteOptions(options);
        }
        this.getMeasure().addNoteGroup(voiceId, [note], noteLength, options);
        return this;
    }

    addChord(voiceId: number, notes: (Note | string)[], noteLength: NoteLength, options?: NoteOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isArray(notes) && notes.length >= 1 && notes.every(note => note instanceof Note || Utils.Is.isString(note)), "notes", notes);
        assertArg(Utils.Is.isEnumValue(noteLength, NoteLength), "noteLength", noteLength);
        if (options !== undefined) {
            assertNoteOptions(options);
        }
        this.getMeasure().addNoteGroup(voiceId, notes, noteLength, options);
        return this;
    }

    addRest(voiceId: number, restLength: NoteLength, options?: RestOptions): DocumentBuilder {
        assertArg(isVoiceId(voiceId), "voiceId", voiceId);
        assertArg(Utils.Is.isEnumValue(restLength, NoteLength), "restLength", restLength);
        if (options !== undefined) {
            assertRestOptions(options);
        }
        this.getMeasure().addRest(voiceId, restLength, options);
        return this;
    }

    addFermata(fermata?: Fermata): DocumentBuilder {
        assertArg(Utils.Is.isEnumValueOrUndefined(fermata, Fermata), "fermata", fermata);
        this.getMeasure().addFermata(fermata ?? Fermata.AtNote);
        return this;
    }

    addNavigation(navigation: Navigation): DocumentBuilder;
    addNavigation(navigation: Navigation.EndRepeat, playCount: number): DocumentBuilder;
    addNavigation(navigation: Navigation.Ending, ...passages: number[]): DocumentBuilder;
    addNavigation(navigation: Navigation, ...args: unknown[]): DocumentBuilder {
        assertArg(Utils.Is.isEnumValue(navigation, Navigation), "navigation", navigation);
        if (navigation === Navigation.EndRepeat && args.length > 0) {
            assertArg(Utils.Is.isIntegerGte(args[0], 1), "playCount", args[0]);
        }
        else if (navigation === Navigation.Ending && args.length > 0) {
            assertArg(args.every(passage => Utils.Is.isIntegerGte(passage, 1)), "passages", args);
        }
        this.getMeasure().addNavigation(navigation, ...args);
        return this;
    }

    addConnective(connective: Connective.Tie, tieSpan?: number | TieType, notAnchor?: NoteAnchor): DocumentBuilder;
    addConnective(connective: Connective.Slur, slurSpan?: number, notAnchor?: NoteAnchor): DocumentBuilder;
    addConnective(connective: Connective.Slide, notAnchor?: NoteAnchor): DocumentBuilder;
    addConnective(connective: Connective, ...args: unknown[]): DocumentBuilder {
        assertArg(Utils.Is.isEnumValue(connective, Connective), "connective", connective);

        if (connective === Connective.Tie) {
            assertArg(Utils.Is.isUndefined(args[0]) || Utils.Is.isInteger(args[0]) || Utils.Is.isEnumValue(args[0], TieType), "tieSpan", args[0]);
            assertArg(Utils.Is.isEnumValueOrUndefined(args[1], NoteAnchor), "noteAnchor", args[1]);
            let tieSpan = args[0] as ConnectiveSpan | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective, tieSpan, noteAnchor);
        }
        else if (connective === Connective.Slur) {
            assertArg(Utils.Is.isUndefined(args[0]) || Utils.Is.isInteger(args[0]), "slurSpan", args[0]);
            assertArg(Utils.Is.isEnumValueOrUndefined(args[1], NoteAnchor), "noteAnchor", args[1]);
            let slurSpan = args[0] as ConnectiveSpan | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective, slurSpan, noteAnchor);
        }
        else if (connective === Connective.Slide) {
            assertArg(Utils.Is.isEnumValueOrUndefined(args[0], NoteAnchor), "noteAnchor", args[0]);
            let noteAnchor = args[0] as NoteAnchor | undefined;
            this.getMeasure().addConnective(connective, noteAnchor);
        }

        return this;
    }

    addLabel(label: Label, text: string): DocumentBuilder {
        assertArg(Utils.Is.isEnumValue(label, Label), "label", label);
        assertArg(Utils.Is.isString(text), "text", text);
        this.getMeasure().addLabel(label, text);
        return this;
    }

    addAnnotation(annotation: Annotation, text: string): DocumentBuilder {
        assertArg(Utils.Is.isEnumValue(annotation, Annotation), "annotation", annotation);
        assertArg(Utils.Is.isString(text), "text", text);
        this.getMeasure().addAnnotation(annotation, text);
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