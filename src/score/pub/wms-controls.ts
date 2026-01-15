import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { PlayState } from "./types";
import { MDocument } from "./mobjects";
import { Player } from "./player";
import { AssertUtil } from "shared-src";

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

    private player?: Player;

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
     * Attach player that will be controlled by these controls.
     * @param player - Player.
     * @returns 
     */
    setPlayer(player?: Player): WmsControls {
        AssertUtil.assertVar(Guard.isUndefined(player) || player instanceof Player, "player", player);

        if (this.player === player) return this;

        this.onStop();

        this.player = player;

        if (this.player) {
            this.player.setPlayStateChangeListener((playState: PlayState) => {
                this.playState = playState;
                this.updateButtons();
            })
            this.playState = this.player.getPlayState();
        }
        else {
            this.playState = PlayState.Stopped;
        }

        this.updateButtons();

        return this;
    }

    /**
     * Attach document whose default player will be controlled by these controls.
     * @param doc - Music document.
     * @returns 
     */
    setDocument(doc?: MDocument): WmsControls {
        AssertUtil.assertVar(Guard.isUndefined(doc) || doc instanceof MDocument, "doc", doc);
        return this.setPlayer(doc?.getDefaultPlayer());
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
     * @param playLabel - Custom button label (e.g. "Play").
     * @returns - This playback buttons class instance.
     */
    setPlayButton(btn: HTMLButtonElement | string, playLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(playLabel), "playLabel", playLabel);

        WmsControls.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = AssertUtil.requireVar("playButton", Utils.Dom.getButton(btn));
        this.playLabel = playLabel ?? "Play";

        WmsControls.removeOnClickListeners(this.playButton, "all");
        WmsControls.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    /**
     * Set stop button.
     * @param btn - HTML button element or element id.
     * @param stopLabel - Custom button label (e.g. "Stop").
     * @returns - This playback buttons class instance.
     */
    setStopButton(btn: HTMLButtonElement | string, stopLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

        WmsControls.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = AssertUtil.requireVar("stopButton", Utils.Dom.getButton(btn));
        this.stopLabel = stopLabel ?? "Stop";

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
        AssertUtil.assertVar(Guard.isStringOrUndefined(playLabel), "playLabel", playLabel);
        AssertUtil.assertVar(Guard.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

        WmsControls.removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = AssertUtil.requireVar("playStopButton", Utils.Dom.getButton(btn));
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
     * @param pauseLabel - Custom button label (e.g. "Pause").
     * @returns - This playback buttons class instance.
     */
    setPauseButton(btn: HTMLButtonElement | string, pauseLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(pauseLabel), "pauseLabel", pauseLabel);

        WmsControls.removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = AssertUtil.requireVar("pauseButton", Utils.Dom.getButton(btn));
        this.pauseLabel = pauseLabel ?? "Pause";

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
        AssertUtil.assertVar(Guard.isFunction(onClickListener), "onClickListener", onClickListener);
        btn.addEventListener("click", onClickListener);
        this.savedOnClickListeners.getOrCreate(btn, []).push(onClickListener);
    }
}
