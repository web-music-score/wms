import { Guard, Utils, ValueSet } from "@tspro/ts-utils-lib";
import { colorNameToCode } from "color-name-to-code";
import { isWmsView } from "../custom-element/wms-view";
import { MusicError, MusicErrorType } from "web-music-score/core";
import { AssertUtil, warnDeprecated } from "shared-src";

const norm = (s: string) => s.toLowerCase();

/** Color keys. */
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
    "staff.element.fermata" |       // deprecated, belongs to "annotation"
    "staff.element.annotation" |
    "staff.element.navigation" |
    "staff.element.label" |

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
    "tab.element.fermata" |         // deprecated, belongs to "annotation"
    "tab.element.annotation" |
    "tab.element.navigation" |
    "tab.element.label";

/** Function to typecheck a valid ColorKey variable. */
export function colorKey(colorKey: ColorKey): ColorKey {
    return colorKey;
}

/** Color key parts. */
export type ColorKeyPart =
    "background" |
    "header" | "title" | "composer" | "arranger" |
    "rowgroup" | "instrument" | "frame" |
    "staff" | "tab" |
    "note" | "rest" | "lyrics" | "connective" | "arpeggio" |
    "signature" | "clef" | "key" | "time" | "tempo" | "measurenum" |
    "tuning" |
    "element" | "fermata" | "annotation" | "navigation" | "label";

/**
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
        "staff.element.fermata": "black",
        "staff.element.annotation": "black",
        "staff.element.navigation": "black",
        "staff.element.label": "black",

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
        "tab.element.fermata": "black",
        "tab.element.annotation": "black",
        "tab.element.navigation": "black",
        "tab.element.label": "black",
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

        // Set no colors
        if (colorKeyParts.length === 0)
            return this;

        if (colorKeyParts.includes("fermata"))
            warnDeprecated("Color key 'fermata' is deprecated, it belongs to 'annotation'.");

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

    private boundElements = new ValueSet<HTMLElement>();

    /**
     * Bind this paint to custom HTML element.
     * @param elem - HTML element id or element.
     */
    bindElement(elem: string | HTMLElement) {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        if (typeof document === "undefined")
            return;

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsView(el)) {
            el.addEventListener("disconnected", () => this.boundElements.delete(el));
            el.paint = this;
        }
        else
            throw new MusicError(MusicErrorType.Score, "Bind element must be <wms-music-score-view>!");
    }

    /**
     * Unbind this paint from custom HTML element.
     * @param elem - HTML element id or element.
     */
    unbindElement(elem: string | HTMLElement) {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        if (typeof document === "undefined")
            return;

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsView(el)) {
            el.paint = undefined;
            this.boundElements.delete(el);
        }
        else
            throw new MusicError(MusicErrorType.Score, "Unbind element must be <wms-music-score-view>!");
    }
}
