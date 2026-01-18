import * as React from "react";
import { ClassicalGuitar } from "web-music-score/audio-cg";
import * as Audio from "web-music-score/audio";
import * as Score from "web-music-score/score";
import * as ScoreUI from "web-music-score/react-ui";
import { createFrereJacques } from "web-music-score/pieces";

type ExampleAppState = { doc: Score.MDocument }

export class ExampleApp extends React.Component<{}, ExampleAppState> {

    state: ExampleAppState;

    constructor(props: {}) {
        super(props);

        Audio.addInstrument(ClassicalGuitar);

        let doc = createFrereJacques();

        this.state = { doc }
    }

    render() {
        let { doc } = this.state;

        return (
            <div>
                <ScoreUI.WmsControls doc={doc} />
                <br />
                <ScoreUI.WmsView doc={doc} />
            </div>
        );
    }
}

export default ExampleApp;
