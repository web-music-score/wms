import { init as initCore, MusicError, MusicErrorType } from "web-music-score/core";
import { Instrument, linearToDecibels } from "./instrument";
import { Synthesizer } from "web-music-score/audio-synth";
import { registerMidiInstruments } from "./midi";
import { getCurrentInstrument, getInstrumentList, addInstrument, initInstrument, useInstrument, getDefaultInstrumentName } from "./manage";
import { playNote, stop, mute, unmute, isMuted } from "./playback"

export {
    Instrument,
    linearToDecibels,
    getCurrentInstrument,
    getInstrumentList,
    addInstrument,
    initInstrument,
    useInstrument,
    playNote,
    stop,
    mute,
    unmute,
    isMuted
};

initCore();

// For legacy support
addInstrument(Synthesizer);

// Add midi instruments
registerMidiInstruments();

useInstrument(getDefaultInstrumentName());

export class AudioError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.Audio, message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}
