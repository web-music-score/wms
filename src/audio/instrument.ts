
/**
 * Instrument interface.
 * <p>To create your own instrument just create a class that implement this simple interface.</p>
 * 
 * ```ts
 *   import * as Audio from "web-music-score/audio";
 * 
 *   class MyCoolInstrument implements Audio.Instrument {
 *       constructor() { }
 *       getName() { return "My Cool Instrument"; }
 *       playNote(note: string, duration: number, linearVolume: number) { }
 *       stop() { }
 *   }
 * 
 *   // Add and use my cool instrument.
 *   Audio.addInstrument(new MyCoolInstrument());
 * ```
 */
export interface Instrument {
    /**
     * Get instrument name.
     * @return - Instrument name.
     */
    getName(): string;

    /**
     * Play a note.
     * @param note - Note to play (e.g. "C4").
     * @param duration - Play duration in seconds.
     * @param linearVolume - Linear volume in range [0, 1].
     */
    playNote(note: string, duration: number, linearVolume: number): void;

    /**
     * Stop playback.
     */
    stop(): void;
}

/**
 * Instruments can also be added using this interface that holds instrument name and audio samples.
 */
export interface InstrumentSamples {
    /**
     * Get instrument name.
     * @returns - Instrument name.
     */
    getName(): string;

    /**
     * Get samples e.g. { "E2": "base64 string mp3", "E3": "base64 string mp3", etc. }
     * @returns - Record of audio samples.
     */
    getSamples(): Record<string, string>;
}

/**
 * Linear volume to decibels converter.
 * @param linearVolume - Linear volume in range [0, 1].
 * @returns - Volume in decibels.
 */
export function linearToDecibels(linearVolume: number): number {
    return (!isFinite(linearVolume) || linearVolume <= 0)
        ? -Infinity
        : 20 * Math.log10(linearVolume);
}
