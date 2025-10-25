import * as Audio from "@tspro/web-music-score/audio";
import { Guard, Utils } from "@tspro/ts-utils-lib";
import { DivRect } from "./div-rect";
import { Player } from "../engine/player";
import { RenderContext } from "../engine/render-context";
import { PlayStateChangeListener } from "./types";
import { ScoreEventListener } from "./event";
import { PlayState } from "./types";
import { MDocument, MScoreRow, MusicInterface } from "./music-objects";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

function assertArg(condition: boolean, argName: string, argValue: unknown) {
    if (!condition) {
        throw new MusicError(MusicErrorType.Score, `Invalid arg: ${argName} = ${argValue}`);
    }
}

function require_t<T>(t: T | undefined | null, message?: string): T {
    if (t === undefined || t === null) {
        throw new TypeError(message);
    }
    else {
        return t;
    }
}

/** Music player class. */
export class MPlayer {
    private static currentlyPlaying = new Set<MPlayer>();

    private readonly player: Player;

    /**
     * Create new music player.
     * @param doc - Music document to play.
     * @param playStateChangeListener - Play state change listener.
     */
    constructor(doc: MDocument, playStateChangeListener?: PlayStateChangeListener) {
        assertArg(doc instanceof MDocument, "doc", doc);
        assertArg(Guard.isFunctionOrUndefined(playStateChangeListener), "playStateChangeListener", playStateChangeListener);

        this.player = new Player();

        this.player.setDocument(doc.getMusicObject());
        this.player.setCursorPositionChangeListener((cursorRect?: DivRect) => doc.getMusicObject().updateCursorRect(cursorRect));

        if (playStateChangeListener) {
            this.player.setPlayStateChnageListener(playStateChangeListener);
        }
    }

    /**
     * Stop all playing.
     */
    static stopAll() {
        this.currentlyPlaying.forEach(p => p.stop());
        Audio.stop();
    }

    /**
     * Playe attached document.
     * @returns - This player instance.
     */
    play() {
        MPlayer.currentlyPlaying.add(this);

        this.player.play();

        return this;
    }

    /**
     * Pause playback of attached document.
     * @returns - This player instance.
     */
    pause() {
        this.player.pause();

        return this;
    }

    /**
     * Stop playback of attached document.
     * @returns - This player instance.
     */
    stop() {
        this.player.stop();

        MPlayer.currentlyPlaying.delete(this);

        return this;
    }
}

/** Render context class. */
export class MRenderContext {
    private readonly ctx: RenderContext;

    /**
     * Create new render context instance.
     */
    constructor() {
        this.ctx = new RenderContext(this);
    }

    /**
     * Attach music document to this render context.
     * @param doc - Music document.
     * @returns - This render context instance.
     */
    setDocument(doc?: MDocument): MRenderContext {
        assertArg(Guard.isUndefined(doc) || doc instanceof MDocument, "doc", doc);

        this.ctx.setDocument(doc);
        return this;
    }

    /**
     * Set target canvas html element for this render context.
     * @param canvas - HTML canvas element or element id.
     * @returns - This render context instance.
     */
    setCanvas(canvas: HTMLCanvasElement | string): MRenderContext {

        canvas = require_t(Utils.Dom.getCanvas(canvas), typeof canvas === "string"
            ? "Cannot set render canvas because invalid canvas id: " + canvas
            : "Cannot set render canvas because given canvas is undefined.");
        this.ctx.setCanvas(canvas);
        return this;
    }

    /**
     * Set score event listener.
     * @param scoreEventListener - Score event listener.
     */
    setScoreEventListener(scoreEventListener: ScoreEventListener) {
        assertArg(Guard.isFunctionOrUndefined(scoreEventListener), "scoreEventListener", scoreEventListener);
        this.ctx.setScoreEventListener(scoreEventListener);
    }

    /**
     * Draw given music object hilighted.
     * @param obj - Music object or undefined to remove hilighting.
     */
    hilightObject(obj?: MusicInterface) {
        this.ctx.hilightObject(obj?.getMusicObject());
    }

    /**
     * Draw given staff position hilighted.
     * @param staffPos - Staff position (score row and diatonic id) or undefined to remove hilighting.
     */
    hilightStaffPos(staffPos?: { scoreRow: MScoreRow, diatonicId: number }) {
        this.ctx.hilightStaffPos(staffPos ? {
            scoreRow: staffPos.scoreRow.getMusicObject(),
            diatonicId: staffPos.diatonicId
        } : undefined);
    }

