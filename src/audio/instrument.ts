
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

export function linearToDecibels(linearVolume: number): number {
    return (!isFinite(linearVolume) || linearVolume <= 0)
        ? -Infinity
        : 20 * Math.log10(linearVolume);
}
