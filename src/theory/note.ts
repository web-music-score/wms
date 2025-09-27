import { Utils } from "@tspro/ts-utils-lib";
import { PitchNotation, SymbolSet } from "./types";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

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

/** Accidental type. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

/** Note letter type. */
export type NoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/** Parsed note props. */
export type ParsedNote = {
    /** Note letter (e.g. "C" in "C#4"). */
    noteLetter: NoteLetter,
    /** Accidental (e.g. "1" (#=1) in "C#4"). */
    accidental: Accidental,
    /** Octave if available(e.g. "4" in "C#4"). */
    octave?: number
}

const AccidentalAsciiSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "bb"], [-1, "b"], [0, ""], [1, "#"], [2, "x"]]);
const AccidentalUnicodeSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "𝄫"], [-1, "♭"], [0, ""], [1, "♯"], [2, "𝄪"]]);
const AccidentalMap: ReadonlyMap<string, Accidental> = new Map([["", 0], ["bb", -2], ["b", -1], ["#", 1], ["x", 2], ["𝄫", -2], ["♭", -1], ["♯", 1], ["𝄪", 2]]);

const NoteLetters: ReadonlyArray<NoteLetter> = ["C", "D", "E", "F", "G", "A", "B"];
const DiatonicToChromaticMap: ReadonlyArray<number> = [0, 2, 4, 5, 7, 9, 11];

