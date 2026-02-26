
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

declare global {
    interface Window {
        WebMusicScore?: {
            Samples?: Record<string, InstrumentSamples>;
        };
    }
}

export function addToGlobalName(name: string, samples: InstrumentSamples) {
    if (typeof window === "undefined") return;

    const root = (window.WebMusicScore ??= {});
    const samplesNs = (root.Samples ??= {});

    if (samplesNs[name]) {
        console.warn(`WebMusicScore.Samples.${name} already exists and will be overwritten.`);
    }

    samplesNs[name] = samples;
}
