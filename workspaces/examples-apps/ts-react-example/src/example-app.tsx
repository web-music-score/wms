import * as React from "react";
import * as Audio from "web-music-score/audio";
import * as ScoreUI from "web-music-score/react-ui";
import { createFrereJacques } from "web-music-score/pieces";

Audio.setDefaultInstrument(0);

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
