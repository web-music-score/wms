import { Guard, LRUCache } from "@tspro/ts-utils-lib";
import TuningData from "./assets/tunings.json";
import { Note } from "./note";
import { MusicError, MusicErrorType } from "web-music-score/core";

/** Guitar handedness enum. */
export enum Handedness {
    /** Right handed guitar. */
    RightHanded,
    /** Left handed guitar. */
    LeftHanded
}

/** Default guitar handedness (Handedness.RightHanded). */
export const DefaultHandedness = Handedness.RightHanded;

/**
 * Validate if given argument is guitar handedness.
 * @param h - Guitar handedness to validate.
 * @returns - Guitar handedness if valid, else throws.
 */
export function validateHandedness(h: unknown): Handedness {
    if (Guard.isEnumValue(h, Handedness)) {
        return h;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid handedness: ${h}`);
    }
}

/*
 * | string | stringId | freq    | fretboard (RH) | on tab        |
 * |--------|----------|---------|----------------|---------------|
 * |   1    |    0     | highest | bottom string  | top string    |
 * |   6    |    5     | lowest  | top string     | bottom string |
 * |--------|----------|---------|----------------|---------------|
 */

/** Guitar tuning name list. */
export const TuningNameList: ReadonlyArray<string> = TuningData.list.map(data => data.name);

/** DEfault tuning name (Standard). */
export const DefaultTuningName: string = TuningNameList[0];

/**
 * Validate if given argument is available tuning name.
 * @param tuningName - Tuning name to validate.
 * @returns - Tuning name if valid, or throws.
 */
export function validateTuningName(tuningName: string): string {
    if (TuningNameList.indexOf(tuningName) < 0) {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid tuning name: ${tuningName}`);
    }
    else {
        return tuningName;
    }
}

const TuningStringsCache = new LRUCache<string, ReadonlyArray<Note>>(100);

/**
 * Get guitar tuning, note for each open string.
 * @param tuningName - Tuning name.
 * @returns Array of open string notes.
 */
export function getTuningStrings(tuningName: string): ReadonlyArray<Note> {
    let tuningStrings = TuningStringsCache.get(tuningName);

    if (!tuningStrings) {
        let tuningData = TuningData.list.find(data => data.name === tuningName);

        if (!tuningData) {
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid tuningName: ${tuningName}`);
        }

        tuningStrings = tuningData.strings.slice().reverse().map(noteName => Note.getNote(noteName));

        if (!Guard.isIntegerEq(tuningStrings.length, 6)) {
            throw new MusicError(MusicErrorType.Unknown, `Tuning has ${tuningStrings.length} strings.`);
        }

        TuningStringsCache.set(tuningName, tuningStrings);
    }

    return tuningStrings;
}
