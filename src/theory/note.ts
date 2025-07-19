import { Assert } from "@tspro/ts-utils-lib";
import { Scale } from "./scale";
import { PitchNotation, SymbolSet } from "./types";

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

    Note: octave = -1 not supported!
*/

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

const NoteNameRule = /^([CDEFGAB])(bb?|b?|#?|x?|𝄫?|♭?|♯?|𝄪?)([0-9]*)$/;

/** @public */
export class Note {
    private static noteByNameCache = new Map<string, Note>();
    private static noteByIdCache = new Map<number, Note>();

    readonly normalizedPitch: number;
    readonly accidental: Accidental;
    readonly octave: number;

    constructor(pitch: number, accidental: number) {
        Note.validatePitch(pitch);
        this.normalizedPitch = Note.getNormalizedPitch(pitch);
        this.accidental = Note.validateAccidental(accidental);
        this.octave = Note.getOctaveFromPitch(pitch);
    }

    get pitch(): number {
        return Note.getPitchInOctave(this.normalizedPitch, this.octave);
    }

    get noteId(): number {
        return this.octave * 12 + NoteIdByPitch[this.normalizedPitch] + this.accidental;
    }

    get normalizedNoteId(): number {
        return Note.getNormalizedNoteId(NoteIdByPitch[this.normalizedPitch] + this.accidental + 12);
    }

    get naturalNote(): NaturalNote {
        return NaturalNoteByPitch[this.normalizedPitch];
    }

    getPitchInOctave(octave: number) {
        return Note.getPitchInOctave(this.normalizedPitch, octave);
    }

    format(pitchNotation: PitchNotation, symbolSet: SymbolSet) {
        let naturalNote = NaturalNoteByPitch[this.normalizedPitch];
        let octave = this.octave;
        let accidental = Note.getAccidentalSymbol(this.accidental, symbolSet);

        if (pitchNotation === PitchNotation.Helmholtz) {
            if (octave >= 3) {
                // c - c′ - c′′ - ...
                return naturalNote.toLowerCase() + accidental + "′".repeat(octave - 3);
            }
            else {
                // C͵ - C͵͵ - C͵͵͵ - ...
                return naturalNote.toUpperCase() + accidental + "͵".repeat(2 - octave);
            }
        }
        else {
            return naturalNote + accidental + octave;
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
            let p = Assert.require(Note.parseNote(noteName), "Invalid note: " + noteName);
            Assert.require(p.octave, "Octave is required for note!");

            note = new Note(Note.getNaturelNotePitch(p.naturalNote, p.octave), p.accidental);

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
                let p = Assert.require(Note.parseNote(noteName), "Invalid noteName: " + noteName);
                Assert.require(p.octave, "Octave is required for note!");

                note = new Note(Note.getNaturelNotePitch(p.naturalNote, p.octave), p.accidental);

                this.noteByIdCache.set(noteId, note);
            }

            return note;
        }
    }

    static getOctaveFromPitch(pitch: number) {
        return Math.floor(pitch / 7);
    }

    static getPitchInOctave(pitch: number, octave: number) {
        return Note.getNormalizedPitch(pitch) + octave * 7;
    }

    static getNormalizedPitch(pitch: number) {
        return pitch % 7;
    }

    static getNormalizedNoteId(noteId: number) {
        return noteId % 12;
    }

    static getOctaveFromNoteId(noteId: number) {
        return Math.floor(noteId / 12);
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
        return NoteNameRule.test(noteName);
    }

    static parseNote(noteName: string): Readonly<ParsedNote> | undefined {
        let m = NoteNameRule.exec(noteName);
        if (!m) {
            return undefined;
        }

        let naturalNote = m[1];
        let accidentalStr = m[2];
        let octaveStr = m[3];

        let accidental = Assert.require(AccidentalMap.get(accidentalStr), "Invalid accidental: " + accidentalStr);

        let octave = octaveStr && octaveStr.length > 0 ? Number(octaveStr) : undefined;

        return {
            naturalNote: Note.validateNaturalNote(naturalNote),
            accidental: Note.validateAccidental(accidental),
            octave: octave !== undefined ? Note.validateOctave(octave) : undefined
        }
    }

    static getScientificNoteName(noteName: string, symbolSet: SymbolSet): string {
        let { naturalNote, accidental, octave } = Assert.require(Note.parseNote(noteName), "Invalid note: " + noteName);
        return naturalNote + Note.getAccidentalSymbol(accidental, symbolSet) + (octave ?? "");
    }

    static getAccidentalSymbol(accidental: Accidental, symbolsSet: SymbolSet) {
        return symbolsSet === SymbolSet.Unicode
            ? AccidentalUnicodeSymbolMap.get(accidental)
            : AccidentalAsciiSymbolMap.get(accidental);
    }

    static getAccidental(accidentalSymbol: string) {
        return Assert.require(AccidentalMap.get(accidentalSymbol), "Invalid accidental symbol: " + accidentalSymbol);
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

    static validatePitch(pitch: number): number {
        return Assert.int_gte(pitch, 0, "Invalid pitch: " + pitch);
    }

    static validateNormalizedPitch(normalizedPitch: number): number {
        return Assert.int_between(normalizedPitch, 0, 6, "Invalid normalizedPitch: " + normalizedPitch);
    }

    static validateNoteId(noteId: number): number {
        return Assert.int_gte(noteId, 0, "Invalid noteId: " + noteId);
    }

    static validateNaturalNote(note: string): NaturalNote {
        return Assert.in_group(note, NaturalNoteByPitch, "Invalid natural note: " + note) as NaturalNote;
    }

    static validateOctave(octave: number): number {
        return Assert.int_gte(octave, 0, "Invalid octave " + octave);
    }

    static validateAccidental(acc: number): Accidental {
        return Assert.int_between(acc, -2, 2, "Invalid accidental: " + acc) as Accidental;
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
