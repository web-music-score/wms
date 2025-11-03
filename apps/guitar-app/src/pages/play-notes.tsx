import * as React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { SelectAccidental, Menubar, TuningScaleInfo } from "components";
import { GuitarApp, Page } from "guitar-app";
import * as Audio from "@tspro/web-music-score/audio";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";
import { Rect } from "@tspro/ts-utils-lib";

interface PlayNotesProps {
    app: GuitarApp;
    windowRect: Rect;
}

interface PlayNotesState {
    accidental: Theory.Accidental | undefined;
    selectedNote?: Theory.Note;
}

export class PlayNotes extends React.Component<PlayNotesProps, PlayNotesState> {
    state: PlayNotesState;

    constructor(props: PlayNotesProps) {
        super(props);

        this.state = {
            accidental: undefined,
            selectedNote: undefined
        }
    }

    render() {
        let { app, windowRect } = this.props;
        let { selectedNote, accidental } = this.state;

        let guitarCtx = app.getGuitarContext();

        let builder = new Score.DocumentBuilder()
            .setScoreConfiguration({
                type: "staff", clef: Score.Clef.G, isOctaveDown: true,
                minNote: "C2", maxNote: "C6"
            })
            .setKeySignature(guitarCtx.scale);

        if (selectedNote) {
            let noteName = selectedNote.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode);
            builder.addNote(0, selectedNote, Theory.NoteLength.Whole);
            builder.addLabel(Score.Label.Note, noteName);
        }

        let doc = builder.getDocument();

        const onScoreEvent: Score.ScoreEventListener = (event: Score.ScoreEvent) => {
            if (!(event instanceof Score.ScoreStaffPosEvent)) {
                return;
            }

            if (event.type === "leave") {
                event.renderContext.hilightStaffPos(undefined);
            }
            else {
                event.renderContext.hilightStaffPos(event); // event contains { scoreRow, diatonicId }
            }
            if (event.type === "click") {
                let { diatonicId } = event;
                let { accidental } = this.state;
                let note = new Theory.Note(diatonicId, accidental ?? guitarCtx.scale.getAccidental(diatonicId));
                Audio.playNote(note);
                this.setState({ selectedNote: note });
            }
        }

        const onClickFretPosition: ScoreUI.ClickFretPositionFunc = (fretPosition) => {
            Audio.playNote(fretPosition.note);
            this.setState({ selectedNote: fretPosition.note });
        }

        const onUpdateFretPosition: ScoreUI.UpdateFretPositionFunc = (fretPosition) => {
            if (selectedNote && selectedNote.chromaticId === fretPosition.chromaticId) {
                fretPosition.setDefaultBorderColor(true);
                fretPosition.setDefaultFillColor();
                fretPosition.setDefaultText();
                fretPosition.show();
            }
            else {
                fretPosition.hide();
            }
        }

        const onChangeAccidental = (accidental: Theory.Accidental | undefined) => {
            this.setState({ accidental });
        }

        return <>
            <Menubar app={app} />

            <Container>
                <h1>{Page.PlayNotes}</h1>
                <Row xs="auto">
                    <Col>
                        <TuningScaleInfo app={app} />
                    </Col>
                </Row>

                <Row xs="auto">
                    <Col>
                        <SelectAccidental accidental={accidental} onChangeAccidental={onChangeAccidental} />
                    </Col>
                </Row>

                <Row xs="auto">
                    <Col>
                        <ScoreUI.MusicScoreView doc={doc} onScoreEvent={onScoreEvent} />
                    </Col>
                </Row>
            </Container>

            <ScoreUI.GuitarView
                style={{ position: "relative", width: windowRect.width }}
                guitarContext={guitarCtx}
                onUpdateFretPosition={onUpdateFretPosition}
                onClickFretPosition={onClickFretPosition} />

            <br />
        </>
    }

}

