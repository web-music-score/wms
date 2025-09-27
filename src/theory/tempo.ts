import { NoteLength, RhythmProps } from "./rhythm";

/** Tempo type. */
export type Tempo = {
    /** Beats per minute value. */
    beatsPerMinute: number,
    /** Optional tempo props. */
    options: {
        /** Length of ane beat. */
        beatLength: NoteLength,
        /** Dot count for length of one beat. */
        dotCount: number
    }
}

let defaultTempo: Tempo | undefined;

/**
 * Get default tempo, which is 120 bpm with quarter note  beat length.
 * @returns - Default tempo.
 */
export function getDefaultTempo(): Readonly<Tempo> {
    if (!defaultTempo) {
        defaultTempo = { beatsPerMinute: 120, options: { beatLength: NoteLength.Quarter, dotCount: 0 } }
    }
    return defaultTempo;
}

/**
 * Get formatted tempo string (e.g. "♩=120").
 * @param tempo - Tempo.
 * @returns - Formatted tempo string.
 */
export function getTempoString(tempo: Tempo) {
    return RhythmProps.get(tempo.options.beatLength, tempo.options.dotCount).toString() + "=" + tempo.beatsPerMinute;
}


/**
 * Get copy of tempo with altered speed.
 * @param tempo - Tempo.
 * @param speed - Speed factor, used to multiply beats per minute to.
 * @returns - Altered tempo.
 */
export function alterTempoSpeed(tempo: Tempo, speed: number): Tempo {
    return {
        beatsPerMinute: tempo.beatsPerMinute * speed,
        options: { beatLength: tempo.options.beatLength, dotCount: tempo.options.dotCount }
    }
}
