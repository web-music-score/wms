
/** @public */
export enum MusicErrorType {
    Unknown,
    InvalidArg,
    Note,
    Scale,
    KeySignature,
    Timesignature,
    Score
}

function formatType(type: MusicErrorType | undefined) {
    return type === undefined ? "" : "[" + MusicErrorType[type] + "] ";
}

/** @public */
export class MusicError extends Error {
    readonly type: MusicErrorType;

    constructor(message: string);
    constructor(type: MusicErrorType, message: string);
    constructor(...args: unknown[]) {
        if (args.length === 1 && typeof args[0] === "string") {
            super(args[0]);
            this.type = MusicErrorType.Unknown;
        }
        else if (args.length === 2 && typeof args[0] === "number" && typeof args[1] === "string") {
            super(formatType(args[0]) + args[1]);
            this.type = args[0];
        }
        else {
            super("Unknown error!");
            this.type = MusicErrorType.Unknown;
        }
        this.name = "MusicError";
    }
}
