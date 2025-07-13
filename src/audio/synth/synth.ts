import * as Tone from "tone";
import { InstrumentInterface } from "../audio";
import { Utils } from "@tspro/ts-utils-lib";

class Synth implements InstrumentInterface {
    private audioSource: Tone.PolySynth | undefined;

    constructor() {
        try {
            this.audioSource = new Tone.PolySynth().toDestination();
        }
        catch (err) {
            this.audioSource = undefined;
            console.error(err);
        }
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

export const SynthInstrument = new Synth();
