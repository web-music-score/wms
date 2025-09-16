import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

const cmp = (a: number, b: number): -1 | 0 | 1 => a === b ? 0 : (a < b ? -1 : 1);

export const MaxTupletRatioParts = 12;

/*
 * To get integer ticks, NoteLength value must be divisible of all TupletRatio.parts values < MaxTupletRatioParts
 */
const TicksMultiplier = 12 * 11 * 9 * 7 * 5;

export enum NoteLength {
    Whole = 1,
    Half = 2,
    Quarter = 4,
    Eighth = 8,
    Sixteenth = 16,
    ThirtySecond = 32,
    SixtyFourth = 64
}

export type NoteLengthStr =
    "1n" | "2n" | "4n" | "8n" | "16n" | "32n" | "64n" |
    "1t" | "2t" | "4t" | "8t" | "16t" | "32t" | "64t" |
    "1." | "2." | "4." | "8." | "16." | "32." | "64." |
    "1.." | "2.." | "4.." | "8.." | "16.." | "32.." | "64.." |
    "1..." | "2..." | "4..." | "8..." | "16..." | "32..." | "64..." |
    "1...." | "2...." | "4...." | "8...." | "16...." | "32...." | "64....";;

export const LongestNoteLength = NoteLength.Whole;
export const ShortestNoteLength = NoteLength.SixtyFourth;

const FlagCountMap = new Map<NoteLength, number>([
    [NoteLength.Whole, 0],
    [NoteLength.Half, 0],
    [NoteLength.Quarter, 0],
    [NoteLength.Eighth, 1],
    [NoteLength.Sixteenth, 2],
    [NoteLength.ThirtySecond, 3],
    [NoteLength.SixtyFourth, 4]
]);

const MaxDotCountMap = new Map<NoteLength, number>([
    [NoteLength.Whole, 6],
    [NoteLength.Half, 5],
    [NoteLength.Quarter, 4],
    [NoteLength.Eighth, 3],
    [NoteLength.Sixteenth, 2],
    [NoteLength.ThirtySecond, 1],
    [NoteLength.SixtyFourth, 0]
]);

const NoteSymbolMap = new Map<NoteLength, string>([
    [NoteLength.Whole, "𝅝"],
    [NoteLength.Half, "𝅗𝅥"],
    [NoteLength.Quarter, "𝅘𝅥"],
    [NoteLength.Eighth, "𝅘𝅥𝅮"],
    [NoteLength.Sixteenth, "𝅘𝅥𝅯"],
    [NoteLength.ThirtySecond, "𝅘𝅥𝅰"],
    [NoteLength.SixtyFourth, "𝅘𝅥𝅱"]
]);

export function hasNoteLengthTriplet(noteLength: NoteLength | NoteLengthStr): boolean {
    return typeof noteLength === "string" && noteLength.endsWith("t");
}

export function getNoteLengthDotCount(noteLength: NoteLength | NoteLengthStr): number | undefined {
    if (typeof noteLength === "string") {
        let dotCount = Utils.Str.charCount(noteLength, ".");
        return dotCount > 0 ? dotCount : undefined;
    }
    else {
        return undefined;
    }
}

export function validateNoteLength(noteLength: unknown): NoteLength {
    if (Utils.Is.isEnumValue(noteLength, NoteLength)) {
        return noteLength;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`)
    }
}

export function getNoteLength(noteLength: NoteLength | NoteLengthStr): NoteLength {
    if (Utils.Is.isEnumValue(noteLength, NoteLength)) {
        return noteLength;
    }
    else if (typeof noteLength === "string" && ["n", "t", "."].some(c => noteLength.endsWith(c))) {
        switch (parseInt(noteLength)) {
            case 1: return NoteLength.Whole;
            case 2: return NoteLength.Half;
            case 4: return NoteLength.Quarter;
            case 8: return NoteLength.Eighth;
            case 16: return NoteLength.Sixteenth;
            case 32: return NoteLength.ThirtySecond;
            case 64: return NoteLength.SixtyFourth;
        }
    }
    throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`)
}

function getTicks(noteLength: NoteLength): number {
    switch (noteLength) {
        case NoteLength.Whole: return 64 * TicksMultiplier;
        case NoteLength.Half: return 32 * TicksMultiplier;
        case NoteLength.Quarter: return 16 * TicksMultiplier;
        case NoteLength.Eighth: return 8 * TicksMultiplier;
        case NoteLength.Sixteenth: return 4 * TicksMultiplier;
        case NoteLength.ThirtySecond: return 2 * TicksMultiplier;
        case NoteLength.SixtyFourth: return 1 * TicksMultiplier;
    }
}

