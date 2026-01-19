import { WmsView as InternalWmsView, MDocument, Paint } from "../pub";
import { Utils } from "@tspro/ts-utils-lib";

// Make SSR Safe for Docusaurus.
const BaseHTMLElement = typeof HTMLElement !== "undefined"
    ? HTMLElement
    : class { } as any;

class WmsView extends BaseHTMLElement {
    private _canvas: HTMLCanvasElement;
    private _view: InternalWmsView;
    private _doc?: MDocument;
    private _paint?: Paint;
    private _connected = false;

    constructor() {
        super();

        this._view = new InternalWmsView();

        this._canvas = document.createElement("canvas");
        this._view.setCanvas(this._canvas);
    }

    static get observedAttributes() {
        return ["src", "zoom", "staff-size"];
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === "src" && value) {
            this.loadFromUrl(value);
        }

        if (name === "zoom" && value) {
            this._view.setZoom(+value);
        }

        if (name === "staff-size" && value) {
            this._view.setStaffSize(value);
        }
    }

    connectedCallback() {
        this._connected = true;
        this.update();
    }

    disconnectedCallback() {
        this._connected = false;
    }

    adoptedCallback() { }

    set doc(doc: MDocument | undefined) {
        this._doc = doc;
        this.update();
    }

    get doc(): MDocument | undefined {
        return this._doc;
    }

    set paint(paint: Paint | undefined) {
        this._paint = paint;
        this.update();
    }

    get paint(): Paint | undefined {
        return this._paint;
    }

    private update() {
        this._view.setDocument(this._doc);
        this._view.setPaint(this._paint);
        if (this._connected) this.render();
    }

    private render() {
        if (typeof document === "undefined") return;

        try {
            if (!this.contains(this._canvas))
                this.append(this._canvas);
        } catch (e) { }

        this._view.draw();
    }

    private loadFromUrl(url: string) { }
}

/**
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsView() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    try {
        if (!customElements.get("wms-view"))
            customElements.define("wms-view", WmsView as any);
    }
    catch (e) { }
}

export function isWmsView(el: unknown): el is WmsView {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return false;

    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-VIEW";
}
