import { CallTracker } from "@tspro/ts-utils-lib";

const tracker = new CallTracker();

// Show warning message once for each message.
export function warnOnce(msg: string) {
    if (!tracker.hasBeenCalledWith(msg))
        console.warn(msg);
    tracker.track(msg);
}
