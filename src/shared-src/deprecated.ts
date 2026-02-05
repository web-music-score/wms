import { CallTracker, Utils } from "@tspro/ts-utils-lib";

const tracker = new CallTracker();

// Show warning message once for each deprecated.
export function warnDeprecated(msg: string) {
    if (!tracker.hasBeenCalledWith(msg))
        console.warn(msg);
    tracker.track(msg);
}
