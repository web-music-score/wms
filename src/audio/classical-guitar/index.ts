import * as Tone from "tone";
import { InstrumentInterface } from "..";
import E2_mp3 from "./assets/E2.mp3";
import A2_mp3 from "./assets/A2.mp3";
import D3_mp3 from "./assets/D3.mp3";
import G3_mp3 from "./assets/G3.mp3";
import B3_mp3 from "./assets/B3.mp3";
import E4_mp3 from "./assets/E4.mp3";
import A4_mp3 from "./assets/A4.mp3";
import E5_mp3 from "./assets/E5.mp3";
import A5_mp3 from "./assets/A5.mp3";
import { Utils } from "@tspro/ts-utils-lib";

class ClassicalGuitar implements InstrumentInterface {

    private audioSource: Tone.Sampler | undefined;

    constructor() {
        try {
            this.audioSource = new Tone.Sampler({
                urls: {
                    "E2": E2_mp3,
                    "A2": A2_mp3,
                    "D3": D3_mp3,
                    "G3": G3_mp3,
                    "B3": B3_mp3,
                    "E4": E4_mp3,
                    "A4": A4_mp3,
                    "E5": E5_mp3,
                    "A5": A5_mp3
                }
            }).toDestination();
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

export const ClassicalGuitarInstrument = new ClassicalGuitar();
