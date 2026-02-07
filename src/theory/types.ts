import { Guard, Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "web-music-score/core";

class InvalidArgError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.InvalidArg, message);
    }
}

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
 * @deprecated Not required by this library, will be removed in future release.
 */
export function validatePitchNotation(pn: unknown): PitchNotation {
    if (Guard.isEnumValue(pn, PitchNotation)) {
        return pn;
    }
    else {
        throw new InvalidArgError(`Invalid pitch notation "${pn}".`);
    }
}

/**
 * Get name of given pitch notation.
 * @param pn - Pitch notation.
 * @returns - Name of given pitch notation.
 */
export function getPitchNotationName(pn: PitchNotation): string {
    return PitchNotation[pn];
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
 * @deprecated Not required by this library, will be removed in future release.
 */
export function validateGuitarNoteLabel(label: unknown): GuitarNoteLabel {
    if (Guard.isEnumValue(label, GuitarNoteLabel)) {
        return label;
    }
    else {
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid guitarNoteLabel: ${label}`);
    }
}
