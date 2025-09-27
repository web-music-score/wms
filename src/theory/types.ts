import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

/** Symbol set enum. */
export enum SymbolSet {
    /** Ascii symbols. */
    Ascii,
    /** Unicode symbols. */
    Unicode
}

/** Pitch notation enum. */
export enum PitchNotation {
    /** Scientific pitch notation (e.g. "C4"). */
    Scientific,
    /** Helmholz pitch notation (the older system often used in Europe, e.g. "c′"). */
    Helmholtz
}

/** Array of available pitch notations. */
export const PitchNotationList: ReadonlyArray<PitchNotation> = Utils.Enum.getEnumValues(PitchNotation);

/** Default pitch notation (PitchNotation.Scientific). */
export const DefaultPitchNotation = PitchNotation.Scientific;

/**
 * Validate pitch notation of unknown value.
 * @param pn - Pitch notation value to validate.
 * @returns - Valid pitch notation or throws.
 */
export function validatePitchNotation(pn: unknown): PitchNotation {
    if (Utils.Is.isEnumValue(pn, PitchNotation)) {
        return pn;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid pitchNotation: ${pn}`);
    }
}

/**
 * Get name of given pitch notation.
 * @param pn - Pitch notation.
 * @returns - Name of given pitch notation.
 */
export function getPitchNotationName(pn: PitchNotation) {
    return PitchNotation[validatePitchNotation(pn)];
}

/** Guitar note label enum. */
export enum GuitarNoteLabel {
    /** Default (e.g. "C4"). */
    Default = "Default",
    /** Omit octave (e.g. "C"). */
    OmitOctave = "Omit Octave",
    /** Interval (e.g. "R" for root note). */
    Interval = "Interval"
}

/** Default guitar note label (GuitarNoteLabel.Default). */
export const DefaultGuitarNoteLabel = GuitarNoteLabel.Default;

/** Array of available guitar note labels. */
export const GuitarNoteLabelList: ReadonlyArray<GuitarNoteLabel> = Utils.Enum.getEnumValues(GuitarNoteLabel);

/**
 * Validate guitar note label of unknown value.
 * @param label - Guitar note label value to validate.
 * @returns - Valid guitar note label or throws.
 */
export function validateGuitarNoteLabel(label: unknown): GuitarNoteLabel {
    if (Utils.Is.isEnumValue(label, GuitarNoteLabel)) {
        return label;
    }
    else {
        throw new MusicError(MusicErrorType.Timesignature, `Invalid guitarNoteLabel: ${label}`);
    }
}
