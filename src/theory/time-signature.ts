import { Utils } from "@tspro/ts-utils-lib";
import { NoteLength, NoteLengthProps } from "./rhythm";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

/** Time signature string type. */
export type TimeSignatureString = "2/4" | "3/4" | "4/4" | "6/8" | "9/8";

/** Time signature class. */
export class TimeSignature {
    /** Number of beats in measure, upper value (e.g. "3" in "3/4"). */
    readonly beatCount: number;
    /** Beat size of time signature, lower value (e.g. "4" in "3/4"). */
    readonly beatSize: number;
    /** Beat length. */
    readonly beatLength: NoteLength;
    /** Number of ticks in measure. */
    readonly measureTicks: number;
    /** Beam groups (e.g. [[2], [2]] or [[2, 2], [2, 2]] (first try as [[4], [4]])). */
    readonly beamGroupSizes: number[][] = [];

    /**
     * Create new time signature instance.
     * @param str - For example "4/4".
     */
    constructor(str: TimeSignatureString);
    /**
     * Create new time signature instance.
     * @param beatCount - Measure beat count.
     * @param beatSize - Size value: whole-note=1, half-note=2, quarter-note=4, etc.
     */
    constructor(beatCount: number, beatSize: number);
    constructor(...args: unknown[]) {
        if (args.length === 1 && typeof args[0] === "string") {
            let parts = args[0].split("/");
            this.beatCount = +parts[0];
            this.beatSize = +parts[1];
        }
        else if (args.length === 2 && typeof args[0] === "number" && typeof args[1] === "number") {
            this.beatCount = args[0];
            this.beatSize = args[1];
        }
        else {
            throw new MusicError(MusicErrorType.Timesignature, `Invalid args: ${args}`);
        }

        if (!Utils.Is.isIntegerGte(this.beatCount, 1)) {
            throw new MusicError(MusicErrorType.Timesignature, `Invalid beatCount: ${this.beatCount}`);
        }
        else if (!Utils.Is.isIntegerGte(this.beatSize, 1)) {
            throw new MusicError(MusicErrorType.Timesignature, `Invalid beatSize: ${this.beatSize}`);
        }

        let props = NoteLengthProps.create(this.beatSize);

        this.beatLength = props.noteLength;
        this.measureTicks = this.beatCount * props.ticks;

        if (this.is(2, 4)) {
            this.beamGroupSizes = [[2], [2]];
        }
        else if (this.is(3, 4)) {
            this.beamGroupSizes = [[2], [2], [2]];
        }
        else if (this.is(4, 4)) {
            this.beamGroupSizes = [[2, 2], [2, 2]];
        }
        else if (this.is(6, 8)) {
            this.beamGroupSizes = [[3], [3]];
        }
        else if (this.is(9, 8)) {
            this.beamGroupSizes = [[3], [3], [3]];
        }
        else if (this.is(12, 8)) {
            this.beamGroupSizes = [[3], [3], [3], [3]];
        }
        else {
            this.beamGroupSizes = [];
            console.warn("No beam detection implemented for time signature: " + this.toString());
        }
    }

    /**
     * Test whether this time signature has given beat count and size.
     * @param beatCount - Beat count.
     * @param beatSize - Beat size.
     * @returns - Boolean whether this time signature match given beat count and size.
     */
    is(beatCount: number, beatSize: number) {
        return this.beatCount === beatCount && this.beatSize === beatSize;
    }

    /**
     * Get string representation of this time signature (e.g. "3/4").
     * @returns - String representation.
     */
    toString() {
        return this.beatCount + "/" + this.beatSize;
    }
}

let defaultTimeSignature: TimeSignature | undefined;

/**
 * Get default time signature ("4/4").
 * @returns - Default time signature.
 */
export function getDefaultTimeSignature(): TimeSignature {
    if (!defaultTimeSignature) {
        defaultTimeSignature = new TimeSignature(4, 4);
    }
    return defaultTimeSignature;
}
