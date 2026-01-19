import { Utils } from "@tspro/ts-utils-lib";
import { WmsControls as PlainControls, MDocument, Player } from "../pub";

function addClass(el: Element, className: string) {
    Utils.Dom.addClass(el, ...className.split(" ").map(cls => cls.trim()));
}

const defaultButtonClass = "wms-button";
const defaultButtonGroupClass = "wms-button-group";

// Make SSR Safe for Docusaurus.
const BaseHTMLElement = typeof HTMLElement !== "undefined"
    ? HTMLElement
    : class { } as any;

export class WmsControlsHTMLElement extends BaseHTMLElement {
    private div?: HTMLDivElement;
    private ctrl: PlainControls;

    private playLabel?: string;
    private pauseLabel?: string;
    private stopLabel?: string;

    private singlePlay = false;
    private singlePlayStop = false;
    private playStop = false;
    private playPauseStop = true;

    private btnPlay?: HTMLButtonElement;
    private btnPause?: HTMLButtonElement;
    private btnStop?: HTMLButtonElement;

    private buttonClass = defaultButtonClass;
    private buttonGroupClass = defaultButtonGroupClass;

    private _doc?: MDocument;
    private _player?: Player;

    constructor() {
        super();

        this.ctrl = new PlainControls();
    }

    static get observedAttributes() {
        return [
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

        if (name === "singlePlay" && value) {
            this.singlePlay = true;
            this.singlePlayStop = false;
            this.playStop = false;
            this.playPauseStop = false;
        }

        if (name === "singlePlayStop" && value) {
            this.singlePlay = false;
            this.singlePlayStop = true;
            this.playStop = false;
            this.playPauseStop = false;
        }

        if (name === "playStop" && value) {
            this.singlePlay = false;
            this.singlePlayStop = false;
            this.playStop = true;
            this.playPauseStop = false;
        }

        if (name === "playPauseStop" && value) {
            this.singlePlay = false;
            this.singlePlayStop = false;
            this.playStop = false;
            this.playPauseStop = true;
        }

        if (name === "buttonClass")
            this.buttonClass = value ?? defaultButtonClass;

        if (name === "buttonGroupClass")
            this.buttonGroupClass = value ?? defaultButtonGroupClass;

        this.render();
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

            if (this.hasAttribute("singlePlay")) {
                this.singlePlay = true;
                this.singlePlayStop = false;
                this.playStop = false;
                this.playPauseStop = false;
            }

            if (this.hasAttribute("singlePlayStop")) {
                this.singlePlay = false;
                this.singlePlayStop = true;
                this.playStop = false;
                this.playPauseStop = false;
            }

            if (this.hasAttribute("playStop")) {
                this.singlePlay = false;
                this.singlePlayStop = false;
                this.playStop = true;
                this.playPauseStop = false;
            }

            if (this.hasAttribute("playPauseStop")) {
                this.singlePlay = false;
                this.singlePlayStop = false;
                this.playStop = false;
                this.playPauseStop = true;
            }

            if (this.hasAttribute("buttonClass"))
                this.buttonClass = this.getAttribute("buttonClass")!;

            if (this.hasAttribute("buttonGroupClass"))
                this.buttonGroupClass = this.getAttribute("buttonGroupClass")!;
        }
        catch (e) { }

        this.render();
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

    private update() {
        this.ctrl.setPlayer(this._player);
        if (this._connected) this.render();
    }

    private render() {
        if (typeof document === "undefined" || !this.div)
            return;

        this.div.innerHTML = "";
        this.btnPlay = this.btnPause = this.btnStop = undefined;

        if (this.singlePlay) {
            if (!this.btnPlay) {
                this.btnPlay = document.createElement("button");
                this.div.append(this.btnPlay);
            }
            this.ctrl.setSinglePlay(this.btnPlay, this.playLabel);
        }
        else if (this.singlePlayStop) {
            if (!this.btnPlay) {
                this.btnPlay = document.createElement("button");
                this.div.append(this.btnPlay);
            }
            this.ctrl.setSinglePlayStop(this.btnPlay, this.playLabel, this.stopLabel);
        }
        else if (this.playStop) {
            if (!this.btnPlay) {
                this.btnPlay = document.createElement("button");
                this.div.append(this.btnPlay);
            }
            if (!this.btnStop) {
                this.btnStop = document.createElement("button");
                this.div.append(this.btnStop);
            }
            this.ctrl.setPlayStop(this.btnPlay, this.btnStop, this.playLabel, this.stopLabel);
        }
        else if (this.playPauseStop) {
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
            this.ctrl.setPlayPauseStop(this.btnPlay, this.btnPause, this.btnStop, this.playLabel, this.pauseLabel, this.stopLabel);
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
 * @internal
 * Safe registration (VERY IMPORTANT)
 */
export function registerWmsControlsHTMLElement() {
    if (typeof document === "undefined" || typeof customElements === "undefined")
        return;

    try {
        if (!customElements.get("controls"))
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
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-CONTROLS";
}
