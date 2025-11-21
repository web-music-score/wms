import * as React from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { GuitarApp, Page } from "guitar-app";
import { TuningScaleInfo, Menubar } from "components";
import { Utils } from "@tspro/ts-utils-lib";
import * as Theory from "web-music-score/theory";
import * as Score from "web-music-score/score";
import * as ScoreUI from "web-music-score/react-ui";

enum ChordType {
    Triads = "Triads",
    SeventhChords = "Seventh Chords"
}

const ChordTypeList = Utils.Enum.getEnumValues(ChordType);

interface DiatonicChordsProps {
    app: GuitarApp;
}

interface DiatonicChordsState {
    chordType: ChordType;
}

export class DiatonicChords extends React.Component<DiatonicChordsProps, DiatonicChordsState> {
    state: DiatonicChordsState;

    constructor(props: DiatonicChordsProps) {
        super(props);

        this.state = {
            chordType: ChordType.Triads
        }
    }

    static isCompatibleScaleType(scaleType: Theory.ScaleType) {
        switch (scaleType) {
            case Theory.ScaleType.Major:
            case Theory.ScaleType.NaturalMinor:
            //case Theory.ScaleType.HarmonicMinor: ?
            case Theory.ScaleType.Ionian:
            case Theory.ScaleType.Dorian:
            case Theory.ScaleType.Phrygian:
            case Theory.ScaleType.Lydian:
            case Theory.ScaleType.Mixolydian:
            case Theory.ScaleType.Aeolian:
            case Theory.ScaleType.Locrian:
                return true;
            default:
                return false;
        }
    }

    onChangeChordType(chordType: string) {
        if (chordType === ChordType.Triads || chordType === ChordType.SeventhChords) {
            this.setState({ chordType });
        }
    }

    createDoc() {

    }

    render() {
        let { chordType } = this.state;
        let { app } = this.props;
        let guitarCtx = app.getGuitarContext();
        let { scale } = guitarCtx;

        let builder = new Score.DocumentBuilder()
            .setScoreConfiguration(Score.StaffPreset.GuitarTreble)
            .setKeySignature(scale);

        let compatibleScale = DiatonicChords.isCompatibleScaleType(scale.scaleType);

        if (compatibleScale) {
            let scaleNotes = scale.getScaleNotes("G2", 1);

            scaleNotes.forEach((rootNote, rootNoteIndex) => {
                const addChord = (...degrees: number[]) => {
                    let notes = degrees.map(d => new Theory.Note(rootNote.diatonicId + d - 1, scaleNotes[(rootNoteIndex + d - 1) % 7].accidental));
                    let chordName = (Theory.Chord.getChords(notes)[0] ?? "?").toString();
                    let chordOrder = Utils.Math.romanize(rootNoteIndex % 7 + 1);
                    builder.addChord(0, notes, Theory.NoteLength.Quarter);
                    builder.addLabel(Score.Label.Chord, chordName);
                    builder.addLabel(Score.Label.Note, chordOrder);
                }

                if (chordType === ChordType.Triads) {
                    addChord(1, 3, 5);
                }
                else if (chordType === ChordType.SeventhChords) {
                    addChord(1, 3, 5, 7);
                }
            });
        }

        let doc = builder.getDocument();

        return <>
            <Menubar app={app} />

            <Container>
                <h1>{Page.DiatonicChords}</h1>

                <Row xs="auto">
                    <Col>
                        <TuningScaleInfo app={app} omitTuningInfo />
                    </Col>
                </Row>

                {compatibleScale
                    ? undefined
                    : <Row xs="auto"><Col><Alert variant="warning">This content is not available for {guitarCtx.scale.getScaleName()} - scale.</Alert></Col></Row>
                }

                <Row xs="auto">
                    <Col>
                        <Form.Select name="select" value={chordType} onChange={e => this.onChangeChordType(e.target.value)}>
                            {ChordTypeList.map(chordType =>
                                <option key={chordType} value={chordType}>{chordType}</option>
                            )}
                        </Form.Select>
                    </Col>
                </Row>

                <Row xs="auto" className="mt-4">
                    <Col>
                        <ScoreUI.MusicScoreView doc={doc} />
                    </Col>
                </Row>
            </Container>
        </>
    }
}

