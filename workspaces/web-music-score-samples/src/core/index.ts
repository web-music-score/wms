
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
