import { GuitarApp } from "guitar-app";
import * as React from "react";
import { Col, Form, Row } from "react-bootstrap";
import * as Score from "@tspro/web-music-score";

interface SelectAccidentalProps {
    accidental: Score.Accidental | undefined;
    onChangeAccidental: (accidental: Score.Accidental | undefined) => void;
}

export function SelectAccidental(props: SelectAccidentalProps) {

    const onSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let n = Number(e.target.value);
        props.onChangeAccidental(isNaN(n) ? undefined : Score.Note.validateAccidental(n));
    }

    return (
        <Form.Select value={props.accidental} onChange={v => onSelectionChange(v)}>
            <option value="NaN">Accidental: -</option>
            <option value="2">Accidental: 𝄪</option>
            <option value="1">Accidental: ♯</option>
            <option value="0">Accidental: ♮</option>
            <option value="-1">Accidental: ♭</option>
            <option value="-2">Accidental: 𝄫</option>
        </Form.Select>
    );
}

export function OrderOfAccidentalsInfo(props: { ks: Score.KeySignature }) {
    if (props.ks.getType() === "sharp") {
        return <p>Order of sharps is F-C-G-D-A-E-B (Father Charles Goes Down And Ends Battle).</p>;
    }
    else if (props.ks.getType() === "flat") {
        return <p>Order of flats is B-E-A-D-G-C-F (Battle Ends And Down Goes Charles' Father).</p>;
    }
    else {
        return <></>;
    }
}

export function ScaleStepsInfo(props: { scale: Score.Scale }) {
    let { scale } = props;
    return <p>{scale.scaleType} - scale is sequence of {scale.getScaleStringSteps().join("-")} steps.</p>;
}

interface SelectTuningFormProps {
    tuningName: string;
    onTuningChange: (tuningName: string) => void;
}

export function SelectTuningForm(props: SelectTuningFormProps) {
    const onSelectionChange = (tuningName: string) => {
        props.onTuningChange(Score.validateTuningName(tuningName));
    }

    return (
        <Form>
            <Row xs="auto">
                <Col>
                    <Form.Select name="select" value={props.tuningName} onChange={e => onSelectionChange(e.target.value)}>
                        {Score.TuningNameList.map((name, i) =>
                            <option key={i}>{name}</option>
                        )}
                    </Form.Select>
                </Col>
            </Row>
        </Form>
    );
}

interface SelectScaleFormProps {
    scale: Score.Scale;
    onScaleChange: (scale: Score.Scale) => void;
}

export function SelectScaleForm(props: SelectScaleFormProps) {
    const ScaleFactoryList = Score.getScaleFactoryList();
    const CurrentScaleFactory = Score.getScaleFactory(props.scale.scaleType);
    const KeyNoteList = CurrentScaleFactory.getKeyNoteList();

    const onSelectionChange = (scaleType: string, scaleKeyNote: string) => {
        let f = Score.getScaleFactory(Score.validateScaleType(scaleType));

        let scale: Score.Scale;
        try {
            scale = f.getScale(scaleKeyNote);
        }
        catch (err) {
            scale = f.getScale(f.getDefaultKeyNote());
        }

        props.onScaleChange(scale);
    }

    return (
        <Form>
            <Row xs="auto">
                <Col>
                    <Form.Select name="select" value={props.scale.keyNote} onChange={e => onSelectionChange(props.scale.scaleType, e.target.value)}>
                        {KeyNoteList.map((keyNote, i) =>
                            CurrentScaleFactory.hasScale(keyNote)
                                ? <option key={i} value={keyNote}>{Score.Note.getScientificNoteName(keyNote, Score.SymbolSet.Unicode)}</option>
                                : <option key={i} disabled>{keyNote}</option>
                        )}
                    </Form.Select>
                </Col>
                <Col>
                    <Form.Select name="select" value={props.scale.scaleType} onChange={e => onSelectionChange(e.target.value, props.scale.keyNote)}>
                        {ScaleFactoryList.map((factory, i) =>
                            factory instanceof Score.ScaleFactory
                                ? <option key={i} value={factory.getType()}>{factory.getType()}</option>
                                : <option key={i} disabled>{factory}</option>
                        )}
                    </Form.Select>
                </Col>
            </Row>
        </Form>
    );
}

interface TuningScaleInfoProps {
    app: GuitarApp;
    omitTuningInfo?: boolean;
    omitScaleInfo?: boolean;
}

export function TuningScaleInfo(props: TuningScaleInfoProps) {
    let guitarCtx = props.app.getGuitarContext();

    return (
        <p>
            {!props.omitTuningInfo
                ? <>Tuning is <b>{guitarCtx.tuningName}</b> ({guitarCtx.getTuningOverview()}).</>
                : null}

            {!props.omitTuningInfo && !props.omitScaleInfo ? <br /> : null}

            {!props.omitScaleInfo
                ? <>Scale is <b>{guitarCtx.scale.getScaleName()}</b> ({guitarCtx.scale.getScaleOverview()}).</>
                : null}
        </p>
    );
}
