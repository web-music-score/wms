import { Assert, Guard, Utils } from "@tspro/ts-utils-lib";
import { View } from "../engine/view";
import { StaffSize } from "./types";
import { ScoreEventListener } from "./event";
import { MDocument, MScoreRow, MusicInterface } from "./mobjects";
import { Paint } from "./paint";
import { AssertUtil } from "shared-src";


export class WmsView {
    private readonly _view: View;

    /**
     * Create new render context instance.
     */
    constructor() {
        this._view = new View(this);
    }

    /**
     * Set Paint for this render context.
     * @param paint - Paint.
     * @returns - This render context instance.
     */
    setPaint(paint?: Paint) {
        AssertUtil.assertVar(Guard.isUndefined(paint) || paint instanceof Paint, "paint", paint);

        this._view.setPaint(paint);
        return this;
    }

    /**
     * Attach music document to this render context.
     * @param doc - Music document.
     * @returns - This render context instance.
     */
    setDocument(doc?: MDocument): WmsView {
        AssertUtil.assertVar(Guard.isUndefined(doc) || doc instanceof MDocument, "doc", doc);
        this._view.setDocument(doc?.getMusicObject());
        return this;
    }

    /**
     * Set target canvas html element for this render context.
     * @param canvas - HTML canvas element or element id.
     * @returns - This render context instance.
     */
    setCanvas(canvas: HTMLCanvasElement | string): WmsView {
        this._view.setCanvas(AssertUtil.requireVar("canvas", Utils.Dom.getCanvas(canvas)));
        return this;
    }

    /**
     * Set zoom level.
     * @param zoom - zoom level, default is 1.0.
     * @returns - This render context instance.
     */
    setZoom(zoom: number = 1.0): WmsView {
        AssertUtil.assertVar(Guard.isNumberGt(zoom, 0) && Guard.isFinite(zoom), "zoom", zoom);
        this._view.setZoom(zoom);
        return this;
    }

    /**
     * Set staff size, distance between top and bottom staff lines.
     * @param staffSize - staff size e.g. 24, "24", "24px", "1cm", etc.
     * @returns - This render context instance.
     */
    setStaffSize(staffSize: StaffSize = "default"): WmsView {
        AssertUtil.assertVar(
            Guard.isNonEmptyString(staffSize) ||
            Guard.isNumberGt(staffSize, 0) && Guard.isFinite(staffSize),
            "staffSize", staffSize
        );
        this._view.setStaffSize(staffSize);
        return this;
    }

    /**
     * Set score event listener.
     * @param scoreEventListener - Score event listener.
     */
    setScoreEventListener(scoreEventListener: ScoreEventListener) {
        AssertUtil.assertVar(Guard.isFunctionOrUndefined(scoreEventListener), "scoreEventListener", scoreEventListener);
        this._view.setScoreEventListener(scoreEventListener);
    }

    /**
     * Draw given music object hilighted.
     * @param obj - Music object or undefined to remove hilighting.
     */
    hilightObject(obj?: MusicInterface) {
        this._view.hilightObject(obj?.getMusicObject());
    }

    /**
     * Draw given staff position hilighted.
     * @param staffPos - Staff position (score row and diatonic id) or undefined to remove hilighting.
     */
    hilightStaffPos(staffPos?: { scoreRow: MScoreRow, diatonicId: number }) {
        this._view.hilightStaffPos(staffPos ? {
            scoreRow: staffPos.scoreRow.getMusicObject(),
            diatonicId: staffPos.diatonicId
        } : undefined);
    }

    /**
     * Draw contents of attached music document to attached canvas.
     */
    draw() {
        try {
            this._view.draw();
        }
        catch (err) {
            console.log("Draw failed in music render context!", err);
        }
    }
}
