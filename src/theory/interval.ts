import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Note } from "./note";
import { InvalidArgError, MusicError, MusicErrorType } from "web-music-score/core";

/** Interval direction type. */
export type IntervalDirection = "Unison" | "Ascending" | "Descending";

/** Interval quality type. */
export type IntervalQuality =
    | "Perfect"
    | "Major"
    | "minor"
    | "Augmented"
    | "Doubly Augmented"
    | "diminished"
    | "doubly diminished";

const IntervalQualityAbbrMap = new UniMap<IntervalQuality, string>([
    ["Major", "M"],
    ["minor", "m"],
    ["Perfect", "P"],
    ["diminished", "d"],
    ["Augmented", "A"],
    ["doubly diminished", "dd"],
    ["Doubly Augmented", "AA"]
]);

type IntervalTable = {
    [diatonic: number]: {
        [chromatic: number]: IntervalQuality;
    }
}

const IntervalQualities: IntervalTable = {
    "1": { // Unison
        "0": "Perfect",
        "1": "Augmented",
        "-1": "diminished",
        "2": "Doubly Augmented",
        "-2": "doubly diminished",
    },
    "2": { // Second
        "2": "Major",
        "1": "minor",
        "3": "Augmented",
        "0": "diminished",
        "4": "Doubly Augmented",
        "-1": "doubly diminished",
    },
    "3": { // Third
        "4": "Major",
        "3": "minor",
        "5": "Augmented",
        "2": "diminished",
        "6": "Doubly Augmented",
        "1": "doubly diminished",
    },
    "4": { // Fourth
        "5": "Perfect",
        "6": "Augmented",
        "4": "diminished",
        "7": "Doubly Augmented",
        "3": "doubly diminished",
    },
    "5": { // Fifth
        "7": "Perfect",
        "8": "Augmented",
        "6": "diminished",
        "9": "Doubly Augmented",
        "5": "doubly diminished",
    },
    "6": { // Sixth
        "9": "Major",
        "8": "minor",
        "10": "Augmented",
        "7": "diminished",
        "11": "Doubly Augmented",
        "6": "doubly diminished",
    },
    "7": { // Seventh
        "11": "Major",
        "10": "minor",
        "12": "Augmented",
        "9": "diminished",
        "13": "Doubly Augmented",
        "8": "doubly diminished",
    },
    "8": { // Octave
        "12": "Perfect",
        "13": "Augmented",
        "11": "diminished",
        "14": "Doubly Augmented",
        "10": "doubly diminished",
    },
};

function getIntervalQuality(diatonicInterval: number, chromaticInterval: number): IntervalQuality | undefined {
    while (diatonicInterval < 1) {
        diatonicInterval += 7;
        chromaticInterval += 12;
    }

    while (diatonicInterval > 8) {
        diatonicInterval -= 7;
        chromaticInterval -= 12;
    }

    const qualities = IntervalQualities[diatonicInterval];

    if (qualities) {
        return qualities[chromaticInterval];
    }
    else {
        return undefined;
    }
}

export function validateIntervalQuality(quality: unknown): IntervalQuality {
    if (
        quality === "Perfect" ||
        quality === "Major" ||
        quality === "minor" ||
        quality === "Augmented" ||
        quality === "diminished" ||
        quality === "Doubly Augmented" ||
        quality === "doubly diminished"
    )
        return quality;
    else
        throw new InvalidArgError(`Invalid interval quality "${quality}".`);
}

function formatQuantity(q: number) {
    if (!Guard.isIntegerGte(q, 1)) {
        throw new InvalidArgError(`Invalid interval quantity "${q}".`);
    }
    else {
        return Utils.Math.toOrdinalNumber(q);
    }
}

// Used only internally
class InvalidIntervalException extends Error {
    constructor(readonly msg: string) {
        super(msg);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}

/** Interval class. */
export class Interval {
    /** Interval direction. */
    readonly direction: IntervalDirection;
    /** Number of semitones. */
    readonly semitones: number;
    /** Interval quantity. */
    readonly quantity: number;
    /** Interval quality. */
    readonly quality: IntervalQuality;

    private constructor(readonly note1: Note, readonly note2: Note) {
        if (note2.diatonicId >= note1.diatonicId) {
            this.direction = note2.diatonicId === note1.diatonicId ? "Unison" : "Ascending";
            this.quantity = note2.diatonicId - note1.diatonicId + 1;
            this.semitones = note2.chromaticId - note1.chromaticId;
        }
        else {
            this.direction = "Descending";
            this.quantity = note1.diatonicId - note2.diatonicId + 1;
            this.semitones = note1.chromaticId - note2.chromaticId;
        }

        let quality = getIntervalQuality(this.quantity, this.semitones);

        if (quality) {
            this.quality = quality;
        }
        else {
            throw new InvalidIntervalException("Unknown interval quality");
        }
    }

    /**
     * Get interval between given two notes.
     * @param note1 - First note.
     * @param note2 - Second note.
     * @returns - Interval if valid, or undefined.
     */
    static get(note1: Note, note2: Note): Interval | undefined {
        try {
            return new Interval(note1, note2);
        }
        catch (err) {
            if (err instanceof InvalidIntervalException) {
                return undefined;
            }
            else {
                throw err;
            }
        }
    }

    /**
     * Get string presentation of interval (e.g. "Descending Major 2").
     * @returns - Interval string.
     */
    toString(): string {
        let direction = this.direction === "Unison" ? "" : (this.direction + " ");
        let quality = this.quality + " ";
        let quantity = this.direction === "Unison" ? "Unison" : formatQuantity(this.quantity);

        return direction + quality + quantity;
    }

    /**
     * Get abbrevated string presentation of interval (e.g. "↓M2").
     * @returns - Interval abbrevated string.
     */
    toAbbrString(): string {
        let direction = this.direction === "Descending" ? "↓" : "";
        let quality = IntervalQualityAbbrMap.getOrDefault(this.quality, "?");
        let quantity = this.quantity;

        return direction + quality + quantity;
    }
}
