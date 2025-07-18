import { Assert, Utils } from "@tspro/ts-utils-lib";
import { Note } from "./note";
import { SymbolSet } from "./types";
import { AccidentalType, KeySignature } from "./key-signature";
import { Interval } from "./interval";

const FullTonicList: ReadonlyArray<string> = [
    "Cb", "C", "C#", "Db", "D", "D#", "Eb", "E", "E#", "Fb", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "B#"
];

/** @public */
export type Degree = 1 | 2 | "b3" | 3 | 4 | "b5" | 5 | "#5" | 6 | "bb7" | "b7" | 7 | "#7" | "b9" | 9 | "#9" | 11 | 13;

/** @public */
export enum ScaleType {
    Major = "Major",
    NaturalMinor = "Natural Minor",
    HarmonicMinor = "Harmonic Minor",
    // Modes:
    Ionian = "Ionian",
    Dorian = "Dorian",
    Phrygian = "Phrygian",
    Lydian = "Lydian",
    Mixolydian = "Mixolydian",
    Aeolian = "Aeolian",
    Locrian = "Locrian",
    // Other
    MajorPentatonic = "Major Pentatonic",
    MinorPentatonic = "Minor Pentatonic",
    // Blues
    MajorHexatonicBlues = "Major Hexatonic Blues",
    MinorHexatonicBlues = "Minor Hexatonic Blues",
    HeptatonicBlues = "Heptatonic Blues",
}

class PreferredChromaticNote {
    constructor(readonly note: Note, readonly isScaleNote: boolean, readonly isScaleRootNote: boolean) { }
}

function getMode(scaleType: ScaleType) {
    switch (scaleType) {
        case ScaleType.Major: return 1;
        case ScaleType.NaturalMinor: return 6;
        case ScaleType.HarmonicMinor: return 6;
        case ScaleType.Ionian: return 1;
        case ScaleType.Dorian: return 2;
        case ScaleType.Phrygian: return 3;
        case ScaleType.Lydian: return 4;
        case ScaleType.Mixolydian: return 5;
        case ScaleType.Aeolian: return 6;
        case ScaleType.Locrian: return 7;
        case ScaleType.MajorPentatonic: return 1;
        case ScaleType.MinorPentatonic: return 6;
        case ScaleType.MajorHexatonicBlues: return 1;
        case ScaleType.MinorHexatonicBlues: return 6;
        case ScaleType.HeptatonicBlues: return 1;
        default:
            Assert.interrupt("Invalid scaleType: " + scaleType);
    }
}

/** @public */
export class Scale extends KeySignature {
    private readonly scaleDegrees: ReadonlyArray<Degree>;
    private readonly scaleNotes: ReadonlyArray<Note>;

    constructor(readonly tonic: string, readonly scaleType: ScaleType) {
        super(tonic, getMode(scaleType));

        switch (scaleType) {
            case ScaleType.HarmonicMinor:
                // Make 7#
                this.scaleDegrees = [1, 2, 3, 4, 5, 6, "#7"];
                break;
            case ScaleType.MajorPentatonic:
                // Remove 4th and 7th degrees
                this.scaleDegrees = [1, 2, 3, 5, 6];
                break;
            case ScaleType.MinorPentatonic:
                // Remove 2nd and 6th degrees
                this.scaleDegrees = [1, 3, 4, 5, 7];
                break;
            case ScaleType.MajorHexatonicBlues:
                // Remove 4th and 7th degrees
                // Add 3b (or 2# to avoid double flat?)
                this.scaleDegrees = [1, 2, "b3", 3, 5, 6];
                break;
            case ScaleType.MinorHexatonicBlues:
                // Remove 2nd and 6th degrees
                // Add 5b (or 4# to avoid double flat?)
                this.scaleDegrees = [1, 3, 4, "b5", 5, 7];
                break;
            case ScaleType.HeptatonicBlues:
                // Make 3b, 5b and 7b
                this.scaleDegrees = [1, 2, "b3", 4, "b5", 6, "b7"];
                break;
            default:
                this.scaleDegrees = [1, 2, 3, 4, 5, 6, 7];
                break;
        }

        this.scaleNotes = this.scaleDegrees.map(d => this.getNoteByDegree(d));
    }

    static equals(a?: Scale | null, b?: Scale | null): boolean {
        if (!a || !b) {
            return false;
        }
        else {
            return a === b || a.getScaleName() === b.getScaleName();
        }
    }

    getScaleName(symbolSet?: SymbolSet) {
        switch (symbolSet) {
            case SymbolSet.Unicode:
                return Note.getScientificNoteName(this.tonic, symbolSet) + " " + this.scaleType;
            default:
                return this.tonic + " " + this.scaleType;
        }
    }

