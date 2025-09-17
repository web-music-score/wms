import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

const cmp = (a: number, b: number): -1 | 0 | 1 => a === b ? 0 : (a < b ? -1 : 1);

export const MaxTupletRatioParts = 12;

/*
 * To get integer ticks, NoteLength value must be divisible of all TupletRatio.parts values < MaxTupletRatioParts
 */
const TicksMultiplier = 12 * 11 * 9 * 7 * 5;

export enum NoteLength {
    Whole = "1n",
    WholeTriplet = "1t",
    WholeDot = "1.",
    Whole12Dots = "1..",
    Whole3Dots = "1...",
    Whole4Dots = "1....",
    Whole5Dots = "1.....",
    Whole6Dots = "1......",

    Half = "2n",
    HalfTriplet = "2t",
    HalfDot = "2.",
    Half2Dots = "2..",
    Half3Dots = "2...",
    Half4Dots = "2....",
    Half5Dots = "2.....",

    Quarter = "4n",
    QuarterTriplet = "4t",
    QuarterDot = "4.",
    Quarter2Dots = "4..",
    Quarter3Dots = "4...",
    Quarter4Dots = "4....",

    Eighth = "8n",
    EighthTriplet = "8t",
    EighthDot = "8.",
    Eighth2Dots = "8..",
    Eighth3Dots = "8...",

    Sixteenth = "16n",
    SixteenthTriplet = "16t",
    SixteenthDot = "16.",
    Sixteenth2Dots = "16..",

    ThirtySecond = "32n",
    ThirtySecondTriplet = "32t",
    ThirtySecondDot = "32.",

    SixtyFourth = "64n",
    SixtyFourthTriplet = "64t",
}

export type NoteLengthStr = `${NoteLength}`;

export const LongestNoteSize = Math.min(...Utils.Enum.getEnumValues(NoteLength).map(noteLength => getNoteSize(noteLength)));
export const ShortestNoteSize = Math.max(...Utils.Enum.getEnumValues(NoteLength).map(noteLength => getNoteSize(noteLength)));

