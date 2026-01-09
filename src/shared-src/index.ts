import { Assert, CallTracker } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "web-music-score/core";

const tracker = new CallTracker();

// Show warning message once for each deprecated.
export function warnDeprecated(msg: string) {
    if (!tracker.hasBeenCalledWith(msg))
        console.warn(msg);
    tracker.track(msg);
}

export function assertArg(condition: boolean, argName: string, argValue: unknown) {
    if (!condition)
        throw new MusicError(MusicErrorType.InvalidArg, `Invalid arg: ${argName} = ${argValue}`);
}

export function requireT<T>(t: T | undefined | null, message?: string): T {
    return Assert.require(t, message);
}
