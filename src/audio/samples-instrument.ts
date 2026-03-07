import * as Tone from "tone";
import { Instrument, linearToDecibels } from "./instrument";
import { canUseToneJs } from "./can-use-tone-js";

function splitUrl(url: string) {
    const i = url.lastIndexOf("/");
    return i < 0
        ? {
            base: "",
            file: url
        } : {
            base: url.substring(0, i + 1),
            file: url.substring(i + 1)
        }
}

export class SamplesInstrument implements Instrument {

    private name: string;
    private fileName: string;
    private samples: Record<string, string> = {};
    private audioSource: Tone.Sampler | undefined = undefined;
    private initialized = false;

    constructor(jsonUrl: string) {
        // Use json filename as temporary instrument name.
        this.name = this.fileName = splitUrl(jsonUrl).file;

        if (!canUseToneJs()) {
            console.warn("Tone.js not available in this environment.");
            return;
        }

        fetch(jsonUrl)
            .then(res => {
                res.json()
                    .then(data => this.parseJson(jsonUrl, data))
                    .catch(_ => console.error(`Failed to parse json for instrument "${this.getName()}".`));
            })
            .catch(_ => console.error(`Failed to fetch json for instrument "${this.getName()}".`));
    }

    private parseJson(jsonUrl: string, data: any) {
        const { base } = splitUrl(jsonUrl);

        if (typeof data.instrument === "string")
            this.name = data.instrument;

        for (const note in data.samples) {
            if (typeof data.samples[note] === "string")
                this.samples[note] = base + data.samples[note];
        }
    }

    private initializeOnPlay() {
        if (this.initialized) return;

        try {
            this.audioSource = new Tone.Sampler(this.samples).toDestination();
        }
        catch (e) {
            this.audioSource = undefined;
            console.error(`Failed to initialize instrument "${this.getName()}".`);
        }

        this.initialized = true;
    }

    getName(): string {
        return this.name;
    }

    getFilename(): string {
        return this.fileName;
    }

    playNote(note: string, duration: number, linearVolume: number) {
        this.initializeOnPlay();

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
