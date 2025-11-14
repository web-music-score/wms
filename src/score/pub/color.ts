import { Utils } from "@tspro/ts-utils-lib";
import { DocumentColor } from "score/engine/settings";

function eq(a: string, b: string) {
    return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

/**
 * Color attributes.
 * ```
 * Attribute hierarchy is:
 *  + background
 *  + header
 *      + title
 *      + composer
 *      + arranger
 *  + rowgroup
 *      + instrument
 *      + frame
 *  + staff|tab
 *      + frame
 *      + note
 *      + rest
 *      + connective
 *      + signature
 *          + clef (staff only)
 *          + key (staff only)
 *          + time
 *          + tempo
 *          + measurenum
 *      + tuning (tab only)
 *      + element
 *          + fermata
 *          + annotation
 *          + navigation
 *          + label
 * ```
 */
export type ColorAttr =
    "background" |
    "header" | "title" | "composer" | "arranger" |
    "rowgroup" | "instrument" | "frame" |
    "staff" | "tab" |
    "frame" | "note" | "rest" | "connective" |
    "signature" | "clef" | "key" | "time" | "tempo" | "measurenum" |
    "tuning" |
    "element" | "fermata" | "annotation" | "navigation" | "label";

/**
 * Set color of any score document element. Use combination of color attributes to set color of specific elements.
 * ```ts
 * setColor("red", "staff");                        // Set color of all staff elements to red.
 * setColor("red", "staff", "signature");           // Set color of all signature elements of staff to red.
 * setColor("red", "staff", "key", "signature");    // Set color of key signature of staff to red.
 * setColor("green", "staff", "time", "signature"); // Set color of time signature of staff to green.
 * // etc.
 * ```
 * See {@link ColorAttr} for attribute hierarchy tree.
 * 
 * @param color - Color (HTML color code e.g. "green", "#AA6644", etc.)
 * @param colorAttrs - Any number of color attributes.
 */
export function setColor(color: string, ...colorAttrs: ColorAttr[]) {
    const setBacground = colorAttrs.length === 1 && eq(colorAttrs[0], "background");
    const setAllColors = colorAttrs.length === 0;

    if (eq(color, ""))
        color = setBacground ? "white" : "black";

    let noMatch = true;

    for (const key in DocumentColor) {
        const keyAttrs = key.split("_");

        const isColorMatch = colorAttrs.length > 0 && colorAttrs.every(a => keyAttrs.some(b => eq(a, b)));
        const isBgColorMatch = keyAttrs.length === 1 && eq(keyAttrs[0], "background");

        if (setAllColors && !isBgColorMatch || isColorMatch) {
            (DocumentColor as Record<string, string>)[key] = color;
            noMatch = false;
        }
    }

    if (noMatch)
        console.error(`Color attrs ${Utils.Str.stringify(colorAttrs)} did not match any color.`);
}
