import { Note } from "@tspro/web-music-score/theory";

export enum StaffPreset {
    /** Treble staff has treble (G-) clef. */
    Treble = 1,
    /** Bass staff has bass (F-) clef. */
    Bass = 2,
    /** Grand staff has both treble and bass clefs. */
    Grand = Treble | Bass,

    /** GuitarTreble has treble clef but is one octave lower. */
    GuitarTreble = 4,
    /** GuitarTab has tab for guitar. */
    GuitarTab = 8,
    /** GuitarCombined has treble clef and tab for guitar. */
    GuitarCombined = GuitarTab | GuitarTreble
}

export enum Clef { G = "G", F = "F" }

export type StaffConfig = {
    type: "staff",
    clef: Clef | `${Clef}`,
    name?: string,
    isOctaveDown?: boolean,
    minNote?: string,
    maxNote?: string,
    voiceIds?: number[],
    isGrand?: boolean
}

export type TabConfig = {
    type: "tab",
    name?: string,
    tuning?: string | string[],
    voiceIds?: number[]
}

export type ScoreConfiguration = StaffConfig | TabConfig | (StaffConfig | TabConfig)[];

export type VoiceId = 0 | 1 | 2 | 3;

export function getVoiceIds(): ReadonlyArray<VoiceId> {
    return [0, 1, 2, 3];
}

export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

export function getStringNumbers(): ReadonlyArray<StringNumber> {
    return [1, 2, 3, 4, 5, 6];
}

export enum Stem { Auto, Up, Down }

export enum Arpeggio { Up, Down }

export enum TieType { Stub = -1, ToMeasureEnd = -2 }

export enum NoteAnchor { Auto, Above, Center, Below, StemTip }

export enum Connective { Tie, Slur, Slide }

export type ConnectiveSpan = number | TieType;

export enum VerticalPosition { Auto, Above, Below, Both }

export type StaffTabOrGroup = number | string;

export type StaffTabOrGroups = StaffTabOrGroup | StaffTabOrGroup[];

export type NoteOptions = {
    dotted?: boolean | number,
    stem?: Stem,
    color?: string,
    arpeggio?: Arpeggio | boolean,
    staccato?: boolean,
    diamond?: boolean,
    triplet?: boolean,
    string?: StringNumber | StringNumber[];
}

export type RestOptions = {
    dotted?: boolean | number,
    staffPos?: Note | string | number, // Note, "C3", or midiNumber
    color?: string,
    hide?: boolean,
    triplet?: boolean
}

export type TupletOptions = {
    showRatio?: boolean
}

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

export enum PlayState { Playing, Paused, Stopped }

export type PlayStateChangeListener = (playState: PlayState) => void;
