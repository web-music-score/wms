import { WmsView as PlainView, MDocument, Paint } from "../pub";
import { Utils } from "@tspro/ts-utils-lib";

class WmsView extends HTMLElement {
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
        this.view.setDocument(this._doc);
        this.view.setPaint(this._paint);
        this.render();
    }

    private render() {
        if (!this.contains(this.canvas))
            this.append(this.canvas);

        this.view.draw();
    }

    private loadFromUrl(url: string) { }
}

/**
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsView() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    if (!customElements.get("wms-view")) {
        customElements.define("wms-view", WmsView);
    }
}

export function isWmsView(el: unknown): el is WmsView {
    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-VIEW";
}