export function validateNoteLength(noteLength: unknown): NoteLength {
    if (Utils.Is.isEnumValue(noteLength, NoteLength)) {
        return noteLength;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`)
    }
}

function getNoteSize(noteLength: NoteLength): number {
    return parseInt(noteLength);
}

function getTicks(noteSize: number): number {
    let ticks = TicksMultiplier, size = ShortestNoteSize;
    while (size > 1 && size > noteSize) {
        size /= 2;
        ticks *= 2;
    }
    return ticks;
}

function getFlagCount(noteSize: number): number {
    if (noteSize <= 4) {
        return 0;
    }
    else {
        let flagCount = 1, size = 8;
        while (size < noteSize) {
            size *= 2;
            flagCount++;
        }
        return flagCount;
    }
}

function getMaxDotCount(noteSize: number): number {
    let size = ShortestNoteSize, maxDotCount = 0;
    while (size > 0) {
        if (size === noteSize) return maxDotCount;
        size /= 2;
        maxDotCount++;
    }
    return 0;
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
    readonly noteSize: number; // whole=1, half=2, quarter=4, etc.
    readonly dotCount: number;
    readonly tupletRatio?: TupletRatio;
    readonly ticks: number;
    readonly flagCount: number;

    private constructor(noteLength: NoteLength | NoteLengthStr, dotCount?: number, tupletRatio?: TupletRatio) {
        this.noteLength = validateNoteLength(noteLength);

        this.noteSize = getNoteSize(this.noteLength);

        this.dotCount = dotCount ?? RhythmProps.getDotCount(noteLength) ?? 0;

        if (Utils.Is.isObject(tupletRatio)) {
            this.tupletRatio = tupletRatio;
        }
        else if (RhythmProps.hasTriplet(noteLength)) {
            this.tupletRatio = Tuplet.Triplet;
        }
        else {
            this.tupletRatio = undefined;
        }

        this.ticks = getTicks(this.noteSize);

        this.flagCount = getFlagCount(this.noteSize);

        if (this.dotCount > 0 && this.tupletRatio !== undefined) {
            throw new MusicError(MusicErrorType.Note, "Note cannot be both dotted and tuplet!");
        }
        else if (this.dotCount > getMaxDotCount(this.noteSize)) {
            throw new MusicError(MusicErrorType.Note, `Too big dot count ${this.dotCount} for note length ${this.noteLength}.`);
        }

        for (let add = this.ticks / 2, i = 1; i <= this.dotCount; i++, add /= 2) {
            this.ticks += add;
        }

        if (this.tupletRatio) {
            this.ticks *= this.tupletRatio.inTimeOf / this.tupletRatio.parts;
        }
    }

    static createFromNoteSize(noteSize: number): RhythmProps {
        return RhythmProps.get(validateNoteLength(noteSize + "n"));
    }

    get hasStem(): boolean {
        return RhythmProps.cmpNoteLength(this.noteLength, NoteLength.Whole) < 0;
    }

    private static NoteSymbolMap = new Map<number, string>([[1, "𝅝"], [2, "𝅗𝅥"], [4, "𝅘𝅥"], [8, "𝅘𝅥𝅮"], [16, "𝅘𝅥𝅯"], [32, "𝅘𝅥𝅰"], [64, "𝅘𝅥𝅱"], [128, "𝅘𝅥𝅲"]]);

    toString(): string {
        let sym = RhythmProps.NoteSymbolMap.get(this.noteSize);
        let dots = ".".repeat(this.dotCount);
        return sym ? (sym + dots) : ("" + this.noteSize + (dots.length > 0 ? dots : "n"));
    }

    private static cache = new Map<NoteLength | NoteLengthStr, RhythmProps>();

    static get(noteLength: NoteLength | NoteLengthStr, dotCount?: number, tupletRatio?: TupletRatio): RhythmProps {
        if (dotCount !== undefined || tupletRatio !== undefined) {
            return new RhythmProps(noteLength, dotCount, tupletRatio);
        }
        else {
            let rhythmProps = this.cache.get(noteLength);
            if (!rhythmProps) {
                this.cache.set(noteLength, rhythmProps = new RhythmProps(noteLength));
            }
            return rhythmProps;
        }
    }

    static cmpTicks(a: RhythmProps | NoteLength | NoteLengthStr, b: RhythmProps | NoteLength | NoteLengthStr): -1 | 0 | 1 {
        let aTicks = (a instanceof RhythmProps ? a : RhythmProps.get(a)).ticks;
        let bTicks = (b instanceof RhythmProps ? b : RhythmProps.get(b)).ticks;
        return cmp(aTicks, bTicks);
    }

    static cmpNoteLength(a: RhythmProps | NoteLength | NoteLengthStr, b: RhythmProps | NoteLength | NoteLengthStr): -1 | 0 | 1 {
        let aRhythProps = a instanceof RhythmProps ? a : RhythmProps.get(a);
        let bRhythProps = b instanceof RhythmProps ? b : RhythmProps.get(b);
        return RhythmProps.cmpNoteSize(aRhythProps, bRhythProps);
    }

    static cmpNoteSize(a: RhythmProps | number, b: RhythmProps | number): -1 | 0 | 1 {
        let aNoteSize = a instanceof RhythmProps ? a.noteSize : a;
        let bNoteSize = b instanceof RhythmProps ? b.noteSize : b;
        return cmp(bNoteSize, aNoteSize); // Reversed: smaller note size (1, 2, 4, etc.) is longer note (whole, half, quarter, etc.)
    }

    static hasTriplet(noteLength: NoteLength | NoteLengthStr): boolean {
        return noteLength.endsWith("t");
    }

    static getDotCount(noteLength: NoteLength | NoteLengthStr): number | undefined {
        let dotCount = Utils.Str.charCount(noteLength, ".");
        return dotCount > 0 ? dotCount : undefined;
    }
}
