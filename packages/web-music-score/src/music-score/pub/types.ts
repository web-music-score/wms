import { Note } from "../../music-theory/note";
import { DivRect } from "./div-rect";
import { MMeasure, MusicInterface } from "./interface";

export enum StaffKind {
    /** Treble staff has treble (G-) clef. */
    Treble,
    /** TrebleForGuitar has treble clef but is one octave lower. */
    TrebleForGuitar,
    /** Bass staff has bass (F-) clef. */
    Bass,
    /** Grand staff has both treble and bass clefs. */
    Grand
}

export enum Stem { Auto, Up, Down }
export enum Arpeggio { Up, Down }
export enum TieLength { Short = "Short", ToMeasureEnd = "ToMeasureEnd" }
export enum ArcPos { Auto, Above, Middle, Below, StemTip }

export type NoteOptions = {
    dotted?: boolean,
    stem?: Stem,
    color?: string,
    arpeggio?: Arpeggio,
    staccato?: boolean,
    diamond?: boolean,
    tieSpan?: number | TieLength,
    tiePos?: ArcPos,
    slurSpan?: number,
    slurPos?: ArcPos,
    triplet?: boolean
}

export type RestOptions = {
    dotted?: boolean,
    pitch?: string | Note,
    color?: string,
    hide?: boolean,
    triplet?: boolean
}

export type PickedPitch = { pitch: number, measure: MMeasure }

export type ClickPitchListener = (pickedPitch: PickedPitch) => void;
export type ClickObjectSelector = (arr: MusicInterface[]) => MusicInterface | undefined;
export type ClickObjectListener = (obj: MusicInterface) => void;

export type CursorPositionChangeListener = (cursorRect: DivRect | undefined) => void;

export enum PlayState { Playing, Paused, Stopped }
export type PlayStateChangeListener = (playState: PlayState) => void;

export enum Fermata {
    AtNote,
    AtMeasureEnd
}

export enum Navigation {
    /** Repeat back to beginning and play to the "Fine" marking. */
    DC_al_Fine,

    /** Repeat back to beginning and play to the "to Coda 𝄌", then jump to the "𝄌 Coda". */
    DC_al_Coda,

    /** Repeat back to Segno sign (𝄋) and play to the "Fine" marking. */
    DS_al_Fine,

    /** Repeat back to Segno sign (𝄋) and play to the "to Coda 𝄌", then jump to the "𝄌 Coda". */
    DS_al_Coda,

    /** "𝄌 Coda" section. */
    Coda,

    /** From "toCoda 𝄌" jump to the "𝄌 Coda" section. */
    toCoda,

    /** Jump here from D.S. al Fine or D.S. al Coda. */
    Segno,

    /** Stop playing after D.C. al Fine or D.S. al Fine. */
    Fine,

    /** Start of repeat section. */
    StartRepeat,

    /** End of repeat section. Jump to start of repeat section. */
    EndRepeat,

    /** Jump to ending with correct passage number. */
    Ending
}

export enum Annotation {
    /** "ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff", "cresc.", "decresc.", "dim." */
    Dynamics,

    /** "accel.", "rit.", "a tempo" */
    Tempo
}

export enum Label {
    /** "C", "C#", "Db", "D", etc. */
    Note,

    /** "C", "Am", "G7", etc. */
    Chord
}
