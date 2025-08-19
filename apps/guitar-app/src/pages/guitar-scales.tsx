import * as React from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { TuningScaleInfo, Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import { Utils } from "@tspro/ts-utils-lib";
import * as Audio from "@tspro/web-music-score/audio";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

class ScaleVariant {
    readonly name: string;
    readonly fretExtentByString: number[];

    constructor(readonly position: number, readonly fretPositions: ReadonlyArray<ScoreUI.FretPosition>) {
        this.name = position === 0 ? "Open" : Utils.Math.toOrdinalNumber(position) + " position";
        this.fretExtentByString = [0, 1, 2, 3, 4, 5].map(stringId => {
            let max = Math.max(...fretPositions.filter(fretPos => fretPos.stringId === stringId).map(fretPos => fretPos.fretId));
            let min = Math.min(...fretPositions.filter(fretPos => fretPos.stringId === stringId).map(fretPos => fretPos.fretId));
            return max - min + 1;
        });
    }
}

interface GuitarScalesProps {
    app: GuitarApp;
    windowRect: Score.DivRect;
}

interface GuitarScalesState {
    guitarCtx: ScoreUI.GuitarContext;
    selectedFretPos?: ScoreUI.FretPosition;
    variants: Map<string, ScaleVariant>;
    variantName: string;
}

export class GuitarScales extends React.Component<GuitarScalesProps, GuitarScalesState> {
    state: GuitarScalesState

    private selectedTimer: number | undefined = undefined

    constructor(props: GuitarScalesProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        let { variants, variantName } = this.createVariants(guitarCtx, "");

        this.state = {
            guitarCtx,
            selectedFretPos: undefined,
            variants,
            variantName
        }
    }

    componentDidUpdate() {
        let guitarCtx = this.props.app.getGuitarContext();

        if (this.state.guitarCtx !== guitarCtx) {
            let { variants, variantName } = this.createVariants(guitarCtx, this.state.variantName);
            this.setState({ guitarCtx, variants, variantName });
        }
    }

    createVariants(guitarCtx: ScoreUI.GuitarContext, variantName: string) {
        let openStringChromaticId = [0, 1, 2, 3, 4, 5].map(stringId => guitarCtx.getStringTuning(stringId).chromaticId);

        let variants = new Map<string, ScaleVariant>();

        function saveVariant(position: number, fretPositions: ScoreUI.FretPosition[]) {
            let v = new ScaleVariant(position, fretPositions);
            variants.set(v.name, v);
        }

        for (let position = 0; position < guitarCtx.maxFretId; position++) {
            try {
                let fretPositions: ScoreUI.FretPosition[] = [];

                for (let stringId = 0; stringId < 6; stringId++) {
                    let highFret = stringId === 0
                        ? (position + 4)
                        : (position + openStringChromaticId[stringId - 1] - openStringChromaticId[stringId] - 1);

                    let minScaleFretId = highFret;
                    let maxScaleFretId = position;

                    for (let fretId = highFret; fretId >= position; fretId--) {

                        let note = Theory.Note.getChromaticNote(openStringChromaticId[stringId] + fretId);

                        if (guitarCtx.scale.isScaleNote(note)) {
                            if (fretId > guitarCtx.maxFretId) {
                                throw "Missed scale note!";
                            }
                            else {
                                let fretPos = guitarCtx.getFretPosition(stringId, fretId);
                                if (!fretPositions.some(fretPos2 => fretPos2.chromaticId === fretPos.chromaticId)) {
                                    fretPositions.push(fretPos);

                                    minScaleFretId = Math.min(minScaleFretId, fretId);
                                    maxScaleFretId = Math.max(maxScaleFretId, fretId);
                                }
                            }
                        }
                    }

                    let extent = maxScaleFretId - minScaleFretId + 1;

                    if (extent < 1) {
                        throw "Invalid extent!";
                    }
                    else if (position === 0 && extent > 5 || position > 0 && extent > 4) {
                        throw "Extent over 4 frets!";
                    }
                }

                let positionOk = fretPositions.some(fretPos => fretPos.fretId === position);

                if (positionOk) {
                    // Set position to the position of first note on 6th string
                    let alteredPosition = Math.min(...fretPositions.filter(n => n.stringId === 5).map(n => n.fretId));

                    saveVariant(alteredPosition, fretPositions.reverse());
                }
            }
            catch (err) { }
        }

        if (!variants.has(variantName)) {
            variantName = Utils.Map.getMapKeys(variants)[0] ?? "";
        }

        return { variants, variantName }
    }

    render() {
        let { app, windowRect } = this.props;
        let { guitarCtx, variantName, variants, selectedFretPos: selectedFretPosition } = this.state;

        let variant = variants.get(variantName);

        const onUpdateFretPosition: ScoreUI.UpdateFretPositionFunc = (fretPosition) => {
            let fretPos = variant?.fretPositions.find(fretPos2 => fretPos2 === fretPosition);

            if (fretPos || selectedFretPosition === fretPosition) {
                fretPosition.setDefaultBorderColor(selectedFretPosition === fretPosition);
                fretPosition.setDefaultFillColor();
                fretPosition.setDefaultText();
                fretPosition.show();
            }
            else {
                fretPosition.hide();
            }
        }

        const selectFretPosition = (fretPosition: ScoreUI.FretPosition) => {
            Audio.playNote(fretPosition.note);
            this.setState({ selectedFretPos: fretPosition });

            if (this.selectedTimer) {
                window.clearTimeout(this.selectedTimer);
                this.selectedTimer = undefined;
            }

            if (!variant || variant.fretPositions.indexOf(fretPosition) < 0) {
                this.selectedTimer = window.setTimeout(() => {
                    this.selectedTimer = undefined;
                    this.setState({ selectedFretPos: undefined })
                }, 1000);
            }
        }

        const onClickFretPosition: ScoreUI.ClickFretPositionFunc = (fretPos) => selectFretPosition(fretPos);

        const onScoreEvent: Score.ScoreEventListener = (event: Score.ScoreEvent) => {
            if (!(event instanceof Score.ScoreObjectEvent)) {
                return;
            }

            let obj = event.findObject(obj => obj instanceof Score.MNoteGroup);

            event.renderer.hilightObject(obj);

            if (event.type === "click") {
                if (obj instanceof Score.MNoteGroup) {
                    let note = obj.getNotes()[0];
                    let scaleFretPos = variant?.fretPositions.find(fretPos => fretPos.chromaticId === note.chromaticId);
                    if (scaleFretPos) {
                        selectFretPosition(scaleFretPos);
                    }
                }
                else {
                    this.setState({ selectedFretPos: undefined });
                }
            }
        }

        const onChangeVariant = (variantName: string) => {
            this.setState({ variantName, selectedFretPos: undefined });
        }

        let variantNames = Utils.Map.getMapKeys(variants);

        let builder = new Score.DocumentBuilder(Score.StaffPreset.GuitarTreble);

        builder.setKeySignature(guitarCtx.scale);

        if (variant) {
            variant.fretPositions.forEach(fretPos => {
                let noteName = fretPos.note.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode);
                let color = selectedFretPosition?.chromaticId === fretPos.chromaticId ? "green" : "black";
                builder.addNote(0, fretPos.note, Theory.NoteLength.Quarter, { color });
                builder.addLabel(Score.Label.Note, noteName);
            });
        }

        let doc = builder.getDocument();

        return (<>
            <Menubar app={app} />

            <Container>
                <h1>{Page.GuitarScales}</h1>
                <Row xs="auto">
                    <Col>
                        <TuningScaleInfo app={app} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <Alert variant="warning">These are computationally generated scales that do not stretch fingers over 4 frets on any string.<br />Work well only for Standard tuning!</Alert>
                </Row>
                <Row xs="auto">
                    <Col>
                        <ScoreUI.MusicScoreView doc={doc} onScoreEvent={onScoreEvent} />
                    </Col>
                </Row>

                <Row xs="auto">
                    <Col>
                        <Form.Select name="select" value={variantName} onChange={v => onChangeVariant(v.target.value)}>
                            {variantNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </Container>

            <br />

            <ScoreUI.GuitarView
                style={{ position: "relative", width: windowRect.width }}
                guitarContext={guitarCtx}
                onUpdateFretPosition={onUpdateFretPosition}
                onClickFretPosition={onClickFretPosition} />

            <br />
        </>);
    }

}

