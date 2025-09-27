import { Utils } from "@tspro/ts-utils-lib";
import { Accidental, Note } from "./note";
import { getScale, ScaleType } from "./scale";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

function getAccidental(chromaticId: number, diatonicId: number): Accidental {
    let a = Note.getChromaticClass(chromaticId) - new Note(diatonicId, 0).chromaticClass;
    while (a > 2) { a -= 12; }
    while (a < -2) { a += 12; }
    return Note.validateAccidental(a);
}

const DegreeRule = /^(bb?|b?|#?|x?)([0-9]*)$/;

function parseDegree(degree: number | string): { deg: number, acc: number } {
    let m = DegreeRule.exec("" + degree);

    if (!m) {
        throw new MusicError(MusicErrorType.KeySignature, `Invalid degree: ${degree}`);
    }

    let acc = Note.getAccidental(m[1] ?? "") ?? 0;
    let deg = +m[2];

    if (!Utils.Is.isInteger(acc) || acc < -2 || acc > 2 || !Utils.Is.isInteger(deg) || deg < 1) {
        throw new MusicError(MusicErrorType.KeySignature, `Invalid degree: ${degree}`);
    }
    else {
        return { deg, acc }
    }
}

/** Mode enum. */
export enum Mode {
    /** Mode 1: Ionian (Major). */
    Ionian = 1,
    /** Mode 2: Dorian. */
    Dorian,
    /** Mode 3: Phrygian. */
    Phrygian,
    /** Mode 4: Lydian. */
    Lydian,
    /** Mode 5: Mixolydian. */
    Mixolydian,
    /** Mode 6: Aeolian (minor). */
    Aeolian,
    /** Mode 7: Locrian. */
    Locrian
}

/** Accidental type enum. */
export enum AccidentalType {
    /** Natural type has no accidentals. */
    Natural,
    /** Flats type has one or more flats. */
    Flats,
    /** Sharps type has one or more sharps. */
    Sharps
}

/**
 * Get default key signature (key signature of "C Major" scale).
 * @returns - Default key signature.
 */
export function getDefaultKeySignature(): KeySignature {
    return getScale("C", ScaleType.Major);
}

export class KeySignature {
    private static readonly OrderOfSharps = "FCGDAEB";
    private static readonly OrderOfFlats = "BEADGCF";

    private readonly naturalScaleNotes: Note[];
    private readonly accidentalByDiatonicClass: Accidental[];
    private readonly orderedAccidentedNotes: Note[];

    /**
     * @param tonic - Tonic/root note.
     * @param mode - Mode: Ionian/Major = 1, Dorian = 2, ..., Locrian = 7
     */
    protected constructor(readonly tonic: string, readonly mode: Mode) {
        if (!Utils.Is.isEnumValue(mode, Mode)) {
            throw new MusicError(MusicErrorType.KeySignature, `Invalid mode: ${mode}`);
        }

        let intervals = [2, 2, 1, 2, 2, 2, 1];

        for (let i = 1; i < mode; i++) {
            intervals.push(intervals.shift()!);
        }

        this.naturalScaleNotes = [];
        this.accidentalByDiatonicClass = [];

        let diatonicId = Note.getDiatonicClass(tonic[0]); // Tonic without #, b, etc., just note letter.
        let chromaticId = Note.getNote(tonic + "0").chromaticId;

        for (let id = 0; id < 7; diatonicId++, chromaticId += intervals[id], id++) {
            let note = new Note(Note.getDiatonicClass(diatonicId), getAccidental(chromaticId, diatonicId));

            if (Math.abs(note.accidental) >= 2) {
                throw new MusicError(MusicErrorType.KeySignature, "Key signature contains double accidental.");
            }

            this.naturalScaleNotes[id] = note;
            this.accidentalByDiatonicClass[note.diatonicClass] = note.accidental;
        }

        let sharps = this.naturalScaleNotes.filter(n => n.accidental > 0).sort((a, b) => {
            let ai = KeySignature.OrderOfSharps.indexOf(a.noteLetter);
            let bi = KeySignature.OrderOfSharps.indexOf(b.noteLetter);
            if (ai === -1 || bi === -1) {
                throw new MusicError(MusicErrorType.KeySignature, "Unexpected note in key signature.");
            }
            return ai - bi;
        });

        let flats = this.naturalScaleNotes.filter(n => n.accidental < 0).sort((a, b) => {
            let ai = KeySignature.OrderOfFlats.indexOf(a.noteLetter);
            let bi = KeySignature.OrderOfFlats.indexOf(b.noteLetter);
            if (ai === -1 || bi === -1) {
                throw new MusicError(MusicErrorType.KeySignature, "Unexpected note in key signature.");
            }
            return ai - bi;
        });

        if (sharps.length !== 0 && flats.length !== 0) {
            throw new MusicError(MusicErrorType.KeySignature, "Key Signature has both sharps and flats.");
        }

        this.orderedAccidentedNotes = flats.length > 0 ? flats : sharps;
    }

    /**
     * Get accidental type sharps, flats, or natural (without accidentals).
     * @returns - Accidental type.
     */
    getAccidentalType(): AccidentalType {
        if (this.orderedAccidentedNotes.length === 0) {
            return AccidentalType.Natural;
        }
        else if (this.orderedAccidentedNotes[0].accidental < 0) {
            return AccidentalType.Flats;
        }
        else {
            return AccidentalType.Sharps;
        }
    }

    /**
     * Get natural scale notes of this key signature, natural scale has 7 steps (e.g. Major scale: W, W, H, W, W, W, H).
     * @returns - Array of notes.
     */
    getNaturalScaleNotes(): ReadonlyArray<Note> {
        return this.naturalScaleNotes;
    }

    /**
     * Get accidental for given diatonic id.
     * @param diatonicId - Diatonic id.
     * @returns - Accidental -2, -1, 0, 1 or 2.
     */
    getAccidental(diatonicId: number): Accidental {
        return this.accidentalByDiatonicClass[Note.getDiatonicClass(diatonicId)] ?? 0;
    }

    /**
     * Get number of accidentals this key signature has.
     * @returns - Number of accidentals.
     */
    getNumAccidentals(): number {
        return this.orderedAccidentedNotes.length;
    }

    /**
     * Get accidental notes in correct order.
     * @returns - Array of accidental notes.
     */
    getOrderedAccidentalNotes(): ReadonlyArray<Note> {
        return this.orderedAccidentedNotes;
    }

    /**
     * Get note of key signature by degree value.
     * @param degree - Degree number in range [1, 7] or string e.g "b5" or "#4".
     * @returns - Note.
     */
    getNoteByDegree(degree: number | string): Note {
        let { deg, acc } = parseDegree(degree);
        if (acc === 0) {
            return this.naturalScaleNotes[(deg - 1) % 7];
        }
        else {
            let note = this.naturalScaleNotes[(deg - 1) % 7];
            return new Note(note.diatonicId, note.accidental + acc);
        }
    }

    /**
     * Test equality of given key signatures.
     * @param a - Key signature a.
     * @param b - Key signature b.
     * @returns - True/false.
     */
    static equals(a: KeySignature | null | undefined, b: KeySignature | null | undefined): boolean {
        if (a == null && b == null) {
            // handles null and undefined
            return true;
        }
        else if (a == null || b == null) {
            return false;
        }
        else {
            return a === b || (a.tonic === b.tonic && a.mode === b.mode);
        }
    }
}
