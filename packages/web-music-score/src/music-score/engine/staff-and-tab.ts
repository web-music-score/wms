import { Assert } from "@tspro/ts-utils-lib";
import { Note } from "../../music-theory/note";
import { ImageAsset } from "./renderer";

export enum ClefKind { Treble, Bass }

export class MusicStaff {
    readonly clefImageAsset: ImageAsset;
    readonly topLinePitch: number;
    readonly bottomLinePitch: number;
    readonly octaveLower: boolean;

    constructor(
        readonly clefKind: ClefKind,
        readonly clefLinePitch: number,
        readonly middleLinePitch: number,
        readonly minPitch: number,
        readonly maxPitch: number) {
        this.clefImageAsset = clefKind === ClefKind.Treble ? ImageAsset.TrebleClefPng : ImageAsset.BassClefPng;
        this.topLinePitch = this.middleLinePitch + 4;
        this.bottomLinePitch = this.middleLinePitch - 4;
        this.octaveLower = this.clefLinePitch === Note.getNote("G3").pitch; // Guitar is played octave lower
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

    getPitchSpacing(): number {
        return this.getLineSpacing() / 2;
    }

    containsPitch(pitch: number): boolean {
        Note.validatePitch(pitch);

        return pitch >= this.minPitch && pitch <= this.maxPitch;
    }

    getPitchY(pitch: number): number {
        Assert.assert(this.containsPitch(pitch), "getPitchY: staff does not contain pitch " + pitch);

        return this.bottomLineY + (this.bottomLinePitch - pitch) * this.getPitchSpacing();
    }

    getPitchAt(y: number): number | undefined {
        let pitch = Math.round(this.bottomLinePitch - (y - this.bottomLineY) / this.getPitchSpacing());

        return this.containsPitch(pitch) ? pitch : undefined;
    }

    isPitchLine(pitch: number) {
        return pitch % 2 === this.middleLinePitch % 2;
    }

    isPitchSpace(pitch: number) {
        return pitch % 2 !== this.middleLinePitch % 2;
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