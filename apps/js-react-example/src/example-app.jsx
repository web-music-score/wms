import * as React from "react";
import * as Score from "@tspro/web-music-score";

export class ExampleApp extends React.Component {
    constructor(props) {
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
