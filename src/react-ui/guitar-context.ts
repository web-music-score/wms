import { GuitarNoteLabel, Handedness, PitchNotation, SymbolSet } from "@tspro/web-music-score/theory";
import { getTuningStrings, Note, Scale } from "@tspro/web-music-score/theory";
import { Assert } from "@tspro/ts-utils-lib";
import GuitarData from "./assets/guitar.json";

const DefaultColors = {
    ScaleNoteColor: "#0A0",
    ScaleRootNoteColor: "#00A",
    NonScaleNoteColor: "#A00",
    DefaultBorderColor: "white",
    TextColor: "white",
}

/** @public */
export class FretPosition {
    readonly note: Note;
    readonly isScaleNote: boolean;
    readonly isScaleRootNote: boolean;

    isVisible: boolean = false;
    text: string = "";
    textColor: string = DefaultColors.TextColor;
    fillColor: string | undefined;
    borderColor: string | undefined;
    isBarre: boolean = false;

    constructor(readonly guitarCtx: GuitarContext, readonly stringId: number, readonly fretId: number, readonly chromaticId: number) {
        let { scale } = guitarCtx;

        this.note = scale.getPreferredChromaticNote(chromaticId);
        this.isScaleNote = scale.isScaleNote(this.note);
        this.isScaleRootNote = scale.isScaleRootNote(this.note);
    }

    get chromaticClass() {
        return Note.getChromaticClass(this.chromaticId);
    }

    show() {
        this.isVisible = true;
    }

    hide() {
        this.isVisible = false;
    }

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

    setDefaultFillColor() {
        this.fillColor = this.isScaleRootNote
            ? DefaultColors.ScaleRootNoteColor
            : this.isScaleNote
                ? DefaultColors.ScaleNoteColor
                : DefaultColors.NonScaleNoteColor;
    }

    setDefaultBorderColor(showBorder = false) {
        this.borderColor = showBorder ? DefaultColors.DefaultBorderColor : undefined;
    }
}

/** @public */
export class GuitarContext {
    readonly maxFretId: number;

    private readonly fretPositionTable: Readonly<FretPosition>[][];
    private readonly tuningStrings: ReadonlyArray<Note>;

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

    getFretPosition(stringId: number, fretId: number): Readonly<FretPosition> {
        Assert.int_between(stringId, 0, 5, "stringId");
        Assert.int_between(fretId, 0, this.maxFretId, "fretId");
        return this.fretPositionTable[stringId][fretId];
    }

    getStringTuning(stringId: number) {
        return this.tuningStrings[stringId];
    }

    getTuningOverview() {
        return this.tuningStrings.slice().reverse().map(note => note.format(this.pitchNotation, SymbolSet.Unicode)).join(" - ");
    }

    alterTuningName(tuningName: string) {
        return tuningName === this.tuningName
            ? this
            : new GuitarContext(tuningName, this.scale, this.handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    alterScale(scale: Scale) {
        return Scale.equals(scale, this.scale)
            ? this
            : new GuitarContext(this.tuningName, scale, this.handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    alterHandedness(handedness: Handedness) {
        return handedness === this.handedness
            ? this
            : new GuitarContext(this.tuningName, this.scale, handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    alterPitchNotation(pitchNotation: PitchNotation) {
        return pitchNotation === this.pitchNotation
            ? this
            : new GuitarContext(this.tuningName, this.scale, this.handedness, pitchNotation, this.guitarNoteLabel);

    }

    alterGuitarNoteLabel(guitarNoteLabel: GuitarNoteLabel) {
        return guitarNoteLabel === this.guitarNoteLabel
            ? this
            : new GuitarContext(this.tuningName, this.scale, this.handedness, this.pitchNotation, guitarNoteLabel);

    }
}
