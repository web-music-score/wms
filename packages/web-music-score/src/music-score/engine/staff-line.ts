import { Note } from "../../music-theory/note";
import { ImageAsset } from "../engine/renderer";

export enum ClefKind { Treble, Bass }

export class StaffLine {
    readonly clefImageAsset: ImageAsset;
    readonly topLinePitch: number;
    readonly bottomLinePitch: number;
    readonly octaveLower: boolean;

    constructor(
        readonly clefKind: ClefKind,
        readonly clefLinePitch: number,
        readonly middleLinePitch: number,
        readonly middleLineOffset: number,
        readonly minPitch: number,
        readonly maxPitch: number) {
        this.clefImageAsset = clefKind === ClefKind.Treble ? ImageAsset.TrebleClefPng : ImageAsset.BassClefPng;
        this.topLinePitch = this.middleLinePitch + 4;
        this.bottomLinePitch = this.middleLinePitch - 4;
        this.octaveLower = this.clefLinePitch === Note.getNote("G3").pitch; // Guitar is played octave lower
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