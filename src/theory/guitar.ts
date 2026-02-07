import { Assert, LRUCache } from "@tspro/ts-utils-lib";
import TuningData from "./assets/tunings.json";
import { Note } from "./note";
import { InvalidArgError } from "web-music-score/core";
import { getClosestString } from "shared-src";

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

export function validateTuningName(tuningName: string): string {
    if (typeof tuningName !== "string" || TuningNameList.indexOf(tuningName) < 0) {
        throw new InvalidArgError(`Invalid tuning name "${tuningName}".`);
    }
    else {
        return tuningName;
    }
}

/** Currently only hints resolved value in error. */
export function resolveTuningName(tuningName: unknown): string {
    const tuningNameStr = String(tuningName);

    if (TuningNameList.includes(tuningNameStr))
        return tuningNameStr;

    const closest = getClosestString(tuningNameStr, TuningNameList);

    if (closest)
        throw new InvalidArgError(`Invalid tuning name "${tuningName}". Did you mean "${closest}"?`);

    throw new InvalidArgError(`Invalid tuning name "${tuningName}".`);
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
            throw new InvalidArgError(`Invalid tuning name "${tuningName}".`);
        }

        tuningStrings = tuningData.strings.slice().reverse().map(noteName => Note.getNote(noteName));

        Assert.isIntegerEq(tuningStrings.length, 6);

        TuningStringsCache.set(tuningName, tuningStrings);
    }

    return tuningStrings;
}
