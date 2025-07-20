import * as React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { TuningScaleInfo, Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import * as Audio from "@tspro/web-music-score/audio";
import * as Score from "@tspro/web-music-score/score";
import * as Theory from "@tspro/web-music-score/theory";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

const tdStyle: React.CSSProperties = {
    paddingLeft: "1em",
    paddingRight: "1em",
    borderTop: "1px solid gray",
    borderBottom: "1px solid gray"
}

type FrettingPos = number | "mute";

interface WhatChordProps {
    app: GuitarApp;
    windowRect: Score.DivRect;
}

interface WhatChordState {
    guitarCtx: ScoreUI.GuitarContext;
    selectedNote?: Theory.Note;
    stringFrettingPos: FrettingPos[/* stringId */];
}

export class WhatChord extends React.Component<WhatChordProps, WhatChordState> {
    state: WhatChordState

    constructor(props: WhatChordProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        let stringFrettingPos = guitarCtx.tuningName === Theory.DefaultTuningName
            ? [0, 1, 0, 2, 3, "mute" as const] // C Chord on E Standard tuning.
            : ["mute" as const, "mute" as const, "mute" as const, "mute" as const, "mute" as const, "mute" as const]

        this.state = {
            guitarCtx,
            selectedNote: undefined,
            stringFrettingPos
        }
    }

    componentDidUpdate() {
        let guitarCtx = this.props.app.getGuitarContext();

        if (this.state.guitarCtx !== guitarCtx) {
            this.setState({ guitarCtx });
        }
    }

    render() {
        let { app, windowRect } = this.props;
        let { guitarCtx, stringFrettingPos, selectedNote } = this.state;

        const updateGuitarNote: ScoreUI.UpdateGuitarNoteFunc = (guitarNote) => {
            let frettingPos = stringFrettingPos.find((fingerPos, stringId) => {
                return stringId === guitarNote.stringId && (fingerPos === guitarNote.fretId || fingerPos === "mute" && guitarNote.fretId === 0);
            });

            if (frettingPos !== undefined) {
                let selected = selectedNote && guitarNote.chromaticId === selectedNote.chromaticId;
                guitarNote.setDefaultBorderColor(selected);

                if (frettingPos === "mute") {
                    guitarNote.fillColor = "black";
                    guitarNote.text = "X";
                }
                else {
                    guitarNote.setDefaultFillColor();
                    guitarNote.setDefaultText();
                }

                guitarNote.show();
            }
            else {
                guitarNote.hide();
            }
        }

        let frettedGuitarNotes = stringFrettingPos.map((fingerPos, stringId) => {
            return fingerPos === "mute"
                ? undefined
                : guitarCtx.getGuitarNote(stringId, fingerPos);
        }).reverse().filter(note => note !== undefined) as ScoreUI.GuitarNote[];

        const onClickGuitar = (guitarNote: ScoreUI.GuitarNote) => {
            Audio.playNote(guitarNote.preferredNote);

            let newStringFrettingPos = stringFrettingPos.slice();
            let newSelectedNote: Theory.Note | undefined;

            if (selectedNote?.chromaticId === guitarNote.chromaticId) {
                newStringFrettingPos[guitarNote.stringId] = "mute";
                newSelectedNote = undefined;
            }
            else {
                newStringFrettingPos[guitarNote.stringId] = guitarNote.fretId;
                newSelectedNote = guitarNote.preferredNote;
            }

            this.setState({ stringFrettingPos: newStringFrettingPos, selectedNote: newSelectedNote });
        }

        const onScoreEvent: Score.ScoreEventListener = (event: Score.ScoreEvent) => {
            if (!(event instanceof Score.ScoreObjectEvent)) {
                return;
            }

            let obj = event.findObject(obj => obj instanceof Score.MNoteGroup);

            event.renderer.hilightObject(obj);

            if (event.type === "click") {
                if (obj instanceof Score.MNoteGroup && obj.getNotes().length === 1) {
                    let note = obj.getNotes()[0];
                    Audio.playNote(note);
                    this.setState({ selectedNote: note });
                }
                else {
                    this.setState({ selectedNote: undefined });
                }
            }
        }

        let doc = new Score.MDocument(Score.StaffPreset.GuitarTreble);

        let m = doc.addMeasure().setKeySignature(guitarCtx.scale);

        frettedGuitarNotes.forEach(note => {
            let noteName = note.preferredNote.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode);
            let color = selectedNote?.chromaticId === note.chromaticId ? "green" : "black";
            m.addNote(0, note.preferredNote, Theory.NoteLength.Quarter, { color });
            m.addLabel(Score.Label.Note, noteName);
        });

        if (frettedGuitarNotes.length >= 2) {
            let chordNotes = frettedGuitarNotes.map(note => note.preferredNote)
            m.addChord(0, chordNotes, Theory.NoteLength.Whole, { arpeggio: Score.Arpeggio.Up });
        }

        let chordNotes = frettedGuitarNotes.map(gn => gn.preferredNote);
        let chordCandidates = Theory.Chord.getChords(chordNotes);

        return (<>
            <Menubar app={app} />

            <Container>
                <h1>{Page.WhatChord}</h1>
                <Row xs="auto">
                    <Col>
                        <TuningScaleInfo app={app} />
                    </Col>
                </Row>
            </Container>

            <ScoreUI.GuitarView
                style={{ position: "relative", width: windowRect.width }}
                guitarContext={guitarCtx}
                updateGuitarNote={updateGuitarNote}
                onClickNote={onClickGuitar} />

            <Container>
                <Row xs="auto">
                    <Col>
                        <ScoreUI.MusicScoreView doc={doc} onScoreEvent={onScoreEvent} />
                    </Col>
                </Row>
                <Row xs="auto">
                    <ScoreUI.PlaybackButtons doc={doc} buttonLayout={ScoreUI.PlaybackButtonsLayout.PlayStopSingle} />
                </Row>
                <br />
                <Row xs="auto">
                    <b>Possible Chords</b>
                </Row>
                <Row xs="auto">
                    <table>
                        <thead>
                            <tr>
                                <th style={tdStyle}>Chord Name</th>
                                <th style={tdStyle}>Degree Notation</th>
                                <th style={tdStyle}>Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chordCandidates.map((chord, i) => {
                                return (
                                    <tr key={"chord" + i}>
                                        <td style={tdStyle}>{chord.toString()}</td>
                                        <td style={tdStyle}>{chord.getDegreeNotationString()}</td>
                                        <td style={tdStyle}>{chord.getOmittedDegreesString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Row>
            </Container>
        </>);
    }

}

