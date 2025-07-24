import { Utils } from "@tspro/ts-utils-lib";
import { Scale } from "./scale";
import { PitchNotation, SymbolSet } from "./types";
import { MusicError } from "@tspro/web-music-score/core";

function getNoteError(msg: string) {
    return new MusicError("NoteError: " + msg);
}

function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

/*
    C-1: chromaticId = 0,  diatonicId = 0
    C0:  chromaticId = 12, diatonicId = 7
    C1:  chromaticId = 24, diatonicId = 14

    chromaticId:   0      1        2       3        4         5          6       7     8        9      10       11        12   ...
    noteName:     C-1 C-1#/D-1b  D-1  D-1#/E-1b E-1/F-1b  F-1/E-1#  F-1#/G-1b  G-1 G-1#/A-1b  A-1  A-1#/B-1b B-1/C0b  B-1#/C0 ...

    diatonicId:    0   1   2   3   4   5   6  7  ...
    chromaticId:   0   2   4   5   7   9   11 12 ...
    noteName:     C-1 D-1 E-1 F-1 G-1 A-1 B-1 C0 ...
*/

const C0_chromaticId = 12;
const C0_diatonicId = 7;

/** @public */
export type Accidental = -2 | -1 | 0 | 1 | 2;

/** @public */
export type NoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** @public */
export type ParsedNote = { noteLetter: NoteLetter, accidental: Accidental, octave?: number }

const AccidentalAsciiSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "bb"], [-1, "b"], [0, ""], [1, "#"], [2, "x"]]);
const AccidentalUnicodeSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "𝄫"], [-1, "♭"], [0, ""], [1, "♯"], [2, "𝄪"]]);
const AccidentalMap: ReadonlyMap<string, Accidental> = new Map([["", 0], ["bb", -2], ["b", -1], ["#", 1], ["x", 2], ["𝄫", -2], ["♭", -1], ["♯", 1], ["𝄪", 2]]);

const NoteLetters: ReadonlyArray<NoteLetter> = ["C", "D", "E", "F", "G", "A", "B"];
const DiatonicToChromaticMap: ReadonlyArray<number> = [0, 2, 4, 5, 7, 9, 11];

