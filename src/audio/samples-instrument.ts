import * as Tone from "tone";
import { Instrument, linearToDecibels } from "./instrument";
import { canUseToneJs } from "./can-use-tone-js";
import { Guard, UniMap, ValueSet } from "@tspro/ts-utils-lib";
import { Note } from "web-music-score/theory";

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

function getSemitones(note1: string, note2: string) {
    // Note.getNote() caches notes to Map, does not parse note every time.
    return Note.getNote(note2).chromaticId - Note.getNote(note1).chromaticId;
}

type SamplesJson = {
    name: string;
    gain?: number;
    loop?: boolean;
    loopStart?: number;
    loopEnd?: number;
    samples: Record<string, string | { file: string, loop?: boolean, loopStart?: number, loopEnd?: number }>;
}

class SampleBuffer {
    private audioBuffer: Tone.ToneAudioBuffer | undefined;
    private activePlayers = new ValueSet<Tone.Player>();
    private gainNode: Tone.Gain;

    constructor(
        readonly note: string,
        readonly file: string,
        readonly gain: number,
        readonly loop: boolean,
        readonly loopStart?: number | undefined,
        readonly loopEnd?: number | undefined
    ) {
        this.gainNode = new Tone.Gain(this.gain).toDestination();

        Tone.ToneAudioBuffer.fromUrl(this.file)
            .then(buf => this.audioBuffer = buf)
            .catch(err => console.error("Audio load failed:", err));
    }

    playNote(note: string, duration: number, linearVolume: number) {
        if (!this.audioBuffer || !this.audioBuffer.loaded)
            return;

        const loop = this.loop;
        const loopStart = this.loopStart ?? 0;
        const loopEnd = this.loopEnd ?? this.audioBuffer.duration;

        const player = new Tone.Player({
            url: this.audioBuffer,
            loop,
            loopStart,
            loopEnd
        }).connect(this.gainNode);

        const semitones = getSemitones(this.note, note);

        player.playbackRate = Math.pow(2, semitones / 12);
        player.volume.value = linearToDecibels(linearVolume);

        this.activePlayers.add(player);

        player.onstop = () => {
            this.activePlayers.delete(player);
            player.dispose();
        };

        const now = Tone.now();

        player.start(now, 0);
        player.stop(now + duration);
    }

    stopAll() {
        this.activePlayers.forEach(p => {
            p.stop();
            p.dispose();
        });
        this.activePlayers.clear();
    }
}

export class SamplesInstrument implements Instrument {
    private name: string;
    private sampleBuffers: SampleBuffer[] = [];

    private initialized = false;

    constructor(private readonly jsonUrl: string) {
        // Use json filename as temporary instrument name.
        this.name = splitUrl(jsonUrl).file;
    }

    private loadJson() {
        if (!canUseToneJs()) {
            console.warn("Tone.js not available in this environment.");
            return;
        }

        fetch(this.jsonUrl)
            .then(res => {
                res.json()
                    .then(data => this.parseJson(data))
                    .catch(_ => console.error(`Failed to parse samples json "${this.jsonUrl}".`));
            })
            .catch(_ => console.error(`Failed to fetch samples json "${this.jsonUrl}".`));
    }

    private parseJson(jsonData: SamplesJson) {
        const { base } = splitUrl(this.jsonUrl);

        this.name = String(jsonData.name);

        const gain = Guard.isNumber(jsonData.gain) ? jsonData.gain : 1.0;

        const loopStart = Guard.isNumber(jsonData.loopStart) ? jsonData.loopStart : undefined;
        const loopEnd = Guard.isNumber(jsonData.loopEnd) ? jsonData.loopEnd : undefined;
        const loop = loopStart !== undefined || loopEnd !== undefined;

        for (const note in jsonData.samples) {
            const sample = jsonData.samples[note];
            if (Guard.isString(sample)) {
                const file = base + sample;
                this.sampleBuffers.push(new SampleBuffer(note, file, gain, loop, loopStart, loopEnd));
            }
            else if (Guard.isObject(sample)) {
                const file = base + sample.file;
                if (Guard.isTrue(sample.loop)) {
                    const loop = true;
                    const loopStart = sample.loopStart;
                    const loopEnd = sample.loopEnd;
                    this.sampleBuffers.push(new SampleBuffer(note, file, gain, loop, loopStart, loopEnd));
                }
                else if (Guard.isFalse(sample.loop)) {
                    const loop = false;
                    const loopStart = undefined;
                    const loopEnd = undefined;
                    this.sampleBuffers.push(new SampleBuffer(note, file, gain, loop, loopStart, loopEnd));
                }
                else if (Guard.isUndefined(sample.loop)) {
                    this.sampleBuffers.push(new SampleBuffer(note, file, gain, loop, loopStart, loopEnd));
                }
            }
        }
    }

    initialize() {
        if (this.initialized) return;

        this.loadJson();

        this.initialized = true;
    }

    private closestSampleBufferMap = new UniMap<string, SampleBuffer>();

    private getClosestSampleBuffer(note: string): SampleBuffer | undefined {
        let closestBuf = this.closestSampleBufferMap.get(note);
        if (closestBuf)
            return closestBuf;

        let closestDist = Infinity;
        this.sampleBuffers.forEach(buf => {
            const dist = Math.abs(getSemitones(note, buf.note));
            if (dist < closestDist) {
                closestDist = dist;
                closestBuf = buf;
            }
        });

        if (closestBuf)
            this.closestSampleBufferMap.set(note, closestBuf);

        return closestBuf;
    }

    getName(): string {
        return this.name;
    }

    playNote(note: string, duration: number, linearVolume: number) {
        this.initialize();

        if (!this.initialized) return;

        const buf = this.getClosestSampleBuffer(note);

        if (buf)
            buf.playNote(note, duration, linearVolume);
    }

    stop() {
        if (!this.initialized) return;

        this.sampleBuffers.forEach(buf => buf.stopAll());
    }
}
