
export enum MusicErrorType {
    Unknown,
    InvalidArg,
    Note,
    Scale,
    KeySignature,
    Timesignature,
    Score
}
function isType(type: unknown): type is MusicErrorType {
    return typeof type === "number" && type in MusicErrorType;
}

function formatType(type: MusicErrorType | undefined): string {
    return type === undefined ? "" : `[${MusicErrorType[type]}] `;
}

export class MusicError extends Error {
    readonly type: MusicErrorType;

    constructor(message: string);
    constructor(type: MusicErrorType, message: string);
    constructor(...args: [string] | [MusicErrorType, string]) {
        const [type, msg] = args.length === 1
            ? [MusicErrorType.Unknown, args[0]]
            : args as [MusicErrorType, string];

        super(formatType(type) + msg);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain

        this.name = "MusicError";
        this.type = type;
    }
}
