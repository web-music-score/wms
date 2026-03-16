/** @deprecated Instrument is deprecated, will be removed in future release. Current platform supports midi instruments built-in. */
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

/** @deprecated linearToDecibels() is deprecated, will be removed in future release. Instrument that required this is deprecated. Current platform supports midi instruments built-in. */
export function linearToDecibels(linearVolume: number): number {
    return (!isFinite(linearVolume) || linearVolume <= 0)
        ? -Infinity
        : 20 * Math.log10(linearVolume);
}
