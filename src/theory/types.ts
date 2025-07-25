import { Utils } from "@tspro/ts-utils-lib";
import { MusicError } from "@tspro/web-music-score/core";

function throwMiscError(msg: string): never {
    throw new MusicError("Misc Error: " + msg);
}

/** @public */
export enum SymbolSet { Ascii, Unicode }

/** @public */
export enum PitchNotation {
    Scientific = "Scientific",
    Helmholtz = "Helmholtz"
}

/** @public */
export const PitchNotationList = Utils.Enum.getEnumValues(PitchNotation);

/** @public */
export const DefaultPitchNotation = PitchNotation.Scientific;

/** @public */
export function validatePitchNotation(pn: string): PitchNotation {
    if (!Utils.Is.isEnumValue(pn, PitchNotation)) {
        throwMiscError("Invalid pitchNotation: " + pn);
    }
    else {
        return pn;
    }
}

/** @public */
export enum GuitarNoteLabel {
    Default = "Default",
    OmitOctave = "Omit Octave",
    Interval = "Interval"
}

/** @public */
export const DefaultGuitarNoteLabel = GuitarNoteLabel.Default;

/** @public */
export const GuitarNoteLabelList = Utils.Enum.getEnumValues(GuitarNoteLabel);

/** @public */
export function validateGuitarNoteLabel(label: string): GuitarNoteLabel {
    if (!Utils.Is.isEnumValue(label, GuitarNoteLabel)) {
        throwMiscError("Invalid guitarNoteLabel: " + label);
    }
    else {
        return label;
    }
}
