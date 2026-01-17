import { MusicError, MusicErrorType } from "web-music-score/core";
import { MScoreRow, MusicInterface } from "./mobjects";
import { WmsView } from "./wms-view";
import { MRenderContext } from "./deprecated";
import { warnDeprecated } from "shared-src";

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
     * @param view - View.
     * @param scoreRow - Score row.
     * @param diatonicId - Diatonic id that was clicked/entered/left.
     */
    constructor(type: ScoreEventType, readonly view: WmsView, readonly scoreRow: MScoreRow, readonly diatonicId: number) {
        super(type);
    }

    /**
     * @deprecated - renderContext is deprecated. Will be removed in future release. Use view instead.
     */
    get renderContext(): MRenderContext {
        warnDeprecated("renderContext is deprecated. Will be removed in future release. Use view instead.");
        return this.view;
    }
}

/** Score object event for clicking/entering/leaving score object. */
export class ScoreObjectEvent extends ScoreEvent {
    /**
     * Create new score object event.
     * @param type - Score event type.
     * @param view - View.
     * @param objects - Array of objects, last object in this array is the top object that was clicked/entered/left, previous objects are it's parent objects.
     */
    constructor(type: ScoreEventType, readonly view: WmsView, readonly objects: MusicInterface[]) {
        super(type);

        if (arguments.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Empty array in score object event!");
        }
    }

    /**
     * @deprecated - renderContext is deprecated. Will be removed in future release. Use view instead.
     */
    get renderContext(): MRenderContext {
        warnDeprecated("renderContext is deprecated. Will be removed in future release. Use view instead.");
        return this.view;
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
