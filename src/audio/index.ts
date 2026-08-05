import { init as initCore, MusicError } from "web-music-score/core";
import { getMidiInstrumentName, registerMidiInstruments } from "./midi";
import { getInstrumentList, loadInstrument, setDefaultInstrument, getDefaultInstrument } from "./manage";
import { PlayContext, playNote, stop, mute, unmute, isMuted } from "./playback"

/** Instrument name (string), midi program (number) or undefined. */
type InstrumentValue = string | number | undefined;

export {
    InstrumentValue,
    getInstrumentList,
    loadInstrument,
    getMidiInstrumentName,
    setDefaultInstrument,
    getDefaultInstrument,
    PlayContext,
    playNote,
    stop,
    mute,
    unmute,
    isMuted
};

initCore();

// Add midi instruments
registerMidiInstruments();

// Set Acoustic Grand Piano as default instrument
setDefaultInstrument(getMidiInstrumentName(0)!);

export class AudioError extends MusicError {
    constructor(message: string) {
        super("AudioError", message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}
