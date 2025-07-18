import { GuitarApp } from "guitar-app";
import * as React from "react";
import { Col, Form, Row } from "react-bootstrap";
import * as Theory from "@tspro/web-music-score/theory";

interface SelectAccidentalProps {
    accidental: Theory.Accidental | undefined;
    onChangeAccidental: (accidental: Theory.Accidental | undefined) => void;
}

export function SelectAccidental(props: SelectAccidentalProps) {

    const onSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let n = Number(e.target.value);
        props.onChangeAccidental(isNaN(n) ? undefined : Theory.Note.validateAccidental(n));
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

export function OrderOfAccidentalsInfo(props: { ks: Theory.KeySignature }) {
    if (props.ks.getAccidentalType() === Theory.AccidentalType.Sharps) {
        return <p>Order of sharps is F-C-G-D-A-E-B (Father Charles Goes Down And Ends Battle).</p>;
    }
    else if (props.ks.getAccidentalType() === Theory.AccidentalType.Flats) {
        return <p>Order of flats is B-E-A-D-G-C-F (Battle Ends And Down Goes Charles' Father).</p>;
    }
    else {
        return <></>;
    }
}

export function ScaleStepsInfo(props: { scale: Theory.Scale }) {
    let { scale } = props;
    return <p>{scale.scaleType} - scale is sequence of {scale.getScaleStringSteps().join("-")} steps.</p>;
}

interface SelectTuningFormProps {
    tuningName: string;
    onTuningChange: (tuningName: string) => void;
}

export function SelectTuningForm(props: SelectTuningFormProps) {
    const onSelectionChange = (tuningName: string) => {
        props.onTuningChange(Theory.validateTuningName(tuningName));
    }

    return (
        <Form>
            <Row xs="auto">
                <Col>
                    <Form.Select name="select" value={props.tuningName} onChange={e => onSelectionChange(e.target.value)}>
                        {Theory.TuningNameList.map((name, i) =>
                            <option key={i}>{name}</option>
                        )}
                    </Form.Select>
                </Col>
            </Row>
        </Form>
    );
}

interface SelectScaleFormProps {
    scale: Theory.Scale;
    onScaleChange: (scale: Theory.Scale) => void;
}

export function SelectScaleForm(props: SelectScaleFormProps) {
    const ScaleFactoryList = Theory.getScaleFactoryList();
    const CurrentScaleFactory = Theory.getScaleFactory(props.scale.scaleType);
    const ScaleTonicList = CurrentScaleFactory.getTonicList();

    const onSelectionChange = (scaleTonic: string, scaleType: string) => {
        let f = Theory.getScaleFactory(Theory.validateScaleType(scaleType));

        let scale: Theory.Scale;
        try {
            scale = f.getScale(scaleTonic);
        }
        catch (err) {
            scale = f.getScale(f.getDefaultTonic());
        }

        props.onScaleChange(scale);
    }

    return (
        <Form>
            <Row xs="auto">
                <Col>
                    <Form.Select name="select" value={props.scale.tonic} onChange={e => onSelectionChange(e.target.value, props.scale.scaleType)}>
                        {ScaleTonicList.map((tonic, i) =>
                            CurrentScaleFactory.hasScale(tonic)
                                ? <option key={i} value={tonic}>{Theory.Note.getScientificNoteName(tonic, Theory.SymbolSet.Unicode)}</option>
                                : <option key={i} disabled>{tonic}</option>
                        )}
                    </Form.Select>
                </Col>
                <Col>
                    <Form.Select name="select" value={props.scale.scaleType} onChange={e => onSelectionChange(props.scale.tonic, e.target.value)}>
                        {ScaleFactoryList.map((factory, i) =>
                            factory instanceof Theory.ScaleFactory
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
