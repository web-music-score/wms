import * as React from "react";
import { Alert, Col, Container, Form, Row } from "react-bootstrap";
import * as Score from "@tspro/web-music-score";
import { TuningScaleInfo, Menubar } from "components";
import { GuitarApp, Page } from "guitar-app";
import { Utils } from "@tspro/ts-utils-lib";

class ScaleVariant {
    readonly name: string;
    readonly fretExtentByString: number[];

    constructor(readonly position: number, readonly notes: ReadonlyArray<Score.GuitarNote>) {
        this.name = position === 0 ? "Open" : Utils.Math.toOrdinalNumber(position) + " position";
        this.fretExtentByString = [0, 1, 2, 3, 4, 5].map(stringId => {
            let max = Math.max(...notes.filter(note => note.stringId === stringId).map(note => note.fretId));
            let min = Math.min(...notes.filter(note => note.stringId === stringId).map(note => note.fretId));
            return max - min + 1;
        });
    }
}

interface GuitarScalesProps {
    app: GuitarApp;
    windowRect: Score.DivRect;
}

interface GuitarScalesState {
    guitarCtx: Score.GuitarContext;
    selectedNote?: Score.GuitarNote;
    variants: Map<string, ScaleVariant>;
    variantName: string;
}

export class GuitarScales extends React.Component<GuitarScalesProps, GuitarScalesState> {
    state: GuitarScalesState

    private selectedNoteTimer: number | undefined = undefined

    constructor(props: GuitarScalesProps) {
        super(props);

        let guitarCtx = props.app.getGuitarContext();

        let { variants, variantName } = this.createVariants(guitarCtx, "");

        this.state = {
            guitarCtx,
            selectedNote: undefined,
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

    createVariants(guitarCtx: Score.GuitarContext, variantName: string) {
        let openStringNoteId = [0, 1, 2, 3, 4, 5].map(stringId => guitarCtx.getStringTuning(stringId).noteId);

        let variants = new Map<string, ScaleVariant>();

        function saveVariant(position: number, notes: Score.GuitarNote[]) {
            let v = new ScaleVariant(position, notes);
            variants.set(v.name, v);
        }

        for (let position = 0; position < guitarCtx.maxFretId; position++) {
            try {
                let notes: Score.GuitarNote[] = [];

                for (let stringId = 0; stringId < 6; stringId++) {
                    let highFret = stringId === 0
                        ? (position + 4)
                        : (position + openStringNoteId[stringId - 1] - openStringNoteId[stringId] - 1);

                    let minScaleFretId = highFret;
                    let maxScaleFretId = position;

                    for (let fretId = highFret; fretId >= position; fretId--) {

                        let note = Score.Note.getNoteById(openStringNoteId[stringId] + fretId);

                        if (guitarCtx.scale.isScaleNote(note)) {
                            if (fretId > guitarCtx.maxFretId) {
                                throw "Missed scale note!";
                            }
                            else {
                                let note = guitarCtx.getGuitarNote(stringId, fretId);
                                if (!notes.some(n => n.noteId === note.noteId)) {
                                    notes.push(note);

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

                let positionOk = notes.some(note => note.fretId === position);

                if (positionOk) {
                    // Set position to the position of first note on 6th string
                    let alteredPosition = Math.min(...notes.filter(n => n.stringId === 5).map(n => n.fretId));

                    saveVariant(alteredPosition, notes.reverse());
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
        let { guitarCtx, variantName, variants, selectedNote } = this.state;

        let variant = variants.get(variantName);

        const updateGuitarNote: Score.UpdateGuitarNoteFunc = (guitarNote) => {
            let scaleNote = variant?.notes.find(note => note === guitarNote);

            if (scaleNote || selectedNote === guitarNote) {
                guitarNote.setDefaultBorderColor(selectedNote === guitarNote);
                guitarNote.setDefaultFillColor();
                guitarNote.setDefaultText();
                guitarNote.show();
            }
            else {
                guitarNote.hide();
            }
        }

        const selectNote = (guitarNote: Score.GuitarNote) => {
            Score.Audio.playNote(guitarNote.preferredNote);
            this.setState({ selectedNote: guitarNote });

            if (this.selectedNoteTimer) {
                window.clearTimeout(this.selectedNoteTimer);
                this.selectedNoteTimer = undefined;
            }

            if (!variant || !variant.notes.includes(guitarNote)) {
                this.selectedNoteTimer = window.setTimeout(() => {
                    this.selectedNoteTimer = undefined;
                    this.setState({ selectedNote: undefined })
                }, 1000);
            }
        }

        const onClickGuitar = (guitarNote: Score.GuitarNote) => selectNote(guitarNote);

        const onScoreSelectObject = (arr: Score.MusicInterface[]) => {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] instanceof Score.MNoteGroup) {
                    return arr[i];
                }
            }
            return undefined;
        }

        const onScoreClickObject = (obj: Score.MusicInterface) => {
            if (obj instanceof Score.MNoteGroup) {
                let note = obj.getNotes()[0];
                let scaleNote = variant?.notes.find(n => n.noteId === note.noteId);
                if (scaleNote) {
                    selectNote(scaleNote);
                }
            }
            else {
                this.setState({ selectedNote: undefined });
            }
        }

        const onChangeVariant = (variantName: string) => {
            this.setState({ variantName, selectedNote: undefined });
        }

        let variantNames = Utils.Map.getMapKeys(variants);

        let doc = new Score.MDocument(Score.StaffKind.TrebleForGuitar);

        let m = doc.addMeasure().setKeySignature(guitarCtx.scale);

        if (variant) {
            variant.notes.forEach(note => {
                let noteName = note.preferredNote.format(guitarCtx.pitchNotation, Score.SymbolSet.Unicode);
                let color = selectedNote?.noteId === note.noteId ? "green" : "black";
                m.addNote(0, note.preferredNote, Score.NoteLength.Quarter, { color });
                m.addLabel(Score.Label.Note, noteName);
            });
        }

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
                        <Score.MusicScoreView doc={doc} onSelectObject={onScoreSelectObject} onClickObject={onScoreClickObject} />
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

            <Score.GuitarComponent
                style={{ position: "relative", width: windowRect.width }}
                guitarContext={guitarCtx}
                updateGuitarNote={updateGuitarNote}
                onClickNote={onClickGuitar} />

            <br />
        </>);
    }

}

