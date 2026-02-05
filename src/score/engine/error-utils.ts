import { MusicError, MusicErrorType } from "web-music-score/core";

export class ScoreError extends MusicError {
    constructor(message: string) {
        super(MusicErrorType.Score, message);
    }
}