import { Assert } from "@tspro/ts-utils-lib";
import { RhythmProps, NoteLength } from "./rhythm";

/** @public */
export type TimeSignatureString = "2/4" | "3/4" | "4/4" | "6/8" | "9/8";

/** @public */
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
            let i = Assert.int_gte(args[0].indexOf("/"), 0, "Invalid TimeSignatureString: " + args[0]);
            this.beatCount = Number(args[0].substring(0, i));
            this.beatSize = Number(args[0].substring(i + 1));
        }
        else if (args.length === 2 && typeof args[0] === "number" && typeof args[1] === "number") {
            this.beatCount = args[0];
            this.beatSize = args[1];
        }
        else {
            Assert.interrupt("Invalid TimeSignature args: " + args);
        }

        Assert.int_gte(this.beatCount, 1, "TimeSignature: Invalid beatCount " + this.beatCount);
        Assert.int_gte(this.beatSize, 1, "TimeSignature: Invalid beatSize " + this.beatCount);

        let beatLengthValue = RhythmProps.createFromNoteSize(this.beatSize);

        this.beatLength = beatLengthValue.noteLength;
        this.measureTicks = this.beatCount * beatLengthValue.ticks;

        if (this.is(2, 4) || this.is(3, 4) || this.is(4, 4)) {
            this.beamGroupCount = this.beatCount;
        }
        else if (this.is(6, 8) || this.is(9, 8)) {
            this.beamGroupCount = this.beatCount / 3;
        }
        else {
            console.warn("Unhandled time signature " + this.toString());
            console.warn("Setting beamGroupCount to 1");
            this.beamGroupCount = 1;
        }

        this.beamGroupLength = this.measureTicks / this.beamGroupCount;

        Assert.int_gte(this.beamGroupLength, 1, "Invalid beamGroupLength value " + this.beamGroupLength);
    }

    is(beatCount: number, beatSize: number) {
        return this.beatCount === beatCount && this.beatSize === beatSize;
    }

    toString() {
        return this.beatCount + "/" + this.beatSize;
    }
}

let defaultTimeSignature: TimeSignature | undefined;

/** @public */
export function getDefaultTimeSignature(): TimeSignature {
    if (!defaultTimeSignature) {
        defaultTimeSignature = new TimeSignature(4, 4);
    }
    return defaultTimeSignature;
}
