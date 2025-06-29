import { Assert, Utils } from "@tspro/ts-utils-lib";
import { MDocument, MPlayer } from "./interface";
import { PlayState } from "./types";

const savedOnClickListeners = new Map<HTMLButtonElement, (() => void)[]>();

function removeOnClickListeners(btn: HTMLButtonElement | undefined, onClick: (() => void) | "all") {
    if (btn) {
        let savedListeners = savedOnClickListeners.get(btn) || [];
        let remainingListeners: (() => void)[] = [];

        savedListeners.forEach(l => {
            if (onClick === l || onClick === "all") {
                btn.removeEventListener("click", l);
            }
            else {
                remainingListeners.push(l);
            }
        });

        savedOnClickListeners.set(btn, remainingListeners);
    }
}

function addOnClickListener(btn: HTMLButtonElement, onClick: () => void) {
    btn.addEventListener("click", onClick);

    let clickListeners = savedOnClickListeners.get(btn) || [];

    savedOnClickListeners.set(btn, [...clickListeners, onClick]);
}

/** @public */
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

    constructor() {
        this.onPlay = () => this.player?.play();
        this.onStop = () => this.player?.stop();
        this.onPlayStop = () => { this.playState === PlayState.Playing ? this.player?.stop() : this.player?.play(); }
        this.onPause = () => this.player?.pause();

        this.updateButtons();
    }

    setDocument(doc: MDocument | undefined) {
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

    setPlayButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        removeOnClickListeners(this.playButton, this.onPlay);

        this.playButton = Assert.require(Utils.Dom.getButton(btn), "Play button required!");
        this.playLabel = btnLabel ?? "Play";

        removeOnClickListeners(this.playButton, "all");
        addOnClickListener(this.playButton, this.onPlay);

        this.updateButtons();

        return this;
    }

    setStopButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        removeOnClickListeners(this.stopButton, this.onStop);

        this.stopButton = Assert.require(Utils.Dom.getButton(btn), "Stop button required!");
        this.stopLabel = btnLabel ?? "Stop";

        removeOnClickListeners(this.stopButton, "all");
        addOnClickListener(this.stopButton, this.onStop);

        this.updateButtons();

        return this;
    }

    setPlayStopButton(btn: HTMLButtonElement | string, playLabel?: string, stopLabel?: string) {
        removeOnClickListeners(this.playStopButton, this.onPlayStop);

        this.playStopButton = Assert.require(Utils.Dom.getButton(btn), "Play/stop button required!");
        this.playLabel = playLabel ?? "Play";
        this.stopLabel = stopLabel ?? "Stop";

        removeOnClickListeners(this.playStopButton, "all");
        addOnClickListener(this.playStopButton, this.onPlayStop);

        this.updateButtons();

        return this;
    }

    setPauseButton(btn: HTMLButtonElement | string, btnLabel?: string) {
        removeOnClickListeners(this.pauseButton, this.onPause);

        this.pauseButton = Assert.require(Utils.Dom.getButton(btn), "Pause button required!");
        this.pauseLabel = btnLabel ?? "Pause";

        removeOnClickListeners(this.pauseButton, "all");
        addOnClickListener(this.pauseButton, this.onPause);

        this.updateButtons();

        return this;
    }
}