const NoteNameRegex = /^([A-G])((?:bb|𝄫|♭|b|#|♯|x|𝄪)?)?(-?\d+)?$/;

/** Note class. */
export class Note {
    private static noteByNameCache = new Map<string, Note>();
    private static chromaticNoteCache = new Map<number, Note>();

    /** Diatonic class */
    readonly diatonicClass: number;
    /** Accidental. */
    readonly accidental: Accidental;
    /** Octave. */
    readonly octave: number;

    /**
     * Create new Note object instance.
     * @param diatonicId - Diatonic id.
     * @param accidental - Accidental (-2, -1, 0, 1 or 2).
     */
    constructor(diatonicId: number, accidental: number);
    /**
     * Create new Note object instance.
     * @param diatonicClass - Diatonic class [0, 11].
     * @param accidental - Accidental (-2, -1, 0, 1 or 2).
     * @param octave - Octave.
     */
    constructor(diatonicClass: number, accidental: number, octave: number);
    /**
     * Create new Note object instance.
     * @param noteLetter - Note letter (e.g. "C").
     * @param accidental Accidental (-2, -1, 0, 1 or 2).
     * @param octave - Octave.
     */
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
            throw new MusicError(MusicErrorType.Note, `Invalid args: ${arg}, ${accidental}, ${octave}`);
        }
    }

    /** Diatonic id getter. */
    get diatonicId(): number {
        return Note.getDiatonicIdInOctave(this.diatonicClass, this.octave);
    }

    /** Chromatic id getter. */
    get chromaticId(): number {
        return Note.getChromaticIdInOctave(DiatonicToChromaticMap[this.diatonicClass] + this.accidental, this.octave);
    }

    /** Midi number getter (implemented same as chromatic id). */
    get midiNumber(): number {
        return this.chromaticId;
    }

    /** Chromatic class getter. */
    get chromaticClass(): number {
        return Note.getChromaticClass(DiatonicToChromaticMap[this.diatonicClass] + this.accidental);
    }

    /** Note letter getter. */
    get noteLetter(): NoteLetter {
        return NoteLetters[this.diatonicClass];
    }

    /**
     * Format note to string presentation.
     * @param pitchNotation - Pitchy notation.
     * @param symbolSet - Symbol set.
     * @returns - String presentation of note.
     */
    format(pitchNotation: PitchNotation, symbolSet: SymbolSet): string {
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

    /**
     * Format note to string presentation without octave number.
     * @param symbolSet - Symbol set.
     * @returns - String presentation of note without octave number.
     */
    formatOmitOctave(symbolSet: SymbolSet) {
        let noteLetter = NoteLetters[this.diatonicClass];
        let accidental = Note.getAccidentalSymbol(this.accidental, symbolSet);
        return noteLetter + accidental;
    }

    /**
     * Get note.
     * @param noteName - Note name (e.g. "C4").
     * @returns - Note.
     */
    static getNote(noteName: string): Note {
        let note = this.noteByNameCache.get(noteName);

        if (note === undefined) {
            let p = Note.parseNote(noteName);

            if (!p) {
                throw new MusicError(MusicErrorType.Note, `Invalid noteName: ${noteName}`);
            }
            if (p.octave === undefined) {
                throw new MusicError(MusicErrorType.Note, `Octave is required for note.`);
            }

            note = new Note(p.noteLetter, p.accidental, p.octave);

            this.noteByNameCache.set(noteName, note);
        }

        return note;
    }

    /**
     * Get chromatic note. There are number of alternatives, this function uses simple logic to choose one.
     * @param chromaticId - Chromatic id.
     * @returns - Note.
     */
    static getChromaticNote(chromaticId: number): Note {
        let note = this.chromaticNoteCache.get(chromaticId);

        if (note === undefined) {
            const NoteNameList = ["C/B#", "C#/Db", "D", "D#/Eb", "E/Fb", "F/E#", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B/Cb"];
            let noteName = NoteNameList[Note.getChromaticClass(chromaticId)].split("/")[0] + Note.getOctaveFromChromaticId(chromaticId);
            let p = Note.parseNote(noteName);

            if (!p) {
                throw new MusicError(MusicErrorType.Note, `Invalid noteName: ${noteName}`);
            }
            if (p.octave === undefined) {
                throw new MusicError(MusicErrorType.Note, `Octave is required for note.`);
            }

            note = new Note(p.noteLetter, p.accidental, p.octave);

            this.chromaticNoteCache.set(chromaticId, note);
        }

        return note;
    }

    /**
     * GEt diatoni class from diatonic id.
     * @param diatonicId - Diatonicid.
     */
    static getDiatonicClass(diatonicId: number): number;
    /**
     * Getdiatonic class from note name.
     * @param noteName - Note name.
     */
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
            throw new MusicError(MusicErrorType.Note, `Invalid arg: ${arg}`);
        }
    }

    /**
     * Get octave from diatonic id.
     * @param diatonicId - Diatonic id.
     * @returns - Octave.
     */
    static getOctaveFromDiatonicId(diatonicId: number): number {
        return Math.floor((diatonicId - C0_diatonicId) / 7);
    }

    /**
     * Get diatonic id in given octave (transposes diatonic id to given octave).
     * @param diatonicId - Original diatonic id.
     * @param octave - Octave.
     * @returns - Transposed diatonic id.
     */
    static getDiatonicIdInOctave(diatonicId: number, octave: number): number {
        return Note.getDiatonicClass(diatonicId) + octave * 7 + C0_diatonicId;
    }

    /**
     * Get chromatic class from chromatic id.
     * @param chromaticId - Chromatic id.
     * @returns - Chromatic class.
     */
    static getChromaticClass(chromaticId: number): number {
        return mod(chromaticId, 12);
    }

    /**
     * Get octave from chromatic id.
     * @param chromaticId - Chromatic id.
     * @returns - Octave.
     */
    static getOctaveFromChromaticId(chromaticId: number): number {
        return Math.floor((chromaticId - C0_chromaticId) / 12);
    }

    /**
     * Get chromatic id in given octave (transposes chromatic id to given octave).
     * @param chromaticId - Original chromatic id.
     * @param octave - Octave.
     * @returns - Transpose chromatic id.
     */
    static getChromaticIdInOctave(chromaticId: number, octave: number) {
        return Note.getChromaticClass(chromaticId) + octave * 12 + C0_chromaticId;
    }

    /**
     * Test if given two notes are equal.
     * @param a - Note a.
     * @param b - Note b.
     * @returns - True/false.
     */
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

    /**
     * Replace accidental symbols in given string to givn symbol set (ascii/unicode).
     * @param str - String to replace.
     * @param symbolSet - Symbol set.
     * @returns - String with updated accidental symbols.
     */
    static replaceAccidentalSymbols(str: string, symbolSet: SymbolSet): string {
        if (symbolSet === SymbolSet.Unicode) {
            return str.replace("bb", "𝄫").replace("b", "♭").replace("#", "♯").replace("x", "𝄪");
        }
        else {
            return str.replace("𝄫", "bb").replace("♭", "b").replace("♯", "#").replace("𝄪", "x");
        }
    }

    /**
     * Test if given string is valid note name.
     * @param noteName - Note name to validate.
     * @returns - True/false.
     */
    static isValidNoteName(noteName: string): boolean {
        return NoteNameRegex.test(noteName);
    }

    /**
     * Parse note name string to note props.
     * @param noteName - Note name to parse.
     * @returns - Parsed note props or undefined if parsing error.
     */
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

    /**
     * Get scientific note name from given note name.
     * @param noteName - Note name.
     * @param symbolSet - Symbol set (ascii/unicode) for scientific note name.
     * @returns - Scientific note name.
     */
    static getScientificNoteName(noteName: string, symbolSet: SymbolSet): string {
        let p = Note.parseNote(noteName);
        if (!p) {
            throw new MusicError(MusicErrorType.Note, `Invalid noteName: ${noteName}`);
        }
        let { noteLetter, accidental, octave } = p;
        return noteLetter + Note.getAccidentalSymbol(accidental, symbolSet) + (octave ?? "");
    }

    /**
     * Get symbol of given accidental in given symbol set (ascii/unicide).
     * @param accidental - Accidental.
     * @param symbolsSet - Symbol set.
     * @returns - Accidental symbol or undefined (invalid accidental).
     */
    static getAccidentalSymbol(accidental: Accidental, symbolsSet: SymbolSet): string | undefined {
        return symbolsSet === SymbolSet.Unicode
            ? AccidentalUnicodeSymbolMap.get(accidental)
            : AccidentalAsciiSymbolMap.get(accidental);
    }

    /**
     * Get accidental value from given accidental symbol.
     * @param accidentalSymbol - Accidental symbol (e.g. "#").
     * @returns - Accidental vlaue.
     */
    static getAccidental(accidentalSymbol: string): Accidental {
        let accidental = AccidentalMap.get(accidentalSymbol);
        if (accidental === undefined) {
            throw new MusicError(MusicErrorType.Note, `Invalid accidental: ${accidentalSymbol}`);
        }
        return accidental;
    }

    /**
     * Get note letter from given diatonic id.
     * @param diatonicId - Diatonic id.
     * @returns - Note letter.
     */
    static getNoteLetter(diatonicId: number): NoteLetter {
        return NoteLetters[Note.getDiatonicClass(diatonicId)];
    }

    /**
     * Find next lowest possible diatonic id that is above given bottom level.
     * @param diatonicId - Diatonic id to begin with.
     * @param bottomDiatonicId - Bottom diatonic id.
     * @param addOctaveIfEqual - If true then add one octave if diatonic id would equal to bottom diatonic id.
     * @returns - Diatonic id.
     */
    static findNextDiatonicIdAbove(diatonicId: number, bottomDiatonicId: number, addOctaveIfEqual: boolean): number {
        let diatonicClass = Note.getDiatonicClass(diatonicId);
        let bottomDiatonicClass = Note.getDiatonicClass(bottomDiatonicId);

        let addOctave = addOctaveIfEqual
            ? (diatonicClass <= bottomDiatonicClass ? 1 : 0)
            : (diatonicClass < bottomDiatonicClass ? 1 : 0);

        return Note.getDiatonicIdInOctave(diatonicClass, Note.getOctaveFromDiatonicId(bottomDiatonicId) + addOctave);
    }

    /**
     * Validate if given argument is diatonic id.
     * @param diatonicId - Diatonic id to validate.
     * @returns - Valid diatonic id or throws.
     */
    static validateDiatonicId(diatonicId: unknown): number {
        if (Utils.Is.isInteger(diatonicId)) {
            return diatonicId;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid diatonicId: ${diatonicId}`);
        }
    }

    /**
     * Validate if given argument is diatonic class.
     * @param diatonicClass - Diatonic class to validate.
     * @returns - Valid diatonic class or throws.
     */
    static validateDiatonicClass(diatonicClass: unknown): number {
        if (Utils.Is.isIntegerBetween(diatonicClass, 0, 6)) {
            return diatonicClass;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid diatonicClass: ${diatonicClass}`);
        }
    }

    /**
     * Validate if given argument is chromatic id.
     * @param chromaticId - Chromatic id to validate.
     * @returns - Valid chromatic id, or throws.
     */
    static validateChromaticId(chromaticId: unknown): number {
        if (Utils.Is.isInteger(chromaticId)) {
            return chromaticId;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid chromaticId: ${chromaticId}`);
        }
    }

    /**
     * Validate if given argument is chromatic class.
     * @param chromaticClass - Chromatic class to validate.
     * @returns - Valid chromatic class, or throws.
     */
    static validatechromaticClass(chromaticClass: unknown): number {
        if (Utils.Is.isIntegerBetween(chromaticClass, 0, 11)) {
            return chromaticClass;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid chromaticClass: ${chromaticClass}`);
        }
    }

    /**
     * Validate if given argument if note letter.
     * @param noteLetter - Note letter to validate.
     * @returns - Valid note letter or throws.
     */
    static validateNoteLetter(noteLetter: unknown): NoteLetter {
        if (NoteLetters.some(n => n === noteLetter)) {
            return noteLetter as NoteLetter;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid note: ${noteLetter}`);
        }
    }

    /**
     * Validate if given argument is octave.
     * @param octave - Octave to validate.
     * @returns - Valid octave or throws.
     */
    static validateOctave(octave: number): number {
        if (Utils.Is.isInteger(octave)) {
            return octave;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid octave: ${octave}`);
        }
    }

    /**
     * Validate if given argument is valid accidental.
     * @param acc - Accidental to validate.
     * @returns - Valid accidental or thorws.
     */
    static validateAccidental(acc: unknown): Accidental {
        if (Utils.Is.isIntegerBetween(acc, -2, 2)) {
            return acc as Accidental;
        }
        else {
            throw new MusicError(MusicErrorType.Note, `Invalid accidental: ${acc}`);
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

    /**
     * Function to compare two notes using diatonic id and accidental properties of notes.
     * @param a - Note a.
     * @param b - Note b.
     * @returns - -1, 0 or 1.
     */
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
