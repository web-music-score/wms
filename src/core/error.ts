
/** Music error class. */
export class MusicError extends Error {
    /** @deprecated - Use Error.name property instead. */
    readonly type: string;

    /**
     * Create new music error instance.
     * @param message - Error message.
     */
    constructor(message: string);
    /**
     * Create new musicerror instance.
     * @param name - Eerror name.
     * @param message - Error message.
     */
    constructor(name: string, message: string);
    constructor(...args: [string] | [string, string]) {
        const [name, msg] = args.length === 1
            ? ["MusicError", args[0]]
            : args;

        super(msg);

        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
        this.name = name;
        this.type = name;
    }
}

export class InvalidArgError extends MusicError {
    constructor(message: string) {
        super("InvalidArgError", message);
        Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
    }
}
