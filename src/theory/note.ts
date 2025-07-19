import { Utils } from "@tspro/ts-utils-lib";
import { Scale } from "./scale";
import { PitchNotation, SymbolSet } from "./types";

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

/** @public */
export class NoteError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "NoteError";
    }
}

/*
    Refactor:
    pitch             => diatonicId
    neutralizedPitch  => diatonicClass

    noteId            => midiNumber
    neutralizedNoteId => pitchClass

    C-1: midiNumber = 0, diatonicId = 0
    C0:  midiNumber = 12, diatonicId = 7
    C1:  midiNumber = 24, diatonicId = 14

    midiNumber:   0      1        2       3        4         5          6       7     8        9      10       11        12   ...
    noteName:     C-1 C-1#/D-1b  D-1  D-1#/E-1b E-1/F-1b  F-1/E-1#  F-1#/G-1b  G-1 G-1#/A-1b  A-1  A-1#/B-1b B-1/C0b  B-1#/C0 ...

    diatonicId:    0   1   2   3   4   5   6  7  ...
    midiNumber:    0   2   4   5   7   9   11 12 ...
    noteName:     C-1 D-1 E-1 F-1 G-1 A-1 B-1 C0 ...
*/

const C0_noteId = 12;
const C0_pitch = 7;

/** @public */
export type Accidental = -2 | -1 | 0 | 1 | 2;

/** @public */
export type NaturalNote = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** @public */
export type ParsedNote = { naturalNote: NaturalNote, accidental: Accidental, octave?: number }

const AccidentalAsciiSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "bb"], [-1, "b"], [0, ""], [1, "#"], [2, "x"]]);
const AccidentalUnicodeSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "𝄫"], [-1, "♭"], [0, ""], [1, "♯"], [2, "𝄪"]]);
const AccidentalMap: ReadonlyMap<string, Accidental> = new Map([["", 0], ["bb", -2], ["b", -1], ["#", 1], ["x", 2], ["𝄫", -2], ["♭", -1], ["♯", 1], ["𝄪", 2]]);

const NaturalNoteByPitch: ReadonlyArray<NaturalNote> = ["C", "D", "E", "F", "G", "A", "B"];
const NoteIdByPitch: ReadonlyArray<number> = [0, 2, 4, 5, 7, 9, 11];

