
/** @public */
export class MusicError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "MusicError";
    }
}
