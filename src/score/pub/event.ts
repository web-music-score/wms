import { Assert } from "@tspro/ts-utils-lib";
import { DivRect } from "./div-rect";
import { MRenderer, MScoreRow, MusicInterface } from "./interface";

/** @public */
export type ScoreEventType = "click" | "hover";

/** @public */
export abstract class ScoreEvent {
    constructor(readonly type: ScoreEventType) {}
}

/** @public */
export class ScoreStaffPosEvent extends ScoreEvent {
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly scoreRow: MScoreRow, readonly diatonicId: number) {
        super(type);
    }
}

/** @public */
export class ScoreObjectEvent extends ScoreEvent {
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly objects: MusicInterface[]) {
        super(type);
        Assert.assert(arguments.length > 0, "Score object event empty array!");
    }
    
    get topObject(): MusicInterface {
        return this.objects[this.objects.length - 1];
    }
    
    findObject(fn: (obj: MusicInterface) => boolean): MusicInterface |undefined {
        return this.objects.find(obj => fn(obj));
    }
}

/** @public */
export type ScoreEventListener = (event: ScoreEvent) => void;

/** @public */
export type CursorPositionChangeListener = (cursorRect: DivRect | undefined) => void;
