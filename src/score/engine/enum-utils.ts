import { Utils } from "@tspro/ts-utils-lib";
import { ScoreError } from "./error-utils";

export function resolveEnumValue<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): Utils.Enum.EnumValue<E> | undefined {
    const normalized = input.toLowerCase();
    return Utils.Enum.getEnumValues(enumObject).find(v => String(v).toLowerCase() === normalized);
}

export function resolveRequiredEnumValue<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): Utils.Enum.EnumValue<E> {
    const enumValue = resolveEnumValue(input, enumObject);
    if (enumValue === undefined)
        throw new ScoreError(`Invalid enum value "${input}" for enum object: ${Utils.Str.stringify(enumObject)}`);
    return enumValue;
}

export function isEnumValueLoose<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): boolean {
    return resolveEnumValue(input, enumObject) !== undefined;
}