export interface TupletRatio {
    parts: number;
    inTimeOf: number;
}

export const Tuplet: Record<"Duplet" | "Triplet" | "Quadruplet", TupletRatio> = {
    /** 2 in the time of 3 */
    Duplet: { parts: 2, inTimeOf: 3 },
    /** 3 in the time of 2 */
    Triplet: { parts: 3, inTimeOf: 2 },
    /** 4 in the time of 3 */
    Quadruplet: { parts: 4, inTimeOf: 3 },
}

export class RhythmProps {
    readonly noteLength: NoteLength;
    readonly noteLengthN: number; // Whole = 1, Half = 2, Quarter = 4, etc.
    readonly dotCount: number;
    readonly tupletRatio?: TupletRatio;
    readonly ticks: number;
    readonly flagCount: number;

    constructor(noteLength: NoteLength | NoteLengthStr, dotCount?: number, tupletRatio?: TupletRatio) {
        this.noteLength = getNoteLength(noteLength);

        this.noteLengthN = this.noteLength;

        this.dotCount = dotCount ?? getNoteLengthDotCount(noteLength) ?? 0;

        if (Utils.Is.isObject(tupletRatio)) {
            this.tupletRatio = tupletRatio;
        }
        else if (hasNoteLengthTriplet(noteLength)) {
            this.tupletRatio = Tuplet.Triplet;
        }
        else {
            this.tupletRatio = undefined;
        }

        this.ticks = getTicks(this.noteLength);

        this.flagCount = FlagCountMap.get(this.noteLength) ?? 0;

        if (this.dotCount > 0 && this.tupletRatio !== undefined) {
            throw new MusicError(MusicErrorType.Note, "Note cannot be both dotted and tuplet!");
        }
        else if (this.dotCount > (MaxDotCountMap.get(this.noteLength) ?? 0)) {
            throw new MusicError(MusicErrorType.Note, `Too big dot count ${this.dotCount} for note length ${NoteLength[this.noteLength]}.`);
        }


        for (let add = this.ticks / 2, i = 1; i <= this.dotCount; i++, add /= 2) {
            this.ticks += add;
        }

        if (this.tupletRatio) {
            this.ticks *= this.tupletRatio.inTimeOf / this.tupletRatio.parts;
        }
    }

    static createFromNoteSize(noteSize: number): RhythmProps {
        switch (noteSize) {
            case 1: return RhythmProps.get(NoteLength.Whole);
            case 2: return RhythmProps.get(NoteLength.Half);
            case 4: return RhythmProps.get(NoteLength.Quarter);
            case 8: return RhythmProps.get(NoteLength.Eighth);
            case 16: return RhythmProps.get(NoteLength.Sixteenth);
            case 32: return RhythmProps.get(NoteLength.ThirtySecond);
            case 64: return RhythmProps.get(NoteLength.SixtyFourth);
        }
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteSize: ${noteSize}`)
    }

    get hasStem(): boolean {
        return RhythmProps.cmpNoteLength(this.noteLength, NoteLength.Whole) < 0;
    }

    toString(): string {
        return NoteSymbolMap.get(this.noteLength) + ".".repeat(this.dotCount);
    }

    private static cache = new Map<NoteLength | NoteLengthStr, RhythmProps>();

    static get(noteLength: NoteLength | NoteLengthStr): RhythmProps {
        let rhythmProps = this.cache.get(noteLength);
        if (!rhythmProps) {
            this.cache.set(noteLength, rhythmProps = new RhythmProps(noteLength));
        }
        return rhythmProps;
    }

    static cmpTicks(a: RhythmProps | NoteLength | NoteLengthStr, b: RhythmProps | NoteLength | NoteLengthStr): -1 | 0 | 1 {
        let aTicks = (a instanceof RhythmProps ? a : RhythmProps.get(a)).ticks;
        let bTicks = (b instanceof RhythmProps ? b : RhythmProps.get(b)).ticks;
        return cmp(aTicks, bTicks);
    }

    static cmpNoteLength(a: RhythmProps | NoteLength | NoteLengthStr, b: RhythmProps | NoteLength | NoteLengthStr): -1 | 0 | 1 {
        let aNoteLength = (a instanceof RhythmProps ? a : RhythmProps.get(a)).noteLength;
        let bNoteLength = (b instanceof RhythmProps ? b : RhythmProps.get(b)).noteLength;
        return cmp(bNoteLength, aNoteLength); // Reversed: smaller number is longer note.
    }
}
