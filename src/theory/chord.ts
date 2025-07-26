import { Utils } from "@tspro/ts-utils-lib";
import { Note } from "./note";
import { Degree, getScale, ScaleType } from "./scale";
import { SymbolSet } from "./types";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

const isEqualNote = (n1: Note, n2: Note) => n1.chromaticClass === n2.chromaticClass;

// From circle of 5ths
const OkayRootNoteList: ReadonlyArray<Note> = [
    "C",
    "C#", "Db", // Same id, first one always gets found
    "D",
    "Eb",
    "E",
    "F",
    "F#", "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B", "Cb"
].map(noteName => Note.getNote(noteName + "0"));

const okayRootNoteCache = new Map<number, Note>();

function getOkayRootNote(wantedRootNote: Note): Note {
    let cacheKey = wantedRootNote.chromaticClass;

    let rootNote = okayRootNoteCache.get(cacheKey);

    if (!rootNote) {
        rootNote = OkayRootNoteList.find(note => isEqualNote(note, wantedRootNote));

        if (!rootNote) {
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid chord root note: ${wantedRootNote.formatOmitOctave(SymbolSet.Unicode)}`);
        }

        okayRootNoteCache.set(cacheKey, rootNote);
    }

    return rootNote;
}

function getChordNoteByDegree(chordRootNote: Note, degree: Degree) {
    let chordRootNoteStr = chordRootNote.formatOmitOctave(SymbolSet.Ascii);

    let ks = getScale(chordRootNoteStr, ScaleType.Major);

    return ks.getNoteByDegree(degree);
}

function removeNoteDuplicates(notes: ReadonlyArray<Note>): Note[] {
    return Utils.Arr.removeDuplicatesCmp(notes, isEqualNote);
}

/** @public */
export type ChordInfo = { name: string, degrees: Degree[] }

const ChordInfoList: ReadonlyArray<ChordInfo> = [
    // Power chord
    { name: "5", degrees: [1, 5] },

    // Triads
    { name: "", degrees: [1, 3, 5] },
    { name: "m", degrees: [1, "b3", 5] },
    { name: "dim", degrees: [1, "b3", "b5"] },
    { name: "aug", degrees: [1, 3, "#5"] },
    { name: "sus2", degrees: [1, 2, 5] },
    { name: "sus4", degrees: [1, 4, 5] },

    // Four-part chords
    { name: "6", degrees: [1, 3, 5, 6] },
    { name: "m6", degrees: [1, "b3", 5, 6] },
    { name: "m(maj7)", degrees: [1, "b3", 5, 7] },
    { name: "7", degrees: [1, 3, 5, "b7"] },
    { name: "7♭5", degrees: [1, 3, "b5", "b7"] },
    { name: "7♯5", degrees: [1, 3, "#5", "b7"] },
    { name: "7sus2", degrees: [1, 2, 5, "b7"] },
    { name: "7sus4", degrees: [1, 4, 5, "b7"] },
    { name: "dim7", degrees: [1, "b3", "b5", "bb7"] },
    { name: "maj7", degrees: [1, 3, 5, 7] },
    { name: "maj7♭5", degrees: [1, 3, "b5", 7] },
    { name: "maj7♯5", degrees: [1, 3, "#5", 7] },
    { name: "m7", degrees: [1, "b3", 5, "b7"] },
    { name: "m7♭5", degrees: [1, "b3", "b5", "b7"] },
    { name: "m7♯5", degrees: [1, "b3", "#5", "b7"] },

    // Five-part chords
    { name: "9", degrees: [1, 3, 5, "b7", 9] },
    { name: "m9", degrees: [1, "b3", 5, "b7", 9] },
    { name: "7♯9", degrees: [1, 3, 5, "b7", "#9"] },
    { name: "7♭9", degrees: [1, 3, 5, "b7", "b9"] },

    // Six-part chords
    { name: "11", degrees: [1, 3, 5, "b7", 9, 11] },
    { name: "m11", degrees: [1, "b3", 5, "b7", 9, 11] },

    // Seven-part chords
    { name: "13", degrees: [1, 3, 5, "b7", 9, 11, 13] },
    { name: "m13", degrees: [1, "b3", 5, "b7", 9, 11, 13] }
];

// Less important notes can be omitted
function canOmitDegree(chordInfo: ChordInfo, degree: Degree) {
    if (chordInfo.degrees.every(c => c !== degree)) {
        // Chord does not even contain degree!
        return true;
    }

    return (
        chordInfo.degrees.length >= 4 && degree === 5 || // Four (and higher) part chord can exclude 5th degree
        chordInfo.degrees.length >= 6 && degree === 9 || // Six (and higher) part chord can exclude 9th degree
        chordInfo.degrees.length >= 7 && degree === 11 // Seven (and higher) part chord can exclude 11th degree
    );
}

// Used only internally
class InvalidChordException extends Error {
    constructor(readonly msg: string) {
        super(msg);
        this.name = "InvalidChordException";
    }
}

/** @public */
export class Chord {
    readonly name: string;
    readonly notes: Note[];
    readonly omitNotes: boolean[];
    readonly slashBassNote?: Note;

    private constructor(readonly chordInfo: ChordInfo, chordNotes: ReadonlyArray<Note>, readonly rootNote: Note, bassNote: Note) {
        this.name = chordInfo.name;

        let notesLeft = chordNotes.slice();

        let outOfChordBass = !notesLeft.some(note => isEqualNote(note, bassNote));

        if (outOfChordBass) {
            notesLeft.push(bassNote);
        }

        this.notes = new Array(this.chordInfo.degrees.length);
        this.omitNotes = new Array(this.chordInfo.degrees.length);

        for (let i = 0; i < chordInfo.degrees.length; i++) {
            let degree = chordInfo.degrees[i];
            let degreeNote = this.notes[i] = getChordNoteByDegree(this.rootNote, degree);

            let noteIndex = notesLeft.findIndex(note => isEqualNote(note, degreeNote));

            if (noteIndex >= 0) {
                // Found chord note
                this.omitNotes[i] = false;
                notesLeft.splice(noteIndex, 1);
            }
            else if (canOmitDegree(chordInfo, degree)) {
                // Can omit certain chord notes
                this.omitNotes[i] = true;
            }
            else {
                throw new InvalidChordException("Missing chord note!");
            }

            // Make sure bassNote has same diatonicId/accidental as equal degreeNote
            if (isEqualNote(bassNote, degreeNote)) {
                bassNote = degreeNote;
            }
        }

        if (notesLeft.length > 0) {
            if (notesLeft.every(note => isEqualNote(note, bassNote))) {
                this.slashBassNote = bassNote;
            }
            else {
                throw new InvalidChordException("Got some extra notes that are not bass note!");
            }
        }
        else {
            this.slashBassNote = isEqualNote(bassNote, this.rootNote) ? undefined : bassNote;
        }

        if (chordInfo.name === "5" && this.slashBassNote) {
            throw new InvalidChordException("Power chord no bass note allowed!");
        }
    }

    static getChords(notes: ReadonlyArray<Note>): ReadonlyArray<Chord> {
        let chords: Chord[] = [];

        let chordNotes = Note.sort(notes);
        let bassNote = chordNotes[0];
        let uniqueNotes = removeNoteDuplicates(chordNotes);

        for (let inversion = 0; inversion < uniqueNotes.length; inversion++) {
            let rootNote = getOkayRootNote(uniqueNotes[inversion]);

            ChordInfoList.forEach(chordInfo => {

                try {
                    let newChord = new Chord(chordInfo, uniqueNotes, rootNote, bassNote);

                    let replaceIndex = chords.findIndex(chord => chord.replaceWith(newChord));

                    if (replaceIndex >= 0) {
                        chords[replaceIndex] = newChord;
                    }
                    else {
                        chords.push(newChord);
                    }
                }
                catch (err) {
                    if (!(err instanceof InvalidChordException)) {
                        throw err;
                    }
                }

            });
        }

        return chords;
    }

    private replaceWith(arg: Chord): boolean {
        if (arg.notes.length < this.notes.length) {
            // Arg has less notes. Different chord. Do not replace with.
            return false;
        }
        else if (
            arg.slashBassNote && this.slashBassNote && !isEqualNote(arg.slashBassNote, this.slashBassNote) ||
            arg.slashBassNote && !this.slashBassNote || !arg.slashBassNote && this.slashBassNote
        ) {
            // Arg has different bass note. Different chord. Do not replace with.
            return false;
        }

        for (let i = 0; i < this.notes.length; i++) {
            if (!isEqualNote(arg.notes[i], this.notes[i]) || arg.omitNotes[i] !== this.omitNotes[i]) {
                // Arg has different notes. Different chord. Do not replace with.
                return false;
            }
        }

        // Arg has same notes than this, plus possiby more. Is same or better. Replace with.
        return true;
    }

    /**
     * @returns Chord name e.g. "C/B"
     */
    toString() {
        let symbolSet = SymbolSet.Unicode;

        let rootNoteStr = this.rootNote.formatOmitOctave(symbolSet);
        let slashBassStr = this.slashBassNote ? "/" + this.slashBassNote.formatOmitOctave(symbolSet) : "";

        return rootNoteStr + this.name + slashBassStr;
    }

    /**
     * @returns Degree notation string, e.g. "E - 1(C) - 3(E) - 5(G)"
     */
    getDegreeNotationString() {
        let symbolSet = SymbolSet.Unicode;

        let bassNoteStr = this.slashBassNote ? this.slashBassNote.formatOmitOctave(symbolSet) + " - " : "";
        let degreeNoteStr = this.omitNotes.map((omitNote, i) => {
            return this.getDegreeStr(i) + "(" + (omitNote ? "-" : this.getNoteStr(i)) + ")";
        }).join(" - ");

        return bassNoteStr + degreeNoteStr;
    }

    /**
     * @returns Omitted degrees string e.g. "Omits 5(G), 9(D)"
     */
    getOmittedDegreesString() {
        let omittedStrList = this.omitNotes.map((omit, i) => {
            return omit ? this.getDegreeStr(i) + "(" + this.getNoteStr(i) + ")" : undefined;
        }).filter(str => str !== undefined);

        return omittedStrList.length > 0 ? "Omits " + omittedStrList.join(", ") : "";
    }

    /**
     * @param i - Degree index
     * @returns Degree string for given degree index, e.g. "3"
     */
    private getDegreeStr(i: number) {
        return Note.replaceAccidentalSymbols("" + this.chordInfo.degrees[i], SymbolSet.Unicode);
    }

    /**
     * @param i - Degree index
     * @returns Note string for given degree index, e.g. "E"
     */
    private getNoteStr(i: number) {
        return this.notes[i].formatOmitOctave(SymbolSet.Unicode);
    }
}
