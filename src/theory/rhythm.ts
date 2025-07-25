import { Utils } from "@tspro/ts-utils-lib";
import { MusicError } from "@tspro/web-music-score/core";

function getRhythmError(msg: string) {
    return new MusicError("Rhythm Error: " + msg);
}

/** @public */
export enum NoteLength {
    Whole = 64 * 3, // * 3 because triplets are multiplied by 2 / 3, integer result
    Half = 32 * 3,
    Quarter = 16 * 3,
    Eighth = 8 * 3,
    Sixteenth = 4 * 3,
    ThirtySecond = 2 * 3,
    SixtyFourth = 1 * 3
}

/** @public */
export const MaxNoteLength = NoteLength.Whole;

/** @public */
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

/** @public */
export function validateNoteLength(noteLength: unknown): NoteLength {
    if (!Utils.Is.isEnumValue(noteLength, NoteLength)) {
        throw getRhythmError("Invalid noteLength: " + noteLength)
    }
    else {
        return noteLength;
    }
}

/** @public */
export class RhythmProps {
    readonly noteLength: NoteLength;
    readonly dotted: boolean;
    readonly triplet: boolean;
    readonly ticks: number;
    readonly flagCount: number;

    constructor(noteLength: NoteLength, dotted?: boolean, triplet?: boolean) {
        this.noteLength = validateNoteLength(noteLength);
        this.dotted = dotted === true;
        this.triplet = triplet === true;
        this.ticks = this.noteLength;
        this.flagCount = FlagCountMap.get(this.noteLength) ?? 0;

        if (this.dotted && this.triplet) {
            throw getRhythmError("Note cannot be both dotted and triplet!");
        }
        else if (this.dotted && this.noteLength === MinNoteLength) {
            throw getRhythmError("Shortest note cannot be dotted!");
        }


        if (this.dotted) {
            this.ticks += this.noteLength / 2;
        }

        if (this.triplet) {
            this.ticks = this.ticks * 2 / 3;
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
