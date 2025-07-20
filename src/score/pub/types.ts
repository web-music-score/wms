import { Note } from "@tspro/web-music-score/theory";
import { DivRect } from "./div-rect";
import { MScoreRow, MusicInterface } from "./interface";

/** @public */
export enum StaffPreset {
    /** Treble staff has treble (G-) clef. */
    Treble = 1,
    /** Bass staff has bass (F-) clef. */
    Bass = 2,
    /** Grand staff has both treble and bass clefs. */
    Grand = Treble | Bass,

    /** GuitarTreble has treble clef but is one octave lower. */
    GuitarTreble = 4,
    // /** GuitarTab has tab for guitar. */
    GuitarTab = 8,
    // /** GuitarCombined has treble clef and tab for guitar. */
    GuitarCombined = GuitarTab | GuitarTreble
}

/** @public */
export type VoiceId = 0 | 1 | 2 | 3;

/** @public */
export function getVoiceIds(): ReadonlyArray<VoiceId> {
    return [0, 1, 2, 3];
}

/** @public */
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

/** @public */
export function getStringNumbers(): ReadonlyArray<StringNumber> {
    return [1, 2, 3, 4, 5, 6];
}

/** @public */
export enum Stem { Auto, Up, Down }

/** @public */
export enum Arpeggio { Up, Down }

/** @public */
export enum Tie { Short = -1, MeasureEnd = -2 }

/** @public */
export enum NoteAnchor { Auto, Above, Center, Below, StemTip }

/** @public */
export type NoteOptions = {
    dotted?: boolean,
    stem?: Stem,
    color?: string,
    arpeggio?: Arpeggio | boolean,
    staccato?: boolean,
    diamond?: boolean,
    tieSpan?: number | Tie,
    tieAnchor?: NoteAnchor,
    slurSpan?: number,
    slurAnchor?: NoteAnchor,
    triplet?: boolean,
    string?: StringNumber | StringNumber[];
}

/** @public */
export type RestOptions = {
    dotted?: boolean,
    staffPos?: Note | string | number, // Note, "C3", or midiNumber
    color?: string,
    hide?: boolean,
    triplet?: boolean
}

/** @public */
export type DocumentOptions = {
    measuresPerRow?: number,
    tuning?: string,
    maxPitchRange?: boolean
}

/** @public */
export enum PlayState { Playing, Paused, Stopped }

/** @public */
export type PlayStateChangeListener = (playState: PlayState) => void;

/** @public */
export enum Fermata {
    AtNote,
    AtMeasureEnd
}

/** @public */
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

/** @public */
export enum Annotation {
    /** "ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff", "cresc.", "decresc.", "dim." */
    Dynamics,

    /** "accel.", "rit.", "a tempo" */
    Tempo
}

/** @public */
export enum Label {
    /** "C", "C#", "Db", "D", etc. */
    Note,

    /** "C", "Am", "G7", etc. */
    Chord
}
