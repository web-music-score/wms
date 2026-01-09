import { Assert, Guard, Utils } from "@tspro/ts-utils-lib";
import { RenderContext } from "../engine/render-context";
import { StaffSize } from "./types";
import { ScoreEventListener } from "./event";
import { MDocument, MScoreRow, MusicInterface } from "./mobjects";
import { Paint } from "./paint";
import { MusicError, MusicErrorType } from "web-music-score/core";

function assertArg(condition: boolean, argName: string, argValue: unknown) {
    if (!condition)
        throw new MusicError(MusicErrorType.Score, `Invalid arg: ${argName} = ${argValue}`);
}

function require_t<T>(t: T | undefined | null, message?: string): T {
    return Assert.require(t, message);
}

export class WmsView {
    private readonly _rc: RenderContext;

    /**
     * Create new render context instance.
     */
    constructor() {
        this._rc = new RenderContext(this);
    }

    /**
     * Set Paint for this render context.
     * @param paint - Paint.
     * @returns - This render context instance.
     */
    setPaint(paint?: Paint) {
        assertArg(Guard.isUndefined(paint) || paint instanceof Paint, "paint", paint);

        this._rc.setPaint(paint);
        return this;
    }

    /**
     * Attach music document to this render context.
     * @param mdoc - Music document.
     * @returns - This render context instance.
     */
    setDocument(mdoc?: MDocument): WmsView {
        assertArg(Guard.isUndefined(mdoc) || mdoc instanceof MDocument, "mdoc", mdoc);

        this._rc.setDocument(mdoc?.getMusicObject());
        return this;
    }

    /**
     * Set target canvas html element for this render context.
     * @param canvas - HTML canvas element or element id.
     * @returns - This render context instance.
     */
    setCanvas(canvas: HTMLCanvasElement | string): WmsView {

        canvas = require_t(Utils.Dom.getCanvas(canvas), typeof canvas === "string"
            ? "Cannot set render canvas because invalid canvas id: " + canvas
            : "Cannot set render canvas because given canvas is undefined.");
        this._rc.setCanvas(canvas);
        return this;
    }

    /**
     * Set zoom level.
     * @param zoom - zoom level, default is 1.0.
     * @returns - This render context instance.
     */
    setZoom(zoom: number = 1.0): WmsView {
        assertArg(Guard.isNumberGt(zoom, 0) && Guard.isFinite(zoom), "zoom", zoom);
        this._rc.setZoom(zoom);
        return this;
    }

    /**
     * Set staff size, distance between top and bottom staff lines.
     * @param staffSize - staff size e.g. 24, "24", "24px", "1cm", etc.
     * @returns - This render context instance.
     */
    setStaffSize(staffSize: StaffSize = "default"): WmsView {
        assertArg(
            Guard.isNonEmptyString(staffSize) ||
            Guard.isNumberGt(staffSize, 0) && Guard.isFinite(staffSize),
            "staffSize", staffSize
        );
        this._rc.setStaffSize(staffSize);
        return this;
    }

    /**
     * Set score event listener.
     * @param scoreEventListener - Score event listener.
     */
    setScoreEventListener(scoreEventListener: ScoreEventListener) {
        assertArg(Guard.isFunctionOrUndefined(scoreEventListener), "scoreEventListener", scoreEventListener);
        this._rc.setScoreEventListener(scoreEventListener);
    }

    /**
     * Draw given music object hilighted.
     * @param obj - Music object or undefined to remove hilighting.
     */
    hilightObject(obj?: MusicInterface) {
        this._rc.hilightObject(obj?.getMusicObject());
    }

    /**
     * Draw given staff position hilighted.
     * @param staffPos - Staff position (score row and diatonic id) or undefined to remove hilighting.
     */
    hilightStaffPos(staffPos?: { scoreRow: MScoreRow, diatonicId: number }) {
        this._rc.hilightStaffPos(staffPos ? {
            scoreRow: staffPos.scoreRow.getMusicObject(),
            diatonicId: staffPos.diatonicId
        } : undefined);
    }

    /**
     * Draw contents of attached music document to attached canvas.
     */
    draw() {
        try {
            this._rc.draw();
        }
        catch (err) {
            console.log("Draw failed in music render context!", err);
        }
    }
}
