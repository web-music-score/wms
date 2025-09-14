import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export enum SymbolSet { Ascii, Unicode }

export enum PitchNotation { Scientific, Helmholtz }

export const PitchNotationList = Utils.Enum.getEnumValues(PitchNotation);

export const DefaultPitchNotation = PitchNotation.Scientific;

export function validatePitchNotation(pn: unknown): PitchNotation {
    if (Utils.Is.isEnumValue(pn, PitchNotation)) {
        return pn;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid pitchNotation: ${pn}`);
    }
}

export function getPitchNotationName(pn: PitchNotation) {
    return PitchNotation[validatePitchNotation(pn)];
}

export enum GuitarNoteLabel {
    Default = "Default",
    OmitOctave = "Omit Octave",
    Interval = "Interval"
}

export const DefaultGuitarNoteLabel = GuitarNoteLabel.Default;

export const GuitarNoteLabelList = Utils.Enum.getEnumValues(GuitarNoteLabel);

export function validateGuitarNoteLabel(label: string): GuitarNoteLabel {
    if (Utils.Is.isEnumValue(label, GuitarNoteLabel)) {
        return label;
    }
    else {
        throw new MusicError(MusicErrorType.Timesignature, `Invalid guitarNoteLabel: ${label}`);
    }
}
