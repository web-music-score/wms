import * as React from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { OrderOfAccidentalsInfo, SelectScaleForm, ScaleStepsInfo, Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

interface ChooseScaleProps {
    app: GuitarApp;
    onChangeScale: (scale: Theory.Scale) => void;
}

interface ChooseScaleState {
    guitarCtx: ScoreUI.GuitarContext;
    doc: Score.MDocument;
}

export class ChooseScale extends React.Component<ChooseScaleProps, ChooseScaleState> {
    state: ChooseScaleState;

    constructor(props: ChooseScaleProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        this.state = this.createNewState(guitarCtx);
    }

    createNewState(guitarCtx: ScoreUI.GuitarContext) {
        let doc = new Score.DocumentBuilder()
            .setScoreConfiguration(Score.StaffPreset.GuitarTreble)
            .setKeySignature(guitarCtx.scale)
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

            <Container>
                <h1>{Page.ChooseScale}</h1>

                <Row xs="auto">
                    <Col>
                        <SelectScaleForm scale={scale} onScaleChange={scale => this.onChangeScale(scale)} />
                    </Col>
                    <Col>
                        <ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStopSingle} />
                    </Col>
                    <Col>
                        <Button variant="primary" onClick={() => this.onOK()}>OK</Button>
                    </Col>
                </Row>
                <Row xs="auto" className="mt-4">
                    <Col>
                        <ScoreUI.MusicScoreView doc={doc} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <Col>
                        <ScaleStepsInfo scale={scale} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <Col>
                        <OrderOfAccidentalsInfo ks={scale} />
                    </Col>
                </Row>
            </Container>
        </>
    }

}
