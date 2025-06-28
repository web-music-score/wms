import * as React from "react";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";
import * as Score from "@tspro/web-music-score";
import { Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";

interface ChooseScaleCircleProps {
    app: GuitarApp;
    onChangeScale: (scale: Score.Scale) => void;
}

interface ChooseScaleCircleState {
    guitarCtx: Score.GuitarContext;
    doc: Score.MDocument;
}

export class ChooseScaleCircle extends React.Component<ChooseScaleCircleProps, ChooseScaleCircleState> {
    state: ChooseScaleCircleState;

    constructor(props: ChooseScaleCircleProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        this.state = this.createNewState(guitarCtx);
    }

    createNewState(guitarCtx: Score.GuitarContext) {
        let doc = Score.MDocument.createSimpleScaleArpeggio(Score.StaffKind.TrebleForGuitar, guitarCtx.scale, "B2", 1);
        return { guitarCtx, doc }
    }

    onChangeScale(scale: Score.Scale) {
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
                        <Score.PlaybackButtons doc={doc} buttonLayout={Score.PlaybackButtonsLayout.PlayStopSingle} />
                    </Col>
                    <Col>
                        <Button variant="primary" onClick={() => this.onOK()}>OK</Button>
                    </Col>
                </Row>
                <Row xs="auto">
                    <Col>
                        <Score.MusicScoreView doc={doc} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <Col>
                        <Score.CircleOfFifthsComponent
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

