import { NoteLength, RhythmProps } from "./rhythm";

export type Tempo = {
    beatsPerMinute: number,
    options: {
        beatLength: NoteLength,
        dotted: boolean // FIXME: dotCount
    }
}

let defaultTempo: Tempo | undefined;

export function getDefaultTempo(): Readonly<Tempo> {
    if (!defaultTempo) {
        defaultTempo = { beatsPerMinute: 120, options: { beatLength: NoteLength.Quarter, dotted: false } }
    }
    return defaultTempo;
}

export function getTempoString(tempo: Tempo) {
    return new RhythmProps(tempo.options.beatLength, tempo.options.dotted ? 1 : 0).toString() + "=" + tempo.beatsPerMinute;
}


export function alterTempoSpeed(tempo: Tempo, speed: number): Tempo {
    return {
        beatsPerMinute: tempo.beatsPerMinute * speed,
        options: { beatLength: tempo.options.beatLength, dotted: tempo.options.dotted }
    }
}
