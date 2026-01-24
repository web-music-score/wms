const React = require("react");
const { ClassicalGuitar } = require("web-music-score/audio-cg");
const Audio = require("web-music-score/audio");
const ScoreUI = require("web-music-score/react-ui");
const { createFrereJacques } = require("web-music-score/pieces");

Audio.addInstrument(ClassicalGuitar);

function ExampleApp() {
    const [ doc ] = React.useState(createFrereJacques());

    return (
        <div>
            <ScoreUI.WmsControls doc={doc} />
            <br />
            <ScoreUI.WmsView doc={doc} />
        </div>
    );
}

module.exports = ExampleApp;