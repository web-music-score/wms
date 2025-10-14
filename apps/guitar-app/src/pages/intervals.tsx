import * as React from "react";
import { Col, Container, Row } from "react-bootstrap";
import { GuitarApp, Page } from "guitar-app";
import { SelectAccidental, Menubar, TuningScaleInfo } from "components";
import * as Audio from "@tspro/web-music-score/audio";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

const tdStyle: React.CSSProperties = {
    paddingLeft: "1em",
    paddingRight: "1em",
    borderTop: "1px solid gray",
    borderBottom: "1px solid gray"
}

interface IntervalsProps {
    app: GuitarApp;
}

interface IntervalsState {
    accidental: Theory.Accidental | undefined;
    note1?: Theory.Note;
    note2?: Theory.Note;
}

export class Intervals extends React.Component<IntervalsProps, IntervalsState> {
    state: IntervalsState;

    constructor(props: IntervalsProps) {
        super(props);

        this.state = {
            accidental: undefined,
            note1: undefined,
            note2: undefined
        }
    }

    render() {
        let { app } = this.props;
        let { note1, note2, accidental } = this.state;

        let guitarCtx = app.getGuitarContext();

        let builder = new Score.DocumentBuilder()
            .setScoreConfiguration({
                type: "staff", clef: Score.Clef.G, isOctaveDown: true,
                minNote: "C2", maxNote: "C6"
            })
            .setKeySignature(guitarCtx.scale);

        if (note1) {
            let noteName1 = note1.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode);
            builder.addNote(0, note1, Theory.NoteLength.Half);
            builder.addLabel(Score.Label.Note, noteName1);
        }
        if (note2) {
            let noteName2 = note2.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode);
            builder.addNote(0, note2, Theory.NoteLength.Half);
            builder.addLabel(Score.Label.Note, noteName2);
        }

        let doc = builder.getDocument();

        let note1Str = note1 ? note1.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode) : "";
        let note2Str = note2 ? note2.format(guitarCtx.pitchNotation, Theory.SymbolSet.Unicode) : "";

        let intervalStr = "";
        let intervalAbbr = "";

        if (note1 && note2) {
            let iv = Theory.Interval.get(note1, note2);
            intervalStr = iv ? iv.toString() : "Unknown";
            intervalAbbr = iv ? iv.toAbbrString() : "?";
        }

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
                let { note1, note2, accidental } = this.state;
                let { diatonicId } = event;

                let note = new Theory.Note(diatonicId, accidental ?? guitarCtx.scale.getAccidental(diatonicId));

                if (note1 === undefined || note1 !== undefined && note2 !== undefined) {
                    this.setState({ note1: note, note2: undefined });
                }
                else if (note1 !== undefined && note2 === undefined) {
                    [note1, note2] = [note1, note];
                    this.setState({ note1, note2 });
                }

                Audio.playNote(note);
            }
        }

        const onChangeAccidental = (accidental: Theory.Accidental | undefined) => {
            this.setState({ accidental })
        }

        return <>
            <Menubar app={app} />

            <Container>
                <h1>{Page.Intervals}</h1>

                <Row xs="auto">
                    <Col>
                        <TuningScaleInfo app={app} omitTuningInfo />
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

                <table>
                    <thead>
                        <tr>
                            <th style={tdStyle}>Notes</th>
                            <th style={tdStyle}>Interval</th>
                            <th style={tdStyle}>Abbr</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={tdStyle}>{note1Str + " - " + note2Str}</td>
                            <td style={tdStyle}>{intervalStr}</td>
                            <td style={tdStyle}>{intervalAbbr}</td>
                        </tr>
                    </tbody>
                </table>
                <br />
            </Container>
        </>
    }
}

