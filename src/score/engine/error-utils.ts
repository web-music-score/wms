import { MusicError } from "web-music-score/core";

export class ScoreError extends MusicError {
    constructor(message: string) {
        super("ScoreError", message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}