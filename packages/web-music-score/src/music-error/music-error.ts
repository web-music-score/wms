import { Assert } from "@tspro/ts-utils-lib";

/** @public */
export class MusicError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "MusicError";
    }
}

Assert.setErrorClass(MusicError);
