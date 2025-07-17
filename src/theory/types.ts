import { Assert, Utils } from "@tspro/ts-utils-lib";

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
    Assert.assertEnum(pn, PitchNotation, "PitchNotation");
    return pn;
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
export function validateGuitarNoteLabel(value: string): GuitarNoteLabel {
    Assert.assertEnum(value, GuitarNoteLabel, "GuitarNoteLabel");
    return value;
}
