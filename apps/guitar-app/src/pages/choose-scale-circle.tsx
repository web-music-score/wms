import * as React from "react";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";
import { Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

interface ChooseScaleCircleProps {
    app: GuitarApp;
    onChangeScale: (scale: Theory.Scale) => void;
}

interface ChooseScaleCircleState {
    guitarCtx: ScoreUI.GuitarContext;
    doc: Score.MDocument;
}

export class ChooseScaleCircle extends React.Component<ChooseScaleCircleProps, ChooseScaleCircleState> {
    state: ChooseScaleCircleState;

    constructor(props: ChooseScaleCircleProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        this.state = this.createNewState(guitarCtx);
    }

    createNewState(guitarCtx: ScoreUI.GuitarContext) {
        let doc = new Score.DocumentBuilder()
            .setScoreConfiguration(Score.StaffPreset.GuitarTreble)
            .addScaleArpeggio(guitarCtx.scale, "B2", 1)
            .getDocument();

        return { guitarCtx, doc }
    }

    onChangeScale(scale: Theory.Scale) {
        try {
            let guitarCtx = this.state.guitarCtx.alterScale(scale);
            if (guitarCtx !== this.state.guitarCtx) {
                Score.MPlayer.stopAll();
                this.setState(this.createNewState(guitarCtx));
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    onOK() {
        try {
            Score.MPlayer.stopAll();
            this.props.onChangeScale(this.state.guitarCtx.scale);
        }
        catch (err) {
            console.error(err);
        }
    }

    render() {
        let { doc, guitarCtx } = this.state;
        let { app } = this.props;
        let { scale } = guitarCtx;

        return <>
            <Menubar app={app} />

            <Container style={{ position: "relative", zIndex: 2 }}>
                <h1>{Page.CircleOfFifths}</h1>

                <Row xs="auto">
                    <Col>
                        <Alert variant="info">{scale.getScaleName()} - scale</Alert>
                    </Col>
                    <Col>
                        <ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStopSingle} />
                    </Col>
                    <Col>
                        <Button variant="primary" onClick={() => this.onOK()}>OK</Button>
                    </Col>
                </Row>
                <Row xs="auto">
                    <Col>
                        <ScoreUI.MusicScoreView doc={doc} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <Col>
                        <ScoreUI.CircleOfFifths
                            style={{ position: "relative", padding: "0.5em" }}
                            scale={scale}
                            onScaleChange={newScale => this.onChangeScale(newScale)} />
                    </Col>
                </Row>
                <br />
            </Container>
        </>;
    }
}

