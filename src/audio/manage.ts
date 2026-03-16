import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Instrument } from "./instrument";
import { warnOnce } from "shared-src";
import { getMidiInstrumentName } from "./midi";
import { SamplesInstrument } from "./samples-instrument";
import { InstrumentValue } from ".";

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
 * @deprecated Use getDefaultInstrument() instead.
 */
export function getCurrentInstrument(): string {
    return defaultInstrument;
}

export function registerInstrument(instr: Instrument, name: string): void {
    instrumentMap.set(name, instr);
    defaultInstrument = name;
}

function getValidInstrumentName(instrument?: InstrumentValue): string {
    if (Guard.isNumber(instrument)) {
        const name = getMidiInstrumentName(instrument);
        if (name) {
            return name;
        }
        else {
            warnOnce(`Invalid midi program "${instrument}". Using fallback instrument.`);
            return getFallbackInstrumentName();
        }
    }
    else if (!Guard.isString(instrument)) {
        warnOnce(`Invalid instrument name "${instrument}". Using fallback instrument.`);
        return getFallbackInstrumentName();
    }
    else {
        return instrument;
    }
}

export function getValidInstrumnt(instrument?: InstrumentValue): Instrument {
    let instr = instrumentMap.get(getValidInstrumentName(instrument));

    if (instr) return instr;

    warnOnce(`Instrument "${instrument}" not available. Using fallback instrument.`);

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
    instrument = getValidInstrumentName(instrument);

    if (instrument === defaultInstrument)
        return;

    defaultInstrument = instrument;

    loadInstrument(instrument).catch(err => console.error("Failed to load instrument:", err));
}

/**
 * Get default instrument.
 * @returns Default instrument name.
 */
export function getDefaultInstrument(): string {
    return defaultInstrument;
}

/**
 * Load samples samples to be ready for playback.
 * If instrument is not manually loaded it will be loaded
 * on the run so there might be silent notes in the beginning.
 * 
 * @param instrument - Instrument name (string) or 0-based midi program (number).
 */
export function loadInstrument(instrument: string | number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (Guard.isNumber(instrument)) {
            const name = getMidiInstrumentName(instrument);
            if (name) instrument = name;
            else {
                resolve();
                return;
            }
        }

        const instr = getValidInstrumnt(instrument);

        if (instr instanceof SamplesInstrument) {
            resolve(instr.load());
        }
        else {
            resolve();
        }
    });
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
