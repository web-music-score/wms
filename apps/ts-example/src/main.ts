import "core-js/stable";
import "regenerator-runtime/runtime";

import * as Score from "web-music-score/score";
import { createFrereJacques } from "web-music-score/pieces";


let doc = createFrereJacques();

new Score.MRenderContext().
    setCanvas("scoreCanvas").
    setDocument(doc).
    draw();

new Score.MPlaybackButtons().
    setPlayStopButton("playButton").
    setDocument(doc);
