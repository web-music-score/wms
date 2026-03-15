import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Instrument } from "./instrument";
import { warnOnce } from "shared-src";
import { getMidiInstrumentName } from "./midi";
import { SamplesInstrument } from "./samples-instrument";

const instrumentMap = new UniMap<string, Instrument>();

let defaultInstrument = "";

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
    return defaultInstrument;
}

export function registerInstrument(instr: Instrument, name: string): void {
    instrumentMap.set(name, instr);
    defaultInstrument = name;
}

export function getInstrumntForPlayback(name?: string): Instrument {
    name ??= getDefaultInstrument();

    let instr = instrumentMap.get(name);

    if (instr) return instr;

    warnOnce(`Instrument "${name}" not available. Using fallback instrument.`);

    return getFallbackInstrument();
}

/**
 * @deprecated Use setDefaultInstrument() instead.
 */
export function useInstrument(instrument: string | number): void {
    setDefaultInstrument(instrument);
}

/**
 * Set default instrument to use in playback.
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function setDefaultInstrument(instrument: string | number): void {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (name) {
            instrument = name;
        }
        else {
            warnOnce(`Invalid midi program "${instrument}". Using fallback instrument.`);
            instrument = getFallbackInstrumentName();
        }
    }
    else if (!Guard.isString(instrument)) {
        warnOnce(`Invalid instrument name "${instrument}". Using fallback instrument.`);
        instrument = getFallbackInstrumentName();
    }

    if (instrument === defaultInstrument)
        return;

    defaultInstrument = instrument;

    preloadInstrument(instrument);
}

/**
 * Get default instrument.
 * @returns Default instrument name.
 */
export function getDefaultInstrument(): string {
    return defaultInstrument;
}

/**
 * Preload samples samples to be ready for playback.
 * If instrument is not manually preloaded it will be loaded
 * on the run so there might be silent notes in the beginning.
 * 
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function preloadInstrument(instrument: string | number): void {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (name) instrument = name;
        else return;
    }

    const instr = getInstrumntForPlayback(instrument);

    if (instr instanceof SamplesInstrument)
        instr.initialize();
}

/**
 * Add instrument(s).
 * 
 * @deprecated Midi instruments are supported.
 * 
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

export function getFallbackInstrumentName(): string {
    return getMidiInstrumentName(0)!;
}

export function getFallbackInstrument(): Instrument {
    return instrumentMap.get(getFallbackInstrumentName())!;
}
