import { Utils } from "@tspro/ts-utils-lib";
import { WmsControls as InternalWmsControls, MDocument, Player } from "../pub";

function addClass(el: Element, className: string) {
    Utils.Dom.addClass(el, ...className.split(" ").map(cls => cls.trim()));
}

const defaultButtonClass = "wms-button";
const defaultButtonGroupClass = "wms-button-group";

// Make SSR Safe for Docusaurus.
const BaseHTMLElement = typeof HTMLElement !== "undefined"
    ? HTMLElement
    : class { } as any;

class WmsControls extends BaseHTMLElement {
    private div?: HTMLDivElement;

    private btnPlay?: HTMLButtonElement;
    private btnPause?: HTMLButtonElement;
    private btnStop?: HTMLButtonElement;

    private playLabel?: string;
    private pauseLabel?: string;
    private stopLabel?: string;

    private buttonClass = defaultButtonClass;
    private buttonGroupClass = defaultButtonGroupClass;

    private _controls: InternalWmsControls;
    private _doc?: MDocument;
    private _player?: Player;

    private _layout: "singlePlay" | "singlePlayStop" | "playStop" | "playPauseStop" = "playPauseStop";
    private _connected = false;

    constructor() {
        super();

        this._controls = new InternalWmsControls();
    }

    static get observedAttributes() {
        return [
            "src",
            "singlePlay",
            "singlePlayStop",
            "playStop",
            "playPauseStop",
            "playLabel",
            "pauseLabel",
            "stopLabel",
            "buttonClass",
            "buttonGroupClass"
        ];
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
        if (name === "playLabel")
            this.playLabel = value ?? undefined;

        if (name === "pauseLabel")
            this.pauseLabel = value ?? undefined;

        if (name === "stopLabel")
            this.stopLabel = value ?? undefined;

        if (name === "singlePlay" && value)
            this._layout = "singlePlay";

        if (name === "singlePlayStop" && value)
            this._layout = "singlePlayStop";

        if (name === "playStop" && value)
            this._layout = "playStop";

        if (name === "playPauseStop" && value)
            this._layout = "playPauseStop";

        if (name === "buttonClass")
            this.buttonClass = value ?? defaultButtonClass;

        if (name === "buttonGroupClass")
            this.buttonGroupClass = value ?? defaultButtonGroupClass;

        this.update();
    }

    connectedCallback() {
        if (typeof document === "undefined") return;

        try {
            if (!this.div) {
                this.div = document.createElement("div");
                addClass(this.div, this.buttonGroupClass);
                this.append(this.div);
            }

            if (this.hasAttribute("playLabel"))
                this.playLabel = this.getAttribute("playLabel")!;

            if (this.hasAttribute("pauseLabel"))
                this.pauseLabel = this.getAttribute("pauseLabel")!;

            if (this.hasAttribute("stopLabel"))
                this.stopLabel = this.getAttribute("stopLabel")!;

            this._layout = "playPauseStop";

            if (this.hasAttribute("singlePlay"))
                this._layout = "singlePlay";

            if (this.hasAttribute("singlePlayStop"))
                this._layout = "singlePlayStop";

            if (this.hasAttribute("playStop"))
                this._layout = "playStop";

            if (this.hasAttribute("playPauseStop"))
                this._layout = "playPauseStop";

            if (this.hasAttribute("buttonClass"))
                this.buttonClass = this.getAttribute("buttonClass")!;

            if (this.hasAttribute("buttonGroupClass"))
                this.buttonGroupClass = this.getAttribute("buttonGroupClass")!;
        }
        catch (e) { }

        this._connected = true;
        this.update();
    }

    disconnectedCallback() {
        this._connected = false;
    }

    adoptedCallback() { }

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

    private update() {
        this._controls.setPlayer(this._player);
        if (this._connected) this.render();
    }

    private render() {
        if (typeof document === "undefined" || !this.div) return;

        this.div.innerHTML = "";
        this.btnPlay = this.btnPause = this.btnStop = undefined;

        switch (this._layout) {
            case "singlePlay":
                if (!this.btnPlay) {
                    this.btnPlay = document.createElement("button");
                    this.div.append(this.btnPlay);
                }
                this._controls.setSinglePlay(this.btnPlay, this.playLabel);
                break;
            case "singlePlayStop":
                if (!this.btnPlay) {
                    this.btnPlay = document.createElement("button");
                    this.div.append(this.btnPlay);
                }
                this._controls.setSinglePlayStop(this.btnPlay, this.playLabel, this.stopLabel);
                break;
            case "playStop":
                if (!this.btnPlay) {
                    this.btnPlay = document.createElement("button");
                    this.div.append(this.btnPlay);
                }
                if (!this.btnStop) {
                    this.btnStop = document.createElement("button");
                    this.div.append(this.btnStop);
                }
                this._controls.setPlayStop(this.btnPlay, this.btnStop, this.playLabel, this.stopLabel);
                break;
            case "playPauseStop":
            default:
                if (!this.btnPlay) {
                    this.btnPlay = document.createElement("button");
                    this.div.append(this.btnPlay);
                }
                if (!this.btnPause) {
                    this.btnPause = document.createElement("button");
                    this.div.append(this.btnPause);
                }
                if (!this.btnStop) {
                    this.btnStop = document.createElement("button");
                    this.div.append(this.btnStop);
                }
                this._controls.setPlayPauseStop(this.btnPlay, this.btnPause, this.btnStop, this.playLabel, this.pauseLabel, this.stopLabel);
                break;
        }

        if (this.btnPlay) {
            this.btnPlay.type = "button";
            addClass(this.btnPlay, this.buttonClass)
        }

        if (this.btnPause) {
            this.btnPause.type = "button";
            addClass(this.btnPause, this.buttonClass)
        }

        if (this.btnStop) {
            this.btnStop.type = "button";
            addClass(this.btnStop, this.buttonClass)
        }
    }
}

/**
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsControls() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    try {
        if (!customElements.get("controls"))
            customElements.define("wms-controls", WmsControls as any);
    }
    catch (e) { }
}

export function isWmsControls(el: unknown): el is WmsControls {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return false;

    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-CONTROLS";
}
