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

export function validateNoteLength(noteLength: unknown): NoteLength {
    if (Utils.Is.isEnumValue(noteLength, NoteLength)) {
        return noteLength;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`);
    }
}

export class NoteLengthProps {
    static LongestNoteSize = Math.min(...Utils.Enum.getEnumValues(NoteLength).map(noteLength => parseInt(noteLength)));
    static ShortestNoteSize = Math.max(...Utils.Enum.getEnumValues(NoteLength).map(noteLength => parseInt(noteLength)));

    readonly noteLength: NoteLength;
    readonly noteSize: number;
    readonly ticks: number;
    readonly flagCount: number;
    readonly dotCount: number;
    readonly maxDotCount: number;
    readonly isTriplet: boolean;
    readonly hasStem: boolean;
    readonly isSolid: boolean; // Is solid (black) note head?

    private constructor(noteLength: NoteLength | NoteLengthStr) {
        this.noteLength = validateNoteLength(noteLength);
        this.noteSize = parseInt(noteLength);
        this.ticks = TicksMultiplier;
        this.maxDotCount = 0;
        this.dotCount = Utils.Str.charCount(noteLength, ".");
        this.isTriplet = noteLength.endsWith("t");
        this.flagCount = 0;
        this.hasStem = this.noteSize > 1;
        this.isSolid = this.noteSize > 2;

        let size = NoteLengthProps.ShortestNoteSize;
        while (size > 1 && size > this.noteSize) {
            size /= 2;
            this.ticks *= 2;
            if (!this.isTriplet) {
                this.maxDotCount++;
            }
        }

        if (this.noteSize > 4) {
            this.flagCount = 1;
            let size = 8;
            while (size < this.noteSize) {
                size *= 2;
                this.flagCount++;
            }
        }
    }

    private static cache = new Map<NoteLength | NoteLengthStr, NoteLengthProps>();

    static get(noteLength: NoteLength | NoteLengthStr): NoteLengthProps {
        let p = this.cache.get(noteLength);
        if (!p) {
            this.cache.set(noteLength, p = new NoteLengthProps(noteLength));
        }
        return p;
    }

    static cmp(a: NoteLengthProps | NoteLength | NoteLengthStr | number, b: NoteLengthProps | NoteLength | NoteLengthStr | number): -1 | 0 | 1 {
        let aNoteSize = a instanceof NoteLengthProps ? a.noteSize : (typeof a === "number" ? a : NoteLengthProps.get(a).noteSize);
        let bNoteSize = b instanceof NoteLengthProps ? b.noteSize : (typeof b === "number" ? b : NoteLengthProps.get(b).noteSize);
        // Reversed: smaller note size (1, 2, 4, etc.) is longer note (whole, half, quarter, etc.)
        // Ignores isTriplet.
        return cmp(bNoteSize, aNoteSize);
    }

    static equals(a: NoteLengthProps | NoteLength | NoteLengthStr | number, b: NoteLengthProps | NoteLength | NoteLengthStr | number): boolean {
        let aNoteSize = a instanceof NoteLengthProps ? a.noteSize : (typeof a === "number" ? a : NoteLengthProps.get(a).noteSize);
        let bNoteSize = b instanceof NoteLengthProps ? b.noteSize : (typeof b === "number" ? b : NoteLengthProps.get(b).noteSize);
        // Ignores isTriplet.
        return aNoteSize === bNoteSize;
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
    readonly noteSize: number; // whole=1, half=2, quarter=4, etc.
    readonly dotCount: number;
    readonly tupletRatio?: TupletRatio;
    readonly ticks: number;
    readonly flagCount: number;
    readonly hasStem: boolean;
    readonly isSolidNoteHead: boolean;

    private constructor(noteLength: NoteLength | NoteLengthStr, dotCount?: number, tupletRatio?: TupletRatio) {
        this.noteLength = validateNoteLength(noteLength);

        let p = NoteLengthProps.get(this.noteLength);

        this.noteSize = p.noteSize;
        this.ticks = p.ticks;
        this.flagCount = p.flagCount;
        this.dotCount = dotCount ?? p.dotCount;
        this.hasStem = p.hasStem;
        this.isSolidNoteHead = p.isSolid;

        if (Utils.Is.isObject(tupletRatio)) {
            this.tupletRatio = tupletRatio;
        }
        else if (p.isTriplet) {
            this.tupletRatio = Tuplet.Triplet;
        }
        else {
            this.tupletRatio = undefined;
        }

        if (this.dotCount > 0 && this.tupletRatio !== undefined) {
            throw new MusicError(MusicErrorType.Note, "Note cannot be both dotted and tuplet!");
        }
        else if (this.dotCount > p.maxDotCount) {
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

    static cmp(a: RhythmProps, b: RhythmProps): -1 | 0 | 1 {
        return cmp(a.ticks, b.ticks);
    }

    static equals(a: RhythmProps, b: RhythmProps): boolean {
        return a.ticks === b.ticks;
    }
}
