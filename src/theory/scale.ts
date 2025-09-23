import { Utils } from "@tspro/ts-utils-lib";
import { Note } from "./note";
import { SymbolSet } from "./types";
import { AccidentalType, KeySignature } from "./key-signature";
import { Interval } from "./interval";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

function getNaturalDiatonicId(chromaticId: number): number {
    // ChromaticId could map to several diatonicId/accidental combinations.
    let diatonicClass = Note.getDiatonicClass("CCDDEFFGGAAB"[Note.getChromaticClass(chromaticId)]);
    let octave = Note.getOctaveFromChromaticId(chromaticId);
    return Note.getDiatonicIdInOctave(diatonicClass, octave);
}

const FullTonicList: ReadonlyArray<string> = [
    "Cb", "C", "C#", "Db", "D", "D#", "Eb", "E", "E#", "Fb", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "B#"
];

export type Degree = 1 | 2 | "b3" | 3 | 4 | "b5" | 5 | "#5" | 6 | "bb7" | "b7" | 7 | "#7" | "b9" | 9 | "#9" | 11 | 13;

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
            throw new MusicError(MusicErrorType.Scale, `Invalid scaleType: ${scaleType}`);
    }
}

export class Scale extends KeySignature {
    private readonly scaleDegrees: ReadonlyArray<Degree>;
    private readonly scaleNotes: ReadonlyArray<Note>;
    private readonly chromaticClassDegree: ReadonlyArray<Degree | undefined>;

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

