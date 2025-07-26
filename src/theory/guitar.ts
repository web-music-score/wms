import { Utils, LRUCache } from "@tspro/ts-utils-lib";
import TuningData from "./assets/tunings.json";
import { Note } from "./note";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

/** @public */
export enum Handedness { RightHanded, LeftHanded }

/** @public */
export const DefaultHandedness = Handedness.RightHanded;

/** @public */
export function validateHandedness(h: unknown): Handedness {
    if (!Utils.Is.isEnumValue(h, Handedness)) {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid handedness: ${h}`);
    }
    else {
        return h;
    }
}

/*
 * | string | stringId | freq    | fretboard (RH) | on tab        |
 * |--------|----------|---------|----------------|---------------|
 * |   1    |    0     | highest | bottom string  | top string    |
 * |   6    |    5     | lowest  | top string     | bottom string |
 * |--------|----------|---------|----------------|---------------|
 */

/** @public */
export const TuningNameList: ReadonlyArray<string> = TuningData.list.map(data => data.name);

/** @public */
export const DefaultTuningName = TuningNameList[0];

/** @public */
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
 * @public
 * @returns Array of open string notes, note for each string.
 */
export function getTuningStrings(tuningName: string): ReadonlyArray<Note> {
    let tuningStrings = TuningStringsCache.get(tuningName);

    if (!tuningStrings) {
        let tuningData = TuningData.list.find(data => data.name === tuningName);

        if (!tuningData) {
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid tuningName: ${tuningName}`);
        }

        tuningStrings = tuningData.strings.slice().reverse().map(noteName => Note.getNote(noteName));

        if (!Utils.Is.isIntegerEq(tuningStrings.length, 6)) {
            throw new MusicError(MusicErrorType.Unknown, `Tuning has ${tuningStrings.length} strings.`);
        }

        TuningStringsCache.set(tuningName, tuningStrings);
    }

    return tuningStrings;
}
