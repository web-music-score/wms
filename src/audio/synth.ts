import * as Tone from "tone";
import { Instrument } from ".";
import { Utils } from "@tspro/ts-utils-lib";

class Synth implements Instrument {
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

    playNote(note: string, duration?: number, linearVolume?: number) {
        try {
            if (this.audioSource) {
                if (linearVolume !== undefined) {
                    this.audioSource.volume.value = Utils.Math.linearToDecibels(linearVolume);
                }

                this.audioSource.triggerAttackRelease(note, duration ?? "2n");
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

export const Synthesizer = new Synth();
