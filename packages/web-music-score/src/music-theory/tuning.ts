import { Assert } from "@tspro/ts-utils-lib";
import TuningData from "./assets/tunings.json";
import { Note } from "./note";

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

/**
 * @public
 * @returns Array of open string notes, note for each string.
 */
export function getTuningStrings(tuningName: string): ReadonlyArray<Note> {
    let tuningData = Assert.require(TuningData.list.find(data => data.name === tuningName), "Invalid tuning name: " + tuningName);
    return tuningData.strings.slice().reverse().map(noteName => Note.getNote(noteName));
}