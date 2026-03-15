import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { getDefaultInstrument, getInstrumentList, getValidInstrumnt } from "./manage";
import { SamplesInstrument } from "./samples-instrument";

function getStringNote(note: Note | number | string): string {
    if (typeof note === "string") {
        return note;
    }
    else if (typeof note === "number") {
        // midiNumber
        note = Note.getChromaticNote(note);
    }
    return note.format(PitchNotation.Scientific, SymbolSet.Ascii);
}

const DefaultDuration = (function calcDuration(noteSize: number, beatsPerMinute: number, timeTisgnature: string): number {
    let beatSize = parseInt(timeTisgnature.split("/")[1] ?? "4");
    return 60 * (1 / noteSize) / (beatsPerMinute * (1 / beatSize));
})(2, 80, "4/4"); // Half note, 80 bpm, 4/4 time signature.

const DefaultVolume = 1;

let mutePlayback: boolean = false;

/** Play context. */
export type PlayContext = number | string | {};

/**
 * Play a note.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 * @param instrument - Instrument name or midi program number.
 * @param playCtx - Play context.
 */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number, instrument?: string | number, playCtx?: PlayContext) {
    if (mutePlayback) return;

    const instr = getValidInstrumnt(instrument ?? getDefaultInstrument());

    duration ??= DefaultDuration;
    linearVolume ??= DefaultVolume;

    if (instr instanceof SamplesInstrument)
        instr.playNote(getStringNote(note), duration, linearVolume, playCtx);
    else
        instr.playNote(getStringNote(note), duration, linearVolume);
}

/**
 * Stop playback.
 * @param playCtx - Play context.
 */
export function stop(playCtx?: PlayContext) {
    getInstrumentList().forEach(instrument => {
        const instr = getValidInstrumnt(instrument);

        if (instr instanceof SamplesInstrument)
            instr.stop(playCtx);
        else
            instr.stop();
    });
}

/**
 * Mute playback.
 */
export function mute() {
    stop();
    mutePlayback = true;
}

/**
 * Unmute playback.
 */
export function unmute() {
    mutePlayback = false;
}

/**
 * Is playback muted?
 * @returns True/false.
 */
export function isMuted(): boolean {
    return mutePlayback;
}
