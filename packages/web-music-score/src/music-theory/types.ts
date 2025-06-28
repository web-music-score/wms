import { Assert, Utils } from "@tspro/ts-utils-lib";

export enum SymbolSet { Ascii, Unicode }

export enum PitchNotation {
    Scientific = "Scientific",
    Helmholtz = "Helmholtz"
}

export const PitchNotationList = Utils.Enum.getEnumValues(PitchNotation);
export const DefaultPitchNotation = PitchNotation.Scientific;

export function validatePitchNotation(pn: string): PitchNotation {
    if (pn === PitchNotation.Scientific || pn === PitchNotation.Helmholtz) {
        return pn;
    }
    else {
        return Assert.interrupt("Invalid PitchNotation: " + pn);
    }
}

export enum GuitarNoteLabel {
    Default = "Default",
    OmitOctave = "Omit Octave",
    Interval = "Interval"
}

export const DefaultGuitarNoteLabel = GuitarNoteLabel.Default;
export const GuitarNoteLabelList = Utils.Enum.getEnumValues(GuitarNoteLabel);

export function validateGuitarNoteLabel(kind: string): GuitarNoteLabel {
    if (kind === GuitarNoteLabel.Default || kind === GuitarNoteLabel.Interval) {
        return kind;
    }
    else {
        Assert.interrupt("Invalid GuitarNoteLabel: " + kind);
    }
}
