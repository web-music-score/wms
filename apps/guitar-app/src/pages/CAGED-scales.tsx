import * as React from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import { TuningScaleInfo, Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import { Utils } from "@tspro/ts-utils-lib";
import * as Audio from "@tspro/web-music-score/audio";
import * as Theory from "@tspro/web-music-score/theory";
import * as Score from "@tspro/web-music-score/score";
import * as ScoreUI from "@tspro/web-music-score/react-ui";

const LowestNote = "E2";

class GuitarChord {
    readonly minFretId: number;
    readonly maxFretId: number;
    readonly minScaleFretId: number;

    constructor(readonly positionName: PositionName, readonly guitarNotes: ScoreUI.GuitarNote[]) {
        this.minFretId = Math.min(...guitarNotes.map(n => n.fretId));
        this.maxFretId = Math.max(...guitarNotes.map(n => n.fretId));
        this.minScaleFretId = Math.max(0, this.minFretId - (positionName === PositionName.C ? 0 : 1));
    }

    consistsOfTriad(triadNotes: Theory.Note[]) {
        return this.guitarNotes.every(n1 => triadNotes.some(n2 => n2.noteId % 12 === n1.noteId % 12));
    }

    hasGuitarNote(guitarNote: ScoreUI.GuitarNote) {
        return this.guitarNotes.some(n => n === guitarNote);
    }
}

enum PositionName {
    C = "C - position",
    A = "A - position",
    G = "G - position",
    E = "E - position",
    D = "D - position"
}

interface CAGEDScalesProps {
    app: GuitarApp;
    windowRect: Score.DivRect;
}

interface CAGEDScalesState {
    guitarCtx: ScoreUI.GuitarContext;
    positionNameList: PositionName[];
    positionName: PositionName;
    positionChords: GuitarChord[];
    scaleNotes: ScoreUI.GuitarNote[];
    selectedNote?: ScoreUI.GuitarNote;
}

export class CAGEDScales extends React.Component<CAGEDScalesProps, CAGEDScalesState> {
    state: CAGEDScalesState

    private selectedNoteTimer: number | undefined = undefined;

    constructor(props: CAGEDScalesProps) {
        super(props);

        let { guitarCtx, positionNameList, positionName, positionChords, scaleNotes } = this.createStateUpdate(props.app.getGuitarContext(), "start");

        this.state = {
            guitarCtx,
            positionNameList,
            positionName,
            positionChords,
            scaleNotes,
            selectedNote: undefined,
        }
    }

    componentDidUpdate() {
        let newGuitarCtx = this.props.app.getGuitarContext();
        let guitarCtxChanged = this.state.guitarCtx !== newGuitarCtx;
        let scaleChanged = this.state.guitarCtx.scale.tonic !== newGuitarCtx.scale.tonic;

        if (guitarCtxChanged || scaleChanged) {
            this.setState(this.createStateUpdate(newGuitarCtx, scaleChanged ? "start" : this.state.positionName));
        }
    }

    private createStateUpdate(guitarCtx: ScoreUI.GuitarContext, positionName: PositionName | "start"): {
        guitarCtx: ScoreUI.GuitarContext,
        positionNameList: PositionName[],
        positionName: PositionName,
        positionChords: GuitarChord[],
        scaleNotes: ScoreUI.GuitarNote[]
    } {

        if (guitarCtx.tuningName !== Theory.DefaultTuningName || guitarCtx.scale.scaleType !== Theory.ScaleType.Major) {
            return {
                guitarCtx,
                positionNameList: [],
                positionName: PositionName.C,
                positionChords: [],
                scaleNotes: []
            }
        }

        const ScaleOctave = guitarCtx.scale.getScaleNotes(LowestNote, 1);
        const MajorTriadNotes = [ScaleOctave[0], ScaleOctave[2], ScaleOctave[4]];

        const mapChord = (...fretIdArr: number[]) => fretIdArr.map((fretId, stringId) => guitarCtx.getGuitarNote(stringId, fretId));

        // Get position chords
        let positionChords: GuitarChord[] = [];

        let startPositionName = PositionName.C;
        let startPositionNameMinFretId = 100000;

        let { maxFretId } = guitarCtx;

        for (let fretId = 0; fretId <= maxFretId; fretId++) {
            let chordCandidates = [
                fretId <= maxFretId - 3 ? new GuitarChord(PositionName.C, mapChord(fretId, fretId + 1, fretId, fretId + 2, fretId + 3)) : undefined,
                fretId <= maxFretId - 2 ? new GuitarChord(PositionName.A, mapChord(fretId, fretId + 2, fretId + 2, fretId + 2, fretId)) : undefined,
                fretId <= maxFretId - 3 ? new GuitarChord(PositionName.G, mapChord(fretId + 3, fretId, fretId, fretId, fretId + 2, fretId + 3)) : undefined,
                fretId <= maxFretId - 2 ? new GuitarChord(PositionName.E, mapChord(fretId, fretId, fretId + 1, fretId + 2, fretId + 2, fretId)) : undefined,
                fretId <= maxFretId - 3 ? new GuitarChord(PositionName.D, mapChord(fretId + 2, fretId + 3, fretId + 2, fretId)) : undefined,
            ].filter(c => c && c.consistsOfTriad(MajorTriadNotes)) as GuitarChord[];

            chordCandidates.forEach(c => {
                if (c.minFretId < startPositionNameMinFretId) {
                    startPositionName = c.positionName;
                    startPositionNameMinFretId = c.minFretId;
                }
                positionChords.push(c);
            });
        }

        if (positionName === "start") {
            positionName = startPositionName;
        }

        positionChords = positionChords.filter(c => c.positionName === positionName);

        // Create scales
        let scaleNotes: ScoreUI.GuitarNote[] = [];

        positionChords.forEach(chord => {
            let notes: ScoreUI.GuitarNote[] = [];

            for (let stringId = 0; stringId <= 5; stringId++) {
                let startFret = chord.minScaleFretId;
                let endFret = startFret + (stringId === 0 ? 4 : 5);

                for (let fretId = Math.min(endFret, maxFretId); fretId >= startFret; fretId--) {
                    let note = guitarCtx.getGuitarNote(stringId, fretId);
                    if (note.isScaleNote && !notes.some(n => n.noteId === note.noteId)) {
                        notes.push(note);
                    }
                }
            }

            scaleNotes = [...scaleNotes, ...notes];
        });

        // Create position name list
        const PositionNameList = Utils.Enum.getEnumValues(PositionName);
        let i = PositionNameList.indexOf(startPositionName);
        let positionNameList = [...PositionNameList.slice(i), ...PositionNameList.slice(0, i)];

        return {
            guitarCtx,
            positionNameList,
            positionName,
            positionChords,
            scaleNotes
        }
    }

    render() {
        let { app, windowRect } = this.props;
        let { guitarCtx, positionNameList, positionName, positionChords, scaleNotes, selectedNote } = this.state;
        let { scale } = guitarCtx;

        let errorMsgs: string[] = [];

        if (scale.scaleType !== Theory.ScaleType.Major) {
            errorMsgs.push("This page only works with Major scales. Please select Major scale from the top menu bar.");
        }

        if (guitarCtx.tuningName !== Theory.DefaultTuningName) {
            errorMsgs.push("This page only works with Standard tuning. Please select tuning from the top menu bar.");
        }

        const ScaleOctave = scale.scaleType === Theory.ScaleType.Major
            ? scale.getScaleNotes(LowestNote, 1).slice(0, 7)
            : [];

        // Create relative modes list
        let relativeModes = ScaleOctave.map((note, i) => {
            let tonic = note.formatOmitOctave(Theory.SymbolSet.Unicode);
            return "" + (i + 1) + ". " + tonic + [
                " Ionian / " + tonic + " Major",
                " Dorian",
                " Phrygian",
                " Lydian",
                " Mixolydian",
                " Aeolian / " + tonic + " natural minor",
                " Locrian"
            ][i];
        });

        const updateGuitarNote: ScoreUI.UpdateGuitarNoteFunc = (guitarNote) => {
            let scaleNote = scaleNotes.find(note => note === guitarNote);

            if (scaleNote || selectedNote === guitarNote) {
                guitarNote.setDefaultFillColor();
                guitarNote.setDefaultText();

                if (selectedNote === guitarNote) {
                    guitarNote.setDefaultBorderColor(true);
                }
                else if (positionChords.some(c => c.hasGuitarNote(guitarNote))) {
                    guitarNote.borderColor = "yellow";
                }
                else {
                    guitarNote.setDefaultBorderColor(false);
                }

                guitarNote.show();
            }
            else {
                guitarNote.hide();
            }
        }

        const selectNote = (guitarNote: ScoreUI.GuitarNote) => {
            Audio.playNote(guitarNote.preferredNote);
            this.setState({ selectedNote: guitarNote });

            if (this.selectedNoteTimer) {
                window.clearTimeout(this.selectedNoteTimer);
                this.selectedNoteTimer = undefined;
            }

            this.selectedNoteTimer = window.setTimeout(() => {
                this.selectedNoteTimer = undefined;
                this.setState({ selectedNote: undefined })
            }, 1000);
        }

        const onClickGuitar = (guitarNote: ScoreUI.GuitarNote) => selectNote(guitarNote);

        const onSetPositionName = (positionName: string) => {
            this.setState(this.createStateUpdate(guitarCtx, positionName as PositionName));
        }

        return (<>
            <Menubar app={app} />

            <Container>
                <h1>{Page.CAGEDScales}</h1>

                <Row xs="auto">
                    <Col>
                        <TuningScaleInfo app={app} />
                    </Col>
                </Row>

                <Row xs="auto">
                    {errorMsgs.map((errorMsg, i) => <Col key={"err" + i}><Alert variant="warning">{errorMsg}</Alert></Col>)}
                </Row >

                <Row xs="auto">
                    <Col>
                        <Alert variant="info">
                            Relative Modes:<br />
                            {relativeModes.map((mode, i) => <div key={"mode" + i}>{mode}<br /></div>)}
                        </Alert>
                    </Col>
                </Row>

                <Row xs="auto">
                    <Col>
                        <Form.Select name="select" value={positionName} onChange={v => onSetPositionName(v.target.value)}>
                            {positionNameList.map(name => <option key={name} value={name}>{name}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </Container>

            <br />

            <ScoreUI.GuitarView
                style={{ position: "relative", width: windowRect.width }}
                guitarContext={guitarCtx}
                updateGuitarNote={updateGuitarNote}
                onClickNote={onClickGuitar} />

            <br />
        </>);
    }

}

