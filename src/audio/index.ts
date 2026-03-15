import { init as initCore, MusicError, MusicErrorType } from "web-music-score/core";
import { Instrument, linearToDecibels } from "./instrument";
import { Synthesizer } from "web-music-score/audio-synth";
import { getMidiInstrumentName, registerMidiInstruments } from "./midi";
import { getCurrentInstrument, getInstrumentList, addInstrument, preloadInstrument, setDefaultInstrument, getDefaultInstrument, useInstrument } from "./manage";
import { playNote, stop, mute, unmute, isMuted } from "./playback"

/** Instrument name (string), midi program (number) or undefined. */
export type InstrumentValue = string | number | undefined;

export {
    Instrument,
    addInstrument,
    linearToDecibels,
    getInstrumentList,
    preloadInstrument,
    getMidiInstrumentName,
    setDefaultInstrument,
    getDefaultInstrument,
    getCurrentInstrument,
    useInstrument,
    playNote,
    stop,
    mute,
    unmute,
    isMuted
};

initCore();

// Add midi instruments
registerMidiInstruments();

// Add synthesizer for legacy support
addInstrument(Synthesizer);

// Set Acoustic Grand Piano as default instrument
setDefaultInstrument(getMidiInstrumentName(0)!);

export class AudioError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.Audio, message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}
