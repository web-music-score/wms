import { Utils } from "@tspro/ts-utils-lib";
import { Annotation, Connective, ConnectiveSpan, Fermata, Label, Navigation, NoteAnchor, NoteOptions, RestOptions, StaffConfig, StaffPreset, TabConfig, TieType } from "./types";
import { MDocument, MMeasure } from "./interface";
import { ObjDocument } from "../engine/obj-document";
import { getScale, KeySignature, Mode, Note, NoteLength, Scale, ScaleType, SymbolSet, TimeSignature, TimeSignatureString } from "@tspro/web-music-score/theory";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

function assertArg(condition: boolean, argName: string, argValue: unknown) {
    if (!condition) {
        throw new MusicError(MusicErrorType.Score, `Invalid arg: ${argName} = ${argValue}`);
    }
}

export class DocumentBuilder {
    private readonly doc: ObjDocument;
    private readonly doc_mi: MDocument;

    constructor(staffPreset: StaffPreset);
    constructor(config: StaffConfig | TabConfig | (StaffConfig | TabConfig)[]);
    constructor(config: StaffPreset | StaffConfig | TabConfig | (StaffConfig | TabConfig)[]) {
        if (Utils.Is.isEnumValue(config, StaffPreset)) {
            this.doc_mi = new MDocument(config);
        }
        else {
            this.doc_mi = new MDocument(config);
        }

        this.doc = this.doc_mi.getMusicObject();
    }

    get measure(): MMeasure {
        return (this.doc.getLastMeasure() ?? this.doc.addMeasure()).getMusicInterface();
    }

    getDocument(): MDocument {
        return this.doc_mi;
    }

    setHeader(title?: string, composer?: string, arranger?: string): DocumentBuilder {
        this.doc_mi.setHeader(title, composer, arranger);
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
        if (args[0] instanceof KeySignature) {
            this.measure.setKeySignature(args[0]);
        }
        else if (args[0] instanceof Scale) {
            this.measure.setKeySignature(args[0]);
        }
        else if (typeof args[0] === "string" && Utils.Is.isEnumValue(args[1], ScaleType)) {
            this.measure.setKeySignature(args[0], args[1]);
        }
        return this;
    }

    setTimeSignature(timeSignature: TimeSignature | TimeSignatureString): DocumentBuilder {
        this.measure.setTimeSignature(timeSignature);
        return this;
    }

    setTempo(beatsPerMinute: number, beatLength?: NoteLength, dotted?: boolean): DocumentBuilder {
        this.measure.setTempo(beatsPerMinute, beatLength, dotted);
        return this;
    }

    addNote(voiceId: number, note: Note | string, noteLength: NoteLength, options?: NoteOptions): DocumentBuilder {
        this.measure.addNote(voiceId, note, noteLength, options);
        return this;
    }

    addChord(voiceId: number, notes: (Note | string)[], noteLength: NoteLength, options?: NoteOptions): DocumentBuilder {
        this.measure.addChord(voiceId, notes, noteLength, options);
        return this;
    }

    addRest(voiceId: number, restLength: NoteLength, options?: RestOptions): DocumentBuilder {
        this.measure.addRest(voiceId, restLength, options);
        return this;
    }

    addFermata(fermata?: Fermata): DocumentBuilder {
        this.measure.addFermata(fermata ?? Fermata.AtNote);
        return this;
    }

    addNavigation(navigation: Navigation): DocumentBuilder;
    addNavigation(navigation: Navigation.EndRepeat, playCount: number): DocumentBuilder;
    addNavigation(navigation: Navigation.Ending, ...passages: number[]): DocumentBuilder;
    addNavigation(navigation: Navigation, ...args: unknown[]): DocumentBuilder {
        if (navigation === Navigation.EndRepeat && typeof args[0] === "number") {
            this.measure.addNavigation(navigation, args[0]);
        }
        else if (navigation === Navigation.Ending && args.length > 0) {
            this.measure.addNavigation(navigation, ...args as number[]);
        }
        else {
            this.measure.addNavigation(navigation);
        }
        return this;
    }

    addConnective(connective: Connective.Tie, tieSpan?: number | TieType, notAnchor?: NoteAnchor): DocumentBuilder;
    addConnective(connective: Connective.Slur, slurSpan?: number, notAnchor?: NoteAnchor): DocumentBuilder;
    addConnective(connective: Connective.Slide, notAnchor?: NoteAnchor): DocumentBuilder;
    addConnective(connective: Connective, ...args: unknown[]): DocumentBuilder {
        if (connective === Connective.Tie) {
            let tieSpan = args[0] as ConnectiveSpan | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.measure.addConnective(connective, tieSpan, noteAnchor);
        }
        else if (connective === Connective.Slur) {
            let slurSpan = args[0] as ConnectiveSpan | undefined;
            let noteAnchor = args[1] as NoteAnchor | undefined;
            this.measure.addConnective(connective, slurSpan, noteAnchor);
        }
        else if (connective === Connective.Slide) {
            let noteAnchor = args[0] as NoteAnchor | undefined;
            this.measure.addConnective(connective, noteAnchor);
        }

        return this;
    }

    addLabel(label: Label, text: string): DocumentBuilder {
        this.measure.addLabel(label, text);
        return this;
    }

    addAnnotation(annotation: Annotation, text: string): DocumentBuilder {
        this.measure.addAnnotation(annotation, text);
        return this;
    }

    addExtension(extensionLength: NoteLength | number, extensionVisible?: boolean): DocumentBuilder {
        this.measure.addExtension(extensionLength, extensionVisible ?? true);
        return this;
    }

    endSong(): DocumentBuilder {
        this.measure.endSong();
        return this;
    }

    endSection(): DocumentBuilder {
        this.measure.endSection();
        return this;
    }

    endRow(): DocumentBuilder {
        this.measure.endRow();
        return this;
    }

    completeRests(voiceId?: number): DocumentBuilder {
        this.measure.completeRests(voiceId);
        return this;
    }

    addScaleArpeggio(scale: Scale, bottomNote: string, numOctaves: number): DocumentBuilder {
        assertArg(Utils.Is.isString(bottomNote), "bottomNote", bottomNote);
        assertArg(Utils.Is.isIntegerGte(numOctaves, 1), "numOctaves", numOctaves);

        let m = this.measure.getMusicObject();
        let ts = m.getTimeSignature();
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