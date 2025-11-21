import { Guard } from "@tspro/ts-utils-lib";
import { Note } from "web-music-score/theory";
import { MusicError, MusicErrorType } from "core/error";

/** Staff preset values for score configuration. */
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
/** Clef for staff notation lines. */
export enum Clef {
    /** G-clef (treble cleff) */
    G = "G",
    /** F-clef (bass cleff) */
    F = "F"
}

/** Base config for staff and tab configs. */
export type BaseConfig = {
    /** Name for this staff/tab config. */
    name?: string;
    /** Voice id that is presented in this staff/tab. Single value or array.*/
    voiceId?: VoiceId | VoiceId[];
    /** @deprecated - Use `voiceId` instead. */
    voiceIds?: VoiceId | VoiceId[];
    /**
     * Instrument name for this staf/tab.<br />
     * Consecutive staves/tabs with the same name are grouped together.<br />
     * Hint!<br />
     * `"!Piano"` hides name.<br />
     * `"!{Piano"` hides both name and left brace of the group.
     * */
    instrument?: string;
}

/** Staff config to add staff notation line in score configuration. */
export type StaffConfig = BaseConfig & {
    /** Config type, must be "staff" for staff config. */
    type: "staff";
    /** G-clef or F-clef for this staff config? */
    clef: Clef | `${Clef}`;
    /** Set octave down with G-clef for guitar treble staff notation line. */
    isOctaveDown?: boolean;
    /** Lowest note (e.g. "C2")that can be presented in this staff notation line. */
    minNote?: string;
    /** Highest note (e.g. "C6") that can be presented in this staff notation line. */
    maxNote?: string;
    /**
     * To create grand staff: use same `grandId` value (e.g. "grand1") for two
     * consequtive staves, first having G-clef and second having F-clef.
     */
    grandId?: string;
    /** @deprecated - Use `grandId` property instead. */
    isGrand?: boolean;
}

/** Tab config to add guitar tab in score configuration. */
export type TabConfig = BaseConfig & {
    /** Config type, must be "tab" for tab config. */
    type: "tab";
    /** Tuning name or array six notes (tune for each string). */
    tuning?: string | string[];
}

/** Score configuration. */
export type ScoreConfiguration = StaffConfig | TabConfig | (StaffConfig | TabConfig)[];

/** Voice id. */
export type VoiceId = 0 | 1 | 2 | 3;

/** Get supported voice ids. Returns [0, 1, 2, 3]. */
export function getVoiceIds(): ReadonlyArray<VoiceId> {
    return [0, 1, 2, 3];
}

export function isVoiceId(voiceId: unknown): voiceId is VoiceId {
    return Guard.isIncluded(voiceId, getVoiceIds());
}

export function validateVoiceId(voiceId: unknown): VoiceId {
    if (isVoiceId(voiceId)) {
        return voiceId;
    }
    else {
        throw new MusicError(MusicErrorType.Score, `Voice id ${voiceId} is invalid!`);
    }
}

/** Strng number. */
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

/** Get string numbers. Returns [0, 1, 2, 3, 4, 5]. */
export function getStringNumbers(): ReadonlyArray<StringNumber> {
    return [1, 2, 3, 4, 5, 6];
}

export function isStringNumber(stringNum: unknown): stringNum is VerseNumber {
    return Guard.isIncluded(stringNum, getStringNumbers());
}

export function validateStringNumber(stringNum: unknown): VerseNumber {
    if (isStringNumber(stringNum)) {
        return stringNum;
    }
    else {
        throw new MusicError(MusicErrorType.Score, `String number ${stringNum} is invalid!`);
    }
}

/** Verse number. */
export type VerseNumber = 1 | 2 | 3;

/** Get supported verse numbers. Returns [1, 2, 3]. */
export function getVerseNumbers(): ReadonlyArray<VerseNumber> {
    return [1, 2, 3];
}

export function isVerseNumber(verse: unknown): verse is VerseNumber {
    return Guard.isIncluded(verse, getVerseNumbers());
}

export function validateVerseNumber(verseNum: unknown): VerseNumber {
    if (isVerseNumber(verseNum)) {
        return verseNum;
    }
    else {
        throw new MusicError(MusicErrorType.Score, `Verse number ${verseNum} is invalid!`);
    }
}

/** Stem direction enum. */
export enum Stem {
    /** Auto stem direction. */
    Auto = "auto",
    /** Stem is upwards. */
    Up = "up",
    /** Stm is downwards. */
    Down = "down"
}

/** Arpeggio direction enum. */
export enum Arpeggio {
    /** Upwards, chord played from lowes to highest. */
    Up = "up",
    /** Downwards, chord played from highest to loest. */
    Down = "down"
}

/** Special tie length enum. */
export enum TieType {
    /** Stub tie is short tie that left anchors to note and has not right anchor point. */
    Stub = "stub",
    /** To measure end tie is tie that left anchors to note and right anchors to measure end. */
    ToMeasureEnd = "toMeasureEnd"
}

/** Anchor point enum for connectives (ties, slurs, slides). */
export enum NoteAnchor {
    /** Automatically choose anchor point using simple logic. */
    Auto = "auto",
    /** Anchor connective above note head. */
    Above = "above",
    /** Anchor connective center/next to note head.*/
    Center = "center",
    /** Anchor connective below note head. */
    Below = "below",
    /** Anchor connective to stem tip. */
    StemTip = "stemTip"
}

