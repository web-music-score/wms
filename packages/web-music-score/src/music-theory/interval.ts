import { Assert, Utils } from "@tspro/ts-utils-lib";
import { Note } from "./note";
import { MusicError } from "../music-error";

/** @public */
export type IntervalDirection = "Unison" | "Ascending" | "Descending";

/** @public */
export type IntervalQuality =
    | "Perfect"
    | "Major"
    | "minor"
    | "Augmented"
    | "Doubly Augmented"
    | "diminished"
    | "doubly diminished";

const IntervalQualityAbbrMap = new Map<IntervalQuality, string>([
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



/** @public */
export function validateIntervalQuality(q: string): IntervalQuality {
    if (q === "Perfect" || q === "Major" || q === "minor" || q === "Augmented" || q === "diminished" || q === "Doubly Augmented" || q === "doubly diminished") {
        return q;
    }
    else {
        Assert.interrupt("Invalid interval quality: " + q);
    }
}

function formatQuantity(q: number) {
    Assert.int_gte(q, 1, "Invalid quantity!");
    return Utils.Math.toOrdinalNumber(q);
}

class InvalidInterval extends MusicError {
    constructor(readonly msg: string) {
        super(msg);
    }
}

/** @public */
export class Interval {
    readonly direction: IntervalDirection;
    readonly semitones: number;
    readonly quantity: number;
    readonly quality: IntervalQuality;

    private constructor(readonly note1: Note, readonly note2: Note) {
        if (note2.pitch >= note1.pitch) {
            this.direction = note2.pitch === note1.pitch ? "Unison" : "Ascending";
            this.quantity = note2.pitch - note1.pitch + 1;
            this.semitones = note2.noteId - note1.noteId;
        }
        else {
            this.direction = "Descending";
            this.quantity = note1.pitch - note2.pitch + 1;
            this.semitones = note1.noteId - note2.noteId;
        }

        let quality = getIntervalQuality(this.quantity, this.semitones);

        if (quality) {
            this.quality = quality;
        }
        else {
            throw new InvalidInterval("Unknown interval quality");
        }
    }

    static get(note1: Note, note2: Note): Interval | undefined {
        try {
            return new Interval(note1, note2);
        }
        catch (err) {
            if (err instanceof InvalidInterval) {
                return undefined;
            }
            else {
                throw err;
            }
        }
    }

    toString(): string {
        let direction = this.direction === "Unison" ? "" : (this.direction + " ");
        let quality = this.quality + " ";
        let quantity = this.direction === "Unison" ? "Unison" : formatQuantity(this.quantity);

        return direction + quality + quantity;
    }

    toAbbrString(): string {
        let direction = this.direction === "Descending" ? "↓" : "";
        let quality = IntervalQualityAbbrMap.get(this.quality) ?? "?";
        let quantity = this.quantity;

        return direction + quality + quantity;
    }
}