const NoteNameRegex = /^([A-G])((?:bb|𝄫|♭|b|#|♯|x|𝄪)?)?(-?\d+)?$/;

/** @public */
export class Note {
    private static noteByNameCache = new Map<string, Note>();
    private static chromaticNoteCache = new Map<number, Note>();

    readonly diatonicClass: number;
    readonly accidental: Accidental;
    readonly octave: number;

    constructor(diatonicId: number, accidental: number);
    constructor(diatonicClass: number, accidental: number, octave: number);
    constructor(noteLetter: string, accidental: number, octave: number);
    constructor(arg: number | string, accidental: number, octave?: number) {
        if (typeof arg === "number" && typeof accidental === "number" && octave === undefined) {
            // arg is diatonicId
            Note.validateDiatonicId(arg);
            this.diatonicClass = Note.getDiatonicClass(arg);
            this.accidental = Note.validateAccidental(accidental);
            this.octave = Note.getOctaveFromDiatonicId(arg);
        }
        else if (typeof arg === "number" && typeof accidental === "number" && typeof octave === "number") {
            // arg is diatonicClass
            this.diatonicClass = Note.validateDiatonicClass(arg);
            this.accidental = Note.validateAccidental(accidental);
            this.octave = Note.validateOctave(octave);
        }
        else if (typeof arg === "string" && typeof accidental === "number" && typeof octave === "number") {
            // arg is noteLetter
            this.diatonicClass = Note.getDiatonicClass(arg);
            this.accidental = Note.validateAccidental(accidental);
            this.octave = Note.validateOctave(octave);
        }
        else {
            throw getNoteError(`Invalid args: ${arg}, ${accidental}, ${octave}`);
        }
    }

    get diatonicId(): number {
        return Note.getDiatonicIdInOctave(this.diatonicClass, this.octave);
    }

    get chromaticId(): number {
        return Note.getChromaticIdInOctave(DiatonicToChromaticMap[this.diatonicClass] + this.accidental, this.octave);
    }

    get midiNumber(): number {
        return this.chromaticId;
    }

    get chromaticClass(): number {
        return Note.getChromaticClass(DiatonicToChromaticMap[this.diatonicClass] + this.accidental);
    }

    get noteLetter(): NoteLetter {
        return NoteLetters[this.diatonicClass];
    }

    format(pitchNotation: PitchNotation, symbolSet: SymbolSet) {
        let { noteLetter, octave } = this;
        let accidentalSymbol = Note.getAccidentalSymbol(this.accidental, symbolSet);

        if (pitchNotation === PitchNotation.Helmholtz) {
            if (octave >= 3) {
                // c - c′ - c′′ - ...
                return noteLetter.toLowerCase() + accidentalSymbol + "′".repeat(octave - 3);
            }
            else {
                // C͵ - C͵͵ - C͵͵͵ - ...
                return noteLetter.toUpperCase() + accidentalSymbol + "͵".repeat(2 - octave);
            }
        }
        else {
            return noteLetter + accidentalSymbol + octave;
        }
    }

    formatOmitOctave(symbolSet: SymbolSet) {
        let noteLetter = NoteLetters[this.diatonicClass];
        let accidental = Note.getAccidentalSymbol(this.accidental, symbolSet);
        return noteLetter + accidental;
    }

    static getNote(noteName: string): Note {
        let note = this.noteByNameCache.get(noteName);

        if (note === undefined) {
            let p = Note.parseNote(noteName);

            if (!p) {
                throw getNoteError(`Invalid noteName: ${noteName}`);
            }
            if (p.octave === undefined) {
                throw getNoteError(`Octave is required for note.`);
            }

            note = new Note(p.noteLetter, p.accidental, p.octave);

            this.noteByNameCache.set(noteName, note);
        }

        return note;
    }

    static getChromaticNote(chromaticId: number): Note {
        let note = this.chromaticNoteCache.get(chromaticId);

        if (note === undefined) {
            const NoteNameList = ["C/B#", "C#/Db", "D", "D#/Eb", "E/Fb", "F/E#", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B/Cb"];
            let noteName = NoteNameList[Note.getChromaticClass(chromaticId)].split("/")[0] + Note.getOctaveFromChromaticId(chromaticId);
            let p = Note.parseNote(noteName);

            if (!p) {
                throw getNoteError(`Invalid noteName: ${noteName}`);
            }
            if (p.octave === undefined) {
                throw getNoteError(`Octave is required for note.`);
            }

            note = new Note(p.noteLetter, p.accidental, p.octave);

            this.chromaticNoteCache.set(chromaticId, note);
        }

        return note;
    }

    static getDiatonicClass(diatonicId: number): number;
    static getDiatonicClass(noteName: string): number;
    static getDiatonicClass(arg: number | string): number {
        if (typeof arg === "number") {
            // arg is diatonicId
            return mod(arg, 7);
        }
        else if (typeof arg === "string" && arg.length > 0) {
            // arg is noteName => arg[0] is noteLetter
            return NoteLetters.indexOf(Note.validateNoteLetter(arg[0]));
        }
        else {
            throw getNoteError(`Invalid getDiatonicClass arg: ${arg}`);
        }
    }

    static getOctaveFromDiatonicId(diatonicId: number) {
        return Math.floor((diatonicId - C0_diatonicId) / 7);
    }

    static getDiatonicIdInOctave(diatonicId: number, octave: number) {
        return Note.getDiatonicClass(diatonicId) + octave * 7 + C0_diatonicId;
    }

    static getChromaticClass(chromaticId: number) {
        return mod(chromaticId, 12);
    }

    static getOctaveFromChromaticId(chromaticId: number) {
        return Math.floor((chromaticId - C0_chromaticId) / 12);
    }

    static getChromaticIdInOctave(chromaticId: number, octave: number) {
        return Note.getChromaticClass(chromaticId) + octave * 12 + C0_chromaticId;
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
            return a === b || a.diatonicId === b.diatonicId && a.accidental === b.accidental;
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

        let noteLetter = Note.validateNoteLetter(m[1]);

        let accidentalStr = m[2];
        let accidental = Note.validateAccidental(AccidentalMap.get(accidentalStr) ?? 0);

        let octaveStr = m[3];
        let octave = octaveStr ? Note.validateOctave(+octaveStr) : undefined;

        return { noteLetter: noteLetter, accidental, octave }
    }

    static getScientificNoteName(noteName: string, symbolSet: SymbolSet): string {
        let p = Note.parseNote(noteName);
        if (!p) {
            throw getNoteError(`Invalid noteName: ${noteName}`);
        }
        let { noteLetter, accidental, octave } = p;
        return noteLetter + Note.getAccidentalSymbol(accidental, symbolSet) + (octave ?? "");
    }

    static getAccidentalSymbol(accidental: Accidental, symbolsSet: SymbolSet) {
        return symbolsSet === SymbolSet.Unicode
            ? AccidentalUnicodeSymbolMap.get(accidental)
            : AccidentalAsciiSymbolMap.get(accidental);
    }

    static getAccidental(accidentalSymbol: string): Accidental {
        let accidental = AccidentalMap.get(accidentalSymbol);
        if (accidental === undefined) {
            throw getNoteError(`Invalid accidental: ${accidentalSymbol}`);
        }
        return accidental;
    }

    static getNoteLetter(diatonicId: number): NoteLetter {
        return NoteLetters[Note.getDiatonicClass(diatonicId)];
    }

    static findNextDiatonicIdAbove(diatonicId: number, bottomDiatonicId: number, addOctaveIfEqual: boolean): number {
        let diatonicClass = Note.getDiatonicClass(diatonicId);
        let bottomDiatonicClass = Note.getDiatonicClass(bottomDiatonicId);

        let addOctave = addOctaveIfEqual
            ? (diatonicClass <= bottomDiatonicClass ? 1 : 0)
            : (diatonicClass < bottomDiatonicClass ? 1 : 0);

        return Note.getDiatonicIdInOctave(diatonicClass, Note.getOctaveFromDiatonicId(bottomDiatonicId) + addOctave);
    }

    static validateDiatonicId(diatonicId: number): number {
        if (Utils.Is.isInteger(diatonicId)) {
            return diatonicId;
        }
        else {
            throw getNoteError(`Invalid diatonicId: ${diatonicId}`);
        }
    }

    static validateDiatonicClass(diatonicClass: number): number {
        if (Utils.Is.isInteger(diatonicClass) && diatonicClass >= 0 && diatonicClass < 7) {
            return diatonicClass;
        }
        else {
            throw getNoteError(`Invalid diatonicClass: ${diatonicClass}`);
        }
    }

    static validateChromaticId(chromaticId: number): number {
        if (Utils.Is.isInteger(chromaticId)) {
            return chromaticId;
        }
        else {
            throw getNoteError(`Invalid chromaticId: ${chromaticId}`);
        }
    }

    static validatechromaticClass(chromaticClass: number): number {
        if (Utils.Is.isInteger(chromaticClass) && chromaticClass >= 0 && chromaticClass < 12) {
            return chromaticClass;
        }
        else {
            throw getNoteError(`Invalid chromaticClass: ${chromaticClass}`);
        }
    }

    static validateNoteLetter(note: string): NoteLetter {
        if (NoteLetters.some(n => n === note)) {
            return note as NoteLetter;
        }
        else {
            throw getNoteError(`Invalid note: ${note}`);
        }
    }

    static validateOctave(octave: number): number {
        if (Utils.Is.isInteger(octave)) {
            return octave;
        }
        else {
            throw getNoteError(`Invalid octave: ${octave}`);
        }
    }

    static validateAccidental(acc: number): Accidental {
        if (Utils.Is.isInteger(acc) && acc >= -2 && acc <= 2) {
            return acc as Accidental;
        }
        else {
            throw getNoteError(`Invalid accidental: ${acc}`);
        }
    }

    /**
     * Sort notes by diatonicId in ascending order.
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
        if (a.diatonicId < b.diatonicId) {
            return -1;
        }
        else if (a.diatonicId > b.diatonicId) {
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
