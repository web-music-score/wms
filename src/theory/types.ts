import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

/** @public */
export enum SymbolSet { Ascii, Unicode }

/** @public */
export enum PitchNotation { Scientific, Helmholtz }

/** @public */
export const PitchNotationList = Utils.Enum.getEnumValues(PitchNotation);

/** @public */
export const DefaultPitchNotation = PitchNotation.Scientific;

/** @public */
export function validatePitchNotation(pn: unknown): PitchNotation {
    if (!Utils.Is.isEnumValue(pn, PitchNotation)) {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid pitchNotation: ${pn}`);
    }
    else {
        return pn;
    }
}

/** @public */
export function getPitchNotationName(pn: PitchNotation) {
    return PitchNotation[validatePitchNotation(pn)];
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
        throw new MusicError(MusicErrorType.Timesignature, `Invalid guitarNoteLabel: ${label}`);
    }
    else {
        return label;
    }
}
