import { Utils } from "@tspro/ts-utils-lib";
import { WmsControls, MDocument, Player } from "../pub";

function addClass(el: Element, className: string) {
    Utils.Dom.addClass(
        el,
        ...className
            .split(" ")
            .map(c => c.trim())
            .filter(Boolean)
    );
}

const defaultButtonClass = "wms-button";
const defaultButtonGroupClass = "wms-button-group";

// Make SSR-safe (Docusaurus / Node)
const BaseHTMLElement = typeof HTMLElement !== "undefined"
    ? HTMLElement
    : (class { } as any);

export class WmsControlsHTMLElement extends BaseHTMLElement {
    private playLabel?: string;
    private pauseLabel?: string;
    private stopLabel?: string;

    private btnPlay?: HTMLButtonElement;
    private btnPause?: HTMLButtonElement;
    private btnStop?: HTMLButtonElement;

    private buttonClass = defaultButtonClass;
    private buttonGroupClass = defaultButtonGroupClass;

    private _layout: "single-play" | "single-play-stop" | "play-stop" | "play-pause-stop" = "play-pause-stop";
    private _controls: WmsControls;
    private _doc?: MDocument;
    private _player?: Player;
    private _root?: HTMLDivElement;
    private _connected = false;

    constructor() {
        super();

        this._controls = new WmsControls();

        // Never touch DOM in SSR
        if (typeof document === "undefined") return;

        this._root = document.createElement("div");
        addClass(this._root, this.buttonGroupClass);
    }

    static get observedAttributes() {
        return [
            "single-play",
            "single-play-stop",
            "play-stop",
            "play-pause-stop",
            "play-label",
            "pause-label",
            "stop-label",
            "button-class",
            "button-group-class"
        ];
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === "play-label")
            this.playLabel = value ?? undefined;

        if (name === "pause-label")
            this.pauseLabel = value ?? undefined;

        if (name === "stop-label")
            this.stopLabel = value ?? undefined;

        if (name === "single-play" && value)
            this._layout = "single-play";

        if (name === "single-play-stop" && value)
            this._layout = "single-play-stop";

        if (name === "play-stop" && value)
            this._layout = "play-stop";

        if (name === "play-pause-stop" && value)
            this._layout = "play-pause-stop";

        // Attribute removed
        if (
            (name === "single-play" || name === "single-play-stop" || name === "play-stop" || name === "play-pause-stop") &&
            value === null
        ) {
            this._layout = "play-pause-stop";
        }

        if (name === "button-class")
            this.buttonClass = value ?? defaultButtonClass;

        if (name === "button-group-class") {
            this.buttonGroupClass = value ?? defaultButtonGroupClass;
            if (this._root) {
                this._root.className = "";
                addClass(this._root, this.buttonGroupClass);
            }
        }

        this.update();
    }

    // Called when inserted into DOM
    connectedCallback() {
        if (typeof document === "undefined") return;

        if (this.hasAttribute("play-label"))
            this.playLabel = this.getAttribute("play-label")!;

        if (this.hasAttribute("pause-label"))
            this.pauseLabel = this.getAttribute("pause-label")!;

        if (this.hasAttribute("stop-label"))
            this.stopLabel = this.getAttribute("stop-label")!;

        this._layout = "play-pause-stop";

        if (this.hasAttribute("single-play"))
            this._layout = "single-play";

        if (this.hasAttribute("single-play-stop"))
            this._layout = "single-play-stop";

        if (this.hasAttribute("play-stop"))
            this._layout = "play-stop";

        if (this.hasAttribute("play-pause-stop"))
            this._layout = "play-pause-stop";

        if (this.hasAttribute("button-class"))
            this.buttonClass = this.getAttribute("button-class")!;

        if (this.hasAttribute("button-group-class"))
            this.buttonGroupClass = this.getAttribute("button-group-class")!;

        this.append(this._root);

        this._connected = true;
        this.update();
    }

    // Called when removed from DOM
    disconnectedCallback() {
        this._connected = false;
    }

    adoptedCallback() {
        // No-op (rarely needed)
    }

    get wmsControls(): WmsControls {
        return this._controls;
    }

    set doc(doc: MDocument | undefined) {
        this._doc = doc;
        this._player = doc?.getDefaultPlayer();
        this.update();
    }

    get doc(): MDocument | undefined {
        return this._doc;
    }

    set player(player: Player | undefined) {
        this._doc = undefined;
        this._player = player;
        this.update();
    }

    get player(): Player | undefined {
        return this._player;
    }

    private ensureButton(ref: HTMLButtonElement | undefined): HTMLButtonElement {
        if (!ref) {
            ref = document.createElement("button");
            ref.type = "button";
        }

        ref.className = "";
        addClass(ref, this.buttonClass);
        return ref;
    }

    private update() {
        if (typeof document === "undefined" || !this._root || !this._connected)
            return;

        this._controls.setPlayer(this._player);

        switch (this._layout) {
            case "single-play":
                this.btnPause = this.btnStop = undefined;
                this.btnPlay = this.ensureButton(this.btnPlay);
                this._root.replaceChildren(this.btnPlay);
                this._controls.setSinglePlay(this.btnPlay, this.playLabel);
                break;
            case "single-play-stop":
                this.btnPlay = this.ensureButton(this.btnPlay);
                this.btnPause = undefined;
                this.btnStop = undefined;
                this._root.replaceChildren(this.btnPlay);
                this._controls.setSinglePlayStop(this.btnPlay, this.playLabel, this.stopLabel);
                break;
            case "play-stop":
                this.btnPlay = this.ensureButton(this.btnPlay);
                this.btnPause = undefined;
                this.btnStop = this.ensureButton(this.btnStop);
                this._root.replaceChildren(this.btnPlay, this.btnStop);
                this._controls.setPlayStop(this.btnPlay, this.btnStop, this.playLabel, this.stopLabel);
                break;
            case "play-pause-stop":
            default:
                this.btnPlay = this.ensureButton(this.btnPlay);
                this.btnPause = this.ensureButton(this.btnPause);
                this.btnStop = this.ensureButton(this.btnStop);
                this._root.replaceChildren(this.btnPlay, this.btnPause, this.btnStop);
                this._controls.setPlayPauseStop(this.btnPlay, this.btnPause, this.btnStop, this.playLabel, this.pauseLabel, this.stopLabel);
                break;
        }
    }
}

/**
 * @internal
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsControlsHTMLElement() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    try {
        if (!customElements.get("wms-controls"))
            customElements.define("wms-controls", WmsControlsHTMLElement as any);
    }
    catch (e) { }
}

/**
 * @internal
 */
export function isWmsControlsHTMLElement(el: unknown): el is WmsControlsHTMLElement {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return false;

    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName"]) &&
        el.tagName === "WMS-CONTROLS";
}
