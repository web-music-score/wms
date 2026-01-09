import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { PlayState } from "./types";
import { MDocument } from "./mobjects";
import { Player } from "./player";
import { assertArg, requireT } from "shared-src";

export class WmsControls {
    private playButton?: HTMLButtonElement;
    private stopButton?: HTMLButtonElement;
    private playStopButton?: HTMLButtonElement;
    private pauseButton?: HTMLButtonElement;

    private onPlay: () => void;
    private onStop: () => void;
    private onPlayStop: () => void;
    private onPause: () => void;

    private playLabel = "Play";
    private stopLabel = "Stop";
    private pauseLabel = "Pause";

    private playState: PlayState = PlayState.Stopped;

    private player?: Player = undefined;

    /**
     * Create new playback buttons helper class instance.
     */
    constructor() {
        this.onPlay = () => this.player?.play();
        this.onStop = () => this.player?.stop();
        this.onPlayStop = () => { this.playState === PlayState.Playing ? this.player?.stop() : this.player?.play(); }
        this.onPause = () => this.player?.pause();

        this.updateButtons();
    }

    /**
     * Attach music document whose playcak will be controlled by this playback buttons helper class instance.
     * @param doc - Music document.
     * @returns 
     */
    setDocument(doc?: MDocument): WmsControls {
        assertArg(Guard.isUndefined(doc) || doc instanceof MDocument, "doc", doc);

        this.onStop();

        if (doc) {
            this.player = new Player(doc, (playState: PlayState) => {
                this.playState = playState;
                this.updateButtons();
            });
        }
        else {
            this.player = undefined;
        }

        this.updateButtons();

        return this;
    }

    /**
     * Detach attached music document.
     */
    detachDocument() {
        this.setDocument(undefined);
    }

    private updateButtons() {
        if (this.playButton) {
            this.playButton.disabled = this.player ? (this.playState === PlayState.Playing) : true;
            this.playButton.innerText = this.playLabel;
        }

        if (this.stopButton) {
            this.stopButton.disabled = this.player ? (this.playState === PlayState.Stopped) : true;
            this.stopButton.innerText = this.stopLabel;
        }

        if (this.playStopButton) {
            this.playStopButton.disabled = this.player ? false : true;
            this.playStopButton.innerText = this.playState === PlayState.Playing ? this.stopLabel : this.playLabel;
        }

        if (this.pauseButton) {
            this.pauseButton.disabled = this.player ? (this.playState !== PlayState.Playing) : true;
            this.pauseButton.innerText = this.pauseLabel;
        }
    }

    /**
     * Set play button.
     * @param btn - HTML button element or element id.
     * @param btnLabel - Custom button label (e.g. "Play").
     * @returns - This playback buttons class instance.
     */
    setPlayButton(btn: HTMLButtonElement | string, btnLabel?: string): WmsControls {
        assertArg(Guard.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        WmsControls.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = requireT(Utils.Dom.getButton(btn), "Play button required!");
        this.playLabel = btnLabel ?? "Play";

        WmsControls.removeOnClickListeners(this.playButton, "all");
        WmsControls.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    /**
     * Set stop button.
     * @param btn - HTML button element or element id.
     * @param btnLabel - Custom button label (e.g. "Stop").
     * @returns - This playback buttons class instance.
     */
    setStopButton(btn: HTMLButtonElement | string, btnLabel?: string): WmsControls {
        assertArg(Guard.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        WmsControls.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = requireT(Utils.Dom.getButton(btn), "Stop button required!");
        this.stopLabel = btnLabel ?? "Stop";

        WmsControls.removeOnClickListeners(this.stopButton, "all");
        WmsControls.addOnClickListener(this.stopButton, this.onStop);

        this.updateButtons();

        return this;
    }

    /**
     * Set play/stop button.
     * @param btn - HTML button element or element id.
     * @param playLabel - Custom button label for play action (e.g. "Play").
     * @param stopLabel - Custom button label for stop action (e.g. "Stop").
     * @returns - This playback buttons class instance.
     */
    setPlayStopButton(btn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string): WmsControls {
        assertArg(Guard.isStringOrUndefined(playLabel), "playLabel", playLabel);
        assertArg(Guard.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

        WmsControls.removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = requireT(Utils.Dom.getButton(btn), "Play/stop button required!");
        this.playLabel = playLabel ?? "Play";
        this.stopLabel = stopLabel ?? "Stop";

        WmsControls.removeOnClickListeners(this.playStopButton, "all");
        WmsControls.addOnClickListener(this.playStopButton, this.onPlayStop);

        this.updateButtons();

        return this;
    }

    /**
     * Set pause button.
     * @param btn - HTML button element or element id.
     * @param btnLabel - Custom button label (e.g. "Pause").
     * @returns - This playback buttons class instance.
     */
    setPauseButton(btn: HTMLButtonElement | string, btnLabel?: string): WmsControls {
        assertArg(Guard.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        WmsControls.removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = requireT(Utils.Dom.getButton(btn), "Pause button required!");
        this.pauseLabel = btnLabel ?? "Pause";

        WmsControls.removeOnClickListeners(this.pauseButton, "all");
        WmsControls.addOnClickListener(this.pauseButton, this.onPause);

        this.updateButtons();

        return this;
    }

    private static savedOnClickListeners = new UniMap<HTMLButtonElement, (() => void)[]>();

    private static removeOnClickListeners(btn: HTMLButtonElement | undefined, onClickListener: (() => void) | "all") {
        if (!btn) return;

        let curListeners = this.savedOnClickListeners.getOrDefault(btn, []);

        curListeners = curListeners.filter(listener => {
            if (onClickListener === listener || onClickListener === "all") {
                btn.removeEventListener("click", listener);
                return false;
            }
            else {
                return true;
            }
        });

        this.savedOnClickListeners.set(btn, curListeners);
    }

    private static addOnClickListener(btn: HTMLButtonElement, onClickListener: () => void) {
        assertArg(Guard.isFunction(onClickListener), "onClick", onClickListener);
        btn.addEventListener("click", onClickListener);
        this.savedOnClickListeners.getOrCreate(btn, []).push(onClickListener);
    }
}
