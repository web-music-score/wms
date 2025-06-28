import { Assert } from "@tspro/ts-utils-lib";
import { Scale } from "./scale";
import { PitchNotation, SymbolSet } from "./types";

/*
    noteId:   0     1     2      3      4       5        6     7     8     9     10      11     12   ...
    noteName: C0 C0#/D0b  D0  D0#/E0b E0/F0b  F0/E0#  F0#/G0b  G0 G0#/A0b  A0  A0#/B0b B0/C1b  B0#/C1 ...

    pitch:    0  1  2  3  4  5  6  7  ...
    noteId:   0  2  4  5  7  9  11 12 ...
    noteName: C0 D0 E0 F0 G0 A0 B0 C1 ...
*/

export type Accidental = -2 | -1 | 0 | 1 | 2;
export type NaturalNote = "C" | "D" | "E" | "F" | "G" | "A" | "B";
export type ParsedNote = { naturalNote: NaturalNote, accidental: Accidental, octave?: number }

const AccidentalAsciiSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "bb"], [-1, "b"], [0, ""], [1, "#"], [2, "x"]]);
const AccidentalUnicodeSymbolMap: ReadonlyMap<Accidental, string> = new Map([[-2, "𝄫"], [-1, "♭"], [0, ""], [1, "♯"], [2, "𝄪"]]);
const AccidentalMap: ReadonlyMap<string, Accidental> = new Map([["", 0], ["bb", -2], ["b", -1], ["#", 1], ["x", 2], ["𝄫", -2], ["♭", -1], ["♯", 1], ["𝄪", 2]]);

const NaturalNoteByPitch: ReadonlyArray<NaturalNote> = ["C", "D", "E", "F", "G", "A", "B"];
const NoteIdByPitch: ReadonlyArray<number> = [0, 2, 4, 5, 7, 9, 11];

const NoteNameRule = /^([CDEFGAB])(bb?|b?|#?|x?|𝄫?|♭?|♯?|𝄪?)([0-9]*)$/;

export class Note {
    private static noteByNameCache = new Map<string, Note>();
    private static noteByIdCache = new Map<number, Note>();

    readonly pitch: number;
    readonly accidental: Accidental;

    constructor(pitch: number, accidental: number) {
        this.pitch = Note.validatePitch(pitch);
        this.accidental = Note.validateAccidental(accidental);
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
                let noteName = NoteNameList[noteId % 12].split("/")[0] + Math.floor(noteId / 12);
                let p = Assert.require(Note.parseNote(noteName), "Invalid noteName: " + noteName);
                Assert.require(p.octave, "Octave is required for note!");

                note = new Note(Note.getNaturelNotePitch(p.naturalNote, p.octave), p.accidental);

                this.noteByIdCache.set(noteId, note);
            }

            return note;
        }
    }

    get pitchMod7(): number {
        return this.pitch % 7;
    }

    get octave(): number {
        return Math.floor(this.pitch / 7);
    }

    get noteId(): number {
        return this.octave * 12 + NoteIdByPitch[this.pitchMod7] + this.accidental;
    }

    get naturalNote(): NaturalNote {
        return NaturalNoteByPitch[this.pitchMod7];
    }

    getPitchInOctave(octave: number) {
        return this.pitchMod7 + Note.validateOctave(octave) * 7;
    }

    equals(note: Note) {
        return this.pitch === note.pitch && this.accidental === note.accidental;
    }

    format(pitchNotation: PitchNotation, symbolSet: SymbolSet) {
        let naturalNote = NaturalNoteByPitch[this.pitch % 7];
        let octave = Math.floor(this.pitch / 7);
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
        // Without octave numer
        return this.format(PitchNotation.Scientific, symbolSet).replace(/([0-9]+)/, "");
    }

    static replaceAccidentalSymbols(str: string, symbolSet: SymbolSet) {
        if (symbolSet === SymbolSet.Unicode) {
            return str.replace("bb", "𝄫").replace("b", "♭").replace("#", "♯").replace("x", "𝄪");
        }
        else {
            return str.replace("𝄫", "bb").replace("♭", "b").replace("♯", "#").replace("𝄪", "x");
        }
    }

    static isValidNoteName(noteName: string) {
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
            pitch += Note.validateOctave(octave) * 7;
        }
        return pitch;
    }

    static getNaturalNote(pitch: number): NaturalNote {
        return NaturalNoteByPitch[Note.validatePitch(pitch) % 7];
    }

    static validatePitch(pitch: number): number {
        return Assert.int_gte(pitch, 0, "Invalid pitch: " + pitch);
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
     * @param notes Array of notes.
     * @returns Sorted array of notes.
     */
    static sort(notes: ReadonlyArray<Note>): Note[] {
        return notes.slice().sort(Note.compareFunc);
    }

    /**
     * Remove duplicate notes.
     * @param notes Array of notes.
     * @returns Sorted set of notes.
     */
    static removeDuplicates(notes: ReadonlyArray<Note>): Note[] {
        let uniqueSet: Note[] = [];

        notes.forEach(note => {
            if (uniqueSet.find(n => note.equals(n)) === undefined) {
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
