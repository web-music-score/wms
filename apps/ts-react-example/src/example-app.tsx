import * as React from "react";
import { ClassicalGuitar } from "@tspro/web-music-score/audio-cg";
import * as Audio from "@tspro/web-music-score/audio";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";
import { createFrereJacques } from "@tspro/web-music-score/pieces";

type ExampleAppState = { doc: Score.MDocument }

export class ExampleApp extends React.Component<{}, ExampleAppState> {

    state: ExampleAppState;

    constructor(props: {}) {
        super(props);

        Audio.registerInstrument(ClassicalGuitar);

        let doc = createFrereJacques();

        this.state = { doc }
    }

    render() {
        let { doc } = this.state;

        return (
            <div>
                <ScoreUI.MusicScoreView doc={doc} />
                <br />
                <ScoreUI.PlaybackButtons doc={doc} />
            </div>
        );
    }
}

export default ExampleApp;
