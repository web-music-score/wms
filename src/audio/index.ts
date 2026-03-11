import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { init as initCore, MusicError, MusicErrorType } from "web-music-score/core";
import { Instrument, linearToDecibels } from "./instrument";
import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Synthesizer } from "web-music-score/audio-synth";
import { SamplesInstrument } from "./samples-instrument";
import { warnOnce } from "shared-src";
import { getMidiInstrumentName } from "./midi";

export { Instrument, linearToDecibels }

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

const instrumentMap = new UniMap<string, Instrument>();
let currentInstrument = "";

addInstrument(Synthesizer);

const samples = [
    ["000-acoustic-grand-piano", "Acoustic Grand Piano"],
    ["001-bright-acoustic-piano", "Bright Acoustic Piano"],
    ["002-electric-grand-piano", "Electric Grand Piano"],
    ["004-electric-piano-1", "Electric Piano 1"],
    ["006-harpsichord", "Harpsichord"],
    ["009-glockenspiel", "Glockenspiel"],
    ["013-xylophone", "Xylophone"],
    ["019-church-organ", "Church Organ"],
    ["024-acoustic-guitar-nylon", "Acoustic Guitar (nylon)"],
    ["025-acoustic-guitar-steel", "Acoustic Guitar (steel)"],
    ["026-electric-guitar-jazz", "Electric Guitar (jazz)"],
    ["027-electric-guitar-clean", "Electric Guitar (clean)"],
    ["032-acoustic-bass", "Acoustic Bass"],
    ["033-electric-bass-finger", "Electric Bass (finger)"],
    ["040-violin", "Violin"],
    ["041-viola", "Viola"],
    ["042-cello", "Cello"],
    ["046-orchestral-harp", "Orchestral Harp"],
    ["052-choir-aahs", "Choir Aahs"],
    ["056-trumpet", "Trumpet"],
    ["057-trombone", "Trombone"],
    ["071-clarinet", "Clarinet"],
    ["073-flute", "Flute"],
    ["075-pan-flute", "Pan Flute"],
    ["074-recorder", "Recorder"],
    ["079-ocarina", "Ocarina"],
    ["080-lead-1-square", "Lead 1 (square)"],
];

// const samplesBaseUrl = "https://cdn.jsdelivr.net/npm/web-music-score-samples@3.0.0/";
const samplesBaseUrl = "http://localhost:3000/";

for (const [folder, name] of samples) {
    addInstrument(`${samplesBaseUrl}/samples/${folder}/samples.json`, name);
}

currentInstrument = Synthesizer.getName();

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
    return [...instrumentMap.keys()];
}

/**
 * Get current instrument name.
 * @returns - Name of current instrument.
 */
export function getCurrentInstrument(): string {
    return currentInstrument;
}

/**
 * Add instrument.
 * @param samplesJson - Url to samples json file.
 * @param instrumentName - Optional instrument name. If not given then instrument is added only after fetched name from the json.
 */
export function addInstrument(samplesJson: string, instrumentName?: string): void;
/**
 * Add instrument.
 * @param instrument - Instrument.
 */
export function addInstrument(instrument: Instrument): void;
/**
 * Add multiple instruments.
 * @param instrument - Instrument array.
 */
export function addInstrument(instrumentArr: Instrument[]): void;
export function addInstrument(instr: Instrument | Instrument[] | string, instrumentName?: string): void {
    if (Guard.isArray(instr)) {
        instr.forEach(instr => addInstrument(instr));
        return;
    }

    if (Guard.isString(instr)) {
        if (Guard.isString(instrumentName)) {
            instrumentMap.set(instrumentName, new SamplesInstrument(instr));
            currentInstrument = instrumentName;
        }
        else {
            function onLoad(instr: SamplesInstrument) {
                instrumentMap.set(instr.getName(), instr);
                currentInstrument = instr.getName();
            }
            new SamplesInstrument(instr, onLoad);
        }
    }
    else if (
        Utils.Obj.hasProperties(instr, ["getName", "playNote", "stop"]) &&
        Guard.isFunction(instr.getName) &&
        Guard.isFunction(instr.playNote) &&
        Guard.isFunction(instr.stop)
    ) {
        instrumentMap.set(instr.getName(), instr);
        currentInstrument = instr.getName();
    }
    else {
        console.error("Invalid instrument!");
    }
}

function getInstrForPlayback(): Instrument {
    let instr = instrumentMap.get(currentInstrument);

    if (instr) return instr;

    warnOnce(`Instrument "${currentInstrument}" not available. Fallback to Synthesizer.`);

    return Synthesizer;
}

/**
 * Set instrument to use in playback.
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function useInstrument(instrument: string | number): void {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (!name)
            throw new AudioError(`Invalid midi program number "${instrument}".`);
        instrument = name;
    }

    if (instrument === currentInstrument)
        return;

    getInstrForPlayback().stop();

    currentInstrument = instrument;

    initInstrument(instrument);
}

/**
 * Initialize instrument, load samples to be ready for playback.
 * If instrument is not manually initialized then it will be initialized
 * on the run so there might be silent notes in the beginning.
 * 
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function initInstrument(instrument: string | number): void {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (!name)
            throw new AudioError(`Invalid midi program number "${instrument}".`);
        instrument = name;
    }

    const instr = instrumentMap.get(instrument);

    if (instr instanceof SamplesInstrument)
        instr.initialize();
}

/**
 * Play a note using current instrument.
 * @param note - Note instance of Note object, note name (e.g. "C4"), or midiNumber.
 * @param duration - Play duration in seconds.
 * @param linearVolume - Linear volume in range [0, 1].
 */
export function playNote(note: Note | string | number, duration?: number, linearVolume?: number) {
    if (!mutePlayback) {
        getInstrForPlayback().playNote(getNoteName(note), duration ?? DefaultDuration, linearVolume ?? DefaultVolume);
    }
}

/**
 * Stop playback on current instrument.
 */
export function stop() {
    getInstrForPlayback().stop();
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
