import { NoteLength, RhythmProps } from "./rhythm";

/** @public */
export type Tempo = {
    beatsPerMinute: number,
    options: {
        beatLength: NoteLength,
        dotted: boolean
    }
}

let defaultTempo: Tempo | undefined;

/** @public */
export function getDefaultTempo(): Readonly<Tempo> {
    if (!defaultTempo) {
        defaultTempo = { beatsPerMinute: 120, options: { beatLength: NoteLength.Quarter, dotted: false } }
    }
    return defaultTempo;
}

/** @public */
export function getTempoString(tempo: Tempo) {
    return new RhythmProps(tempo.options.beatLength, tempo.options.dotted).toString() + "=" + tempo.beatsPerMinute;
}


/** @public */
export function alterTempoSpeed(tempo: Tempo, speed: number): Tempo {
    return {
        beatsPerMinute: tempo.beatsPerMinute * speed,
        options: { beatLength: tempo.options.beatLength, dotted: tempo.options.dotted }
    }
}
