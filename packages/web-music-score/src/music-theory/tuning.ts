import { Assert, LRUCache } from "@tspro/ts-utils-lib";
import TuningData from "./assets/tunings.json";
import { Note } from "./note";

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
    if (TuningNameList.indexOf(tuningName) >= 0) {
        return tuningName;
    }
    else {
        return Assert.interrupt("Invalid tuning name: " + tuningName);
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
        let tuningData = Assert.require(TuningData.list.find(data => data.name === tuningName), "Invalid tuning name: " + tuningName);

        tuningStrings = tuningData.strings.slice().reverse().map(noteName => Note.getNote(noteName));
        Assert.int_eq(tuningStrings.length, 6, "Tuning should have 6 strings but has " + tuningStrings.length + " strings.");

        TuningStringsCache.set(tuningName, tuningStrings);

    }

    return tuningStrings;
}
