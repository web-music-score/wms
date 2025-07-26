import * as React from "react";
import * as Audio from "@tspro/web-music-score/audio";
import { registerClassicalGuitar } from "@tspro/web-music-score/audio-cg";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";
import { DemoPieces } from "demo-pieces";

type DemoAppState = {
    instrument: string;
    doc: Score.MDocument;
    hoverText: string;
}

export class DemoApp extends React.Component<{}, DemoAppState> {

    state: DemoAppState;

    constructor(props: {}) {
        super(props);

        registerClassicalGuitar();

        this.state = {
            instrument: Audio.getCurrentInstrument(),
            doc: DemoPieces.getInstance().getDefault(),
            hoverText: ""
        }
    }

    render() {
        let { instrument, doc, hoverText } = this.state;

        let docList = DemoPieces.getInstance().getList();

        const onChangePiece = (title: string) => {
            let newDoc = DemoPieces.getInstance().getDocument(title);

            if (newDoc && newDoc.getTitle() !== doc.getTitle()) {
                Score.MPlayer.stopAll();
                this.setState({ doc: newDoc });
            }
        }

        const onChangeInstrument = (instrument: string) => {
            Audio.setInstrument(instrument);
            this.setState({ instrument });
        }

        const onScoreEvent: Score.ScoreEventListener = (event: Score.ScoreEvent) => {
            if (event instanceof Score.ScoreObjectEvent) {
                if (event.type === "leave") {
                    event.renderer.hilightObject(undefined);
                    this.setState({ hoverText: "" });
                }
                else {
                    event.renderer.hilightObject(event.topObject);
                    this.setState({ hoverText: event.topObject.name + " Object" });
                }
            }
        }

        return <div className="container">
            <h1>Features Demo</h1>
            <br />
            <div className="row">
                <div className="col-3">
                    <select className="form-select" name="select" value={doc.getTitle()} onChange={e => onChangePiece(e.target.value)}>
                        {docList.map((doc, i) => {
                            return <option disabled={!(doc instanceof Score.MDocument)} key={i}>
                                {(doc instanceof Score.MDocument) ? doc.getTitle() : doc}
                            </option>;
                        })}
                    </select>
                </div>
                <div className="col-1">
                    <ScoreUI.PlaybackButtons doc={doc} />
                </div>
            </div>
            <br />
            <div className="row">
                <label className="form-label">Instrument:</label>
                <div className="col-3">
                    <select className="form-select" name="select" value={instrument} onChange={e => onChangeInstrument(e.target.value)}>
                        {Audio.getInstrumentList().map(instr => <option key={instr} >{instr}</option>)}
                    </select>
                </div>
            </div>
            <br />
            {hoverText}
            <br />
            <ScoreUI.MusicScoreView doc={doc} onScoreEvent={onScoreEvent} />
        </div >
    }
}

export default DemoApp;
