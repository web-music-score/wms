import * as React from "react";

// Try require
const { ClassicalGuitar } = require("web-music-score/audio-cg");
const Audio = require("web-music-score/audio");
const ScoreUI = require("web-music-score/react-ui");
const { createFrereJacques } = require("web-music-score/pieces");

export class ExampleApp extends React.Component {
    constructor(props) {
        super(props);

        Audio.addInstrument(ClassicalGuitar);

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
