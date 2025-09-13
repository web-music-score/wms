import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export enum NoteLength {
    Whole = 64 * 3, // * 3 because triplets are multiplied by 2 / 3, integer result
    Half = 32 * 3,
    Quarter = 16 * 3,
    Eighth = 8 * 3,
    Sixteenth = 4 * 3,
    ThirtySecond = 2 * 3,
    SixtyFourth = 1 * 3
}

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

export function validateNoteLength(noteLength: unknown): NoteLength {
    if (!Utils.Is.isEnumValue(noteLength, NoteLength)) {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid noteLength: ${noteLength}`)
    }
    else {
        return noteLength;
    }
}

export interface TupletRatio {
    parts: number;
    inTimeOf: number;
}

export const Tuplet = {
    Triplet: { parts: 3, inTimeOf: 2 }
}

export class RhythmProps {
    readonly noteLength: NoteLength;
    readonly dotted: boolean;
    /** @deprecated - replaced by tupletRatio */
    readonly triplet: boolean;
    readonly tupletRatio?: TupletRatio;
    readonly ticks: number;
    readonly flagCount: number;

    constructor(noteLength: NoteLength, dotted?: boolean, triplet?: boolean);
    constructor(noteLength: NoteLength, dotted?: boolean, tupletRatio?: TupletRatio);
    constructor(noteLength: NoteLength, dotted?: boolean, tupletArg?: boolean | TupletRatio) {
        this.noteLength = validateNoteLength(noteLength);
        this.dotted = dotted === true;
        if (typeof tupletArg === "boolean") {
            this.triplet = tupletArg;
            this.tupletRatio = tupletArg ? Tuplet.Triplet : undefined;
        }
        else if (Utils.Is.isObject(tupletArg)) {
            this.triplet = tupletArg.parts === 3 && tupletArg.inTimeOf === 2;
            this.tupletRatio = tupletArg;
        }
        else {
            this.triplet = false;
            this.tupletRatio = undefined;
        }
        
        this.ticks = this.noteLength;
        this.flagCount = FlagCountMap.get(this.noteLength) ?? 0;

        if (this.dotted && this.triplet) {
            throw new MusicError(MusicErrorType.Note, "Note cannot be both dotted and triplet!");
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
