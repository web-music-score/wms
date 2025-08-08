import { Note } from "@tspro/web-music-score/theory";
import { ImageAsset } from "./renderer";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Clef, StaffConfig, TabConfig } from "../pub";

export class MusicStaff {
    readonly clefImageAsset: ImageAsset;
    readonly clefLineDiatonicId: number;
    readonly topLineDiatonicId: number;
    readonly middleLineDiatonicId: number;
    readonly bottomLineDiatonicId: number;
    readonly minDiatonicId?: number;
    readonly maxDiatonicId?: number;

    constructor(readonly staffConfig: StaffConfig) {
        const getDiatonicId = (noteName: string, isOctaveDown: boolean) => Note.getNote(noteName).diatonicId - (isOctaveDown ? 7 : 0);

        if (staffConfig.clef === Clef.G) {
            this.clefImageAsset = ImageAsset.TrebleClefPng;
            this.clefLineDiatonicId = getDiatonicId("G4", staffConfig.isOctaveDown === true);
            this.middleLineDiatonicId = this.clefLineDiatonicId + 2;
        }
        else {
            this.clefImageAsset = ImageAsset.BassClefPng;
            this.clefLineDiatonicId = getDiatonicId("F3", staffConfig.isOctaveDown === true);
            this.middleLineDiatonicId = this.clefLineDiatonicId - 2;
        }

        this.topLineDiatonicId = this.middleLineDiatonicId + 4;
        this.bottomLineDiatonicId = this.middleLineDiatonicId - 4;

        this.minDiatonicId = staffConfig.minNote !== undefined ? Math.min(getDiatonicId(staffConfig.minNote, false), this.bottomLineDiatonicId) : undefined;
        this.maxDiatonicId = staffConfig.maxNote !== undefined ? Math.max(getDiatonicId(staffConfig.maxNote, false), this.topLineDiatonicId) : undefined;
    }

    topLineY: number = 0;
    bottomLineY: number = 0;

    get middleLineY(): number {
        return (this.topLineY + this.bottomLineY) / 2;
    }

    get octaveLower(): boolean {
        return this.staffConfig.isOctaveDown === true;
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

        return (this.minDiatonicId === undefined || diatonicId >= this.minDiatonicId) &&
            (this.maxDiatonicId === undefined || diatonicId <= this.maxDiatonicId);
    }

    getDiatonicIdY(diatonicId: number): number {
        if (!this.containsDiatonicId(diatonicId)) {
            throw new MusicError(MusicErrorType.Score, "Staff does not contain diatonicId " + diatonicId);
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

    constructor(readonly tabConfig: TabConfig) { }

    /** Return Y coordinate of string. */
    getStringY(stringId: number): number {
        return this.top + (this.bottom - this.top) / 6 * (stringId + 0.5);
    }

    offset(dx: number, dy: number) {
        this.top += dy;
        this.bottom += dy;
    }
}