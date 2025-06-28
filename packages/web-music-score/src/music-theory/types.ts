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
    if (pn === PitchNotation.Scientific || pn === PitchNotation.Helmholtz) {
        return pn;
    }
    else {
        return Assert.interrupt("Invalid PitchNotation: " + pn);
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
export function validateGuitarNoteLabel(kind: string): GuitarNoteLabel {
    if (kind === GuitarNoteLabel.Default || kind === GuitarNoteLabel.Interval) {
        return kind;
    }
    else {
        Assert.interrupt("Invalid GuitarNoteLabel: " + kind);
    }
}
