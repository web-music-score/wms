import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export const MaxTupletRatioParts = 12;

/*
 * To get integer ticks, NoteLength value must be divisible of all TupletRatio.parts values < MaxTupletRatioParts
 */
const TickMul = 12 * 11 * 9 * 7 * 5;

export enum NoteLength {
    Whole = 64 * TickMul,
    Half = 32 * TickMul,
    Quarter = 16 * TickMul,
    Eighth = 8 * TickMul,
    Sixteenth = 4 * TickMul,
    ThirtySecond = 2 * TickMul,
    SixtyFourth = 1 * TickMul
}

export type NoteLengthStr =
    "1n" | "2n" | "4n" | "8n" | "16n" | "32n" | "64n" |
    "1t" | "2t" | "4t" | "8t" | "16t" | "32t" | "64t";

export const MaxNoteLength = NoteLength.Whole;

export const MinNoteLength = NoteLength.SixtyFourth;

const FlagCountMap = new Map<NoteLength, number>([
    [NoteLength.Whole, 0],
    [NoteLength.Half, 0],
    [NoteLength.Quarter, 0],
    [NoteLength.Eighth, 1],
    [NoteLength.Sixteenth, 2],
    [NoteLength.ThirtySecond, 3],
    [NoteLength.SixtyFourth, 4]
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

const NoteLengthStrMap = new Map<NoteLengthStr, NoteLength>([
    ["1n", NoteLength.Whole],
    ["2n", NoteLength.Half],
    ["4n", NoteLength.Quarter],
    ["8n", NoteLength.Eighth],
    ["16n", NoteLength.Sixteenth],
    ["32n", NoteLength.ThirtySecond],
    ["64n", NoteLength.SixtyFourth],
    ["1t", NoteLength.Whole],
    ["2t", NoteLength.Half],
    ["4t", NoteLength.Quarter],
    ["8t", NoteLength.Eighth],
    ["16t", NoteLength.Sixteenth],
    ["32t", NoteLength.ThirtySecond],
    ["64t", NoteLength.SixtyFourth],
]);

export function hasNoteLengthTriplet(noteLength: NoteLength | NoteLengthStr): boolean {
    return typeof noteLength === "string" && noteLength.endsWith("t");
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
    else if (typeof noteLength === "string" && NoteLengthStrMap.get(noteLength)) {
        return NoteLengthStrMap.get(noteLength)!;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`)
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
    readonly dotted: boolean;
    readonly tupletRatio?: TupletRatio;
    readonly ticks: number;
    readonly flagCount: number;

    constructor(noteLength: NoteLength | NoteLengthStr, dotted?: boolean, triplet?: boolean);
    constructor(noteLength: NoteLength | NoteLengthStr, dotted?: boolean, tupletRatio?: TupletRatio);
    constructor(noteLength: NoteLength | NoteLengthStr, dotted?: boolean, tupletArg?: boolean | TupletRatio) {
        this.noteLength = getNoteLength(noteLength);
        this.dotted = dotted === true;
        if (typeof tupletArg === "boolean") {
            this.tupletRatio = tupletArg ? Tuplet.Triplet : undefined;
        }
        else if (Utils.Is.isObject(tupletArg)) {
            this.tupletRatio = tupletArg;
        }
        else if (hasNoteLengthTriplet(noteLength)) {
            this.tupletRatio = Tuplet.Triplet;
        }
        else {
            this.tupletRatio = undefined;
        }

        this.ticks = this.noteLength;
        this.flagCount = FlagCountMap.get(this.noteLength) ?? 0;

        if (this.dotted && this.tupletRatio !== undefined) {
            throw new MusicError(MusicErrorType.Note, "Note cannot be both dotted and tuplet!");
        }
        else if (this.dotted && this.noteLength === MinNoteLength) {
            throw new MusicError(MusicErrorType.Note, "Shortest note cannot be dotted!");
        }


        if (this.dotted) {
            this.ticks += this.noteLength / 2;
        }

        if (this.tupletRatio) {
            this.ticks *= this.tupletRatio.inTimeOf / this.tupletRatio.parts;
        }
    }

    static createFromNoteSize(noteSize: number) {
        /*
            Calculate noteLength example:
                noteSize = 16 (16th note),
                MaxNoteLength = NoteLength.Whole = 64
                noteLength = 64 / 16 = 4 = NoteLength.Sixteenth (16th note)
        */
        return new RhythmProps(MaxNoteLength / noteSize);
    }

    canDot() {
        // Already dotted and shortest note cannot be dotted.
        return !this.dotted && this.noteLength !== MinNoteLength;
    }

    hasStem() {
        return this.noteLength < NoteLength.Whole;
    }

    toString() {
        return NoteSymbolMap.get(this.noteLength) + (this.dotted ? "." : "");
    }
}