    getScaleNotes(lowestPitchNote: string, numOctaves: number): Note[] {
        Assert.int_gte(numOctaves, 1, "Invalid numOctaves = " + numOctaves);

        let lowestPitch = Note.getNote(lowestPitchNote).pitch;

        let scaleNoteList: Note[] = [];

        for (let o = 1; o <= numOctaves; o++) {
            scaleNoteList = [...scaleNoteList, ...this.scaleNotes];
        }

        scaleNoteList.push(this.scaleNotes[0]);

        return scaleNoteList.map(accNote => {
            let pitch = accNote.getPitchInOctave(0);
            while (pitch < lowestPitch) {
                pitch += 7;
            }
            lowestPitch = pitch;
            return new Note(pitch, accNote.accidental);
        });
    }

    getScaleOverview() {
        return this.getScaleNotes("C4", 1).map(note => note.formatOmitOctave(SymbolSet.Unicode)).join(" - ");
    }

    getScaleSteps(): number[] {
        let noteIds = this.getScaleNotes("C4", 1).map(note => note.noteId);
        let steps: number[] = [];
        for (let i = 0; i < noteIds.length - 1; i++) {
            steps.push(Utils.Math.mod(noteIds[i + 1] - noteIds[i], 12));
        }
        return steps;
    }

    getScaleStringSteps(): string[] {
        return this.getScaleSteps().map(step => step === 1 ? "H" : (step === 2 ? "W" : (step.toString() + "H")));
    }

    isScaleNote(note: Note): boolean {
        let n = this.getPreferredChromaticNote(note.noteId);
        return Note.equals(n.note, note) && n.isScaleNote;
    }

    isScaleRootNote(note: Note): boolean {
        let n = this.getPreferredChromaticNote(note.noteId);
        return Note.equals(n.note, note) && n.isScaleRootNote;
    }

    getIntervalFromRootNote(note: Note): Interval {
        let rootNote = this.getScaleNotes("C0", 1)[0];

        while (note.noteId >= rootNote.noteId + 12) {
            note = new Note(note.pitch - 7, note.accidental);
        }

        Assert.assert(note.noteId >= rootNote.noteId, "Note cannot be below root note!");

        let iv = Interval.get(rootNote, note);

        return Assert.require(iv, "Scale note interval is required!");
    }

    getPreferredNote(noteId: number): Note {
        return this.getPreferredChromaticNote(noteId).note;
    }

    private preferredChromaticNoteCache: PreferredChromaticNote[] = [];

    private getPreferredChromaticNote(noteId: number): PreferredChromaticNote {
        Note.validateNoteId(noteId);

        if (this.preferredChromaticNoteCache[noteId]) {
            return this.preferredChromaticNoteCache[noteId];
        }

        let octave = Math.floor(noteId / 12);

        // Get the note that belongs to scale
        let scaleNotes = this.scaleNotes.map(accNote => {
            if (accNote.naturalNote === "C" && accNote.accidental < 0) {
                return new Note(accNote.getPitchInOctave(octave + 1), accNote.accidental)
            }
            else if (accNote.naturalNote === "B" && accNote.accidental > 0) {
                return new Note(accNote.getPitchInOctave(octave - 1), accNote.accidental)
            }
            else {
                return new Note(accNote.getPitchInOctave(octave), accNote.accidental)
            }
        });

        let scaleNote = scaleNotes.find(note => noteId % 12 === note.noteId % 12);
        if (scaleNote) {
            let isScaleNote = true;
            let isScaleRootNote = scaleNote === scaleNotes[0];
            return this.preferredChromaticNoteCache[noteId] = new PreferredChromaticNote(scaleNote, isScaleNote, isScaleRootNote);
        }

        // Other method
        let midPitch = Note.getNaturelNotePitch("CCDDEFFGGAAB"[noteId % 12], octave);
        let pitchStart = midPitch - 2;
        let pitchEnd = midPitch + 2;

        let preferFlat = this.getAccidentalType() === AccidentalType.Flats;
        let preferredAccs = preferFlat ? [0, -1, 1, -2, 2] : [0, 1, -1, 2, -2];

        for (let ai = 0; ai < preferredAccs.length; ai++) {
            let acc = preferredAccs[ai];
            for (let pitch = Math.max(0, pitchStart); pitch <= pitchEnd; pitch++) {
                let note = new Note(pitch, acc);
                if (noteId === note.noteId) {
                    let isScaleNote = false;
                    let isScaleRootNote = false;
                    return this.preferredChromaticNoteCache[noteId] = new PreferredChromaticNote(note, isScaleNote, isScaleRootNote);
                }
            }
        }

        Assert.interrupt("Invalid noteId: " + noteId);
    }

}

