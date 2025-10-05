/**
 * Make this module "audio-synth" in typedoc instead of "audio-instruments/audio-synth".
 * @module audio-synth
 */

// Use direct path to instrument.ts in audio module.
// Instrument modules must not depend on the audio module.
import { Instrument, linearToDecibels } from "../../audio/instrument";

import * as Tone from "tone";

class SynthesizerInstr implements Instrument {
    private audioSource: Tone.PolySynth | undefined;

    constructor() {
        try {
            const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination();
            const filter = new Tone.Filter(800, "lowpass").connect(reverb);

            this.audioSource = new Tone.PolySynth(Tone.Synth, {
                oscillator: {
                    type: "triangle"
                },
                envelope: {
                    attack: 0.001,
                    decay: 2,
                    sustain: 0.1,
                    release: 1.2
                }
            }).connect(filter);

        }
        catch (err) {
            this.audioSource = undefined;
            console.error(err);
        }
    }

    getName(): string {
        return "Synthesizer";
    }

    playNote(note: string, duration: number, linearVolume: number) {
        try {
            if (this.audioSource) {
                this.audioSource.volume.value = linearToDecibels(linearVolume);
                this.audioSource.triggerAttackRelease(note, duration);
            }
        }
        catch (err) { }
    }

    stop() {
        try {
            if (this.audioSource) {
                this.audioSource.releaseAll();
            }
        }
        catch (err) { }
    }
}

/**
 * Export synthesizer instrument object.
 * 
 * Synthesizer is default instrument and enabled out of the box.
 */
const Synthesizer: Instrument = new SynthesizerInstr();

export { Synthesizer }