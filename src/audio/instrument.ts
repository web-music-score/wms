
/**
 * Instrument interface.
 * <p>To create your own instrument just create a class that implement this simple interface.</p>
 * 
 * ```ts
 *   import * as Audio from "@tspro/web-music-score/audio";
 * 
 *   class CoolInstrument implements Audio.Instrument {
 *       constructor() { }
 *       getName() { return "Cool Instrument"; }
 *       playNote(note: string, duration: number, linearVolume: number) { }
 *       stop() { }
 *   }
 * 
 *   // Register and activate.
 *   Audio.registerInstrument(new CoolInstrument());
 * ```
 */
export interface Instrument {
    /**
     * Get instrument name.
     * @return - Instrument name.
     */
    getName(): string;
    
    /**
     * Play a note.
     * @param note - Note to play (e.g. "C4").
     * @param duration - Play duration in seconds.
     * @param linearVolume - Linear volume in range [0, 1].
     */
    playNote(note: string, duration: number, linearVolume: number): void;
    
    /**
     * Stop playback.
     */
    stop(): void;
}

/**
 * Linear to decibel volume converter, can be useful with instruments.
 * @param linearVolume - Linear volume 0..1.
 * @returns - DEcibel volume.
 */
export function linearToDecibels(linearVolume: number): number {
    if (!isFinite(linearVolume)) {
        throw new Error("linearToDecibel: Invalid linearVolume = " + linearVolume);
    }
    else if (linearVolume <= 0) {
        return -Infinity;
    }
    else {
        return 20 * Math.log10(linearVolume);
    }
}
