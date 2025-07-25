import { MusicError } from "@tspro/web-music-score/core";

export function throwScoreError(msg: string): never {
    throw new MusicError("Score Error: " + msg);
}