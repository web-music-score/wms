import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { init as initCore, MusicError, MusicErrorType } from "web-music-score/core";
import { Instrument, InstrumentSamples, linearToDecibels } from "./instrument";
import { Guard, Utils } from "@tspro/ts-utils-lib";
import { SamplerInstrument } from "./sampler-instrument";
import { addBuiltInSynthesizers } from "./built-in-synthesizers";

export { Instrument, InstrumentSamples, linearToDecibels }

initCore();

export class AudioError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.Audio, message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}

function getNoteName(note: Note | number | string) {
    if (typeof note === "string") {
        return note;
    }
    else if (typeof note === "number") {
        // midiNumber
        note = Note.getChromaticNote(note);
    }
    return note.format(PitchNotation.Scientific, SymbolSet.Ascii);
}

const InstrumentList: Instrument[] = [];
let currentInstrument: Instrument;

// Add all builting synthesizers.
addBuiltInSynthesizers();

const DefaultDuration = (function calcDuration(noteSize: number, beatsPerMinute: number, timeTisgnature: string): number {
    let beatSize = parseInt(timeTisgnature.split("/")[1] ?? "4");
    return 60 * (1 / noteSize) / (beatsPerMinute * (1 / beatSize));
})(2, 80, "4/4"); // Half note, 80 bpm, 4/4 time signature.

const DefaultVolume = 1;

let mutePlayback: boolean = false;

/**
 * Get instrument name list.
 * @returns - Array of available instrument names.
 */
export function getInstrumentList(): ReadonlyArray<string> {
    return InstrumentList.map(instr => instr.getName());
}

/**
 * Get current instrument name.
 * @returns - Name of current instrument.
 */
export function getCurrentInstrument(): string {
    return currentInstrument.getName();
}

function _addInstrument(instr: Instrument) {
    const i = InstrumentList.findIndex(testInstr => testInstr.getName() === instr.getName());
    
    if (i < 0) {
        // Add new instrument.
        InstrumentList.push(instr);
    }
    else {
        // Replace existing instrument.
        InstrumentList[i] = instr;
    }

    useInstrument(instr.getName());
}

/**
 * Add and use instrument.
 * @param instrument - Object that implements Instrument interface. Can be single instrument or array of instruments.
 */
export function addInstrument(instrument: Instrument | InstrumentSamples | (Instrument | InstrumentSamples)[]): void {
    for (const instr of Guard.isArray(instrument) ? instrument : [instrument]) {
        if (
            Utils.Obj.hasProperties(instr, ["getName", "getSamples"]) &&
            Guard.isFunction(instr.getName) &&
            Guard.isFunction(instr.getSamples)
        ) {
            const genericInstr = new SamplerInstrument(instr.getName(), instr.getSamples());
            _addInstrument(genericInstr);
        }
        else if (
            Utils.Obj.hasProperties(instr, ["getName", "playNote", "stop"]) &&
            Guard.isFunction(instr.getName) &&
            Guard.isFunction(instr.playNote) &&
            Guard.isFunction(instr.stop)
        ) {
            _addInstrument(instr as Instrument);
        }
        else {
            console.error("Object is not instrument or instrument samples!");
        }
    }
}

/**
 * Set instrument to use in playback.
 * @param instrumentName - Instrument name.
 */
export function useInstrument(instrumentName: string): void {
    if (currentInstrument && instrumentName === currentInstrument.getName())
        return;

    if (currentInstrument)
        currentInstrument.stop();

    let instr = InstrumentList.find(instr => instr.getName() === instrumentName);

    if (instr) {
        currentInstrument = instr;
    }
}

/**
 * Play a note using current instrument.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    if (!mutePlayback) {
        currentInstrument.playNote(getNoteName(note), duration ?? DefaultDuration, linearVolume ?? DefaultVolume);
    }
}

/**
 * Stop playback on current instrument.
 */
export function stop() {
    currentInstrument.stop();
}

/**
 * Mute playback on current instrument.
 */
export function mute() {
    stop();
    mutePlayback = true;
}

/**
 * Unmute playback on current instrument.
 */
export function unmute() {
    mutePlayback = false;
}

/**
 * Is playback muted?
 * @returns True/false.
 */
export function isMuted(): boolean {
    return mutePlayback;
}
