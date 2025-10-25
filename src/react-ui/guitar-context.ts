import { GuitarNoteLabel, Handedness, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { getTuningStrings, Note, Scale } from "@tspro/web-music-score/theory";
import GuitarData from "./assets/guitar.json";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Guard } from "@tspro/ts-utils-lib";

const DefaultColors = {
    ScaleNoteColor: "#0A0",
    ScaleRootNoteColor: "#00A",
    NonScaleNoteColor: "#A00",
    DefaultBorderColor: "white",
    TextColor: "white",
}

/** Fret position props. */
export class FretPosition {
    /** Note of this fret position. */
    readonly note: Note;
    /** Is note of this fret position a scale note? */
    readonly isScaleNote: boolean;
    /** Is note of this fret position a scale root note? */
    readonly isScaleRootNote: boolean;

    /** Is note circle/text of this fret position visible? */
    isVisible: boolean = false;
    /** Text (e.g. note name) of this fret position. */
    text: string = "";
    /** Text color. */
    textColor: string = DefaultColors.TextColor;
    /** Fill color of note circle. */
    fillColor: string | undefined;
    /** Border color of note circle. */
    borderColor: string | undefined;
    /** Is barre? (Reserved for future) */
    isBarre: boolean = false;

    /**
     * Create new fret position object instance.
     * @param guitarCtx - Guitar context.
     * @param stringId - String index in range [0, 5].
     * @param fretId - Fret index, 0 = open string fret position.
     * @param chromaticId - Chromatic id.
     */
    constructor(readonly guitarCtx: GuitarContext, readonly stringId: number, readonly fretId: number, readonly chromaticId: number) {
        let { scale } = guitarCtx;

        this.note = scale.getPreferredChromaticNote(chromaticId);
        this.isScaleNote = scale.isScaleNote(this.note);
        this.isScaleRootNote = scale.isScaleRootNote(this.note);
    }

    /** Chromatic class getter. */
    get chromaticClass() {
        return Note.getChromaticClass(this.chromaticId);
    }

    /** Show note circle/text of this fret position. */
    show() {
        this.isVisible = true;
    }

    /** Hide note circle/text of this fret position. */
    hide() {
        this.isVisible = false;
    }

    /** Set default note name. */
    setDefaultText() {
        let { pitchNotation, scale, guitarNoteLabel } = this.guitarCtx;

        switch (guitarNoteLabel) {
            case GuitarNoteLabel.OmitOctave:
                this.text = this.note.formatOmitOctave(SymbolSet.Unicode);
                break;
            case GuitarNoteLabel.Interval:
                this.text = scale.getIntervalFromRootNote(this.note).toAbbrString().replace("P1", "R");
                break;
            default:
                this.text = this.note.format(pitchNotation, SymbolSet.Unicode);
                break;
        }
    }

    /** Set default fill color of note circle. */
    setDefaultFillColor() {
        this.fillColor = this.isScaleRootNote
            ? DefaultColors.ScaleRootNoteColor
            : this.isScaleNote
                ? DefaultColors.ScaleNoteColor
                : DefaultColors.NonScaleNoteColor;
    }

    /** Set default border color of note circle. */
    setDefaultBorderColor(showBorder = false) {
        this.borderColor = showBorder ? DefaultColors.DefaultBorderColor : undefined;
    }
}

/** Guitar context class. */
export class GuitarContext {
    /** Maximum fret index value. */
    readonly maxFretId: number;

    private readonly fretPositionTable: Readonly<FretPosition>[][];
    private readonly tuningStrings: ReadonlyArray<Note>;

    /**
     * Create new guitar context object instance.
     * @param tuningName - Tuning name (e.g. "Standard").
     * @param scale - Scale.
     * @param handedness - Handedness.
     * @param pitchNotation - Pitch notation.
     * @param guitarNoteLabel - Guitar note label type.
     */
    constructor(readonly tuningName: string, readonly scale: Scale, readonly handedness: Handedness, readonly pitchNotation: PitchNotation, readonly guitarNoteLabel: GuitarNoteLabel) {
        // Nut = fret0, FretCount = maxFret + 1
        this.maxFretId = GuitarData.maxFret;

        this.tuningStrings = getTuningStrings(tuningName);

        this.fretPositionTable = [[], [], [], [], [], []];

        for (let stringId = 0; stringId < 6; stringId++) {
            let openStringChromaticId = this.tuningStrings[stringId].chromaticId;

            for (let fretId = 0; fretId <= this.maxFretId; fretId++) {
                let chromaticId = openStringChromaticId + fretId;
                this.fretPositionTable[stringId][fretId] = new FretPosition(this, stringId, fretId, chromaticId);
            }
        }
    }

    /**
     * Get fret position object.
     * @param stringId - String index in range [0,5].
     * @param fretId - Fret index, 0 = open string fret position.
     * @returns - Fret position object.
     */
    getFretPosition(stringId: number, fretId: number): Readonly<FretPosition> {
        if (!Guard.isInteger(stringId) || stringId < 0 || stringId > 5) {
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid stringId: + ${stringId}`);
        }
        else if (!Guard.isInteger(fretId) || fretId < 0 || fretId > this.maxFretId) {
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid fretId: ${fretId}`);
        }
        else {
            return this.fretPositionTable[stringId][fretId];
        }
    }

    /**
     * Get tuning value (Note) of given string.
     * @param stringId - STring index in range [0, 5].
     * @returns - Note of given string played unfretted.
     */
    getStringTuning(stringId: number): Note {
        return this.tuningStrings[stringId];
    }

    /**
     * Get tuning overview (e.g. "E2 - A2 - D3 - G3 - B3 - E4").
     * @returns - Tuning overview string.
     */
    getTuningOverview() {
        return this.tuningStrings.slice().reverse().map(note => note.format(this.pitchNotation, SymbolSet.Unicode)).join(" - ");
    }

    /**
     * Create copy of this guitar context with new tuning name.
     * @param tuningName - New tuning name.
     * @returns - Guitar context.
     */
    alterTuningName(tuningName: string): GuitarContext {
        return tuningName === this.tuningName
            ? this
            : new GuitarContext(tuningName, this.scale, this.handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    /**
     * Create copy of this guitar context with new scale.
     * @param scale - New scale.
     * @returns - Guitar context.
     */
    alterScale(scale: Scale): GuitarContext {
        return Scale.equals(scale, this.scale)
            ? this
            : new GuitarContext(this.tuningName, scale, this.handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    /**
     * Create copy of this guitar context with handedness.
     * @param handedness - New handedness.
     * @returns - Guitar context.
     */
    alterHandedness(handedness: Handedness): GuitarContext {
        return handedness === this.handedness
            ? this
            : new GuitarContext(this.tuningName, this.scale, handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    /**
     * Create copy of this guitar context with new pitch notation.
     * @param pitchNotation - New pitch notation.
     * @returns - Guitar context.
     */
    alterPitchNotation(pitchNotation: PitchNotation): GuitarContext {
        return pitchNotation === this.pitchNotation
            ? this
            : new GuitarContext(this.tuningName, this.scale, this.handedness, pitchNotation, this.guitarNoteLabel);

    }

    /**
     * Create copy of this guitar context with new guitar note label type.
     * @param guitarNoteLabel - New guitar note label type.
     * @returns - Guitar context.
     */
    alterGuitarNoteLabel(guitarNoteLabel: GuitarNoteLabel): GuitarContext {
        return guitarNoteLabel === this.guitarNoteLabel
            ? this
            : new GuitarContext(this.tuningName, this.scale, this.handedness, this.pitchNotation, guitarNoteLabel);

    }
}
