import { MusicError } from "@tspro/web-music-score/core";

export function getScoreError(msg: string) {
    return new MusicError("Score Error: " + msg);
}