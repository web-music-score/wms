import { Utils } from "@tspro/ts-utils-lib";
import { InvalidArgError } from "web-music-score/core";
import { getClosestString } from "./closest-string";

export function resolveEnumValue<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): Utils.Enum.EnumValue<E> | undefined {
    const normalized = input.toLowerCase();
    return Utils.Enum.getEnumValues(enumObject).find(v => String(v).toLowerCase() === normalized);
}

export function resolveRequiredEnumValue<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): Utils.Enum.EnumValue<E> {
    const enumValue = resolveEnumValue(input, enumObject);
    if (enumValue === undefined)
        throw new InvalidArgError(`Invalid enum value "${input}" for enum object: ${Utils.Str.stringify(enumObject)}`);
    return enumValue;
}

export function isEnumValueLoose<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): boolean {
    return resolveEnumValue(input, enumObject) !== undefined;
}

export function getClosestEnumValue<E extends Utils.Enum.EnumObject>(input: string, enumObject: E): Utils.Enum.EnumValue<E> | undefined {
    return getClosestString(input, Utils.Enum.getEnumValues(enumObject).map(e => e.toString())) as Utils.Enum.EnumValue<E> | undefined;
}
