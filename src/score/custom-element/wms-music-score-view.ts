import { MRenderContext, MDocument, Paint } from "../pub";
import { Utils } from "@tspro/ts-utils-lib";

class WmsMusicScoreView extends HTMLElement {
    private canvas: HTMLCanvasElement;
    private rc: MRenderContext;

    private _doc?: MDocument;
    private _paint?: Paint;
    private _connected = false;

    constructor() {
        super();

        this.canvas = document.createElement("canvas");
        this.rc = new MRenderContext().setCanvas(this.canvas);
    }

    static get observedAttributes() {
        return ["src"];
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === "src" && value) {
            this.loadFromUrl(value);
        }
    }

    connectedCallback() {
        this._connected = true;
        this.update();
    }

    set doc(doc: MDocument | undefined) {
        this._doc = doc;
        if (this._connected)
            this.update();
    }

    get doc(): MDocument | undefined {
        return this._doc;
    }

    set paint(paint: Paint | undefined) {
        this._paint = paint;
        if (this._connected)
            this.update();
    }

    get paint(): Paint | undefined {
        return this._paint;
    }

    private update() {
        this.rc.setDocument(this._doc);
        this.rc.setPaint(this._paint);
        this.render();
    }

    private render() {
        if (!this.contains(this.canvas))
            this.append(this.canvas);

        this.rc.draw();
    }

    private loadFromUrl(url: string) { }
}

/**
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsMusicScoreView() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    if (!customElements.get("wms-music-score-view")) {
        customElements.define(
            "wms-music-score-view",
            WmsMusicScoreView
        );
    }
}

export function isWmsMusicScoreView(el: unknown): el is WmsMusicScoreView {
    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-MUSIC-SCORE-VIEW";
}