    /**
     * Draw contents of attached music document to attached canvas.
     */
    draw() {
        try {
            this.ctx.draw();
        }
        catch (err) {
            console.log("Draw failed in music render context!", err);
        }
    }
}

/**
 * Renderer class.
 * @deprecated - Use MRenderContext instead.
 * */
export class MRenderer extends MRenderContext { }

/** Playback buttons helper class. */
export class MPlaybackButtons {
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

    private player?: MPlayer = undefined;

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
    setDocument(doc?: MDocument): MPlaybackButtons {
        assertArg(Guard.isUndefined(doc) || doc instanceof MDocument, "doc", doc);

        this.onStop();

        if (doc) {
            this.player = new MPlayer(doc, (playState: PlayState) => {
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
    setPlayButton(btn: HTMLButtonElement | string, btnLabel?: string): MPlaybackButtons {
        assertArg(Guard.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        MPlaybackButtons.removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = require_t(Utils.Dom.getButton(btn), "Play button required!");
        this.playLabel = btnLabel ?? "Play";

        MPlaybackButtons.removeOnClickListeners(this.playButton, "all");
        MPlaybackButtons.addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    /**
     * Set stop button.
     * @param btn - HTML button element or element id.
     * @param btnLabel - Custom button label (e.g. "Stop").
     * @returns - This playback buttons class instance.
     */
    setStopButton(btn: HTMLButtonElement | string, btnLabel?: string): MPlaybackButtons {
        assertArg(Guard.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        MPlaybackButtons.removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = require_t(Utils.Dom.getButton(btn), "Stop button required!");
        this.stopLabel = btnLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.stopButton, "all");
        MPlaybackButtons.addOnClickListener(this.stopButton, this.onStop);

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
    setPlayStopButton(btn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string): MPlaybackButtons {
        assertArg(Guard.isStringOrUndefined(playLabel), "playLabel", playLabel);
        assertArg(Guard.isStringOrUndefined(stopLabel), "stopLabel", stopLabel);

        MPlaybackButtons.removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = require_t(Utils.Dom.getButton(btn), "Play/stop button required!");
        this.playLabel = playLabel ?? "Play";
        this.stopLabel = stopLabel ?? "Stop";

        MPlaybackButtons.removeOnClickListeners(this.playStopButton, "all");
        MPlaybackButtons.addOnClickListener(this.playStopButton, this.onPlayStop);

        this.updateButtons();

        return this;
    }

    /**
     * Set pause button.
     * @param btn - HTML button element or element id.
     * @param btnLabel - Custom button label (e.g. "Pause").
     * @returns - This playback buttons class instance.
     */
    setPauseButton(btn: HTMLButtonElement | string, btnLabel?: string): MPlaybackButtons {
        assertArg(Guard.isStringOrUndefined(btnLabel), "btnLabel", btnLabel);

        MPlaybackButtons.removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = require_t(Utils.Dom.getButton(btn), "Pause button required!");
        this.pauseLabel = btnLabel ?? "Pause";

        MPlaybackButtons.removeOnClickListeners(this.pauseButton, "all");
        MPlaybackButtons.addOnClickListener(this.pauseButton, this.onPause);

        this.updateButtons();

        return this;
    }

    private static savedOnClickListeners = new Map<HTMLButtonElement, (() => void)[]>();

    private static removeOnClickListeners(btn: HTMLButtonElement | undefined, onClick: (() => void) | "all") {
        if (btn) {
            let savedListeners = this.savedOnClickListeners.get(btn) || [];
            let remainingListeners: (() => void)[] = [];

            savedListeners.forEach(l => {
                if (onClick === l || onClick === "all") {
                    btn.removeEventListener("click", l);
                }
                else {
                    remainingListeners.push(l);
                }
            });

            this.savedOnClickListeners.set(btn, remainingListeners);
        }
    }

    private static addOnClickListener(btn: HTMLButtonElement, onClick: () => void) {
        assertArg(Guard.isFunction(onClick), "onClick", onClick);

        btn.addEventListener("click", onClick);

        let clickListeners = this.savedOnClickListeners.get(btn) || [];

        this.savedOnClickListeners.set(btn, [...clickListeners, onClick]);
    }
}
