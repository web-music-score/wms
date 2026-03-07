/**
 * Make this module "audio-cg" in typedoc instead of "audio-instruments/audio-cg".
 * @module audio-cg
 */

/** @deprecated. audio-cg module is deprecated and will be removed in future release. Use built-in synths and samples from web-music-score-samples instead. */

import { Instrument } from "audio/instrument";
import { SamplesInstrument } from "audio/samples-instrument"

class ClassicalGuitarWrapper implements Instrument {
    private samples = new SamplesInstrument("https://cdn.jsdelivr.net/npm/web-music-score-samples@2.0.0/samples/classical-guitar.json");

    getName(): string {
        return "Classical Guitar";
    }

    playNote(note: string, duration: number, linearVolume: number): void {
        this.samples.playNote(note, duration, linearVolume);
    }

    stop(): void {
        this.samples.stop();
    }
}

const ClassicalGuitar: Instrument = new ClassicalGuitarWrapper();

export { ClassicalGuitar }
