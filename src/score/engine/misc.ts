import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export function throwScoreError(message: string): never {
    throw new MusicError(MusicErrorType.Score, message);
}
