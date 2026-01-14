import * as Audio from "web-music-score/audio";
import { Guard, ValueSet, Rect } from "@tspro/ts-utils-lib";
import { Player as InternalPlayer } from "../engine/player";
import { PlayStateChangeListener } from "./types";
import { MDocument } from "./mobjects";
import { AssertUtil } from "shared-src";

export class Player {
    private static currentlyPlaying = new ValueSet<Player>();

    private readonly player: InternalPlayer;

    /**
     * Create new music player.
     * @param doc - Music document to play.
     * @param playStateChangeListener - Play state change listener.
     */
    constructor(doc: MDocument, playStateChangeListener?: PlayStateChangeListener) {
        AssertUtil.assertVar(doc instanceof MDocument, "doc", doc);
        AssertUtil.assertVar(Guard.isFunctionOrUndefined(playStateChangeListener), "playStateChangeListener", playStateChangeListener);

        this.player = new InternalPlayer();

        this.player.setDocument(doc.getMusicObject());

        this.player.setCursorPositionChangeListener((cursorRect?: Rect) => {
            doc.getMusicObject().updateCursorRect(cursorRect);
        });

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
}
