import { Guard, Utils } from "@tspro/ts-utils-lib";
import { colorNameToCode } from "color-name-to-code";
import { isWmsViewHTMLElement } from "../custom-element/wms-view";
import { AssertUtil, warnDeprecated } from "shared-src";

const norm = (s: string) => s.toLowerCase();

/** Color keys.
 * @deprecated All paint stuff is deprecated. Will be removed in future release.
 * ```ts
 * --- Deprecated since v6.4.0-pre.5 ---
 * "*.element.fermata"    => use "*.annotation.temporal"
 * "*.element.annotation" => use "*.annotation.*"
 * "*.element.navigation" => use "*.annotation.navigation"
 * "*.element.label"      => use "*.annotation.label"
 * ```
*/
export type ColorKey =
    "hilight.staffpos" |
    "hilight.object" |
    "play.cursor" |

    "background" |

    "header.title" |
    "header.composer" |
    "header.arranger" |

    "rowgroup.instrument" |
    "rowgroup.frame" |

    "staff.frame" |
    "staff.note" |
    "staff.rest" |
    "staff.lyrics" |
    "staff.connective" |
    "staff.arpeggio" |
    "staff.signature.clef" |
    "staff.signature.key" |
    "staff.signature.time" |
    "staff.signature.tempo" |
    "staff.signature.measurenum" |

    "tab.frame" |
    "tab.note" |
    "tab.rest" |
    "tab.lyrics" |
    "tab.connective" |
    "tab.arpeggio" |
    "tab.tuning" |
    "tab.signature.clef" |
    "tab.signature.key" |
    "tab.signature.time" |
    "tab.signature.tempo" |
    "tab.signature.measurenum" |

    // --- Deprecated since 6.4.0-pre.5 ---
    "staff.element.fermata" |
    "staff.element.annotation" |
    "staff.element.navigation" |
    "staff.element.label" |

    // --- Deprecated since 6.4.0-pre.5 ---
    "tab.element.fermata" |
    "tab.element.annotation" |
    "tab.element.navigation" |
    "tab.element.label" |

    // --- New since 6.4.0-pre.5 ---
    "staff.annotation.navigation" |
    "staff.annotation.dynamics" |
    "staff.annotation.tempo" |
    "staff.annotation.articulation" |
    "staff.annotation.expression" |
    "staff.annotation.technique" |
    "staff.annotation.temporal" |
    "staff.annotation.label" |
    "staff.annotation.ornament" |
    "staff.annotation.misc" |

    // --- New since 6.4.0-pre.5 ---
    "tab.annotation.navigation" |
    "tab.annotation.dynamics" |
    "tab.annotation.tempo" |
    "tab.annotation.articulation" |
    "tab.annotation.expression" |
    "tab.annotation.technique" |
    "tab.annotation.temporal" |
    "tab.annotation.label" |
    "tab.annotation.ornament" |
    "tab.annotation.misc";

/**
 * @deprecated All paint stuff is deprecated. Will be removed in future release.
 * Function to typecheck a valid ColorKey variable.
 * */
export function colorKey(colorKey: ColorKey): ColorKey {
    return colorKey;
}

/**
 * @deprecated All paint stuff is deprecated. Will be removed in future release.
 * Color key parts.
 * */
export type ColorKeyPart =
    "background" |
    "header" | "title" | "composer" | "arranger" |
    "rowgroup" | "instrument" | "frame" |
    "staff" | "tab" |
    "note" | "rest" | "lyrics" | "connective" | "arpeggio" |
    "signature" | "clef" | "key" | "time" | "tempo" | "measurenum" |
    "tuning" |
    "element" | "fermata" | // Deprecated
    "annotation" |
    "navigation" | "dynamics" | "tempo" | "articulation" | "expression" | "technique" | "temporal" | "label" | "ornament" | "misc";

