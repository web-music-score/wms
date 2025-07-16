import * as React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Menubar, SelectTuningForm } from "components";
import { GuitarApp, Page } from "guitar-app";
import * as Audio from "@tspro/web-music-score/audio";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

interface ChooseTuningProps {
    app: GuitarApp;
    onChangeTuning: (tuningName: string) => void;
}

interface ChooseTuningState {
    guitarCtx: ScoreUI.GuitarContext;
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
            let guitarCtx = this.state.guitarCtx.alterTuningName(Theory.validateTuningName(tuningName));
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

        let notes = [0, 1, 2, 3, 4, 5].map(i => guitarCtx.getStringTuning(i)).reverse();

        let staffKinds = [
            Score.StaffKind.GuitarTreble,
            Score.StaffKind.Treble,
            Score.StaffKind.Bass,
            Score.StaffKind.Grand
        ];

        let doc: Score.MDocument | undefined;

        for (let i = 0; i < staffKinds.length; i++) {
            try {
                doc = new Score.MDocument(staffKinds[i]);

                let m = doc.addMeasure().setKeySignature(Theory.getScale("C", Theory.ScaleType.Major));

                notes.forEach(note => {
                    m.addNote(0, note, Theory.NoteLength.Quarter);
                    m.addLabel(Score.Label.Note, note.format(Theory.PitchNotation.Scientific, Theory.SymbolSet.Unicode));
                });

                m.addChord(0, notes, Theory.NoteLength.Whole, { arpeggio: Score.Arpeggio.Up });

                // Ok.
                break;
            }
            catch (err) {
                // All notes did not fit into staff.
                continue;
            }
        }

        if (!doc) {
            return <div>Error.</div>;
        }

        const openStringNoteName = (stringId: number) => {
            return guitarCtx.getStringTuning(stringId).format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode);
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
                        <ScoreUI.MusicScoreView doc={doc} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStopSingle} />
                </Row>

            </Container>
        </>
    }

}
