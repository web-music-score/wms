import { MMeasure, MScoreRow, MStaff, MTab, MusicInterface } from "./mobjects";
import { WmsView } from "./wms-view";
import { MRenderContext } from "./deprecated";
import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { warnDeprecated } from "shared-src";
import { Utils } from "@tspro/ts-utils-lib";
import { ScoreError } from "../engine/error-utils";

/** Score event type. */
export type ScoreEventType = "enter" | "leave" | "click";

/**
 * Abstract base class for score events.
 */
export abstract class ScoreEvent {
    readonly kind: string = "ScoreEvent";

    static is(event: unknown): event is ScoreEvent {
        return (
            event instanceof ScoreEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type"]) && event.kind === "ScoreEvent"
        );
    }

    /**
     * 
     * @param type - Event type: "enter", "leave" or "click". 
     */
    constructor(readonly type: ScoreEventType) { }
}

/**
 * Score staff note event for click/enter/leave on staves.
 */
export class ScoreStaffEvent extends ScoreEvent {
    readonly kind: string = "ScoreStaffEvent";

    /**
     * Replacement for <code>event instanceof ScoreStaffEvent</code>.
     */
    static is(event: unknown): event is ScoreStaffEvent {
        return (
            event instanceof ScoreStaffEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type", "view", "staff", "measure", "diatonicId", "accidental"]) && event.kind === "ScoreStaffEvent"
        );
    }

    private _note: Note;

    /**
     * 
     * @param type - Event type: "enter", "leave" or "click".
     * @param view - Score.WmsView object.
     * @param staff 
     * @param measure 
     * @param diatonicId 
     * @param accidental 
     */
    constructor(type: ScoreEventType, readonly view: WmsView, readonly staff: MStaff, readonly measure: MMeasure, readonly diatonicId: number, readonly accidental: number) {
        super(type);

        this._note = new Note(diatonicId, accidental);
    }

    get noteName(): string {
        return this._note.format(PitchNotation.Scientific, SymbolSet.Ascii);
    }

    get diatonicClass(): number {
        return this._note.diatonicClass;
    }

    get chromaticId(): number {
        return this._note.chromaticId;
    }

    get chromaticClass(): number {
        return this._note.chromaticClass;
    }

    get midiNumber(): number {
        return this._note.midiNumber;
    }

}

/**
 * Score tab event for click/enter/leave on tabs.
 *
 * Note! Not yet implemented, reserved for future.
 */
export class ScoreTabEvent extends ScoreEvent {
    readonly kind: string = "ScoreTabEvent";

    /**
     * Replacement for <code>event instanceof ScoreTabEvent</code>.
     */ 
    static is(event: unknown): event is ScoreTabEvent {
        return (
            event instanceof ScoreTabEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type", "view", "tab"]) && event.kind === "ScoreTabEvent"
        );
    }

    /**
     * 
     * @param type - Event type: "enter", "leave" or "click".
     * @param view - Score.WmsView object.
     * @param tab 
     */
    constructor(type: ScoreEventType, readonly view: WmsView, readonly tab: MTab) {
        super(type);
    }
}

/**
 * Score staff pos event.
 * 
 * This event class was deprecated because it does not support multiple staves or tabs per score row.
 * 
 * @deprecated - ScoreStaffPosEvent is deprecated. Will be removed in future release. Use ScoreStaffEvent and ScoreTabEvent instead.
 */
export class ScoreStaffPosEvent extends ScoreEvent {
    /**
     * 
     * @param type - Event type: "enter", "leave" or "click".
     * @param view - Score.WmsView object.
     * @param scoreRow
     * @param diatonicId
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

/**
 * Score object event for clicking/entering/leaving score object.
 */
export class ScoreObjectEvent extends ScoreEvent {
    readonly kind: string = "ScoreObjectEvent";

    /**
     * Replacement for <code>event instanceof ScoreObjectEvent</code>.
     */ 
    static is(event: unknown): event is ScoreObjectEvent {
        return (
            event instanceof ScoreObjectEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type", "view", "objects"]) && event.kind === "ScoreObjectEvent"
        );
    }

    /**
     * 
     * @param type - Event type: "enter", "leave" or "click".
     * @param view - Score.WmsView object.
     * @param objects - Objects from root (first) to top (last).
     */
    constructor(type: ScoreEventType, readonly view: WmsView, readonly objects: MusicInterface[]) {
        super(type);

        if (arguments.length === 0)
            throw new ScoreError("Empty objects array in ScoreObjectEvent!");
    }

    /**
     * @deprecated - renderContext is deprecated. Will be removed in future release. Use view instead.
     */
    get renderContext(): MRenderContext {
        warnDeprecated("renderContext is deprecated. Will be removed in future release. Use view instead.");
        return this.view;
    }

    /** Top object. */
    get topObject(): MusicInterface {
        return this.objects[this.objects.length - 1];
    }

    /**
     * Find object.
     * @param fn - Compare function.
     * @param topToBottom - Find from top to bottom or from bottom to top (default if omitted).
     * @returns - First object that matched compare function, or undefined if no match.
     */
    findObject(fn: (obj: MusicInterface) => boolean, topToBottom = false): MusicInterface | undefined {
        if (topToBottom) {
            for (let i = this.objects.length - 1; i >= 0; i--) {
                if (fn(this.objects[i])) return this.objects[i];
            }
        }
        else {
            for (let i = 0; i < this.objects.length; i++) {
                if (fn(this.objects[i])) return this.objects[i];
            }
        }
        return undefined;
    }
}

/**
 * Score event listener type.
 */
export type ScoreEventListener = (event: ScoreEvent) => void;
