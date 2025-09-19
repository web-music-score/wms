import { Utils } from "@tspro/ts-utils-lib";
import { NoteLength, NoteLengthProps } from "./rhythm";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export type TimeSignatureString = "2/4" | "3/4" | "4/4" | "6/8" | "9/8";

export class TimeSignature {
    readonly beatCount: number;
    readonly beatSize: number;

    /** Lengths in ticks */
    readonly beatLength: NoteLength;
    readonly measureTicks: number;

    readonly beamGroupCount: number;
    readonly beamGroupLength: number;

    /**
     * @param str - For example "4/4".
     */
    constructor(str: TimeSignatureString);
    /**
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

        if (this.is(2, 4) || this.is(3, 4) || this.is(4, 4)) {
            this.beamGroupCount = this.beatCount;
        }
        else if (this.is(6, 8) || this.is(9, 8)) {
            this.beamGroupCount = this.beatCount / 3;
        }
        else {
            console.warn("Not necessarily an error, but unsupported time signature: " + this.toString());
            this.beamGroupCount = 1;
        }

        this.beamGroupLength = this.measureTicks / this.beamGroupCount;

        if (!Utils.Is.isIntegerGte(this.beamGroupLength, 1)) {
            throw new MusicError(MusicErrorType.Timesignature, `Invalid beamGroupLength: ${this.beamGroupLength}`);
        }
    }

    is(beatCount: number, beatSize: number) {
        return this.beatCount === beatCount && this.beatSize === beatSize;
    }

    toString() {
        return this.beatCount + "/" + this.beatSize;
    }
}

let defaultTimeSignature: TimeSignature | undefined;

export function getDefaultTimeSignature(): TimeSignature {
    if (!defaultTimeSignature) {
        defaultTimeSignature = new TimeSignature(4, 4);
    }
    return defaultTimeSignature;
}
