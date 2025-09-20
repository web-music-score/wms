import { Note } from "@tspro/web-music-score/theory";

export enum StaffPreset {
    /** Treble staff has treble (G-) clef. */
    Treble = "treble",
    /** Bass staff has bass (F-) clef. */
    Bass = "bass",
    /** Grand staff has both treble and bass clefs. */
    Grand = "grand",

    /** GuitarTreble has treble clef but is one octave lower. */
    GuitarTreble = "guitarTreble",
    /** GuitarTab has tab for guitar. */
    GuitarTab = "guitarTab",
    /** GuitarCombined has treble clef and tab for guitar. */
    GuitarCombined = "guitarCombined"
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

export enum Stem { Auto = "auto", Up = "up", Down = "down" }

export enum Arpeggio { Up = "up", Down = "down" }

export enum TieType { Stub = "stub", ToMeasureEnd = "toMeasureEnd" }

export enum NoteAnchor { Auto = "auto", Above = "above", Center = "center", Below = "below", StemTip = "stemTip" }

export enum Connective { Tie = "tie", Slur = "slur", Slide = "slide" }

export enum VerticalPosition { Auto = "auto", Above = "above", Below = "below", Both = "both" }

export type StaffTabOrGroup = number | string;

export type StaffTabOrGroups = StaffTabOrGroup | StaffTabOrGroup[];

export type NoteOptions = {
    stem?: Stem | `${Stem}`,
    color?: string,
    arpeggio?: boolean | Arpeggio | `${Arpeggio}`,
    staccato?: boolean,
    diamond?: boolean,
    string?: StringNumber | StringNumber[],
    /** @deprecated - Use triplet NoteLength values instead, e.g. NoteLength.QuarterTriplet or "4t", etc. */
    triplet?: boolean,
    /** @deprecated - Use dotted NoteLength values instead, e.g. NoteLength.Quarter2Dots or "4..", etc. */
    dotted?: boolean | number
}

export type RestOptions = {
    staffPos?: Note | string | number, // Note, "C3", or midiNumber
    color?: string,
    hide?: boolean,
    /** @deprecated - Use triplet NoteLength values instead, e.g. NoteLength.QuarterTriplet or "4t", etc. */
    triplet?: boolean,
    /** @deprecated - Use dotted NoteLength values instead, e.g. NoteLength.Quarter2Dots or "4..", etc. */
    dotted?: boolean | number
}

export type TupletOptions = {
    showRatio?: boolean
}

export enum Fermata {
    AtNote = "atNote",
    AtMeasureEnd = "atMeasureEnd"
}

export enum Navigation {
    /** Repeat back to beginning and play to the "Fine" marking. */
    DC_al_Fine = "D.C. al Fine",

    /** Repeat back to beginning and play to the "to Coda 𝄌", then jump to the "𝄌 Coda". */
    DC_al_Coda = "D.C. al Coda",

    /** Repeat back to Segno sign (𝄋) and play to the "Fine" marking. */
    DS_al_Fine = "D.S. al Fine",

    /** Repeat back to Segno sign (𝄋) and play to the "to Coda 𝄌", then jump to the "𝄌 Coda". */
    DS_al_Coda = "D.S. al Coda",

    /** "𝄌 Coda" section. */
    Coda = "Coda",

    /** From "toCoda 𝄌" jump to the "𝄌 Coda" section. */
    toCoda = "toCoda",

    /** Jump here from D.S. al Fine or D.S. al Coda. */
    Segno = "Segno",

    /** Stop playing after D.C. al Fine or D.S. al Fine. */
    Fine = "Fine",

    /** Start of repeat section. */
    StartRepeat = "startRepeat",

    /** End of repeat section. Jump to start of repeat section. */
    EndRepeat = "endRepeat",

    /** Jump to ending with correct passage number. */
    Ending = "ending"
}

export enum Annotation {
    /** "ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff", "cresc.", "decresc.", "dim." */
    Dynamics = "dynamics",

    /** "accel.", "rit.", "a tempo" */
    Tempo = "tempo"
}

export enum Label {
    /** "C", "C#", "Db", "D", etc. */
    Note = "note",

    /** "C", "Am", "G7", etc. */
    Chord = "chord"
}

export enum PlayState { Playing, Paused, Stopped }

export type PlayStateChangeListener = (playState: PlayState) => void;
