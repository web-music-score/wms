import * as React from "react";
import * as Score from "@tspro/web-music-score";

type ExampleAppState = { doc: Score.MDocument }

export class ExampleApp extends React.Component<{}, ExampleAppState> {

    state: ExampleAppState;

    constructor(props: {}) {
        super(props);

        Score.Audio.setInstrument(Score.Audio.Instrument.ClassicalGuitar);

        let doc = Score.SamplePieces.createFrereJacques();

        this.state = { doc }
    }

    render() {
        let { doc } = this.state;

        return (
            <div>
                <Score.MusicScoreView doc={doc} />
                <br />
                <Score.PlaybackButtons doc={doc} />
            </div>
        );
    }
}

export default ExampleApp;
