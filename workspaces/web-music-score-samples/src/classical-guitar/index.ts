/**
 * Make this module "audio-cg" in typedoc instead of "audio-instruments/audio-cg".
 * @module audio-cg
 */

// Import audio samples.
import E2_mp3 from "./E2.mp3";
import A2_mp3 from "./A2.mp3";
import D3_mp3 from "./D3.mp3";
import G3_mp3 from "./G3.mp3";
import B3_mp3 from "./B3.mp3";
import E4_mp3 from "./E4.mp3";
import A4_mp3 from "./A4.mp3";
import E5_mp3 from "./E5.mp3";
import A5_mp3 from "./A5.mp3";

// Use direct path to instrument.ts in audio module.
// Instrument modules must not depend on the audio module.
import { addToGlobalName, InstrumentSamples } from "web-music-score-samples/core";

/**
 * Export classical guitar instrument object.
 * 
 * ```ts
 *   // Usage
 *   import * as Audio from "web-music-score/audio";
 *   import { ClassicalGuitar } from "web-music-score/audio-cg";
 * 
 *   Audio.addInstrument(ClassicalGuitar);
 * ```
 */
class ClassicalGuitarSamples implements InstrumentSamples {
    getName(): string {
        return "Classical Guitar";
    }

    getSamples(): Record<string, string> {
        return {
            "E2": E2_mp3,
            "A2": A2_mp3,
            "D3": D3_mp3,
            "G3": G3_mp3,
            "B3": B3_mp3,
            "E4": E4_mp3,
            "A4": A4_mp3,
            "E5": E5_mp3,
            "A5": A5_mp3
        }
    }
}

const ClassicalGuitar: InstrumentSamples = new ClassicalGuitarSamples();

export { ClassicalGuitar }

addToGlobalName("ClassicalGuitar", ClassicalGuitar);
