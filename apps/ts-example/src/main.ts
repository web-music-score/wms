import "core-js/stable";
import "regenerator-runtime/runtime";

import * as Score from "@tspro/web-music-score";
import { createFrereJacques } from "@tspro/web-music-score/pieces";

Score.Audio.setInstrument(Score.Audio.Instrument.ClassicalGuitar);

let doc = createFrereJacques();

new Score.MRenderer().
    setCanvas("scoreCanvas").
    setDocument(doc).
    draw();

new Score.MPlaybackButtons().
    setPlayStopButton("playButton").
    setDocument(doc);
