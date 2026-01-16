import "core-js/stable";
import "regenerator-runtime/runtime";

import * as Score from "web-music-score/score";
import { createFrereJacques } from "web-music-score/pieces";

let doc = createFrereJacques();

new Score.WmsView()
    .setCanvas("scoreCanvas")
    .setDocument(doc)
    .draw();

new Score.WmsControls()
    .setPlayButton("playButton")
    .setPauseButton("pauseButton")
    .setStopButton("stopButton")
    .setDocument(doc);
