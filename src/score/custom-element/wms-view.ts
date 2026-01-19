import { WmsView as PlainView, MDocument, Paint } from "../pub";
import { Utils } from "@tspro/ts-utils-lib";

// Make SSR Safe for Docusaurus.
const BaseHTMLElement = typeof HTMLElement !== "undefined"
    ? HTMLElement
    : class { } as any;

export class WmsViewHTMLElement extends BaseHTMLElement {
    private canvas: HTMLCanvasElement;
    private view: PlainView;

    private _doc?: MDocument;
    private _paint?: Paint;
    private _connected = false;

    constructor() {
        super();

        this.canvas = document.createElement("canvas");
        this.view = new PlainView().setCanvas(this.canvas);
    }

    static get observedAttributes() {
        return ["src", "zoom", "staff-size"];
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === "src" && value) {
            this.loadFromUrl(value);
        }

        if (name === "zoom" && value) {
            this.view.setZoom(+value);
        }

        if (name === "staff-size" && value) {
            this.view.setStaffSize(value);
        }
    }

    connectedCallback() {
        this._connected = true;
        this.update();
    }

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
        this.view.setDocument(this._doc);
        this.view.setPaint(this._paint);
        if (this._connected) this.render();
    }

    private render() {
        try {
            if (!this.contains(this.canvas))
                this.append(this.canvas);
        } catch (e) { }

        this.view.draw();
    }

    private loadFromUrl(url: string) { }
}

/**
 * @internal
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsViewHTMLElement() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    try {
        if (!customElements.get("wms-view"))
            customElements.define("wms-view", WmsViewHTMLElement as any);
    }
    catch (e) { }
}

/**
 * @internal
 */
export function isWmsViewHTMLElement(el: unknown): el is WmsViewHTMLElement {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return false;

    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-VIEW";
}