function mapDeprecatedColorKeys(colorKey: ColorKey | ColorKeyPart | ColorKeyPart[]): ColorKey | ColorKeyPart | ColorKeyPart[] {
    let newColorKey = colorKey;

    const colorKeyArr = Guard.isArray(colorKey) ? colorKey : [colorKey];

    const hasExactKeys = (hasKeys: ColorKeyPart[]) => (
        hasKeys.every(key => colorKeyArr.includes(key)) &&
        colorKeyArr.every(key => hasKeys.includes(key as ColorKeyPart))
    );

    if (hasExactKeys(["element"]) || hasExactKeys(["element", "annotation"])) {
        newColorKey = "annotation";
    }
    else if (hasExactKeys(["element", "fermata"])) {
        newColorKey = ["annotation", "temporal"];
    }
    else if (hasExactKeys(["element", "navigation"])) {
        newColorKey = ["annotation", "navigation"];
    }
    else if (hasExactKeys(["element", "label"])) {
        newColorKey = ["annotation", "label"];
    }
    else {
        switch (colorKey) {
            case "staff.element.fermata":
                newColorKey = "staff.annotation.temporal";
                break;
            case "staff.element.annotation":
                newColorKey = ["staff", "annotation"];
                break;
            case "staff.element.navigation":
                newColorKey = "staff.annotation.navigation";
                break;
            case "staff.element.label":
                newColorKey = "staff.annotation.label";
                break;
            case "tab.element.fermata":
                newColorKey = "tab.annotation.temporal";
                break;
            case "tab.element.annotation":
                newColorKey = ["tab", "annotation"];
                break;
            case "tab.element.navigation":
                newColorKey = "tab.annotation.navigation";
                break;
            case "tab.element.label":
                newColorKey = "tab.annotation.label";
                break;
        }
    }

    if (!Utils.Obj.deepEqual(colorKey, newColorKey)) {
        warnDeprecated(`Deprecated ColorKey: ${Utils.Str.stringify(colorKey)}`);
    }

    return newColorKey;
}

/**
 * @deprecated All paint stuff is deprecated. Will be removed in future release.
 * Paint class for coloring music scores.
 */
export class Paint {
    public static readonly default = new Paint();

    public colors: Record<ColorKey, string> = {
        "hilight.staffpos": "#55cc55",
        "hilight.object": "#55cc55",
        "play.cursor": "#44aa44",

        "background": "white",

        "header.title": "black",
        "header.composer": "black",
        "header.arranger": "black",

        "rowgroup.instrument": "black",
        "rowgroup.frame": "black",

        "staff.frame": "black",
        "staff.note": "black",
        "staff.rest": "black",
        "staff.lyrics": "black",
        "staff.connective": "black",
        "staff.arpeggio": "black",
        "staff.signature.clef": "black",
        "staff.signature.key": "black",
        "staff.signature.time": "black",
        "staff.signature.tempo": "black",
        "staff.signature.measurenum": "black",

        "staff.element.fermata": "black",       // Deprecated, mapped to "staff.annotation.?"
        "staff.element.annotation": "black",    // Deprecated, mapped to "staff.annotation.?"
        "staff.element.navigation": "black",    // Deprecated, mapped to "staff.annotation.?"
        "staff.element.label": "black",         // Deprecated, mapped to "staff.annotation.?"

        "staff.annotation.navigation": "black",
        "staff.annotation.dynamics": "black",
        "staff.annotation.tempo": "black",
        "staff.annotation.articulation": "black",
        "staff.annotation.expression": "black",
        "staff.annotation.technique": "black",
        "staff.annotation.temporal": "black",
        "staff.annotation.label": "black",
        "staff.annotation.ornament": "black",
        "staff.annotation.misc": "black",

        "tab.frame": "black",
        "tab.note": "black",
        "tab.rest": "black",
        "tab.lyrics": "black",
        "tab.connective": "black",
        "tab.arpeggio": "black",
        "tab.tuning": "black",
        "tab.signature.clef": "black", // not needed
        "tab.signature.key": "black",  // not needed
        "tab.signature.time": "black",
        "tab.signature.tempo": "black",
        "tab.signature.measurenum": "black",

        "tab.element.fermata": "black",     // Deprecated, mapped to "tab.annotation.?"
        "tab.element.annotation": "black",  // Deprecated, mapped to "tab.annotation.?"
        "tab.element.navigation": "black",  // Deprecated, mapped to "tab.annotation.?"
        "tab.element.label": "black",       // Deprecated, mapped to "tab.annotation.?"

        "tab.annotation.navigation": "black",
        "tab.annotation.dynamics": "black",
        "tab.annotation.tempo": "black",
        "tab.annotation.articulation": "black",
        "tab.annotation.expression": "black",
        "tab.annotation.technique": "black",
        "tab.annotation.temporal": "black",
        "tab.annotation.label": "black",
        "tab.annotation.ornament": "black",
        "tab.annotation.misc": "black",
    }

