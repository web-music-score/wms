import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { getInstrumntForPlayback } from "./manage";

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

/**
 * Play a note using current instrument.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    if (mutePlayback) return;

    getInstrumntForPlayback().playNote(getStringNote(note), duration ?? DefaultDuration, linearVolume ?? DefaultVolume);
}

/**
 * Stop playback on current instrument.
 */
export function stop() {
    getInstrumntForPlayback().stop();
}

/**
 * Mute playback on current instrument.
 */
export function mute() {
    stop();
    mutePlayback = true;
}

/**
 * Unmute playback on current instrument.
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
