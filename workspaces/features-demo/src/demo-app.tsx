import * as React from "react";
import * as Audio from "web-music-score/audio";
import { ClassicalGuitar } from "web-music-score/audio-cg";
import * as Score from "web-music-score/score";
import * as ScoreUI from "web-music-score/react-ui";
import { DemoPieces } from "demo-pieces";

Audio.addInstrument(ClassicalGuitar);

function DemoApp() {
    const [doc, setDoc] = React.useState(DemoPieces.getInstance().getDefault() as (Score.MDocument | undefined));
    const [instrument, setInstrument] = React.useState(Audio.getCurrentInstrument());
    const [hoverObjectText, setHoverObjectText] = React.useState("");
    const [hoverStaffText, setHoverStaffText] = React.useState("");


    const onChangePiece = (title: string) => {
        let newDoc = DemoPieces.getInstance().getDocument(title);

        if (DemoPieces.getTitle(newDoc) !== DemoPieces.getTitle(doc)) {
            Score.Player.stopAll();
            setDoc(newDoc);
        }
    }

    const onChangeInstrument = (instrument: string) => {
        Audio.useInstrument(instrument);
        setInstrument(instrument);
    }

    const onScoreEvent: Score.ScoreEventListener = (event: Score.ScoreEvent) => {
        if (event instanceof Score.ScoreObjectEvent) {
            if (event.type === "leave") {
                event.view.hilightObject(undefined);
                setHoverObjectText("");
            }
            else {
                event.view.hilightObject(event.topObject);
                setHoverObjectText(`Hover Object: ${event.topObject.name}`)
            }
        }
        else if (event instanceof Score.ScoreStaffEvent) {
            if (event.type === "leave") {
                event.view.hilightStaffPos(undefined);
                setHoverStaffText("");
            }
            else {
                event.view.hilightStaffPos(event);
                setHoverStaffText(`Hover Note: ${event.noteName}`);
            }
        }
    }

    return <div className="container">
        <h1>Features Demo</h1>
        <br />
        <div className="row">
            <div className="col-3">
                <select className="form-select" name="select" value={DemoPieces.getTitle(doc)} onChange={e => onChangePiece(e.target.value)}>
                    {DemoPieces.getInstance().getList().map((doc, i) => {
                        return <option disabled={DemoPieces.getTitle(doc).startsWith("-")} key={i}>
                            {DemoPieces.getTitle(doc)}
                        </option>;
                    })}
                </select>
            </div>
            <div className="col-1">
                <ScoreUI.WmsControls doc={doc} />
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
        <div>
            <code>{hoverObjectText}</code><br />
            <code>{hoverStaffText.split("\n").map(s => <>{s}</>)}</code><br />
        </div>
        <ScoreUI.WmsView doc={doc} onScoreEvent={onScoreEvent} />
    </div >
}

export default DemoApp;
