import * as Tone from "tone";

// Use direct paths. Instrument modules must not depend on the audio module.
import { Instrument, linearToDecibels } from "../audio/instrument";
import { canUseToneJs } from "../audio/can-use-tone-js";

export class GenericInstrument implements Instrument {

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
