
/** Music error class. */
export class MusicError extends Error {
    /** Music error type. */
    readonly type: string;

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
    constructor(type: string, message: string);
    constructor(...args: [string] | [string, string]) {
        const [type, msg] = args.length === 1
            ? ["MusicError", args[0]]
            : args;

        super(`${type}: ${msg}`);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
        this.type = type;
    }
}

export class InvalidArgError extends MusicError {
    constructor(message: string) {
        super("InvalidArgError", message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = new.target.name;
    }
}
