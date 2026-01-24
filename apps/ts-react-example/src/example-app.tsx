import * as React from "react";
import { ClassicalGuitar } from "web-music-score/audio-cg";
import * as Audio from "web-music-score/audio";
import * as ScoreUI from "web-music-score/react-ui";
import { createFrereJacques } from "web-music-score/pieces";

Audio.addInstrument(ClassicalGuitar);

function ExampleApp() {
    const [doc] = React.useState(createFrereJacques());

    return (
        <div>
            <ScoreUI.WmsControls doc={doc} />
            <br />
            <ScoreUI.WmsView doc={doc} />
        </div>
    );
}

export default ExampleApp;
