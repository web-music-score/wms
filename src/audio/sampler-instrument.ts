import * as Tone from "tone";
import { Instrument, linearToDecibels } from "./instrument";
import { canUseToneJs } from "./can-use-tone-js";

export class SamplerInstrument implements Instrument {

    private audioSource: Tone.Sampler | undefined = undefined;

    constructor(private readonly name: string, urls: Record<string, string>) {
        if (!canUseToneJs()) {
            console.warn("Tone.js not available in this environment.");
            return;
        }

        try {
            this.audioSource = new Tone.Sampler({ urls }).toDestination();
        }
        catch (e) {
            this.audioSource = undefined;
            console.error(`Failed to initialize instrument "${this.getName()}".`);
        }
    }

    getName(): string {
        return this.name;
    }

    playNote(note: string, duration: number, linearVolume: number) {
        if (!this.audioSource) {
            return;
        }
        try {
            this.audioSource.volume.value = linearToDecibels(linearVolume * 0.6);
            this.audioSource.triggerAttackRelease(note, duration);
        }
        catch (error) { }
    }

    stop() {
        if (!this.audioSource) {
            return;
        }
        try {
            this.audioSource.releaseAll();
        }
        catch (error) { }
    }
}
