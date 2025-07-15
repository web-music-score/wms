import * as React from "react";

// Try require
const Audio = require("@tspro/web-music-score/audio");
const Score = require("@tspro/web-music-score/score");
const ScoreUI = require("@tspro/web-music-score/react-ui");
const { createFrereJacques } = require("@tspro/web-music-score/pieces");

export class ExampleApp extends React.Component {
    constructor(props) {
        super(props);

        Audio.setInstrument(Audio.Instrument.ClassicalGuitar);

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