/** Connective enum. */
export enum Connective {
    /** Tie, connects two or more adjacent notes of same pitch with arc. */
    Tie = "tie",
    /** Slur, connects two or more adjacent notes of different pitch with arc. */
    Slur = "slur",
    /** Slide, connects two adjacent notes of different pitch with straight line. */
    Slide = "slide"
}

/** Vertical position enum used to layout notation elements. */
export enum VerticalPosition {
    /** Automatic/default layout position depending on element. */
    Auto = "auto",
    /** Add  element above staff/tab. */
    Above = "above",
    /** Add element below staff/tab. */
    Below = "below",
    /** Add element both above and below staff/tab. */
    Both = "both"
}

/** Staff/tab/group type can be staff/tab index or staff/tab/group name. */
export type StaffTabOrGroup = number | string;

/** Staff/tab/group snglevalue or array of values. */
export type StaffTabOrGroups = StaffTabOrGroup | StaffTabOrGroup[];

/** Measure options. */
export type MeasureOptions = {
    /** show measure number? */
    showNumber?: boolean
}

/** Options for notes/chords. */
export type NoteOptions = {
    /** Stem direction. */
    stem?: Stem | `${Stem}`,
    /** Set color. */
    color?: string,
    /** Arepggio direction for chords. true = "up". */
    arpeggio?: boolean | Arpeggio | `${Arpeggio}`,
    /** Add staccato dot. */
    staccato?: boolean,
    /** Use diamond shaped note head. */
    diamond?: boolean,
    /** Set string number (array of numbers for chord) to use in guitar tab. */
    string?: StringNumber | StringNumber[],
    /** @deprecated - Use triplet NoteLength values instead, e.g. NoteLength.QuarterTriplet or "4t", etc. */
    triplet?: boolean,
    /** @deprecated - Use dotted NoteLength values instead, e.g. NoteLength.Quarter2Dots or "4..", etc. */
    dotted?: boolean | number
}

/** Options for rests. */
export type RestOptions = {
    /** Set staff position for this rest. Can be instance of Note, string (e.g. "C3"), or midiNumber. */
    staffPos?: Note | string | number,
    /** Set color. */
    color?: string,
    /** Hide this rest, still affects playing. */
    hide?: boolean,
    /** @deprecated - Use triplet NoteLength values instead, e.g. NoteLength.QuarterTriplet or "4t", etc. */
    triplet?: boolean,
    /** @deprecated - Use dotted NoteLength values instead, e.g. NoteLength.Quarter2Dots or "4..", etc. */
    dotted?: boolean | number
}

/** Tuplet options. */
export type TupletOptions = {
    /** Show tuplet ratio (e.g. "3:2") instead of number of parts (e.g. "3"). */
    showRatio?: boolean
}

/** Lyrics text/syllable alignment.*/
export enum LyricsAlign {
    /** Left align lyrics text/syllable. */
    Left = "left",
    /** Center align lyrics text/syllable. */
    Center = "center",
    /** Right align lyrics text/syllable. */
    Right = "right"
}

/** Lyrics hyphen.*/
export enum LyricsHyphen {
    /** Hyphen. */
    Hyphen = "-",
    /** Extender. */
    Extender = "---"
}

/** Lyrics options. */
export type LyricsOptions = {
    /** Alignment of lyrics text/syllable. */
    align?: LyricsAlign | `${LyricsAlign}`,
    /** Hyphen or extender after lyrics text/syllable. */
    hyphen?: LyricsHyphen | `${LyricsHyphen}`
}

/** Fermata enum. */
export enum Fermata {
    /** Anchor fermata to note/rest. */
    AtNote = "atNote",
    /** Anchor fermata to measure end. */
    AtMeasureEnd = "atMeasureEnd"
}

/** Navigation element enum. */
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

/** Annotation element enum. */
export enum Annotation {
    /** "ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff", "cresc.", "decresc.", "dim." */
    Dynamics = "dynamics",

    /** "accel.", "rit.", "a tempo" */
    Tempo = "tempo"
}

/** Some known dynamics annotations. */
export enum DynamicsAnnotation {
    cresc = "cresc.",
    decresc = "decresc.",
    dim = "dim.",
    ppp = "ppp",
    pp = "pp",
    p = "p",
    mp = "mp",
    m = "m",
    mf = "mf",
    f = "f",
    ff = "ff",
    fff = "fff"
}

/** Some known tempo annotations. */
export enum TempoAnnotation {
    accel = "accel.",
    rit = "rit.",
    a_tempo = "a tempo"
}

/** Known annotation test type. */
export type AnnotationText = `${DynamicsAnnotation}` | `${TempoAnnotation}`;

/** Label element enum. */
export enum Label {
    /** "C", "C#", "Db", "D", etc. */
    Note = "note",

    /** "C", "Am", "G7", etc. */
    Chord = "chord"
}

/** Play state enum. */
export enum PlayState {
    /** Playing. */
    Playing,
    /** Paused. */
    Paused,
    /** Stopped. */
    Stopped
}

/** Play state change listener type. */
export type PlayStateChangeListener = (playState: PlayState) => void;