        this.chromaticClassDegree = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(chromaticClass => {
            let id = this.scaleNotes.findIndex(scaleNote => scaleNote.chromaticClass === chromaticClass);
            return id >= 0 ? this.scaleDegrees[id] : undefined;
        });
    }

    static equals(a: Scale | null | undefined, b: Scale | null | undefined): boolean {
        if (a == null && b == null) {
            // handles null and undefined
            return true;
        }
        else if (a == null || b == null) {
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

    getScaleNotes(bottomNote: string, numOctaves: number): Note[] {
        if (!Utils.Is.isIntegerGte(numOctaves, 1)) {
            throw new MusicError(MusicErrorType.Scale, `Invalid numOctaves: ${numOctaves}`);
        }

        let scaleNoteList: Note[] = [];

        for (let o = 1; o <= numOctaves; o++) {
            scaleNoteList = [...scaleNoteList, ...this.scaleNotes];
        }

        scaleNoteList.push(this.scaleNotes[0]);

        let diatonicId = Note.getNote(bottomNote).diatonicId;

        return scaleNoteList.map(note => {
            diatonicId = Note.findNextDiatonicIdAbove(note.diatonicId, diatonicId, false);
            return new Note(diatonicId, note.accidental);
        });
    }

    getScaleOverview() {
        return this.getScaleNotes("C4", 1).map(note => note.formatOmitOctave(SymbolSet.Unicode)).join(" - ");
    }

    getScaleSteps(): number[] {
        let chromaticIds = this.getScaleNotes("C4", 1).map(note => note.chromaticId);
        let steps: number[] = [];
        for (let i = 0; i < chromaticIds.length - 1; i++) {
            steps.push(Utils.Math.mod(chromaticIds[i + 1] - chromaticIds[i], 12));
        }
        return steps;
    }

    getScaleStringSteps(): string[] {
        return this.getScaleSteps().map(step => step === 1 ? "H" : (step === 2 ? "W" : (step.toString() + "H")));
    }

    isScaleNote(note: Note): boolean {
        return this.chromaticClassDegree[note.chromaticClass] !== undefined;
    }

    isScaleRootNote(note: Note): boolean {
        return String(this.chromaticClassDegree[note.chromaticClass]) === "1";
    }

    getIntervalFromRootNote(note: Note): Interval {
        let rootNote = this.getScaleNotes("C0", 1)[0];

        while (note.chromaticId >= rootNote.chromaticId + 12) {
            note = new Note(note.diatonicClass, note.accidental, note.octave - 1);
        }

        if (note.chromaticId < rootNote.chromaticId) {
            throw new MusicError(MusicErrorType.Scale, `Note is below rootNote.`);
        }

        let interval = Interval.get(rootNote, note);

        if (interval === undefined) {
            throw new MusicError(MusicErrorType.Scale, `Interval is undefined.`);
        }
        else {
            return interval;
        }
    }

    private preferredChromaticNoteCache = new Map<number, Note>();

    getPreferredChromaticNote(chromaticId: number): Note {
        Note.validateChromaticId(chromaticId);

        let note = this.preferredChromaticNoteCache.get(chromaticId);
        if (note) {
            return note;
        }

        let octave = Note.getOctaveFromChromaticId(chromaticId);

        // Get the note that belongs to scale
        let scaleNotes = this.scaleNotes.map(accNote => {
            if (accNote.noteLetter === "C" && accNote.accidental < 0) {
                return new Note(accNote.diatonicClass, accNote.accidental, octave + 1)
            }
            else if (accNote.noteLetter === "B" && accNote.accidental > 0) {
                return new Note(accNote.diatonicClass, accNote.accidental, octave - 1)
            }
            else {
                return new Note(accNote.diatonicClass, accNote.accidental, octave)
            }
        });

        note = scaleNotes.find(note2 => Note.getChromaticClass(chromaticId) === note2.chromaticClass);
        if (note) {
            this.preferredChromaticNoteCache.set(chromaticId, note);
            return note;
        }

        // Other method
        let diatonicIdMid = getNaturalDiatonicId(chromaticId);
        let diatonicIdStart = diatonicIdMid - 2;
        let diatonicIdEnd = diatonicIdMid + 2;

        let preferFlat = this.getAccidentalType() === AccidentalType.Flats;
        let preferredAccs = preferFlat ? [0, -1, 1, -2, 2] : [0, 1, -1, 2, -2];

        for (let ai = 0; ai < preferredAccs.length; ai++) {
            let acc = preferredAccs[ai];
            for (let diatonicId = Math.max(0, diatonicIdStart); diatonicId <= diatonicIdEnd; diatonicId++) {
                note = new Note(diatonicId, acc);
                if (chromaticId === note.chromaticId) {
                    this.preferredChromaticNoteCache.set(chromaticId, note);
                    return note;
                }
            }
        }

        // Final method (if ever occurs).
        note = Note.getChromaticNote(chromaticId);
        this.preferredChromaticNoteCache.set(chromaticId, note);
        return note;
    }
}

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

        if (naturalScales.length === 0) {
            throw new MusicError(MusicErrorType.Scale, `Expected natural scale.`);
        }

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
        if (!scale) {
            throw new MusicError(MusicErrorType.Scale, `Invalid scale: ${tonic} ${this.type}`);
        }
        else {
            return scale;
        }
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

export function getScaleFactoryList(): ReadonlyArray<ScaleFactory | string> {
    return ScaleFactoryList;
}

const ScaleFactoryMap = new Map<ScaleType | `${ScaleType}`, ScaleFactory>();

ScaleFactoryList.forEach(factory => {
    if (factory instanceof ScaleFactory) {
        ScaleFactoryMap.set(factory.getType(), factory);
    }
});

export function getScaleFactory(scaleType: ScaleType | `${ScaleType}`): ScaleFactory {
    let f = ScaleFactoryMap.get(scaleType);
    if (!f) {
        throw new MusicError(MusicErrorType.Scale, `Invalid scaleType: ${scaleType}`);
    }
    else {
        return f;
    }
}

export function validateScaleType(scaleType: unknown): ScaleType {
    if (Utils.Is.isEnumValue(scaleType, ScaleType)) {
        return scaleType;
    }
    else {
        throw new MusicError(MusicErrorType.Scale, `Invalid scaleType: "${scaleType}"`);
    }
}

export function getScale(tonic: string, scaleType: ScaleType | `${ScaleType}`): Scale;
export function getScale(scale: string): Scale;
export function getScale(arg0: string, arg1?: ScaleType | `${ScaleType}`): Scale {
    let tonic: string;
    let scaleType: ScaleType;

    if (arg1 !== undefined) {
        tonic = arg0;
        scaleType = validateScaleType(arg1);
    }
    else {
        tonic = arg0.split(" ")[0];
        scaleType = validateScaleType(arg0.substring(tonic.length + 1));
    }

    return getScaleFactory(scaleType).getScale(tonic);
}

const DefaultScale = getScale("C", ScaleType.Major);

export function getDefaultScale() {
    return DefaultScale;
}
