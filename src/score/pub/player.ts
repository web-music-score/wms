import * as Audio from "web-music-score/audio";
import { Guard, ValueSet, Rect } from "@tspro/ts-utils-lib";
import { PlayerEngine } from "../engine/player-engine";
import { PlayState, PlayStateChangeListener } from "./types";
import { MDocument } from "./mobjects";
import { AssertUtil } from "shared-src";
import { isWmsControls } from "score/custom-element/wms-controls";
import { MusicError, MusicErrorType } from "core/error";

export class Player {
    private static currentlyPlaying = new ValueSet<Player>();

    private readonly player: PlayerEngine;

    /**
     * Create new music player.
     * @param doc - Music document to play.
     * @param playStateChangeListener - Play state change listener.
     */
    constructor(doc: MDocument, playStateChangeListener?: PlayStateChangeListener) {
        AssertUtil.assertVar(doc instanceof MDocument, "doc", doc);
        AssertUtil.assertVar(Guard.isFunctionOrUndefined(playStateChangeListener), "playStateChangeListener", playStateChangeListener);

        this.player = new PlayerEngine();

        this.player.setDocument(doc.getMusicObject());

        this.player.setCursorPositionChangeListener((cursorRect?: Rect) => {
            doc.getMusicObject().updateCursorRect(this, cursorRect);
        });

        if (playStateChangeListener) {
            this.player.setPlayStateChangeListener(playStateChangeListener);
        }
    }

    /**
     * Set play state change listener.
     * @param playStateChangeListener - Play state change listener.
     */
    setPlayStateChangeListener(playStateChangeListener: PlayStateChangeListener) {
        this.player.setPlayStateChangeListener(playStateChangeListener);
    }

    /**
     * Remove play state change listener.
     * @param playStateChangeListener - Play state change listener.
     */
    removePlayStateChangeListener(playStateChangeListener: PlayStateChangeListener) {
        this.player.removePlayStateChangeListener(playStateChangeListener);
    }

    /**
     * Get play state change listeners.
     */
    getPlayStateChangeListeners(): PlayStateChangeListener[] {
        return this.player.getPlayStateChangeListeners();
    }

    /**
     * Get play state.
     * @returns - Play state.
     */
    getPlayState(): PlayState {
        return this.player.getPlayState();
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
        Player.currentlyPlaying.add(this);

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

        Player.currentlyPlaying.delete(this);

        return this;
    }

    private boundElements = new ValueSet<HTMLElement>();

    /**
     * Bind this player to custom HTML element.
     * @param elem - HTML element id or element.
     */
    bindElement(elem: string | HTMLElement) {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        if (typeof document === "undefined")
            return;

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsControls(el)) {
            el.addEventListener("disconnected", () => this.boundElements.delete(el));
            el.player = this;
        }
        else
            throw new MusicError(MusicErrorType.Score, "Bind element must be <wms-controls>!");
    }

    /**
     * Unbind this player from custom HTML element.
     * @param elem - HTML element id or element.
     */
    unbindElement(elem: string | HTMLElement) {
        AssertUtil.assertVar(Guard.isNonEmptyString(elem) || Guard.isObject(elem), "elem", elem);

        if (typeof document === "undefined")
            return;

        const el = typeof elem === "string" ? document.getElementById(elem) : elem;

        if (isWmsControls(el)) {
            el.player = undefined;
            this.boundElements.delete(el);
        }
        else
            throw new MusicError(MusicErrorType.Score, "Unbind element must be <wms-music-score-view>!");
    }
}
