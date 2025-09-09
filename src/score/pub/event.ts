import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { MRenderer, MScoreRow, MusicInterface } from "./interface";

export type ScoreEventType = "enter" | "leave" | "click";

export abstract class ScoreEvent {
    constructor(readonly type: ScoreEventType) { }
}

export class ScoreStaffPosEvent extends ScoreEvent {
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly scoreRow: MScoreRow, readonly diatonicId: number) {
        super(type);
    }
}

export class ScoreObjectEvent extends ScoreEvent {
    constructor(type: ScoreEventType, readonly renderer: MRenderer, readonly objects: MusicInterface[]) {
        super(type);
        if (arguments.length === 0) {
            throw new MusicError(MusicErrorType.Score, "Empty array in score object event!");
        }
    }

    get topObject(): MusicInterface {
        return this.objects[this.objects.length - 1];
    }

    findObject(fn: (obj: MusicInterface) => boolean): MusicInterface | undefined {
        return this.objects.find(obj => fn(obj));
    }
}

export type ScoreEventListener = (event: ScoreEvent) => void;
