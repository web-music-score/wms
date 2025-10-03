import { Utils } from "@tspro/ts-utils-lib";
import { NoteLength, NoteLengthProps } from "./rhythm";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

/** Time signature enum.  */
export enum TimeSignatures {
    /** 2/4 time signature. */
    _2_4 = "2/4",
    /** 3/4 time signature. */
    _3_4 = "3/4",
    /** 4/4 time signature. */
    _4_4 = "4/4",
    /** 3/8 time signature. */
    _3_8 = "3/8",
    /** 5/8 time signature. */
    _5_8 = "5/8",
    /** 6/8 time signature. */
    _6_8 = "6/8",
    /** 7/8 time signature. */
    _7_8 = "7/8",
    /** 9/8 time signature. */
    _9_8 = "9/8",
    /** 12/8 time signature. */
    _12_8 = "12/8"
}

/** @deprecated - Use TimeSignatures enum values or just it's string values. */
export type TimeSignatureString = `${TimeSignatures}`;

/** Beam grouping enum. */
export enum BeamGrouping {
    /** 2-3 beam grouping for 5/8 time signature. */
    _2_3 = "2-3",
    /** 3-2 beam grouping for 5/8 time signature. */
    _3_2 = "3-2",
    /** 2-2-3 beam grouping for 7/8 time signature. */
    _2_2_3 = "2-2-3",
    /** 3-2-2 beam grouping for 7/8 time signature. */
    _3_2_2 = "3-2-2"
}

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
     * @param timeSignature - For example "4/4".
     * @param beamGrouping - Beam grouping (e.g. "3-2" for time signature "5/8").
     */
    constructor(timeSignature: TimeSignatures | `${TimeSignatures}`, beamGrouping?: BeamGrouping | `${BeamGrouping}`);
    /**
     * Create new time signature instance.
     * @param beatCount - Measure beat count.
     * @param beatSize - Size value: whole-note=1, half-note=2, quarter-note=4, etc.
     * @param beamGrouping - Beam grouping (e.g. "3-2" for time signature "5/8").
     */
    constructor(beatCount: number, beatSize: number, beamGrouping?: BeamGrouping | `${BeamGrouping}`);
    constructor(...args: unknown[]) {
        let beamGrouping: BeamGrouping | undefined;

        if (Utils.Is.isEnumValue(args[0], TimeSignatures)) {
            let parts = args[0].split("/");

            this.beatCount = +parts[0];
            this.beatSize = +parts[1];

            if (Utils.Is.isEnumValue(args[1], BeamGrouping)) {
                beamGrouping = args[1];
            }
        }
        else if (Utils.Is.isIntegerGte(args[0], 2) && Utils.Is.isIntegerGte(args[1], 2)) {
            this.beatCount = args[0];
            this.beatSize = args[1];

            if (Utils.Is.isEnumValue(args[2], BeamGrouping)) {
                beamGrouping = args[2];
            }
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

        let { noteLength, ticks } = NoteLengthProps.create(this.beatSize);

        this.beatLength = noteLength;
        this.measureTicks = this.beatCount * ticks;

        if (this.is(2, 4)) {
            this.beamGroupSizes = [[2], [2]];
        }
        else if (this.is(3, 4)) {
            this.beamGroupSizes = [[2], [2], [2]];
        }
        else if (this.is(4, 4)) {
            this.beamGroupSizes = [[2, 2], [2, 2]];
        }
        else if (this.is(3, 8)) {
            this.beamGroupSizes = [[3]];
        }
        else if (this.is(5, 8)) {
            if (!Utils.Is.isUndefined(beamGrouping) && beamGrouping !== BeamGrouping._2_3 && beamGrouping !== BeamGrouping._3_2) {
                throw new MusicError(MusicErrorType.Timesignature, `Invalid beam grouping "${beamGrouping}" for time signature "${this.toString()}".`);
            }
            else {
                this.beamGroupSizes = beamGrouping === BeamGrouping._3_2 ? [[3], [2]] : [[2], [3]];
                beamGrouping = undefined; // Mark as handled.
            }
        }
        else if (this.is(6, 8)) {
            this.beamGroupSizes = [[3], [3]];
        }
        else if (this.is(7, 8)) {
            if (!Utils.Is.isUndefined(beamGrouping) && beamGrouping !== BeamGrouping._2_2_3 && beamGrouping !== BeamGrouping._3_2_2) {
                throw new MusicError(MusicErrorType.Timesignature, `Invalid beam grouping "${beamGrouping}" for time signature "${this.toString()}".`);
            }
            else {
                this.beamGroupSizes = beamGrouping === BeamGrouping._3_2_2 ? [[3], [2], [2]] : [[2], [2], [3]];
                beamGrouping = undefined; // Mark as handled.
            }
        }
        else if (this.is(9, 8)) {
            this.beamGroupSizes = [[3], [3], [3]];
        }
        else if (this.is(12, 8)) {
            this.beamGroupSizes = [[3], [3], [3], [3]];
        }

        if (this.beamGroupSizes.length === 0) {
            throw new MusicError(MusicErrorType.Timesignature, `Unimplemented time signature "${this.toString()}".`);
        }
        else if (beamGrouping !== undefined) {
            throw new MusicError(MusicErrorType.Timesignature, `Invalid beam grouping "${beamGrouping}" for time signature "${this.toString()}".`);
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
