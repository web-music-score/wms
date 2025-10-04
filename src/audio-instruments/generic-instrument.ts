import * as Tone from "tone";

// Use direct path to instrument.ts in audio module.
// Instrument modules must not depend on the audio module.
import { Instrument, linearToDecibels } from "../audio/instrument";

export class GenericInstrument implements Instrument {

    private audioSource: Tone.Sampler | undefined = undefined;

    constructor(private readonly name: string, urls: Record<string, string>) {
        try {
            this.audioSource = new Tone.Sampler({ urls }).toDestination();
        }
        catch (error) {
            console.error(`Failed to initialize instrument "${name}".`);
            console.error(error);
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
