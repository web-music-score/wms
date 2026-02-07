import { MusicError, MusicErrorType } from "web-music-score/core";

export class ScoreError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.Score, message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}