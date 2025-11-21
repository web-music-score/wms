import { Guard, IndexArray, UniMap, Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "web-music-score/core";

const MaxTupletRatioValue = 12;

/*
 * To get integer ticks, NoteLength value must be divisible of all TupletRatio.parts values < MaxTupletRatioParts
 */
const TicksMultiplier = 12 * 11 * 9 * 7 * 5;

/** Note length enum. */
export enum NoteLength {
    /** Whole note. */
    Whole = "1n",
    /** Whole note creating a triplet. */
    WholeTriplet = "1t",
    /** Dotted whole note. */
    WholeDot = "1.",
    /** Double dotted whole note. */
    Whole2Dots = "1..",
    /** Triple dotted whole note. */
    Whole3Dots = "1...",
    /** Quadruple-dotted whole note. */
    Whole4Dots = "1....",
    /** Quintuple-dotted whole note. */
    Whole5Dots = "1.....",
    /** Sextuple-dotted whole note. */
    Whole6Dots = "1......",

    /** Half note. */
    Half = "2n",
    /** Half note creating a triplet. */
    HalfTriplet = "2t",
    /** Dotted half note. */
    HalfDot = "2.",
    /** Double dotted half note. */
    Half2Dots = "2..",
    /** Triple dotted half note. */
    Half3Dots = "2...",
    /** Quadruple-dotted half note. */
    Half4Dots = "2....",
    /** Quintuple-dotted half notre. */
    Half5Dots = "2.....",

    /** Quarter note. */
    Quarter = "4n",
    /** Quarter note creating a triplet. */
    QuarterTriplet = "4t",
    /** Dotted quarter note. */
    QuarterDot = "4.",
    /** Double dotted quarter note. */
    Quarter2Dots = "4..",
    /** Triple dotted quarter note. */
    Quarter3Dots = "4...",
    /** Quadruple-dotted quarter note. */
    Quarter4Dots = "4....",

    /** Eighth note. */
    Eighth = "8n",
    /** Eighth note creating a triplet. */
    EighthTriplet = "8t",
    /** Dotted eighth note. */
    EighthDot = "8.",
    /** Double dotted eighth note. */
    Eighth2Dots = "8..",
    /** Triple dotted eighth note. */
    Eighth3Dots = "8...",

    /** Sixteenth note. */
    Sixteenth = "16n",
    /** Sixteenth note creating a triplet. */
    SixteenthTriplet = "16t",
    /** Dotted sixteenth note. */
    SixteenthDot = "16.",
    /** Double dotted sixteenth note. */
    Sixteenth2Dots = "16..",

    /** Thirtysecond note. */
    ThirtySecond = "32n",
    /** Thirtysecond note creating a triplet. */
    ThirtySecondTriplet = "32t",
    /** Dotted thritysecond note. */
    ThirtySecondDot = "32.",

    /** Sixtyfourth note. */
    SixtyFourth = "64n",
    /** Sixtyfourth note creating a triplet. */
    SixtyFourthTriplet = "64t",
}

/** String values type of note length enum. */
export type NoteLengthStr = `${NoteLength}`;

/**
 * Test if given argument is note length.
 * @param noteLength - Note length to validate.
 * @returns - True/false.
 */
export function isNoteLength(noteLength: unknown): noteLength is NoteLength {
    return Guard.isEnumValue(noteLength, NoteLength);
}

/**
 * Validate if given argument is note length.
 * @param noteLength - Note length to validate.
 * @returns - Valid note length or throws.
 */
export function validateNoteLength(noteLength: unknown): NoteLength {
    if (isNoteLength(noteLength)) {
        return noteLength;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`);
    }
}

/** Note length props class. */
export class NoteLengthProps {
    /** Longest note size (e.g. 1 = whole note). */
    static LongestNoteSize: number = Math.min(...Utils.Enum.getEnumValues(NoteLength).map(noteLength => parseInt(noteLength)));
    /** Shortest note size (e.g. 64 = sixtyfourth note). */
    static ShortestNoteSize: number = Math.max(...Utils.Enum.getEnumValues(NoteLength).map(noteLength => parseInt(noteLength)));

    /** Note length. */
    readonly noteLength: NoteLength;
    /** Note size (whole=1, half=2, quarter=4, ...). */
    readonly noteSize: number;
    /** Number of ticks (not altered by isTriplet). */
    readonly ticks: number;
    /** Flag count. */
    readonly flagCount: number;
    /** Dot count. */
    readonly dotCount: number;
    /** Max dot count. */
    readonly maxDotCount: number;
    /** Is triplet? */
    readonly isTriplet: boolean;
    /** Has note stem. */
    readonly hasStem: boolean;
    /** Is note head solid (black)? */
    readonly isSolid: boolean;

    private constructor(noteLength: NoteLength | NoteLengthStr | string) {
        this.noteLength = validateNoteLength(noteLength);
        this.noteSize = parseInt(noteLength);
        this.isTriplet = noteLength.endsWith("t");
        this.maxDotCount = this.isTriplet ? 0 : Math.floor(Math.log2(NoteLengthProps.ShortestNoteSize / this.noteSize));
        this.dotCount = Utils.Str.charCount(noteLength, ".");
        this.flagCount = this.noteSize > 4 ? Math.floor(Math.log2(this.noteSize / 4)) : 0;
        this.ticks = TicksMultiplier * NoteLengthProps.ShortestNoteSize / this.noteSize;
        this.hasStem = this.noteSize > 1;
        this.isSolid = this.noteSize > 2;

        if (this.dotCount > this.maxDotCount) {
            throw new MusicError(MusicErrorType.Note, `dotCount ${this.dotCount} > maxDotCount ${this.maxDotCount}, for noteLength "${this.noteLength}".`);
        }
        else if (this.isTriplet && this.dotCount > 0) {
            throw new MusicError(MusicErrorType.Note, `noteLength "${this.noteLength}" is both triplet and dotted!`);
        }
    }

    private static cache = new UniMap<NoteLength | NoteLengthStr | string, NoteLengthProps>();

    /**
     * Get note length props.
     * @param noteLength - Note length.
     * @returns - Note length props.
     */
    static get(noteLength: NoteLength | NoteLengthStr | string): NoteLengthProps {
        return this.cache.getOrCreate(noteLength, () => new NoteLengthProps(noteLength));
    }

    /**
     * Create note length props.
     * @param noteLength - Note length or note size.
     * @param dotCount - Dot count.
     * @returns - Note length props.
     */
    static create(noteLength: NoteLength | NoteLengthStr | string | number, dotCount: number = 0): NoteLengthProps {
        let noteSize = typeof noteLength === "number" ? noteLength : this.get(noteLength).noteSize;
        return this.get(noteSize + (Guard.isIntegerGte(dotCount, 1) ? ".".repeat(dotCount) : "n"));
    }

    /**
     * Compare note lengths/sizes. Whole (1) > half (2) > quarter (4), etc.
     * Ignores possible triplet property of note length.
     * @param a - NoteLengthProps, NoteLength/Str or noteSize
     * @param b - NoteLengthProps, NoteLength/Str or noteSize
     * @returns - -1: a < b, 0: a === b, +1: a > b (note length/size comparisons)
     */
    static cmp(a: NoteLengthProps | NoteLength | NoteLengthStr | number, b: NoteLengthProps | NoteLength | NoteLengthStr | number): -1 | 0 | 1 {
        let aNoteSize = a instanceof NoteLengthProps ? a.noteSize : (typeof a === "number" ? a : NoteLengthProps.get(a).noteSize);
        let bNoteSize = b instanceof NoteLengthProps ? b.noteSize : (typeof b === "number" ? b : NoteLengthProps.get(b).noteSize);
        // Reversed: smaller note size (1, 2, 4, etc.) is longer note (whole, half, quarter, etc.)
        return Utils.Math.cmp(bNoteSize, aNoteSize);
    }

    /**
     * Compare note lengths/sizes for equality.
     * Ignores possible triplet property of note length.
     * @param a - NoteLengthProps, NoteLength/Str or noteSize
     * @param b - NoteLengthProps, NoteLength/Str or noteSize
     * @returns - true: a === b, false: a !== b (note length/size comparisons)
     */
    static equals(a: NoteLengthProps | NoteLength | NoteLengthStr | number, b: NoteLengthProps | NoteLength | NoteLengthStr | number): boolean {
        let aNoteSize = a instanceof NoteLengthProps ? a.noteSize : (typeof a === "number" ? a : NoteLengthProps.get(a).noteSize);
        let bNoteSize = b instanceof NoteLengthProps ? b.noteSize : (typeof b === "number" ? b : NoteLengthProps.get(b).noteSize);
        return aNoteSize === bNoteSize;
    }
}

/** Tuplet ratio interface. */
export interface TupletRatio {
    /** Number of parts (notes). */
    parts: number;
    /** Played int time of (notes). */
    inTimeOf: number;
}

/**
 * Test if given argument is tuplet ratio.
 * @param tupletRatio - Tuplet ratio to validate.
 * @returns - True/false.
 */
export function isTupletRatio(tupletRatio: unknown): tupletRatio is TupletRatio {
    return (
        Guard.isObject(tupletRatio) &&
        Guard.isIntegerBetween(tupletRatio.parts, 2, MaxTupletRatioValue) &&
        Guard.isIntegerBetween(tupletRatio.inTimeOf, 2, MaxTupletRatioValue)
    );
}

/**
 * Validate if given argument is tuplet ratio.
 * @param tupletRatio - Tuplet ratio to validate.
 * @returns - Valid tuplet ratio or throws.
 */
export function validateTupletRatio(tupletRatio: unknown): TupletRatio {
    if (isTupletRatio(tupletRatio)) {
        return tupletRatio;
    }
    else {
        throw new MusicError(MusicErrorType.Note, `Invalid tupletRatio ${JSON.stringify(tupletRatio)}`);
    }
}

/** Some preset tuplet ratio values. */
export const Tuplet: Record<"Duplet" | "Triplet" | "Quadruplet", TupletRatio> = {
    /** Duplet: 2 in the time of 3 */
    Duplet: { parts: 2, inTimeOf: 3 },
    /** Triplet: 3 in the time of 2 */
    Triplet: { parts: 3, inTimeOf: 2 },
    /** Quadruplet: 4 in the time of 3 */
    Quadruplet: { parts: 4, inTimeOf: 3 },
}

/** Rhythm props class. */
export class RhythmProps {
    /** Note length. */
    readonly noteLength: NoteLength;
    /** Note size (whole=1, half=2, quarter=4, ...). */
    readonly noteSize: number;
    /** Dot count. */
    readonly dotCount: number;
    /** Tuplet ratio. */
    readonly tupletRatio?: TupletRatio;
    /** Number of ticks. */
    readonly ticks: number;
    /** Flag count. */
    readonly flagCount: number;
    /** Has note stem. */
    readonly hasStem: boolean;
    /** Is note head solid (black)? */
    readonly isSolidNoteHead: boolean;

    private constructor(noteLength: NoteLength | NoteLengthStr, dotCount?: number, tupletRatio?: TupletRatio) {
        this.noteLength = validateNoteLength(noteLength);

        let p = NoteLengthProps.get(noteLength); // Not this.noteLength, misses isTriplet (maxDotCount will be wrong)!

        this.noteSize = p.noteSize;
        this.ticks = p.ticks;
        this.flagCount = p.flagCount;
        this.dotCount = dotCount ?? p.dotCount;
        this.hasStem = p.hasStem;
        this.isSolidNoteHead = p.isSolid;

        if (Guard.isObject(tupletRatio)) {
            this.tupletRatio = validateTupletRatio(tupletRatio);
        }
        else if (p.isTriplet) {
            this.tupletRatio = Tuplet.Triplet;
        }
        else {
            this.tupletRatio = undefined;
        }

        if (this.dotCount > 0 && this.tupletRatio !== undefined) {
            throw new MusicError(MusicErrorType.Note, `Note cannot be both dotted and tuplet!`);
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

    private static NoteSymbolMap = new IndexArray<string>([[1, "𝅝"], [2, "𝅗𝅥"], [4, "𝅘𝅥"], [8, "𝅘𝅥𝅮"], [16, "𝅘𝅥𝅯"], [32, "𝅘𝅥𝅰"], [64, "𝅘𝅥𝅱"], [128, "𝅘𝅥𝅲"]]);

    /**
     * Get string presentation of rhythm props.
     * @returns - String presentation.
     */
    toString(): string {
        let sym = RhythmProps.NoteSymbolMap.get(this.noteSize);
        let dots = ".".repeat(this.dotCount);
        return sym ? (sym + dots) : ("" + this.noteSize + (dots.length > 0 ? dots : "n"));
    }

    private static cache = new UniMap<NoteLength | NoteLengthStr, RhythmProps>();

    /**
     * Get rhythm props with given arguments.
     * @param noteLength - Note length.
     * @param dotCount - Dot count.
     * @param tupletRatio - Tuplet ratio.
     * @returns - Rhythm props.
     */
    static get(noteLength: NoteLength | NoteLengthStr, dotCount?: number, tupletRatio?: TupletRatio): RhythmProps {
        if (dotCount !== undefined || tupletRatio !== undefined) {
            return new RhythmProps(noteLength, dotCount, tupletRatio);
        }
        else {
            return this.cache.getOrCreate(noteLength, () => new RhythmProps(noteLength));
        }
    }

    /**
     * Compare duration of rhythm props.
     * @param a - RhythmProps
     * @param b - RhythmProps
     * @returns - -1: a < b, 0: a === b, +1: a > b (duration comparisons)
     */
    static cmp(a: RhythmProps, b: RhythmProps): -1 | 0 | 1 {
        return Utils.Math.cmp(a.ticks, b.ticks);
    }

    /**
     * Compare duration equality of rhythm props.
     * @param a - RhythmProps
     * @param b - RhythmProps
     * @returns - true: a === b, false: a !== b (duration comparisons)
     */
    static equals(a: RhythmProps, b: RhythmProps): boolean {
        return a.ticks === b.ticks;
    }
}
