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
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly row: MScoreRow, readonly diatonicId: number) {
        super(type);
    }
}

/** @public */
export class ScoreObjectEvent extends ScoreEvent {
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly arr: MusicInterface[]) {
        super(type);
        Assert.assert(arguments.length > 0, "Score object event empty array!");
    }
    get top(): MusicInterface {
        return this.arr[this.arr.length - 1];
    }
    find(fn: (obj: MusicInterface) => boolean): MusicInterface |undefined {
        return this.arr.find(obj => fn(obj));
    }
}

/** @public */
export type ScoreEventListener = (event: ScoreEvent) => void;

/** @public */
export type CursorPositionChangeListener = (cursorRect: DivRect | undefined) => void;
