import { Assert, LRUCache } from "@tspro/ts-utils-lib";
import { Accidental, Note } from "./note";

/** @public */
export class KeySignature {
    private static readonly OrderOfSharps = "FCGDAEB";
    private static readonly OrderOfFlats = "BEADGCF";

    private readonly accidentalNotes: Note[];
    private readonly accidentalNotesByPitch: Note[];
    private readonly orderedAccidentalNotes: Note[];

    private static ksCache = new LRUCache<string, KeySignature>(250);

    static getKeySignature(tonic: string, mode: number) {
        const ksKey = tonic + "_" + mode;

        let ks = this.ksCache.get(ksKey);

        if (!ks) {
            ks = new KeySignature(tonic, mode);
            this.ksCache.set(ksKey, ks);
        }

        return ks;
    }

    /**
     * @param tonic - tonic/root note.
     * @param mode - [1..7], 1 = Ionian/Major, 2 = Dorian, ..., 7 = Locrian
     */
    private constructor(private readonly tonic: string, private readonly mode: number) {
        Assert.int_between(mode, 1, 7, "Invalid mode: " + mode);

        function getAccidental(noteId: number, pitch: number): Accidental {
            let a = noteId % 12 - new Note(pitch, 0).noteId % 12;
            while (a > 2) { a -= 12; }
            while (a < -2) { a += 12; }
            return Note.validateAccidental(a);
        }

        let intervals = [2, 2, 1, 2, 2, 2, 1];

        for (let i = 1; i < mode; i++) {
            intervals.push(intervals.shift()!);
        }

        this.accidentalNotes = [];
        this.accidentalNotesByPitch = [];

        let pitch = Note.getNaturelNotePitch(tonic[0]);
        let noteId = Note.getNote(tonic + "0").noteId;

        for (let id = 0; id < 7; pitch++, noteId += intervals[id], id++) {
            let note = new Note(pitch % 7, getAccidental(noteId, pitch));

            if (Math.abs(note.accidental) >= 2) {
                Assert.interrupt("DoubleAccidentalException: Key signature contains double accidental.");
            }

            this.accidentalNotes[id] = note;
            this.accidentalNotesByPitch[note.pitchMod7] = note;
        }

        let sharps = this.accidentalNotes.filter(n => n.accidental > 0).sort((a, b) => {
            let ai = KeySignature.OrderOfSharps.indexOf(a.naturalNote);
            let bi = KeySignature.OrderOfSharps.indexOf(b.naturalNote);
            return ai - bi;
        });

        let flats = this.accidentalNotes.filter(n => n.accidental < 0).sort((a, b) => {
            let ai = KeySignature.OrderOfFlats.indexOf(a.naturalNote);
            let bi = KeySignature.OrderOfFlats.indexOf(b.naturalNote);
            return ai - bi;
        });

        Assert.assert(sharps.length === 0 || flats.length === 0, "Key Signature has both sharps and flats.")

        this.orderedAccidentalNotes = flats.length > 0 ? flats : sharps;
    }

    getType() {
        if (this.orderedAccidentalNotes.length === 0) {
            return "natural";
        }
        else if (this.orderedAccidentalNotes[0].accidental < 0) {
            return "flat";
        }
        else {
            return "sharp";
        }
    }

    getAccidental(pitch: number): Accidental {
        let pa = this.accidentalNotesByPitch[Note.validatePitch(pitch) % 7];
        return pa?.accidental ?? 0;
    }

    getNumAccidentals() {
        return this.orderedAccidentalNotes.length;
    }

    getOrderedAccidentalNotes(): ReadonlyArray<Note> {
        return this.orderedAccidentalNotes;
    }

    private static parseDegree(degree: number | string): { deg: number, acc: number } {
        const DegreeRule = /^(bb?|b?|#?|x?)([0-9]*)$/;
        let m = Assert.require(DegreeRule.exec("" + degree), "Invalid degree: " + degree);
        let acc = Note.getAccidental(m[1] ?? "") ?? 0;
        let deg = +m[2];
        return { deg, acc }
    }

    /**
     * 
     * @param degree - number 1..7 or string e.g "b5" or "#4"
     * @returns 
     */
    getScaleNote(degree: number | string) {
        let { deg, acc } = KeySignature.parseDegree(degree);

        Assert.int_gte(deg, 1, "Invalid degree: " + deg)

        let note = this.accidentalNotes[(deg - 1) % 7];

        return acc === 0
            ? note
            : new Note(note.pitchMod7, note.accidental + acc);
    }

    static equals(a: KeySignature, b: KeySignature): boolean {
        return a === b || a.tonic === b.tonic && a.mode == b.mode;
    }

}

/** @public */
export function getDefaultKeySignature(): KeySignature {
    return KeySignature.getKeySignature("C", 1); // tonic = "C", mode = 1 (Ionian/Major)
}
