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
import { GenericInstrument } from "../generic-instrument";

// Use direct path to instrument.ts in audio module.
// Instrument modules must not depend on the audio module.
import { Instrument } from "../../audio/instrument";

/**
 * Default export is the classical guitar instrument object.
 * 
 * ```ts
 *   // Usage
 *   import * as Audio from "@tspro/web-music-score/audio";
 *   import { ClassicalGuitar } from "@tspro/web-music-score/audio-cg";
 * 
 *   Audio.registerInstrument(ClassicalGuitar);
 * ```
 */
const ClassicalGuitar: Instrument = new GenericInstrument("Classical Guitar", {
    "E2": E2_mp3,
    "A2": A2_mp3,
    "D3": D3_mp3,
    "G3": G3_mp3,
    "B3": B3_mp3,
    "E4": E4_mp3,
    "A4": A4_mp3,
    "E5": E5_mp3,
    "A5": A5_mp3
});

export { ClassicalGuitar }