    /**
     * Set color of any score document element. Use combination of color key parts to set color of specific elements.
     * ```ts
     * setColor("all", "red");                          // Set color of everything except background.
     * setColor("staff", "red");                        // Set color of all staff elements.
     * setColor(["staff", "signature"], "red");         // Set color of all staff signature elements.
     * setColor(["staff", "signature", "key"], "red");  // Set color of staff key signature.
     * setColor(["staff", "signature", "time"], "red"); // Set color of staff time signature.
     * setColor("staff.signature.time", "red");         // Set color of staff time signature.
     * // etc.
     * ```
     * 
     * @param colorKeyOrParts - Color key parts to set color for.
     * @param color - Color (HTML color code e.g. "green", "#AA6644", etc.)
     */
    public setColor(colorKeyOrParts: ColorKey | ColorKeyPart | ColorKeyPart[] | "all", color: string): Paint {
        // Set all element colors
        if (colorKeyOrParts === "all") {
            for (const key of Object.keys(this.colors) as ColorKey[]) {
                if (key !== "background" && key !== "hilight.object" && key !== "hilight.staffpos" && key !== "play.cursor")
                    this.colors[key] = color || "black";
            }
            return this;
        }

        // Map deprecated color keys
        colorKeyOrParts = mapDeprecatedColorKeys(colorKeyOrParts);

        const isBackground = typeof colorKeyOrParts === "string" && norm(colorKeyOrParts) === "background" ||
            Guard.isArray(colorKeyOrParts) && colorKeyOrParts.length === 1 && norm(colorKeyOrParts[0]) === "background";

        const finalColor = color || (isBackground ? "white" : "black");

        // Set background
        if (isBackground) {
            this.colors.background = finalColor;
            return this;
        }

        // Direct key override
        if (typeof colorKeyOrParts === "string" && colorKeyOrParts in this.colors) {
            this.colors[colorKeyOrParts as ColorKey] = finalColor;
            return this;
        }

        const colorKeyParts = Guard.isArray(colorKeyOrParts) ? colorKeyOrParts : colorKeyOrParts.split(".");

        if (colorKeyParts.includes("fermata"))
            warnDeprecated(`Color key "fermata" is deprecated. Will be removed in future release. Use "annotation" instead.`);

        // Set no colors
        if (colorKeyParts.length === 0)
            return this;

        const normalizedParts = colorKeyParts.map(norm);

        let matched = false;

        for (const key of Object.keys(this.colors) as ColorKey[]) {
            const parts = key.split(".").map(norm);

            const match = normalizedParts.every(a => parts.includes(a));

            if (match) {
                this.colors[key] = finalColor;
                matched = true;
            }
        }

        if (!matched) {
            console.error(
                `Color attrs ${Utils.Str.stringify(colorKeyParts)} did not match any color.`
            );
        }

        return this;
    }

    /**
     * Get color.
     * @param colorKeyOrColor - ColorKey or color.
     * @returns - Color value (e.g. "white" or "#FFFFFF").
     */
    getColor(colorKeyOrColor: ColorKey | string): string {
        return this.colors[colorKeyOrColor as ColorKey] ?? colorKeyOrColor;
    }

    /**
     * Get color code.
     * @param colorKeyOrColor - ColorKey or color.
     * @returns - Color code (e.g. "#FFFFFF").
     */
    getColorCode(colorKeyOrColor: ColorKey | string): string {
        return Paint.colorNameToCode(this.getColor(colorKeyOrColor));
    }

    /**
     * Get color RGBA.
     * @param colorKeyOrColor - ColorKey or color.
     * @returns - Color RGBA (e.g. [1, 1, 1, 1]).
     */
    getColorRGBA(colorKeyOrColor: ColorKey | string): [number, number, number, number] {
        return Paint.colorNameToRGBA(this.getColor(colorKeyOrColor));
    }

    /**
     * Convert color name to color code.
     * @param colorName - Color name (e.g. "white").
     * @returns - Color code (e.g. "#FFFFFF")
     */
    static colorNameToCode(colorName: string): string {
        return colorNameToCode(colorName);
    }

    /**
     * Convert color name ro RGBA.
     * @param colorName - Color name (e.g. "white").
     * @param alpha - Alpha value 0..1 (default is 1).
     * @returns - RGBA (e.g. [1, 1, 1, 1]).
     */
    static colorNameToRGBA(colorName: string, alpha = 1): [number, number, number, number] {
        const hex = colorNameToCode(colorName).replace("#", ""); // "FF0000"
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = Math.round(alpha * 255);
        return [r, g, b, a];
    }

    /**
     * Bind this paint to custom HTML element.
     * 
     * @param elem - HTML element id or element.
     * @returns - Boolean whether bind was succesfull.
     */
    bindElement(elem: string | HTMLElement): boolean {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        if (typeof document === "undefined")
            return false;

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsViewHTMLElement(el)) {
            el.paint = this;
            return true;
        }

        return false;
    }

    /**
     * Unbind this paint from custom HTML element.
     * 
     * @param elem - HTML element id or element.
     * @returns - Boolean whether unbind was succesfull.
     */
    unbindElement(elem: string | HTMLElement): boolean {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        if (typeof document === "undefined")
            return false;

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsViewHTMLElement(el)) {
            el.paint = undefined;
            return true;
        }

        return false;
    }
}