/** @public */
export class ScaleFactory {
    private tonicList: string[] = [];
    private scaleMap: Map<string, Scale> = new Map();

    constructor(readonly type: ScaleType) {
        let naturalScales: Scale[] = [];
        let sharpScales: Scale[] = [];
        let flatScales: Scale[] = [];

        FullTonicList.forEach(tonic => {
            try {
                let scale = new Scale(tonic, this.type);

                switch (scale.getAccidentalType()) {
                    case AccidentalType.Natural:
                        naturalScales.push(scale);
                        break;
                    case AccidentalType.Sharps:
                        if (tonic.endsWith("b")) {
                            return;
                        }
                        else {
                            sharpScales.push(scale);
                            break;
                        }
                    case AccidentalType.Flats:
                        if (tonic.endsWith("#")) {
                            return;
                        }
                        else {
                            flatScales.push(scale);
                            break;
                        }
                }

                this.scaleMap.set(tonic, scale);
            }
            catch (err) {
                // Ignore scales with double accidental and other error scales
            }
        });

        Assert.int_gte(naturalScales.length, 1, "Expected natural scale.");

        const SortByAccidentalCountFunc = (a: Scale, b: Scale) => a.getNumAccidentals() - b.getNumAccidentals();

        this.tonicList = [
            ...naturalScales.sort(SortByAccidentalCountFunc).map(scale => scale.tonic),
            "- Sharps -",
            ...sharpScales.sort(SortByAccidentalCountFunc).map(scale => scale.tonic),
            "- Flats -",
            ...flatScales.sort(SortByAccidentalCountFunc).map(scale => scale.tonic),
        ];
    }

    getTonicList(): ReadonlyArray<string> {
        return this.tonicList;
    }

    getDefaultTonic(): string {
        return this.tonicList[0];
    }

    getType(): ScaleType {
        return this.type;
    }

    getScale(tonic: string): Scale {
        let scale = this.scaleMap.get(tonic);
        Assert.assert(scale, "Invalid scale: " + tonic + " " + this.type);
        return scale!;
    }

    hasScale(tonic: string) {
        return this.scaleMap.get(tonic) !== undefined;
    }
}

const ScaleFactoryList: ReadonlyArray<ScaleFactory | string> = [
    new ScaleFactory(ScaleType.Major),
    new ScaleFactory(ScaleType.NaturalMinor),
    new ScaleFactory(ScaleType.HarmonicMinor),
    "- Modes -",
    new ScaleFactory(ScaleType.Ionian),
    new ScaleFactory(ScaleType.Dorian),
    new ScaleFactory(ScaleType.Phrygian),
    new ScaleFactory(ScaleType.Lydian),
    new ScaleFactory(ScaleType.Mixolydian),
    new ScaleFactory(ScaleType.Aeolian),
    new ScaleFactory(ScaleType.Locrian),
    "- Pentatonic -",
    new ScaleFactory(ScaleType.MajorPentatonic),
    new ScaleFactory(ScaleType.MinorPentatonic),
    "- Blues -",
    new ScaleFactory(ScaleType.MajorHexatonicBlues),
    new ScaleFactory(ScaleType.MinorHexatonicBlues),
    new ScaleFactory(ScaleType.HeptatonicBlues),
];

/** @public */
export function getScaleFactoryList(): ReadonlyArray<ScaleFactory | string> {
    return ScaleFactoryList;
}

const ScaleFactoryMap = new Map<ScaleType, ScaleFactory>();

ScaleFactoryList.forEach(factory => {
    if (factory instanceof ScaleFactory) {
        ScaleFactoryMap.set(factory.getType(), factory);
    }
});

/** @public */
export function getScaleFactory(scaleType: ScaleType): ScaleFactory {
    return Assert.require(ScaleFactoryMap.get(scaleType), "Invalid ScaleType: " + scaleType);
}

/** @public */
export function validateScaleType(scaleType: unknown): ScaleType {
    Assert.assertEnum(scaleType, ScaleType, "ScaleType");
    return scaleType;
}

/** @public */
export function getScale(tonic: string, scaleType: ScaleType): Scale {
    return getScaleFactory(scaleType).getScale(tonic);
}

const DefaultScale = getScale("C", ScaleType.Major);

/** @public */
export function getDefaultScale() {
    return DefaultScale;
}
