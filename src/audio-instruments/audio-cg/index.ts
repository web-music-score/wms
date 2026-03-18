// Make this module "audio-cg" in typedoc instead of "audio-instruments/audio-cg".
/** @module audio-cg */

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

/** @deprecated This instrument is deprecatedand will be removed in future release. New platform has built-in midi instrument support. */
const ClassicalGuitar: Instrument = new ClassicalGuitarWrapper();

export { ClassicalGuitar }
