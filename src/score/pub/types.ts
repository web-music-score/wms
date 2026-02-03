import { Guard } from "@tspro/ts-utils-lib";
import { Note } from "web-music-score/theory";
import { MusicError, MusicErrorType } from "web-music-score/core";

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

/** Identifier (index or name) for staff, tab, or group. */
export type StaffTarget = number | string;

/** Single or multiple staff/tab/group identifiers. */
export type StaffTargets = StaffTarget | StaffTarget[];

/** @deprecated - StaffTabOrGroup is deprecated. Will be removed in future release. Use StaffTarget instead. */
export type { StaffTarget as StaffTabOrGroup }

/** @deprecated - StaffTabOrGroups is deprecated. Will be removed in future release. Use StaffTargets instead. */
export type { StaffTargets as StaffTabOrGroups }

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
}

/** Options for rests. */
export type RestOptions = {
    /** Set staff position for this rest. Can be instance of Note, string (e.g. "C3"), or midiNumber. */
    staffPos?: Note | string | number,
    /** Set color. */
    color?: string,
    /** Hide this rest, still affects playing. */
    hide?: boolean,
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

/**
 * @deprecated - Fermata is deprecated. Will be removed in future release. Use Annotation with TemporalAnnotation instead.
 */
export enum Fermata {
    /** Anchor fermata to note/rest. @deprecated */
    AtNote = "atNote",
    /** Anchor fermata to measure end. @deprecated */
    AtMeasureEnd = "atMeasureEnd"
}

/** @deprecated - Label is deprecated. Will be removed in future release. Use Annotation with LabelAnnotation instead. */
export enum Label {
    /** "C", "C#", "Db", "D", etc. @deprecated */
    Note = "note",
    /** "C", "Am", "G7", etc. @deprecated */
    Chord = "chord"
}

/** Annotation group */
export enum AnnotationGroup {
    /** Navigation annotation */
    Navigation = "navigation",
    /** Dynamics annotation */
    Dynamics = "dynamics",
    /** Tempo annotation */
    Tempo = "tempo",
    /** Articulation annotation */
    Articulation = "articulation",
    /** Expression annotation */
    Expression = "expression",
    /** Technique annotation */
    Technique = "technique",
    /** Temporal annotation */
    Temporal = "temporal",
    /** Label annotation */
    Label = "label",
    /** Ornament annotation */
    Ornament = "ornament",
    /** Miscellaneous annotation */
    Misc = "misc"
}

/** @deprecated - Annotation is deprecated. Will be removed in future release. Use AnnotationGroup instead. */
export { AnnotationGroup as Annotation }

/** Annotation kind enum */
export enum AnnotationKind {
    //////////////////////////////////////////////////
    // AnnotationGroup.Navigation
    //////////////////////////////////////////////////

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
    Ending = "ending",

    //////////////////////////////////////////////////
    // AnnotationGroup.Dynamics
    //////////////////////////////////////////////////

    /** pianississimo (very, very soft) */
    ppp = "ppp",
    /** pianissimo (very soft) */
    pp = "pp",
    /** piano (soft) */
    p = "p",
    /** mezzo-piano (moderately soft) */
    mp = "mp",
    /** mezzo */
    m = "m",
    /** mezzo-forte (moderately loud) */
    mf = "mf",
    /** forte (loud) */
    f = "f",
    /** fortissimo (very loud) */
    ff = "ff",
    /** fortississimo (very, very loud) */
    fff = "fff",
    /** crescendo (gradually louder) */
    cresc = "cresc.",
    /** diminuendo (gradually softer) */
    decresc = "decresc.",
    /** diminuendo (gradually softer) */
    dim = "dim.",
    /** forte then immediately piano */
    fp = "fp",
    /** sudden strong accent */
    sf = "sf",
    /** sudden strong accent */
    sfz = "sfz",
    /** sudden strong accent */
    sforzando = "sforzando",

    //////////////////////////////////////////////////
    // AnnotationGroup.Tempo
    //////////////////////////////////////////////////

    /** gradually faster */
    accel = "accel.",
    /** gradually slower */
    rit = "rit.",
    /** gradually slower */
    rall = "rall.",
    /** return to original tempo */
    a_tempo = "a tempo",
    /** flexible tempo */
    rubato = "rubato",
    /** very slow */
    Largo = "Largo",
    /** slow */
    Adagio = "Adagio",
    /** walking pace */
    Andante = "Andante",
    /** moderate */
    Moderato = "Moderato",
    /** fast */
    Allegro = "Allegro",
    /** lively, fast */
    Vivace = "Vivace",
    /** very fast */
    Presto = "Presto",
    /** extremely fast */
    Prestissimo = "Prestissimo",

    //////////////////////////////////////////////////
    // AnnotationGroup.Articulation
    //////////////////////////////////////////////////

    /** short, detached */
    staccato = "staccato",
    /** (—) – held for full value */
    tenuto = "tenuto",
    /** (>) – emphasized */
    accent = "accent",
    /** (^) – strongly accented */
    marcato = "marcato",
    /** (slur) smoothly connected */
    legato = "legato",
    /** gently separated (tenuto + staccato) */
    portato = "portato",

    //////////////////////////////////////////////////
    // AnnotationGroup.Expression
    //////////////////////////////////////////////////

    /** sweetly */
    dolce = "dolce",
    /** singing style */
    cantabile = "cantabile",
    /** expressively */
    espressivo = "espressivo",
    /** expressively */
    espr = "espr.",
    /** lightly */
    leggiero = "leggiero",
    /** heavy */
    pesante = "pesante",
    /** with energy */
    con_brio = "con brio",
    /** with fire */
    con_fuoco = "con fuoco",
    /** playful */
    giocoso = "giocoso",
    /** majestic */
    maestoso = "maestoso",
    /** mysterious */
    misterioso = "misterioso",
    /** calm */
    tranquillo = "tranquillo",

    //////////////////////////////////////////////////
    // AnnotationGroup.Technique
    //////////////////////////////////////////////////

    //////////// Strings ////////////
    /** plucked */
    pizz = "pizz.",
    /** bowed */
    arco = "arco",
    /** with the wood of the bow */
    col_legno = "col legno",
    /** near the bridge */
    sul_ponticello = "sul ponticello",
    /** over the fingerboard */
    sul_tasto = "sul tasto",
    /**  */
    vibrato = "vibrato",
    /**  */
    senza_vibrato = "senza vibrato",
    //////////// Keyboard ////////////
    /** legato pedal */
    legato_pedal = "legato pedal",
    /** staccato pedal */
    staccato_pedal = "staccato pedal",
    /** soft pedal */
    una_corda = "una corda",
    /** release soft pedal */
    tre_corde = "tre corde",

    //////////////////////////////////////////////////
    // AnnotationGroup.Ornament
    //////////////////////////////////////////////////

    /**  */
    trill = "trill",
    /**  */
    tr = "tr",
    /**  */
    mordent = "mordent",
    /**  */
    grace_note = "grace note",
    /**  */
    turn = "turn",
    /**  */
    appoggiatura = "appoggiatura",
    /**  */
    acciaccatura = "acciaccatura",

    //////////////////////////////////////////////////
    // AnnotationGroup.Temporal
    //////////////////////////////////////////////////

    /** hold longer than written */
    fermata = "fermata",
    /** @deprecated - Use addAnnotation("fermata", { anchor: "rightBarLine" }) */
    measureEndFermata = "measureEndFermata",

    //////////////////////////////////////////////////
    // AnnotationGroup.Label
    //////////////////////////////////////////////////

    /** Pitch label */
    PitchLabel = "pitchLabel",
    /** Chord label */
    ChordLabel = "chordLabel",

    //////////////////////////////////////////////////
    // AnnotationGroup.Misc
    //////////////////////////////////////////////////

    /** play one octave higher */
    _8va = "8va",
    /** play one octave lower */
    _8vb = "8vb",
    /** silent */
    tacet = "tacet",
    /** continue similarly */
    sim = "sim.",
    /** divided parts */
    div = "div.",
    /** play in unison */
    unis = "unis.",
    /** small notes for reference */
    cue_notes = "cue notes",
}

/** Annotation kind text type. @deprecated - Do not use. */
export type AnnotationText = `${AnnotationKind}`;

/** Annotation anchor */
export enum AnnotationAnchor {
    /** Add annotation at certain time position in measure (e.g. time position of last added note) */
    TimePosition = "timePosition",
    /** Add annotation at left bar line (start of measure) */
    LeftBarLine = "leftBarLine",
    /** Add annotation at right bar line (end of measure) */
    RightBarLine = "rightBarLine",
}

/** Annotation options */
export type AnnotationOptions = {
    /** Anchor */
    anchor?: AnnotationAnchor | `${AnnotationAnchor}`;
    /** Play count for repeats */
    repeatCount?: number;
    /** Passage number(s) for endings */
    endingPassages?: number | number[];
    /** Text for labels */
    labelText?: string;
}

/** Navigation annotations */
export enum Navigation {
    /** Repeat back to beginning and play to the "Fine" marking. */
    DC_al_Fine = AnnotationKind.DC_al_Fine,
    /** Repeat back to beginning and play to the "to Coda 𝄌", then jump to the "𝄌 Coda". */
    DC_al_Coda = AnnotationKind.DC_al_Coda,
    /** Repeat back to Segno sign (𝄋) and play to the "Fine" marking. */
    DS_al_Fine = AnnotationKind.DS_al_Fine,
    /** Repeat back to Segno sign (𝄋) and play to the "to Coda 𝄌", then jump to the "𝄌 Coda". */
    DS_al_Coda = AnnotationKind.DS_al_Coda,
    /** "𝄌 Coda" section. */
    Coda = AnnotationKind.Coda,
    /** From "toCoda 𝄌" jump to the "𝄌 Coda" section. */
    toCoda = AnnotationKind.toCoda,
    /** Jump here from D.S. al Fine or D.S. al Coda. */
    Segno = AnnotationKind.Segno,
    /** Stop playing after D.C. al Fine or D.S. al Fine. */
    Fine = AnnotationKind.Fine,
    /** Start of repeat section. */
    StartRepeat = AnnotationKind.StartRepeat,
    /** End of repeat section. Jump to start of repeat section. */
    EndRepeat = AnnotationKind.EndRepeat,
    /** Jump to ending with correct passage number. */
    Ending = AnnotationKind.Ending
}

/** @deprecated - DynamicsAnnotation is deprecated. Will be removed in future release. Use AnnotationKind instead. */
export enum DynamicsAnnotation {
    /** pianississimo (very, very soft) */
    ppp = AnnotationKind.ppp,
    /** pianissimo (very soft) */
    pp = AnnotationKind.pp,
    /** piano (soft) */
    p = AnnotationKind.p,
    /** mezzo-piano (moderately soft) */
    mp = AnnotationKind.mp,
    /** mezzo */
    m = AnnotationKind.m,
    /** mezzo-forte (moderately loud) */
    mf = AnnotationKind.mf,
    /** forte (loud) */
    f = AnnotationKind.f,
    /** fortissimo (very loud) */
    ff = AnnotationKind.ff,
    /** fortississimo (very, very loud) */
    fff = AnnotationKind.fff,
    /** crescendo (gradually louder) */
    cresc = AnnotationKind.cresc,
    /** diminuendo (gradually softer) */
    decresc = AnnotationKind.decresc,
    /** diminuendo (gradually softer) */
    dim = AnnotationKind.dim,
}

/** @deprecated - TempoAnnotation is deprecated. Will be removed in future release. Use AnnotationKind instead. */
export enum TempoAnnotation {
    /** gradually faster */
    accel = AnnotationKind.accel,
    /** gradually slower */
    rit = AnnotationKind.rit,
    /** gradually slower */
    rall = AnnotationKind.rall,
    /** return to original tempo */
    a_tempo = AnnotationKind.a_tempo,
}

/** @deprecated - ArticulationAnnotation is deprecated. Will be removed in future release. Use AnnotationKind instead. */
export enum ArticulationAnnotation {
    fermata = AnnotationKind.fermata,
    measureEndFermata = AnnotationKind.measureEndFermata,
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

/**
 * Staff size.
 * <pre>
 * number:
 *      number of pixels.
 * string:
 *      "20px", "3cm", "25mm", "1in", etc.
 *      "small" | "medium" | "larg" | "default"
 * </pre>
 */
export type StaffSize = number | string | "small" | "medium" | "large" | "default";
