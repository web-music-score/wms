import { Note } from "@tspro/web-music-score/theory";
import { ImageAsset } from "./renderer";
import { throwScoreError } from "./misc";

export enum Clef { Treble, Bass }

export class MusicStaff {
    readonly clefImageAsset: ImageAsset;
    readonly topLineDiatonicId: number;
    readonly bottomLineDiatonicId: number;
    readonly octaveLower: boolean;

    constructor(
        readonly clef: Clef,
        readonly clefLineDiatonicId: number,
        readonly middleLineDiatonicId: number,
        readonly minDiatonicId: number,
        readonly maxDiatonicId: number) {
        this.clefImageAsset = clef === Clef.Treble ? ImageAsset.TrebleClefPng : ImageAsset.BassClefPng;
        this.topLineDiatonicId = this.middleLineDiatonicId + 4;
        this.bottomLineDiatonicId = this.middleLineDiatonicId - 4;
        this.octaveLower = this.clefLineDiatonicId === Note.getNote("G3").diatonicId; // Guitar is played octave lower
    }

    topLineY: number = 0;
    bottomLineY: number = 0;

    get middleLineY(): number {
        return (this.topLineY + this.bottomLineY) / 2;
    }

    offset(dx: number, dy: number) {
        this.topLineY += dy;
        this.bottomLineY += dy;
    }

    getLineSpacing(): number {
        return (this.bottomLineY - this.topLineY) / 4;
    }

    getDiatonicSpacing(): number {
        return this.getLineSpacing() / 2;
    }

    containsDiatonicId(diatonicId: number): boolean {
        Note.validateDiatonicId(diatonicId);

        return diatonicId >= this.minDiatonicId && diatonicId <= this.maxDiatonicId;
    }

    getDiatonicIdY(diatonicId: number): number {
        if (!this.containsDiatonicId(diatonicId)) {
            throwScoreError("Staff does not contain diatonicId " + diatonicId);
        }
        else {
            return this.bottomLineY + (this.bottomLineDiatonicId - diatonicId) * this.getDiatonicSpacing();
        }
    }

    getDiatonicIdAt(y: number): number | undefined {
        let diatonicId = Math.round(this.bottomLineDiatonicId - (y - this.bottomLineY) / this.getDiatonicSpacing());

        return this.containsDiatonicId(diatonicId) ? diatonicId : undefined;
    }

    isLine(diatonicId: number) {
        return diatonicId % 2 === this.middleLineDiatonicId % 2;
    }

    isSpace(diatonicId: number) {
        return diatonicId % 2 !== this.middleLineDiatonicId % 2;
    }
}

export class GuitarTab {
    top: number = 0;
    bottom: number = 0;

    /** Return Y coordinate of string. */
    getStringY(stringId: number): number {
        return this.top + (this.bottom - this.top) / 6 * (stringId + 0.5);
    }

    offset(dx: number, dy: number) {
        this.top += dy;
        this.bottom += dy;
    }
}