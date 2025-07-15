import * as React from "react";
import { getScale, Scale, ScaleType } from "@tspro/web-music-score";
import { DivRect, Note, SymbolSet } from "@tspro/web-music-score";
import { Device, Utils } from "@tspro/ts-utils-lib";

const SelectedColor = "#0A0";

const MajorScaleKeyNotes = [
    ["C"],
    ["G"],
    ["D"],
    ["A"],
    ["E"],
    ["B", "Cb"],
    ["F#", "Gb"],
    ["C#", "Db"],
    ["Ab"],
    ["Eb"],
    ["Bb"],
    ["F"]
];

const MinorScaleKeyNotes = [
    ["A"],
    ["E"],
    ["B"],
    ["F#"],
    ["C#"],
    ["G#", "Ab"],
    ["D#", "Eb"],
    ["A#", "Bb"],
    ["F"],
    ["C"],
    ["G"],
    ["D"]
];

/** @public */
export interface CircleOfFifthsProps {
    style?: React.CSSProperties;
    scale: Scale;
    onScaleChange: (scale: Scale) => void;
}

/** @public */
export class CircleOfFifths extends React.Component<CircleOfFifthsProps, {}> {
    constructor(props: CircleOfFifthsProps) {
        super(props);
    }

    onScaleChange(scaleType: ScaleType, keyNote: string) {
        try {
            let scale = getScale(keyNote, scaleType);
            this.props.onScaleChange(scale);
        }
        catch (err) {
            console.error("Invalid scale", keyNote, scaleType);
        }
    }

    render() {
        let { style, scale } = this.props;

        let defaultSize = Device.toPx("22em");
        let dim = Utils.Dom.getDimension(style);

        let width = dim.width ?? defaultSize;
        let height = dim.height ?? defaultSize;

        style = Object.assign({}, style, { width, height })

        let circleRect = new DivRect(0, width, 0, height).scaleCopy(0.65);

        let lineWidth = Math.max(1, circleRect.width / 100);
        let fontSize = circleRect.width / 15;
        let keyNoteSize = fontSize * 2;

        let components: React.JSX.Element[] = [];

        // Add circle
        components.push(<div key="circle" style={{
            position: "absolute",
            left: circleRect.left - lineWidth / 2,
            top: circleRect.top - lineWidth / 2,
            width: circleRect.width + lineWidth,
            height: circleRect.height + lineWidth,
            border: lineWidth + "px solid black",
            borderRadius: "50%"
        }} />);

        for (let i = 0; i < 12; i++) {
            let rad = 2 * Math.PI * i / 12;

            let dx = Math.sin(rad);
            let dy = -Math.cos(rad);
            let x = circleRect.centerX + dx * circleRect.width / 2;
            let y = circleRect.centerY + dy * circleRect.height / 2;

            // Add marker
            components.push(<div key={"m" + i} style={{
                position: "absolute",
                left: x - lineWidth / 2,
                top: y - lineWidth * 4 / 2,
                width: lineWidth,
                height: lineWidth * 4,
                backgroundColor: "black",
                transform: "rotate(" + rad + "rad)"
            }} />);

            let keyNotes = [
                MinorScaleKeyNotes[i][1],
                MinorScaleKeyNotes[i][0],
                undefined,
                MajorScaleKeyNotes[i][0],
                MajorScaleKeyNotes[i][1],
            ];

            for (let k = -2; k <= 2; k++) {
                const keyNote = keyNotes[k + 2];

                if (keyNote) {
                    const scaleType = k < 0 ? ScaleType.NaturalMinor : ScaleType.Major;

                    let keyNoteStr = Note.getScientificNoteName(keyNote, SymbolSet.Unicode);
                    if (scaleType === ScaleType.NaturalMinor) {
                        keyNoteStr += "m";
                    }
                    let isSelected = scaleType === scale.scaleType && keyNote === scale.keyNote;
                    components.push(<div key={"kn_" + i + "_" + (k + 2)} style={{
                        position: "absolute",
                        cursor: "pointer",
                        left: (x + dx * fontSize * k * 1.5) - keyNoteSize / 2,
                        top: (y + dy * fontSize * k * 1.5) - keyNoteSize / 2,
                        width: keyNoteSize,
                        height: keyNoteSize,
                        backgroundColor: isSelected ? SelectedColor : "",
                        borderRadius: isSelected ? "50%" : "",
                        fontSize,
                        lineHeight: 1,
                        display: "flex",
                        justifyContent: "center", // Align horizontal
                        alignItems: "center" // Align vertical
                    }} onClick={() => this.onScaleChange(scaleType, keyNote)}>
                        {keyNoteStr}
                    </div>);
                }
            }
        }

        return <div style={style}>{components}</div>;
    }
}
