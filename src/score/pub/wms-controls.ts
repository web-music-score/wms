import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { PlayState } from "./types";
import { MDocument } from "./mobjects";
import { Player } from "./player";
import { AssertUtil, warnDeprecated } from "shared-src";

export class WmsControls {
    public static readonly DefaultPlayLabel = "Play";
    public static readonly DefaultPauseLabel = "Pause";
    public static readonly DefaultStopLabel = "Stop";

    private playButton?: HTMLButtonElement;
    private stopButton?: HTMLButtonElement;
    private playStopButton?: HTMLButtonElement;
    private pauseButton?: HTMLButtonElement;

    private onPlay: () => void;
    private onStop: () => void;
    private onPlayStop: () => void;
    private onPause: () => void;

    private playLabel = WmsControls.DefaultPlayLabel;
    private stopLabel = WmsControls.DefaultStopLabel;
    private pauseLabel = WmsControls.DefaultPauseLabel;

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
     * @deprecated - setPlayButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.
     * @param playBtn - HTML button element or element id.
     * @param playLabel - Custom button label (e.g. "Play").
     * @returns - This playback buttons class instance.
     */
    setPlayButton(playBtn: HTMLButtonElement | string, playLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(playLabel), "playLabel", playLabel);

        warnDeprecated("setPlayButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.");

        WmsControls.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = AssertUtil.requireVar("playBtn", Utils.Dom.getButton(playBtn));
        this.playLabel = playLabel ?? WmsControls.DefaultPlayLabel;

        WmsControls.removeOnClickListeners(this.playButton, "all");
        WmsControls.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    /**
     * Set stop button.
     * @deprecated - setStopButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.
     * @param stopBtn - HTML button element or element id.
     * @param stopLabel - Custom button label (e.g. "Stop").
     * @returns - This playback buttons class instance.
     */
    setStopButton(stopBtn: HTMLButtonElement | string, stopLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

        warnDeprecated("setStopButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.");

        WmsControls.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = AssertUtil.requireVar("stopBtn", Utils.Dom.getButton(stopBtn));
        this.stopLabel = stopLabel ?? WmsControls.DefaultStopLabel;

        WmsControls.removeOnClickListeners(this.stopButton, "all");
        WmsControls.addOnClickListener(this.stopButton, this.onStop);

        this.updateButtons();

        return this;
    }

    /**
     * Set play/stop button.
     * @deprecated - setPlayStopButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.
     * @param playStopBtn - HTML button element or element id.
     * @param playLabel - Custom button label for play action (e.g. "Play").
     * @param stopLabel - Custom button label for stop action (e.g. "Stop").
     * @returns - This playback buttons class instance.
     */
    setPlayStopButton(playStopBtn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(playLabel), "playLabel", playLabel);
        AssertUtil.assertVar(Guard.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

        warnDeprecated("setPlayStopButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.");

        WmsControls.removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = AssertUtil.requireVar("playStopBtn", Utils.Dom.getButton(playStopBtn));
        this.playLabel = playLabel ?? WmsControls.DefaultPlayLabel;
        this.stopLabel = stopLabel ?? WmsControls.DefaultStopLabel;

        WmsControls.removeOnClickListeners(this.playStopButton, "all");
        WmsControls.addOnClickListener(this.playStopButton, this.onPlayStop);

        this.updateButtons();

        return this;
    }

    /**
     * Set pause button.
     * @deprecated - setPauseButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.
     * @param pauseBtn - HTML button element or element id.
     * @param pauseLabel - Custom button label (e.g. "Pause").
     * @returns - This playback buttons class instance.
     */
    setPauseButton(pauseBtn: HTMLButtonElement | string, pauseLabel?: string): WmsControls {
        AssertUtil.assertVar(Guard.isStringOrUndefined(pauseLabel), "pauseLabel", pauseLabel);

        warnDeprecated("setPauseButton() is deprecated. Will be removed in future release. Use `setSinglePlay()`, `setSinglePlayStop()`, `setPlayStop()` or `setPlayPauseStop()` instead.");

        WmsControls.removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = AssertUtil.requireVar("pauseBtn", Utils.Dom.getButton(pauseBtn));
        this.pauseLabel = pauseLabel ?? WmsControls.DefaultPauseLabel;

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

    /**
     * Setup with single play button.
     * @param playBtn - Play button can be HTMLButtonElement or button element id.
     * @param playLabel - Play button label (optional: "Play" if omitted).
     * @returns 
     */
    setSinglePlay(playBtn: HTMLButtonElement | string, playLabel?: string): WmsControls {
        this.setPlayButton(playBtn, playLabel);
        return this;
    }

    /**
     * Setup with single play/stop toggle button.
     * @param playStopBtn - Play/Stop button can be HTMLButtonElement or button element id.
     * @param playLabel - Play button label (optional: "Play" if omitted).
     * @param stopLabel - Stop button label (optional: "Stop" if omitted).
     * @returns 
     */
    setSinglePlayStop(playStopBtn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string) {
        this.setPlayStopButton(playStopBtn, playLabel);
        return this;
    }

    /**
     * Setup with play and stop buttons.
     * @param playBtn - Play button can be HTMLButtonElement or button element id.
     * @param stopBtn - Stop button can be HTMLButtonElement or button element id.
     * @param playLabel - Play button label (optional: "Play" if omitted).
     * @param stopLabel - Stop button label (optional: "Stop" if omitted).
     * @returns 
     */
    setPlayStop(playBtn: HTMLButtonElement | string, stopBtn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string) {
        this.setPlayButton(playBtn, playLabel);
        this.setStopButton(stopBtn, stopLabel);
        return this;
    }

    /**
     * Setup with play, pause and stop buttons.
     * @param playBtn - Play button can be HTMLButtonElement or button element id.
     * @param pauseBtn - Pause button can be HTMLButtonElement or button element id.
     * @param stopBtn - Stop button can be HTMLButtonElement or button element id.
     * @param playLabel - Play button label (optional: "Play" if omitted).
     * @param pauseLabel - Pause button label (optional: "Pause" if omitted).
     * @param stopLabel - Stop button label (optional: "Stop" if omitted).
     * @returns 
     */
    setPlayPauseStop(playBtn: HTMLButtonElement | string, pauseBtn: HTMLButtonElement | string, stopBtn: HTMLButtonElement | string, playLabel?: string, pauseLabel?: string, stopLabel?: string) {
        this.setPlayButton(playBtn, playLabel);
        this.setPauseButton(pauseBtn, pauseLabel);
        this.setStopButton(stopBtn, stopLabel);
        return this;
    }
}
