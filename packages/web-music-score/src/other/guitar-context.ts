import { GuitarNoteLabel, PitchNotation, SymbolSet } from "../music-theory/types";
import { Note } from "../music-theory/note";
import { Scale } from "../music-theory/scale";
import { Assert } from "@tspro/ts-utils-lib";
import GuitarData from "./assets/guitar.json";
import TuningData from "./assets/tuning.json";

/** @public */
export const TuningNameList: ReadonlyArray<string> = TuningData.list.map(data => data.name);

/** @public */
export const DefaultTuningName = TuningNameList[0];

/** @public */
export function validateTuningName(tuningName: string): string {
    if (TuningNameList.includes(tuningName)) {
        return tuningName;
    }
    else {
        return Assert.interrupt("Invalid tuning name: " + tuningName);
    }
}

/** @public */
export type Handedness = "rh" | "lh";

/** @public */
export const DefaultHandedness: Handedness = "rh";

/** @public */
export function validateHandedness(handedness: string): Handedness {
    if (handedness === "rh" || handedness === "lh") {
        return handedness;
    }
    else {
        return Assert.interrupt("Invalid handedness: " + handedness);
    }
}

const DefaultColors = {
    ScaleNoteColor: "#0A0",
    ScaleRootNoteColor: "#00A",
    NonScaleNoteColor: "#A00",
    DefaultBorderColor: "white",
    TextColor: "white",
}

/** @public */
export class GuitarNote {
    readonly preferredNote: Note;
    readonly isScaleNote: boolean;
    readonly isScaleRootNote: boolean;

    isVisible: boolean = false;
    text: string = "";
    textColor: string = DefaultColors.TextColor;
    fillColor: string | undefined;
    borderColor: string | undefined;
    isBarre: boolean = false;

    constructor(readonly guitarCtx: GuitarContext, readonly stringId: number, readonly fretId: number, readonly noteId: number) {
        let { scale } = guitarCtx;

        this.preferredNote = scale.getPreferredNote(noteId);
        this.isScaleNote = scale.isScaleNote(this.preferredNote);
        this.isScaleRootNote = scale.isScaleRootNote(this.preferredNote);
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
                this.text = this.preferredNote.formatOmitOctave(SymbolSet.Unicode);
                break;
            case GuitarNoteLabel.Interval:
                this.text = scale.getIntervalFromRootNote(this.preferredNote).toAbbrString().replace("P1", "R");
                break;
            default:
                this.text = this.preferredNote.format(pitchNotation, SymbolSet.Unicode);
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

    private readonly guitarNoteTable: Readonly<GuitarNote>[][];
    private readonly stringTunings: ReadonlyArray<Note>;

    constructor(readonly tuningName: string, readonly scale: Scale, readonly handedness: Handedness, readonly pitchNotation: PitchNotation, readonly guitarNoteLabel: GuitarNoteLabel) {
        // Nut = fret0, FretCount = maxFret + 1
        this.maxFretId = GuitarData.maxFret;

        let tuningData = Assert.require(TuningData.list.find(data => data.name === tuningName), "Invalid tuning name: " + tuningName);

        this.stringTunings = tuningData.strings.slice().reverse().map(noteName => Note.getNote(noteName));

        this.guitarNoteTable = [[], [], [], [], [], []];

        for (let stringId = 0; stringId < 6; stringId++) {
            let openStringNoteId = this.stringTunings[stringId].noteId;

            for (let fretId = 0; fretId <= this.maxFretId; fretId++) {
                let noteId = openStringNoteId + fretId;
                this.guitarNoteTable[stringId][fretId] = new GuitarNote(this, stringId, fretId, noteId);
            }
        }
    }

    getGuitarNote(stringId: number, fretId: number): Readonly<GuitarNote> {
        Assert.int_between(stringId, 0, 5, "stringId");
        Assert.int_between(fretId, 0, this.maxFretId, "fretId");
        return this.guitarNoteTable[stringId][fretId];
    }

    getStringTuning(stringId: number) {
        return this.stringTunings[stringId];
    }

    getTuningOverview() {
        return this.stringTunings.slice().reverse().map(note => note.format(this.pitchNotation, SymbolSet.Unicode)).join(" - ");
    }

    alterTuningName(tuningName: string) {
        return tuningName === this.tuningName
            ? this
            : new GuitarContext(tuningName, this.scale, this.handedness, this.pitchNotation, this.guitarNoteLabel);

    }

    alterScale(scale: Scale) {
        return scale.equals(this.scale)
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
