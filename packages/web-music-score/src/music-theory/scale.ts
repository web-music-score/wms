import { Assert, Utils } from "@tspro/ts-utils-lib";
import { Accidental, Note } from "./note";
import { SymbolSet } from "./types";
import { KeySignature } from "./key-signature";
import { Interval } from "./interval";

const FullKeyNoteList: ReadonlyArray<string> = [
    "Cb", "C", "C#", "Db", "D", "D#", "Eb", "E", "E#", "Fb", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "B#"
];

const DegreeRule = /^(bb?|b?|#?|x?)([0-9]*)$/;

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

class PreferredChromaticNote {
    constructor(readonly note: Note, readonly isScaleNote: boolean, readonly isScaleRootNote: boolean) { }
}

export class Scale {
    private readonly keySignature: KeySignature;
    private readonly scaleDegrees: ReadonlyArray<Degree>;
    private readonly accidentalNotes: ReadonlyArray<Note>;

    constructor(readonly keyNote: string, readonly scaleType: ScaleType) {
        let mode: number;

        switch (scaleType) {
            case ScaleType.Major: mode = 1; break;
            case ScaleType.NaturalMinor: mode = 6; break;
            case ScaleType.HarmonicMinor: mode = 6; break;
            case ScaleType.Ionian: mode = 1; break;
            case ScaleType.Dorian: mode = 2; break;
            case ScaleType.Phrygian: mode = 3; break;
            case ScaleType.Lydian: mode = 4; break;
            case ScaleType.Mixolydian: mode = 5; break;
            case ScaleType.Aeolian: mode = 6; break;
            case ScaleType.Locrian: mode = 7; break;
            case ScaleType.MajorPentatonic: mode = 1; break;
            case ScaleType.MinorPentatonic: mode = 6; break;
            case ScaleType.MajorHexatonicBlues: mode = 1; break;
            case ScaleType.MinorHexatonicBlues: mode = 6; break;
            case ScaleType.HeptatonicBlues: mode = 1; break;
        }

        this.keySignature = new KeySignature(keyNote, mode);

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

        this.accidentalNotes = this.scaleDegrees.map(d => this.getKeySignature().getScaleNote(d));
    }

    equals(o: Scale) {
        return this.getScaleName() === o.getScaleName();
    }

    static parseDegree(degree: number | string): { deg: number, acc: number } {
        let m = Assert.require(DegreeRule.exec("" + degree), "Invalid degree: " + degree);
        let acc = Note.getAccidental(m[1] ?? "") ?? 0;
        let deg = +m[2];
        return { deg, acc }
    }

    getScaleName(symbolSet?: SymbolSet) {
        switch (symbolSet) {
            case SymbolSet.Unicode:
                return Note.getScientificNoteName(this.keyNote, symbolSet) + " " + this.scaleType;
            default:
                return this.keyNote + " " + this.scaleType;
        }
    }

    getScaleNotes(lowestPitchNote: string, numOctaves: number): Note[] {
        Assert.int_gte(numOctaves, 1, "Invalid numOctaves = " + numOctaves);

        let lowestPitch = Note.getNote(lowestPitchNote).pitch;

        let accNoteList: Note[] = [];

        for (let o = 1; o <= numOctaves; o++) {
            accNoteList = [...accNoteList, ...this.accidentalNotes];
        }

        accNoteList.push(this.accidentalNotes[0]);

        return accNoteList.map(accNote => {
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

    getKeySignature(): KeySignature {
        return this.keySignature;
    }

    getAccidental(pitch: number): Accidental {
        return this.getKeySignature().getAccidental(pitch);
    }

    isScaleNote(note: Note): boolean {
        let n = this.getPreferredChromaticNote(note.noteId);
        return n.note.equals(note) && n.isScaleNote;
    }

    isScaleRootNote(note: Note): boolean {
        let n = this.getPreferredChromaticNote(note.noteId);
        return n.note.equals(note) && n.isScaleRootNote;
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
        let scaleNotes = this.accidentalNotes.map(accNote => {
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

        let preferFlat = this.getKeySignature().getType() === "flat";
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

export class ScaleFactory {
    private keyNoteList: string[] = [];
    private scaleMap: Map<string, Scale> = new Map();

    constructor(readonly type: ScaleType) {
        let naturalScales: Scale[] = [];
        let sharpScales: Scale[] = [];
        let flatScales: Scale[] = [];

        FullKeyNoteList.forEach(keyNote => {
            try {
                let scale = new Scale(keyNote, this.type);

                switch (scale.getKeySignature().getType()) {
                    case "natural":
                        naturalScales.push(scale);
                        break;
                    case "sharp":
                        if (keyNote.endsWith("b")) {
                            return;
                        }
                        else {
                            sharpScales.push(scale);
                            break;
                        }
                    case "flat":
                        if (keyNote.endsWith("#")) {
                            return;
                        }
                        else {
                            flatScales.push(scale);
                            break;
                        }
                }

                this.scaleMap.set(keyNote, scale);
            }
            catch (err) {
                // Ignore scales with double accidental and other error scales
            }
        });

        Assert.int_gte(naturalScales.length, 1, "Expected natural scale.");

        const SortByAccidentalCountFunc = (a: Scale, b: Scale) => a.getKeySignature().getNumAccidentals() - b.getKeySignature().getNumAccidentals();

        this.keyNoteList = [
            ...naturalScales.sort(SortByAccidentalCountFunc).map(scale => scale.keyNote),
            "- Sharps -",
            ...sharpScales.sort(SortByAccidentalCountFunc).map(scale => scale.keyNote),
            "- Flats -",
            ...flatScales.sort(SortByAccidentalCountFunc).map(scale => scale.keyNote),
        ];
    }

    getKeyNoteList(): ReadonlyArray<string> {
        return this.keyNoteList;
    }

    getDefaultKeyNote(): string {
        return this.keyNoteList[0];
    }

    getType(): ScaleType {
        return this.type;
    }

    getScale(keyNote: string): Scale {
        let scale = this.scaleMap.get(keyNote);
        return scale ? scale : Assert.interrupt("Invalid scale: " + keyNote + " " + this.type);
    }

    hasScale(keyNote: string) {
        return this.scaleMap.get(keyNote) !== undefined;
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

export function getScaleFactoryList(filter?: (scaleType: ScaleType) => boolean): ReadonlyArray<ScaleFactory | string> {
    if (!filter) {
        return ScaleFactoryList;
    }

    let factoryList = ScaleFactoryList.filter(factory => typeof factory === "string" || filter(factory.getType()));

    // Remove strings that are not followed by ScaleFactory.
    for (let i = 0; i < factoryList.length;) {
        if (typeof factoryList[i] === "string" && !(factoryList[i + 1] instanceof ScaleFactory)) {
            factoryList.splice(i, 1);
        }
        else {
            i++;
        }
    }

    return factoryList;
}

const ScaleFactoryMap = new Map<ScaleType, ScaleFactory>();

ScaleFactoryList.forEach(factory => {
    if (factory instanceof ScaleFactory) {
        ScaleFactoryMap.set(factory.getType(), factory);
    }
});

export function getScaleFactory(scaleType: ScaleType): ScaleFactory {
    return Assert.require(ScaleFactoryMap.get(scaleType));
}

export function validateScaleType(scaleTypeStr: string): ScaleType {
    let f = ScaleFactoryMap.get(scaleTypeStr as ScaleType);
    return f ? f.getType() : Assert.interrupt("Invalid scale type: " + scaleTypeStr);
}

export function getScale(keyNote: string, scaleType: ScaleType): Scale {
    return getScaleFactory(scaleType).getScale(keyNote);
}

let defaultScale: Scale | undefined;

export function getDefaultScale() {
    if (!defaultScale) {
        defaultScale = getScale("C", ScaleType.Major);
    }
    return defaultScale;
}

