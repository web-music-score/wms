import * as React from "react";
import * as Score from "@tspro/web-music-score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";
import { DemoPieces } from "demo-pieces";

type DemoAppState = {
    instrument: Score.Audio.Instrument;
    doc: Score.MDocument;
    hoverText: string;
}

export class DemoApp extends React.Component<{}, DemoAppState> {

    state: DemoAppState;

    constructor(props: {}) {
        super(props);

        Score.Audio.setInstrument(Score.Audio.Instrument.ClassicalGuitar);

        this.state = {
            instrument: Score.Audio.Instrument.ClassicalGuitar,
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

        const onChangeInstrument = (instr: number) => {
            Score.Audio.setInstrument(Score.Audio.validateInstrument(instr));
            this.setState({ instrument: Score.Audio.validateInstrument(instr) });
        }

        const onSelectObject = (arr: Score.MusicInterface[]) => {
            let selObj = arr[arr.length - 1];
            if (selObj) {
                this.setState({ hoverText: selObj.name + " Object" });
            }
            return selObj;
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
                    <select className="form-select" name="select" value={instrument} onChange={e => onChangeInstrument(+e.target.value)}>
                        {Score.Audio.InstrumentList.map(instr => <option key={instr} value={instr}>{Score.Audio.getInstrumentName(instr)}</option>)}
                    </select>
                </div>
            </div>
            <br />
            {hoverText}
            <br />
            <ScoreUI.MusicScoreView doc={doc} onClickObject={() => { }} onSelectObject={onSelectObject} />
        </div >
    }
}

export default DemoApp;