const NoteNameRegex = /^([A-G])((?:bb|𝄫|♭|b|#|♯|x|𝄪)?)?(-?\d+)?$/;

/** @public */
export class Note {
    private static noteByNameCache = new Map<string, Note>();
    private static noteByIdCache = new Map<number, Note>();

    readonly normalizedPitch: number;
    readonly accidental: Accidental;
    readonly octave: number;

    constructor(pitch: number, accidental: number);
    constructor(normalizedPitch: number, accidental: number, octave: number);
    constructor(naturalNote: string, accidental: number, octave: number);
    constructor(arg0: number | string, accidental: number, octave?: number) {
        if (typeof arg0 === "number" && typeof accidental === "number" && octave === undefined) {
            Note.validatePitch(arg0);
            this.normalizedPitch = Note.getNormalizedPitch(arg0);
            this.accidental = Note.validateAccidental(accidental);
            this.octave = Note.getOctaveFromPitch(arg0);
        }
        else if (typeof arg0 === "number" && typeof accidental === "number" && typeof octave === "number") {
            this.normalizedPitch = Note.validateNormalizedPitch(arg0);
            this.accidental = Note.validateAccidental(accidental);
            this.octave = Note.validateOctave(octave);
        }
        else if (typeof arg0 === "string" && typeof accidental === "number" && typeof octave === "number") {
            this.normalizedPitch = Note.getNaturelNotePitch(arg0);
            this.accidental = Note.validateAccidental(accidental);
            this.octave = Note.validateOctave(octave);
        }
        else {
            throw new NoteError(`Invalid Note args: ${arg0}, ${accidental}, ${octave}`);
        }
    }

    get pitch(): number {
        return Note.getPitchInOctave(this.normalizedPitch, this.octave);
    }

    get noteId(): number {
        return Note.getNoteIdInOctave(NoteIdByPitch[this.normalizedPitch] + this.accidental, this.octave);
    }

    get normalizedNoteId(): number {
        return Note.getNormalizedNoteId(NoteIdByPitch[this.normalizedPitch] + this.accidental);
    }

    get naturalNote(): NaturalNote {
        return NaturalNoteByPitch[this.normalizedPitch];
    }

    format(pitchNotation: PitchNotation, symbolSet: SymbolSet) {
        let { naturalNote, octave } = this;
        let accidentalSymbol = Note.getAccidentalSymbol(this.accidental, symbolSet);

        if (pitchNotation === PitchNotation.Helmholtz) {
            if (octave >= 3) {
                // c - c′ - c′′ - ...
                return naturalNote.toLowerCase() + accidentalSymbol + "′".repeat(octave - 3);
            }
            else {
                // C͵ - C͵͵ - C͵͵͵ - ...
                return naturalNote.toUpperCase() + accidentalSymbol + "͵".repeat(2 - octave);
            }
        }
        else {
            return naturalNote + accidentalSymbol + octave;
        }
    }

    formatOmitOctave(symbolSet: SymbolSet) {
        let naturalNote = NaturalNoteByPitch[this.normalizedPitch];
        let accidental = Note.getAccidentalSymbol(this.accidental, symbolSet);
        return naturalNote + accidental;
    }

    static getNote(noteName: string): Note {
        let note = this.noteByNameCache.get(noteName);

        if (note === undefined) {
            let p = Note.parseNote(noteName);

            if (!p) {
                throw new NoteError(`Invalid noteName: ${noteName}`);
            }
            if (p.octave === undefined) {
                throw new NoteError(`Octave is required for note.`);
            }

            note = new Note(p.naturalNote, p.accidental, p.octave);

            this.noteByNameCache.set(noteName, note);
        }

        return note;
    }

    static getNoteById(noteId: number, scale?: Scale): Note {
        if (scale) {
            return scale.getPreferredNote(noteId);
        }
        else {
            let note = this.noteByIdCache.get(noteId);

            if (note === undefined) {
                const NoteNameList = ["C/B#", "C#/Db", "D", "D#/Eb", "E/Fb", "F/E#", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B/Cb"];
                let noteName = NoteNameList[Note.getNormalizedNoteId(noteId)].split("/")[0] + Note.getOctaveFromNoteId(noteId);
                let p = Note.parseNote(noteName);

                if (!p) {
                    throw new NoteError(`Invalid noteName: ${noteName}`);
                }
                if (p.octave === undefined) {
                    throw new NoteError(`Octave is required for note.`);
                }

                note = new Note(p.naturalNote, p.accidental, p.octave);

                this.noteByIdCache.set(noteId, note);
            }

            return note;
        }
    }

    static getNormalizedPitch(pitch: number) {
        return mod(pitch, 7);
    }

    static getOctaveFromPitch(pitch: number) {
        return Math.floor((pitch - C0_pitch) / 7);
    }

    static getPitchInOctave(pitch: number, octave: number) {
        return Note.getNormalizedPitch(pitch) + octave * 7 + C0_pitch;
    }

    static getNormalizedNoteId(noteId: number) {
        return mod(noteId, 12);
    }

    static getOctaveFromNoteId(noteId: number) {
        return Math.floor((noteId - C0_noteId) / 12);
    }

    static getNoteIdInOctave(noteId: number, octave: number) {
        return Note.getNormalizedNoteId(noteId) + octave * 12 + C0_noteId;
    }

    static equals(a: Note | null | undefined, b: Note | null | undefined): boolean {
        if (a == null && b == null) {
            // Handled both null and udefined
            return true;
        }
        else if (a == null || b == null) {
            return false;
        }
        else {
            return a === b || a.pitch === b.pitch && a.accidental === b.accidental;
        }
    }

    static replaceAccidentalSymbols(str: string, symbolSet: SymbolSet) {
        if (symbolSet === SymbolSet.Unicode) {
            return str.replace("bb", "𝄫").replace("b", "♭").replace("#", "♯").replace("x", "𝄪");
        }
        else {
            return str.replace("𝄫", "bb").replace("♭", "b").replace("♯", "#").replace("𝄪", "x");
        }
    }

    static isValidNoteName(noteName: string): boolean {
        return NoteNameRegex.test(noteName);
    }

    static parseNote(noteName: string): Readonly<ParsedNote> | undefined {
        let m = NoteNameRegex.exec(noteName);
        if (!m) {
            return undefined;
        }

        let naturalNote = Note.validateNaturalNote(m[1]);

        let accidentalStr = m[2];
        let accidental = Note.validateAccidental(AccidentalMap.get(accidentalStr) ?? 0);

        let octaveStr = m[3];
        let octave = octaveStr ? Note.validateOctave(+octaveStr) : undefined;

        return { naturalNote, accidental, octave }
    }

    static getScientificNoteName(noteName: string, symbolSet: SymbolSet): string {
        let p = Note.parseNote(noteName);
        if (!p) {
            throw new NoteError(`Invalid noteName: ${noteName}`);
        }
        let { naturalNote, accidental, octave } = p;
        return naturalNote + Note.getAccidentalSymbol(accidental, symbolSet) + (octave ?? "");
    }

    static getAccidentalSymbol(accidental: Accidental, symbolsSet: SymbolSet) {
        return symbolsSet === SymbolSet.Unicode
            ? AccidentalUnicodeSymbolMap.get(accidental)
            : AccidentalAsciiSymbolMap.get(accidental);
    }

    static getAccidental(accidentalSymbol: string): Accidental {
        let accidental = AccidentalMap.get(accidentalSymbol);
        if (accidental === undefined) {
            throw new NoteError(`Invalid accidental: ${accidentalSymbol}`);
        }
        return accidental;
    }

    static getNaturelNotePitch(naturalNote: string, octave?: number): number {
        let pitch = NaturalNoteByPitch.indexOf(Note.validateNaturalNote(naturalNote));
        if (octave !== undefined) {
            return Note.getPitchInOctave(pitch, octave);
        }
        else {
            return pitch;
        }
    }

    static getNaturalNote(pitch: number): NaturalNote {
        return NaturalNoteByPitch[Note.getNormalizedPitch(pitch)];
    }

    static findNextPitchAbove(pitch: number, bottomPitch: number, addOctaveIfEqual: boolean): number {
        let normalizedPitch = Note.getNormalizedPitch(pitch);
        let normalizedBottomPitch = Note.getNormalizedPitch(bottomPitch);

        let addOctave = addOctaveIfEqual
            ? (normalizedPitch <= normalizedBottomPitch ? 1 : 0)
            : (normalizedPitch < normalizedBottomPitch ? 1 : 0);

        return Note.getPitchInOctave(normalizedPitch, Note.getOctaveFromPitch(bottomPitch) + addOctave);
    }

    static validatePitch(pitch: number): number {
        if (Utils.Is.isInteger(pitch)) {
            return pitch;
        }
        else {
            throw new NoteError(`Invalid pitch: ${pitch}`);
        }
    }

    static validateNormalizedPitch(normalizedPitch: number): number {
        if (Utils.Is.isInteger(normalizedPitch) && normalizedPitch >= 0 && normalizedPitch < 7) {
            return normalizedPitch;
        }
        else {
            throw new NoteError(`Invalid normalizedPitch: ${normalizedPitch}`);
        }
    }

    static validateNoteId(noteId: number): number {
        if (Utils.Is.isInteger(noteId)) {
            return noteId;
        }
        else {
            throw new NoteError(`Invalid noteId: ${noteId}`);
        }
    }

    static validateNormalizedNoteId(normalizedNoteId: number): number {
        if (Utils.Is.isInteger(normalizedNoteId) && normalizedNoteId >= 0 && normalizedNoteId < 12) {
            return normalizedNoteId;
        }
        else {
            throw new NoteError(`Invalid normalizedNoteId: ${normalizedNoteId}`);
        }
    }

    static validateNaturalNote(note: string): NaturalNote {
        if (NaturalNoteByPitch.some(n => n === note)) {
            return note as NaturalNote;
        }
        else {
            throw new NoteError(`Invalid note: ${note}`);
        }
    }

    static validateOctave(octave: number): number {
        if (Utils.Is.isInteger(octave)) {
            return octave;
        }
        else {
            throw new NoteError(`Invalid octave: ${octave}`);
        }
    }

    static validateAccidental(acc: number): Accidental {
        if (Utils.Is.isInteger(acc) && acc >= -2 && acc <= 2) {
            return acc as Accidental;
        }
        else {
            throw new NoteError(`Invalid accidental: ${acc}`);
        }
    }

    /**
     * Sort notes by pitch in ascending order.
     * @param notes - Array of notes.
     * @returns Sorted array of notes.
     */
    static sort(notes: ReadonlyArray<Note>): Note[] {
        return notes.slice().sort(Note.compareFunc);
    }

    /**
     * Remove duplicate notes.
     * @param notes - Array of notes.
     * @returns Sorted set of notes.
     */
    static removeDuplicates(notes: ReadonlyArray<Note>): Note[] {
        let uniqueSet: Note[] = [];

        notes.forEach(note => {
            if (uniqueSet.find(n => Note.equals(note, n)) === undefined) {
                uniqueSet.push(note);
            }
        });

        return uniqueSet;
    }

    static compareFunc(a: Note, b: Note) {
        if (a.pitch < b.pitch) {
            return -1;
        }
        else if (a.pitch > b.pitch) {
            return 1;
        }
        else {
            if (a.accidental < b.accidental) {
                return -1;
            }
            else if (a.accidental > b.accidental) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }
}
