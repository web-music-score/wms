import * as React from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { GuitarApp, Page } from "guitar-app";
import { TuningScaleInfo, Menubar } from "components";
import { Utils } from "@tspro/ts-utils-lib";
import * as Score from "@tspro/web-music-score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

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

    static isCompatibleScaleType(scaleType: Score.ScaleType) {
        switch (scaleType) {
            case Score.ScaleType.Major:
            case Score.ScaleType.NaturalMinor:
            //case Score.ScaleType.HarmonicMinor: ?
            case Score.ScaleType.Ionian:
            case Score.ScaleType.Dorian:
            case Score.ScaleType.Phrygian:
            case Score.ScaleType.Lydian:
            case Score.ScaleType.Mixolydian:
            case Score.ScaleType.Aeolian:
            case Score.ScaleType.Locrian:
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

        let doc = new Score.MDocument(Score.StaffKind.GuitarTreble);

        let m = doc.addMeasure().setKeySignature(scale);

        let compatibleScale = DiatonicChords.isCompatibleScaleType(scale.scaleType);

        if (compatibleScale) {
            let scaleNotes = scale.getScaleNotes("G2", 1);

            scaleNotes.forEach((rootNote, rootNoteId) => {
                const addChord = (...degrees: number[]) => {
                    let notes = degrees.map(d => new Score.Note(rootNote.pitch + d - 1, scaleNotes[(rootNoteId + d - 1) % 7].accidental));
                    let chordName = (Score.Chord.getChords(notes)[0] ?? "?").toString();
                    let chordOrder = Utils.Math.romanize(rootNoteId % 7 + 1);
                    m.addChord(0, notes, Score.NoteLength.Quarter);
                    m.addLabel(Score.Label.Chord, chordName);
                    m.addLabel(Score.Label.Note, chordOrder);
                }

                if (chordType === ChordType.Triads) {
                    addChord(1, 3, 5);
                }
                else if (chordType === ChordType.SeventhChords) {
                    addChord(1, 3, 5, 7);
                }
            });
        }

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

