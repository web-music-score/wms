import { Assert } from "@tspro/ts-utils-lib";
import { Accidental, Note } from "./note";
import { getScale, ScaleType } from "./scale";

function getAccidental(noteId: number, pitch: number): Accidental {
    let a = noteId % 12 - new Note(pitch, 0).noteId % 12;
    while (a > 2) { a -= 12; }
    while (a < -2) { a += 12; }
    return Note.validateAccidental(a);
}

const DegreeRule = /^(bb?|b?|#?|x?)([0-9]*)$/;
// const DegreeRule = /^(bb|b|x|#|♯|♭)?(\d{1,2})$/; // TODO: ChatGPT improvement 

function parseDegree(degree: number | string): { deg: number, acc: number } {
    let m = Assert.require(DegreeRule.exec("" + degree), "Invalid degree: " + degree);
    let acc = Note.getAccidental(m[1] ?? "") ?? 0;
    let deg = +m[2];

    Assert.int_between(acc, -2, 2, "Invalid degree: " + degree);
    Assert.int_gte(deg, 1, "Invalid degree: " + degree);

    return { deg, acc }
}

function getNormalizedPitch(pitch: number) {
    return Note.validatePitch(pitch % 7);
}

/** @public */
export class KeySignatureError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "KeySignatureError";
    }
}

/** @public */
export enum Mode {
    Ionian = 1,
    Dorian,
    Phrygian,
    Lydian,
    Mixolydian,
    Aeolian,
    Locrian
}

/** @public */
export enum AccidentalType { Natural, Flats, Sharps }

/** @public */
export function getDefaultKeySignature(): KeySignature {
    return getScale("C", ScaleType.Major);
}

/** @public */
export class KeySignature {
    private static readonly OrderOfSharps = "FCGDAEB";
    private static readonly OrderOfFlats = "BEADGCF";

    private readonly naturalScaleNotes: Note[];
    private readonly accidentalByPitch: Accidental[];
    private readonly orderedAccidentedNotes: Note[];

    /**
     * @param tonic - Tonic/root note.
     * @param mode - Mode: Ionian/Major = 1, Dorian = 2, ..., Locrian = 7
     */
    protected constructor(readonly tonic: string, readonly mode: Mode) {
        Assert.assertEnum(mode, Mode, "Invalid mode: " + mode);

        let intervals = [2, 2, 1, 2, 2, 2, 1];

        for (let i = 1; i < mode; i++) {
            intervals.push(intervals.shift()!);
        }

        this.naturalScaleNotes = [];
        this.accidentalByPitch = [];

        let pitch = Note.getNaturelNotePitch(tonic[0]);
        let noteId = Note.getNote(tonic + "0").noteId;

        for (let id = 0; id < 7; pitch++, noteId += intervals[id], id++) {
            let note = new Note(getNormalizedPitch(pitch), getAccidental(noteId, pitch));

            if (Math.abs(note.accidental) >= 2) {
                throw new KeySignatureError("Key signature contains double accidental.");
            }

            this.naturalScaleNotes[id] = note;
            this.accidentalByPitch[note.pitch] = note.accidental;
        }

        let sharps = this.naturalScaleNotes.filter(n => n.accidental > 0).sort((a, b) => {
            let ai = KeySignature.OrderOfSharps.indexOf(a.naturalNote);
            let bi = KeySignature.OrderOfSharps.indexOf(b.naturalNote);
            if (ai === -1 || bi === -1) {
                throw new KeySignatureError("Unexpected note in key signature.");
            }
            return ai - bi;
        });

        let flats = this.naturalScaleNotes.filter(n => n.accidental < 0).sort((a, b) => {
            let ai = KeySignature.OrderOfFlats.indexOf(a.naturalNote);
            let bi = KeySignature.OrderOfFlats.indexOf(b.naturalNote);
            if (ai === -1 || bi === -1) {
                throw new KeySignatureError("Unexpected note in key signature.");
            }
            return ai - bi;
        });

        if (sharps.length !== 0 && flats.length !== 0) {
            throw new KeySignatureError("Key Signature has both sharps and flats.");
        }

        this.orderedAccidentedNotes = flats.length > 0 ? flats : sharps;
    }

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

    getNaturalScaleNotes(): ReadonlyArray<Note> {
        return this.naturalScaleNotes;
    }

    getAccidental(pitch: number): Accidental {
        return this.accidentalByPitch[getNormalizedPitch(pitch)] ?? 0;
    }

    getNumAccidentals(): number {
        return this.orderedAccidentedNotes.length;
    }

    getOrderedAccidentalNotes(): ReadonlyArray<Note> {
        return this.orderedAccidentedNotes;
    }

    /**
     * 
     * @param degree - number 1..7 or string e.g "b5" or "#4"
     * @returns 
     */
    getNoteByDegree(degree: number | string): Note {
        let { deg, acc } = parseDegree(degree);
        if (acc === 0) {
            return this.naturalScaleNotes[(deg - 1) % 7];
        }
        else {
            let note = this.naturalScaleNotes[(deg - 1) % 7];
            return new Note(note.pitch, note.accidental + acc);
        }
    }

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
