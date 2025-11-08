import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "core/error";
import { DocumentColor } from "score/engine/settings";

export type ColorAttr =
    "background" |
    "header" | "title" | "composer" | "arranger" |
    "rowgroup" | "instrument" | "frame" |
    "element" | "fermata" | "annotation" | "navigation" | "label" |
    "exrtension" |
    "staff" | "tab" |
    "frame" | "note" | "rest" | "connective" |
    "signature" | "clef" | "key" | "time" | "tempo" | "measure" |
    "tuning";

function eq(a: string, b: string) {
    return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

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
        throw new MusicError(MusicErrorType.InvalidArg, `Color attrs ${Utils.Str.stringify(colorAttrs)} did not match any color.`);
}

setColor("purple", "rowgroup");