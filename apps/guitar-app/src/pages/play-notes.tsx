import * as React from "react";
import { Alert, Col, Container, Row } from "react-bootstrap";
import { SelectAccidental, Menubar, TuningScaleInfo } from "components";
import { GuitarApp, Page } from "guitar-app";
import * as Score from "@tspro/web-music-score";

interface PlayNotesProps {
    app: GuitarApp;
    windowRect: Score.DivRect;
}

interface PlayNotesState {
    accidental: Score.Accidental | undefined;
    selectedNote?: Score.Note;
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

        let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

        let m = doc.addMeasure().setKeySignature(guitarCtx.scale);

        if (selectedNote) {
            let noteName = selectedNote.format(guitarCtx.pitchNotation, Score.SymbolSet.Unicode);
            m.addNote(0, selectedNote, Score.NoteLength.Whole);
            m.addLabel(Score.Label.Note, noteName);
        }

        const updateGuitarNote: Score.UpdateGuitarNoteFunc = (guitarNote) => {
            if (selectedNote && selectedNote.noteId === guitarNote.noteId) {
                guitarNote.setDefaultBorderColor(true);
                guitarNote.setDefaultFillColor();
                guitarNote.setDefaultText();
                guitarNote.show();
            }
            else {
                guitarNote.hide();
            }
        }

        const onClickPitch = (pickedPitch: Score.PickedPitch) => {
            let { pitch } = pickedPitch;
            let { accidental } = this.state;

            let note = new Score.Note(pitch, accidental ?? guitarCtx.scale.getKeySignature().getAccidental(pitch));

            Score.Audio.playNote(note);

            this.setState({ selectedNote: note });
        }

        const onClickGuitar = (guitarNote: Score.GuitarNote) => {
            Score.Audio.playNote(guitarNote.preferredNote);
            this.setState({ selectedNote: guitarNote.preferredNote });
        }

        const onChangeAccidental = (accidental: Score.Accidental | undefined) => {
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
                        <Score.MusicScoreView doc={doc} onClickPitch={onClickPitch} />
                    </Col>
                </Row>
            </Container>

            <Score.GuitarComponent
                style={{ position: "relative", width: windowRect.width }}
                guitarContext={guitarCtx}
                updateGuitarNote={updateGuitarNote}
                onClickNote={onClickGuitar} />

            <br />
        </>
    }

}

