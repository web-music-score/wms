
/** Enum of music error types. */
export enum MusicErrorType {
    Unknown,
    InvalidArg,
    Score,
    Audio,
    Note,
    Scale,
    KeySignature,
    TimeSignature,
    /** @deprecated Typo, use TimeSignature instead. */
    Timesignature = TimeSignature,
}

function isType(type: unknown): type is MusicErrorType {
    return typeof type === "number" && type in MusicErrorType;
}

function formatType(type: MusicErrorType | undefined): string {
    return type === undefined ? "" : String(MusicErrorType[type]);
}

/** Music error class. */
export class MusicError extends Error {
    /** Music error type. */
    readonly type: MusicErrorType;

    /**
     * Create new music error instance.
     * @param message - Error message.
     */
    constructor(message: string);
    /**
     * Create new musicerror instance.
     * @param type - Music error type.
     * @param message - Error message.
     */
    constructor(type: MusicErrorType, message: string);
    constructor(...args: [string] | [MusicErrorType, string]) {
        const [type, msg] = args.length === 1
            ? [MusicErrorType.Unknown, args[0]]
            : args as [MusicErrorType, string];

        super(`${formatType(type)} ${msg}`);

        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = "MusicError";
        this.type = type;
    }
}
