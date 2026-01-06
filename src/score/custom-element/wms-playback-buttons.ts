import { Utils } from "@tspro/ts-utils-lib";
import { ObjDocument } from "../engine/obj-document";
import { MDocument, MPlaybackButtons } from "score/pub";

function addClass(el: HTMLElement, className: string) {
    className.trim().split(" ").filter(cls => cls.length > 0).forEach(cls => Utils.Dom.addClass(el, cls));
}

const defaultButtonClass = "wms-button";
const defaultButtonGroupClass = "wms-button-group";

class WmsPlaybackButtons extends HTMLElement {
    private div?: HTMLDivElement;
    private pb: MPlaybackButtons;

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

    private _defaultDoc = new ObjDocument().getMusicInterface();
    private _doc: MDocument = this._defaultDoc;

    constructor() {
        super();

        this.pb = new MPlaybackButtons();
        this.pb.setDocument(this._doc);
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
        if (typeof document !== "undefined" && !this.div) {
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

        this.render();
    }

    set doc(doc: MDocument | undefined) {
        this._doc = doc || this._defaultDoc;
        this.pb.setDocument(this._doc);
    }

    get doc(): MDocument {
        return this._doc;
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
            this.pb.setPlayStopButton(this.btnPlay, this.playLabel);
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
            this.pb.setPlayButton(this.btnPlay, this.playLabel);
            this.pb.setStopButton(this.btnStop, this.stopLabel);
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
            this.pb.setPlayButton(this.btnPlay, this.playLabel);
            this.pb.setPauseButton(this.btnPause, this.pauseLabel);
            this.pb.setStopButton(this.btnStop, this.stopLabel);
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
export function registerWmsPlaybackButtons() {
    if (typeof document === "undefined")
        return;

    if (!customElements.get("wms-playback-buttons")) {
        customElements.define(
            "wms-playback-buttons",
            WmsPlaybackButtons
        );
    }
}

export function isWmsPlaybackButtons(el: unknown): el is WmsPlaybackButtons {
    return Utils.Obj.isObject(el) &&
        Utils.Obj.hasProperties(el, ["tagName", "doc"]) &&
        el.tagName === "WMS-PLAYBACK-BUTTONS";
}
