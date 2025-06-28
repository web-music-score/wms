import "core-js/stable";
import  "regenerator-runtime/runtime";

import * as Score from "@tspro/web-music-score";

Score.Audio.setInstrument(Score.Audio.Instrument.ClassicalGuitar);

let doc = Score.SamplePieces.createFrereJacques();

new Score.MRenderer().
    setCanvas("scoreCanvas").
    setDocument(doc).
    draw();

new Score.PlaybackButtonsController().
    setPlayStopButton("playButton").
    setDocument(doc);
