import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { MRenderer, MScoreRow, MusicInterface } from "./interface";

/** Score event type. */
export type ScoreEventType = "enter" | "leave" | "click";

/** Abstract score event class. */
export abstract class ScoreEvent {
    /**
     * Create new score event instance.
     * @param type - Score event type.
     */
    constructor(readonly type: ScoreEventType) { }
}

/** Score staff position event for clicking/entering/leaving staff position (diatonic id) in staff notation line. */
export class ScoreStaffPosEvent extends ScoreEvent {
    /**
     * Create new score staff position event.
     * @param type - Score event type.
     * @param renderer - Renderer.
     * @param scoreRow - Score row.
     * @param diatonicId - Diatonic id that was clicked/entered/left.
     */
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly scoreRow: MScoreRow, readonly diatonicId: number) {
        super(type);
    }
}

/** Score object event for clicking/entering/leaving score object. */
export class ScoreObjectEvent extends ScoreEvent {
    /**
     * Create new score object event.
     * @param type - Score event type.
     * @param renderer - Renderer.
     * @param objects - Array of objects, last object in this array is the top object that was clicked/entered/left, previous objects are it's parent objects.
     */
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly objects: MusicInterface[]) {
        super(type);
        if (arguments.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Empty array in score object event!");
        }
    }

    /** Top object getter. */
    get topObject(): MusicInterface {
        return this.objects[this.objects.length - 1];
    }

    /**
     * Find object.
     * @param fn - Compare function.
     * @returns - First object that matched compare function, or undefined if no match.
     */
    findObject(fn: (obj: MusicInterface) => boolean): MusicInterface | undefined {
        return this.objects.find(obj => fn(obj)); // TODO: Should be reversed?
    }
}

/** Score event listener type. */
export type ScoreEventListener = (event: ScoreEvent) => void;
