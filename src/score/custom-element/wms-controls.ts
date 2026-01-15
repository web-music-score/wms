import { Utils } from "@tspro/ts-utils-lib";
import { WmsControls as PlainControls, MDocument, Player } from "../pub";

function addClass(el: Element, className: string) {
    Utils.Dom.addClass(el, ...className.split(" ").map(cls => cls.trim()));
}

const defaultButtonClass = "wms-button";
const defaultButtonGroupClass = "wms-button-group";

// Make SSR Safe for Docusaurus.
const BaseElement = typeof HTMLElement !== "undefined"
    ? HTMLElement
    : class { } as any;

class WmsControls extends BaseElement {
    private div?: HTMLDivElement;
    private ctrl: PlainControls;

    private playLabel?: string;
    private pauseLabel?: string;
    private stopLabel?: string;

    private singlePlayStop = false;
    private playStop = false;
    private playPauseStop = true;

    private btnPlay?: HTMLButtonElement;
    private btnPause?: HTMLButtonElement;
    private btnStop?: HTMLButtonElement;

    private buttonClass = defaultButtonClass;
    private buttonGroupClass = defaultButtonGroupClass;

    private _player?: Player;

    constructor() {
        super();

        this.ctrl = new PlainControls();
    }

    static get observedAttributes() {
        return [
            "src",
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
        if (name === "playLabel" && value)
            this.playLabel = value;

        if (name === "pauseLabel" && value)
            this.pauseLabel = value;

        if (name === "stopLabel" && value)
            this.stopLabel = value;

        if (name === "singlePlayStop") {
            this.singlePlayStop = true;
            this.playStop = false;
            this.playPauseStop = false;
        }

        if (name === "playStop") {
            this.singlePlayStop = false;
            this.playStop = true;
            this.playPauseStop = false;
        }

        if (name === "playPauseStop") {
            this.singlePlayStop = false;
            this.playStop = false;
            this.playPauseStop = true;
        }

        if (name === "buttonClass") {
            this.buttonClass = value || defaultButtonClass;
        }

        if (name === "buttonGroupClass") {
            this.buttonGroupClass = value || defaultButtonGroupClass;
        }

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

            this.playLabel = this.getAttribute("playLabel") || undefined;
            this.pauseLabel = this.getAttribute("pauseLabel") || undefined;
            this.stopLabel = this.getAttribute("stopLabel") || undefined;

            this.singlePlayStop = false;
            this.playStop = false;
            this.playPauseStop = false;

            if (this.hasAttribute("singlePlayStop"))
                this.singlePlayStop = true;
            else if (this.hasAttribute("playStop"))
                this.playStop = true;
            else this.playPauseStop = true;

            if (this.hasAttribute("buttonClass"))
                this.buttonClass = this.getAttribute("buttonClass")!;
            else if (this.hasAttribute("buttonGroupClass"))
                this.buttonGroupClass = this.getAttribute("buttonGroupClass")!;

        }
        catch (e) { }

        this.render();
    }

    set doc(doc: MDocument | undefined) {
        this._doc = doc;
        this.ctrl.setDocument(this._doc);
    }

    get doc(): MDocument | undefined {
        return this._doc;
    }

    set player(player: Player | undefined) {
        this._player = player;
        if (this._connected)
            this.update();
    }

    get player(): Player | undefined {
        return this._player;
    }

    private render() {
        if (typeof document === "undefined" || !this.div)
            return;

        this.div.innerHTML = "";
        this.btnPlay = this.btnPause = this.btnStop = undefined;

        if (this.singlePlayStop) {
            if (!this.btnPlay) {
                this.btnPlay = document.createElement("button");
                this.div.append(this.btnPlay);
            }
            this.ctrl.setPlayStopButton(this.btnPlay, this.playLabel);
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
            this.ctrl.setPlayButton(this.btnPlay, this.playLabel);
            this.ctrl.setStopButton(this.btnStop, this.stopLabel);
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
            this.ctrl.setPlayButton(this.btnPlay, this.playLabel);
            this.ctrl.setPauseButton(this.btnPause, this.pauseLabel);
            this.ctrl.setStopButton(this.btnStop, this.stopLabel);
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
    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-CONTROLS";
}
