import * as Audio from "web-music-score/audio";
import * as Score from "web-music-score/score";
import { createFrereJacques } from "web-music-score/pieces";

Audio.setDefaultInstrument(0);

let doc = createFrereJacques();

new Score.WmsView()
    .setCanvas("scoreCanvas")
    .setDocument(doc)
    .draw();

new Score.WmsControls()
    .setPlayPauseStop("playButton", "pauseButton", "stopButton")
    .setDocument(doc);
