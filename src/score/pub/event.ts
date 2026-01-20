import { MusicError, MusicErrorType } from "web-music-score/core";
import { MScoreRow, MStaff, MTab, MusicInterface } from "./mobjects";
import { WmsView } from "./wms-view";
import { MRenderContext } from "./deprecated";
import { Note, PitchNotation, SymbolSet } from "web-music-score/theory";
import { warnDeprecated } from "shared-src";

/** Score event type. */
export type ScoreEventType = "enter" | "leave" | "click";

/** Abstract score event class. */
export abstract class ScoreEvent {
    constructor(readonly type: ScoreEventType) { }
}

/**
 * Score staff position event for click/enter/leave staff positions.
 */
export class ScoreStaffPosEvent extends ScoreEvent {
    private _note?: Note;

    constructor(type: ScoreEventType, readonly view: WmsView, private readonly staffOrRow: MStaff | MScoreRow, readonly diatonicId: number, accidental?: number) {
        super(type);

        this._note = accidental !== undefined ? new Note(diatonicId, accidental) : undefined;
    }

    /**
     * @deprecated - renderContext is deprecated. Will be removed in future release. Use view instead.
     */
    get renderContext(): MRenderContext {
        warnDeprecated("renderContext is deprecated. Will be removed in future release. Use view instead.");
        return this.view;
    }

    /**
     * Staff (since v6.4.0).
     */
    get staff(): MStaff {
        if(this.staffOrRow instanceof MScoreRow)
            throw new MusicError(MusicErrorType.Unknown, "ScoreStaffPosEvent.staff is not supported!");
        return this.staffOrRow;
    }

    /**
     * Row.
     *
     * @deprecated - scoreRow is deprecated. Will be removed in future release. Use staff instead.
     */
    get scoreRow(): MScoreRow {
        return this.staffOrRow instanceof MScoreRow ? this.staffOrRow : this.staffOrRow.getRow();
    }

    /**
     * Note name (since v6.4.0).
     */
    get noteName(): string {
        if(!this._note)
            throw new MusicError(MusicErrorType.Unknown, "ScoreStaffPosEvent.noteName is not supported!");
        return this._note.format(PitchNotation.Scientific, SymbolSet.Ascii);
    }

    /**
     * Diatonic class (since v6.4.0).
     */
    get diatonicClass(): number {
        if(!this._note)
            throw new MusicError(MusicErrorType.Unknown, "ScoreStaffPosEvent.diatonicClass is not supported!");
        return this._note.diatonicClass;
    }

    /**
     * Chromatic id (since v6.4.0).
     */
    get chromaticId(): number {
        if(!this._note)
            throw new MusicError(MusicErrorType.Unknown, "ScoreStaffPosEvent.chromaticId is not supported!");
        return this._note.chromaticId;
    }

    /**
     * Chromatic class (since v6.4.0).
     */
    get chromaticClass(): number {
        if(!this._note)
            throw new MusicError(MusicErrorType.Unknown, "ScoreStaffPosEvent.chromaticClass is not supported!");
        return this._note.chromaticClass;
    }

    /**
     * Midi number (since v6.4.0).
     */
    get midiNumber(): number {
        if(!this._note)
            throw new MusicError(MusicErrorType.Unknown, "ScoreStaffPosEvent.midiNumber is not supported!");
        return this._note.midiNumber;
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
