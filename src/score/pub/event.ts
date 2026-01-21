import { MusicError, MusicErrorType } from "web-music-score/core";
import { MMeasure, MScoreRow, MStaff, MTab, MusicInterface } from "./mobjects";
import { WmsView } from "./wms-view";
import { MRenderContext } from "./deprecated";
import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { warnDeprecated } from "shared-src";
import { Utils } from "@tspro/ts-utils-lib";

/** Score event type. */
export type ScoreEventType = "enter" | "leave" | "click";

/** Abstract score event class. */
export abstract class ScoreEvent {
    readonly kind: string = "ScoreEvent";

    static is(event: unknown): event is ScoreEvent {
        return (
            event instanceof ScoreEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type"]) && event.kind === "ScoreEvent"
        );
    }

    constructor(readonly type: ScoreEventType) { }
}

/**
 * Score staff note event for click/enter/leave on staves.
 */
export class ScoreStaffEvent extends ScoreEvent {
    readonly kind: string = "ScoreStaffEvent";

    static is(event: unknown): event is ScoreStaffEvent {
        return (
            event instanceof ScoreStaffEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type", "view", "staff", "measure", "diatonicId", "accidental"]) && event.kind === "ScoreStaffEvent"
        );
    }

    private _note: Note;

    /**
     * @internal
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

    static is(event: unknown): event is ScoreTabEvent {
        return (
            event instanceof ScoreTabEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type", "view", "tab"]) && event.kind === "ScoreTabEvent"
        );
    }

    /**
     * @internal
     */
    constructor(type: ScoreEventType, readonly view: WmsView, readonly tab: MTab) {
        super(type);
    }
}

/**
 * Score staff position event for click/enter/leave staff positions.
 * 
 * @deprecated - ScoreStaffPosEvent is deprecated (since v6.4.0). Will be removed in future release. Use ScoreStaffEvent and ScoreTabEvent instead.
 */
export class ScoreStaffPosEvent extends ScoreEvent {
    /**
     * @internal
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

    static is(event: unknown): event is ScoreObjectEvent {
        return (
            event instanceof ScoreObjectEvent ||
            Utils.Obj.isObject(event) && Utils.Obj.hasProperties(event, ["kind", "type", "view", "objects"]) && event.kind === "ScoreObjectEvent"
        );
    }

    /**
     * @internal
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

/**
 * Score event listener type.
 */
export type ScoreEventListener = (event: ScoreEvent) => void;
