import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Instrument } from "./instrument";
import { warnOnce } from "shared-src";
import { Synthesizer } from "web-music-score/audio-synth";
import { getMidiInstrumentName } from "./midi";
import { SamplesInstrument } from "./samples-instrument";

const instrumentMap = new UniMap<string, Instrument>();

let currentInstrument = "";

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

export function registerInstrument(instr: Instrument, name: string): void {
    instrumentMap.set(name, instr);
    currentInstrument = name;
}

export function getInstrumnt(name?: string): Instrument {
    name ??= currentInstrument;

    let instr = instrumentMap.get(name);

    if (instr) return instr;

    warnOnce(`Instrument "${name}" not available. Fallback to Synthesizer.`);

    return Synthesizer;
}

/**
 * Set instrument to use in playback.
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function useInstrument(instrument: string | number): void {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (name) {
            instrument = name;
        }
        else {
            warnOnce(`Invalid midi program (${instrument}). Fallback to Synthesizer.`);
            instrument = Synthesizer.getName();
        }
    }

    if (instrument === currentInstrument)
        return;

    getInstrumnt().stop();

    currentInstrument = instrument;

    initInstrument(instrument);
}

/**
 * Initialize instrument, preload samples to be ready for playback.
 * If instrument is not manually initialized then it will be initialized
 * on the run so there might be silent notes in the beginning.
 * 
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function initInstrument(instrument: string | number): void {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (name) instrument = name;
        else return;
    }

    const instr = getInstrumnt(instrument);

    if (instr instanceof SamplesInstrument)
        instr.initialize();
}

/**
 * Add instrument(s).
 * @param instr - Instrument or array.
 */
export function addInstrument(instr: Instrument | Instrument[]): void {
    if (Guard.isArray(instr)) {
        instr.forEach(instr => addInstrument(instr));
        return;
    }

    if (
        Utils.Obj.hasProperties(instr, ["getName", "playNote", "stop"]) &&
        Guard.isFunction(instr.getName) &&
        Guard.isFunction(instr.playNote) &&
        Guard.isFunction(instr.stop)
    ) {
        registerInstrument(instr, instr.getName());
    }
}
