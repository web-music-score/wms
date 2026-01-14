import { Assert, CallTracker, Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "web-music-score/core";

const tracker = new CallTracker();

// Show warning message once for each deprecated.
export function warnDeprecated(msg: string) {
    if (!tracker.hasBeenCalledWith(msg))
        console.warn(msg);
    tracker.track(msg);
}

export namespace AssertUtil {
    let assertFunctStr = "";

    function formatArgs(...args: unknown[]) {
        return args
            .map(arg => {
                let s = Utils.Str.stringify(arg)
                if (s.startsWith("Object{") && s.endsWith("}")) s = s.substring(6);
                return s;
            })
            .join(", ");
    }

    export function setClassFunc(className: string, fnName: string, ...fnArgs: unknown[]) {
        assertFunctStr = `${className}.${fnName}(${formatArgs(...fnArgs)})`;
    }

    export function setFunc(fnName: string, ...fnArgs: unknown[]) {
        assertFunctStr = `${fnName}(${formatArgs(...fnArgs)})`;
    }

    export function clearFunc() {
        assertFunctStr = "";
    }

    export function assert(...conditions: boolean[]) {
        if (conditions.some(c => !c))
            throw new MusicError(MusicErrorType.InvalidArg, assertFunctStr);
    }

    export function assertMsg(condition: boolean, msg: string) {
        if (!condition) throw new MusicError(MusicErrorType.InvalidArg, msg);
    }

    export function assertVar(condition: boolean, varName: string, varValue: unknown) {
        if (!condition)
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid value: ${varName} = ${varValue}`);
    }

    export function requireVar<VAR_VALUE>(varName: string, varValue: VAR_VALUE | undefined | null): VAR_VALUE {
        if (varValue == null)
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid value: ${varName} = ${varValue}`);
        return varValue;
    }
}
