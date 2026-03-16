const React = require("react");
const Audio = require("web-music-score/audio");
const ScoreUI = require("web-music-score/react-ui");
const { createFrereJacques } = require("web-music-score/pieces");

Audio.setDefaultInstrument(0);

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