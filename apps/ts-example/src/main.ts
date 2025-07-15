import "core-js/stable";
import "regenerator-runtime/runtime";

import * as Audio from "@tspro/web-music-score/audio";
import * as Score from "@tspro/web-music-score/score";
import { createFrereJacques } from "@tspro/web-music-score/pieces";

Audio.setInstrument(Audio.Instrument.ClassicalGuitar);

let doc = createFrereJacques();

new Score.MRenderer().
    setCanvas("scoreCanvas").
    setDocument(doc).
    draw();

new Score.MPlaybackButtons().
    setPlayStopButton("playButton").
    setDocument(doc);
