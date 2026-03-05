import { Utils } from "@tspro/ts-utils-lib";

export function getClosestString(input: string, candidates: readonly string[]): string | undefined {
    return Utils.Str.getClosestString(input, candidates, 3);
}
