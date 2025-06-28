import * as React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import * as Score from "@tspro/web-music-score";
import { Menubar, SelectTuningForm } from "components";
import { GuitarApp, Page } from "guitar-app";

interface ChooseTuningProps {
    app: GuitarApp;
    onChangeTuning: (tuningName: string) => void;
}

interface ChooseTuningState {
    guitarCtx: Score.GuitarContext;
}

export class ChooseTuning extends React.Component<ChooseTuningProps, ChooseTuningState> {
    state: ChooseTuningState;

    constructor(props: ChooseTuningProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        this.state = { guitarCtx }
    }

    onChangeTuning(tuningName: string) {
        try {
            let guitarCtx = this.state.guitarCtx.alterTuningName(Score.validateTuningName(tuningName));
            if (guitarCtx !== this.state.guitarCtx) {
                Score.MPlayer.stopAll();
                this.setState({ guitarCtx });
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    onOK() {
        try {
            Score.MPlayer.stopAll();
            this.props.onChangeTuning(this.state.guitarCtx.tuningName);
        }
        catch (err) {
            console.error(err);
        }
    }

    render() {
        let { app } = this.props;
        let { guitarCtx } = this.state;
        let { tuningName } = guitarCtx;

        let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);
        let m = doc.addMeasure().setKeySignature(Score.getScale("C", Score.ScaleType.Major));
        let notes = [0, 1, 2, 3, 4, 5].map(i => guitarCtx.getStringTuning(i)).reverse();
        notes.forEach(note => {
            m.addNote(0, note, Score.NoteLength.Quarter);
            m.addLabel(Score.Label.Note, note.format(Score.PitchNotation.Scientific, Score.SymbolSet.Unicode));
        });
        m.addChord(0, notes, Score.NoteLength.Whole, { arpeggio: Score.Arpeggio.Up });


        const openStringNoteName = (stringId: number) => {
            return guitarCtx.getStringTuning(stringId).format(guitarCtx.pitchNotation, Score.SymbolSet.Unicode);
        }

        return <>
            <Menubar app={app} />

            <Container>
                <h1>{Page.ChooseTuning}</h1>

                <Row xs="auto">
                    <Col>
                        <SelectTuningForm tuningName={tuningName} onTuningChange={t => this.onChangeTuning(t)} />
                    </Col>
                    <Col>
                        <Button variant="primary" onClick={() => this.onOK()}>OK</Button>
                    </Col>
                </Row>
                <br />
                <table style={{ textAlign: "center" }}>
                    <thead>
                        <tr><td>String</td><td></td><td>Pitch</td></tr>
                    </thead>
                    <tbody>
                        <tr><td>6th</td><td>⎯⎯⎯⎯⎯</td><td>{openStringNoteName(5)}</td></tr>
                        <tr><td>5th</td><td>⎯⎯⎯⎯⎯</td><td>{openStringNoteName(4)}</td></tr>
                        <tr><td>4th</td><td>⎯⎯⎯⎯⎯</td><td>{openStringNoteName(3)}</td></tr>
                        <tr><td>3rd</td><td>⎯⎯⎯⎯⎯</td><td>{openStringNoteName(2)}</td></tr>
                        <tr><td>2nd</td><td>⎯⎯⎯⎯⎯</td><td>{openStringNoteName(1)}</td></tr>
                        <tr><td>1st</td><td>⎯⎯⎯⎯⎯</td><td>{openStringNoteName(0)}</td></tr>
                    </tbody>
                </table>
                <br />
                <Row xs="auto">
                    <Col>
                        <Score.MusicScoreView doc={doc} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayStopSingle} />
                </Row>

            </Container>
        </>
    }

}
