import { Instrument, linearToDecibels } from "./instrument";
import { canUseToneJs } from "./can-use-tone-js";
import * as Tone from "tone";
import { addInstrument, useInstrument } from ".";
import { Synthesizer } from "web-music-score/audio-synth";

class SynthesizerCreator implements Instrument {
    private audioSource: Tone.PolySynth | undefined = undefined;

    constructor(readonly name: string, createaudioSource: () => Tone.PolySynth) {
        if (!canUseToneJs()) {
            console.warn("Tone.js not available in this environment.");
            return;
        }

        try {
            this.audioSource = createaudioSource();
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

function createPiano() {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    const filter = new Tone.Filter(2500, "lowpass").connect(reverb);

    const piano = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
            attack: 0.001,
            decay: 1.2,
            sustain: 0.05,
            release: 1
        }
    }).connect(filter);

    return piano;
}

function createElectricPiano() {
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination();

    const ep = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.01,
            decay: 1.5,
            sustain: 0.4,
            release: 1.5
        },
        modulation: { type: "square" },
        modulationEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0,
            release: 0.2
        }
    }).connect(reverb);

    return ep;
}

function createAcousticGuitar() {
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.25 }).toDestination();
    const filter = new Tone.Filter(3000, "lowpass").connect(reverb);

    const guitar = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
            attack: 0.001,
            decay: 0.8,
            sustain: 0.05,
            release: 0.8
        }
    }).connect(filter);

    return guitar;
}
function createElectricGuitar() {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();

    const guitar = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 1.5,
        envelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0.4,
            release: 1
        },
        modulationEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0,
            release: 0.2
        }
    }).connect(reverb);

    return guitar;
}

function createViolin() {
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination();
    const filter = new Tone.Filter(3500, "lowpass").connect(reverb);

    const violin = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: {
            attack: 0.3,
            decay: 0.2,
            sustain: 0.8,
            release: 1.5
        }
    }).connect(filter);

    return violin;
}

function createCello() {
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination();
    const filter = new Tone.Filter(1200, "lowpass").connect(reverb);

    const cello = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: {
            attack: 0.4,
            decay: 0.3,
            sustain: 0.9,
            release: 2
        }
    }).connect(filter);

    return cello;
}

function createFlute() {
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination();
    const filter = new Tone.Filter(1800, "lowpass").connect(reverb);

    const flute = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.2,
            decay: 0.1,
            sustain: 0.9,
            release: 1
        }
    }).connect(filter);

    return flute;
}

function createTrumpet() {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();

    const trumpet = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1,
        modulationIndex: 15,
        envelope: {
            attack: 0.05,
            decay: 0.3,
            sustain: 0.7,
            release: 0.8
        }
    }).connect(reverb);

    return trumpet;
}

function createOrgan() {
    const organ = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "square" },
        envelope: {
            attack: 0.05,
            decay: 0,
            sustain: 1,
            release: 0.2
        }
    }).toDestination();

    return organ;
}

export function addBuiltInSynthesizers() {
    addInstrument(new SynthesizerCreator("Piano (Synth)", createPiano));
    addInstrument(new SynthesizerCreator("Electric Piano (Synth)", createElectricPiano));
    addInstrument(new SynthesizerCreator("Acoustic Guitar (Synth)", createAcousticGuitar));
    addInstrument(new SynthesizerCreator("Electric Guitar (Synth)", createElectricGuitar));
    addInstrument(new SynthesizerCreator("Violin (synth)", createViolin));
    addInstrument(new SynthesizerCreator("Cello (Synth)", createCello));
    addInstrument(new SynthesizerCreator("Flute (Synth)", createFlute));
    addInstrument(new SynthesizerCreator("Trumpet (Synth)", createTrumpet));
    addInstrument(new SynthesizerCreator("Organ (Synth)", createOrgan));
    
    // Old default synthesizer
    addInstrument(Synthesizer);

    useInstrument("Piano (Synth)");
}