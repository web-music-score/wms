import * as React from "react";
import { Note, SymbolSet, getScale, Scale, ScaleType } from "@tspro/web-music-score/theory";
import { DivRect } from "@tspro/web-music-score/score";
import { Device, Utils } from "@tspro/ts-utils-lib";

const SelectedColor = "#0A0";

const MajorScaleTonics = [
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

const MinorScaleTonics = [
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

export interface CircleOfFifthsProps {
    style?: React.CSSProperties;
    scale: Scale;
    onScaleChange: (scale: Scale) => void;
}

/**
 * Circle of fifths react component.
 * <pre>
 *   // Using with React TSX/JSX
 *   import * as ScoreUI from "@tspro/web-music-score/react-ui";
 *   import * as Theory from "@tspro/web-music-score/theory";
 *  
 *   // Render function of react component.
 *   render() {
 *       const curScale = Theory.getScale("C Major");
 *
 *       const onChangeScale = (newScale: Theory.Scale) => {
 *           console.log("New scale is " + newScale.getScaleName());
 *       }
 * 
 *       return &lt;&gt;
 *          &lt;ScoreUI.CircleOfFifths
 *              style={{ position: "relative", padding: "0.5em" }}
 *              scale={curScale}
 *              onScaleChange={onChangeScale} /&gt;
 *      &lt;/&gt;;
 *   }
 * </pre>
 */
export class CircleOfFifths extends React.Component<CircleOfFifthsProps, {}> {
    constructor(props: CircleOfFifthsProps) {
        super(props);
    }

    onScaleChange(tonic: string, scaleType: ScaleType) {
        try {
            let scale = getScale(tonic, scaleType);
            this.props.onScaleChange(scale);
        }
        catch (err) {
            console.error("Invalid scale", tonic, scaleType);
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
        let tonicSize = fontSize * 2;

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

            let tonics = [
                MinorScaleTonics[i][1],
                MinorScaleTonics[i][0],
                undefined,
                MajorScaleTonics[i][0],
                MajorScaleTonics[i][1],
            ];

            for (let k = -2; k <= 2; k++) {
                const tonic = tonics[k + 2];

                if (tonic) {
                    const scaleType = k < 0 ? ScaleType.NaturalMinor : ScaleType.Major;

                    let tonicStr = Note.getScientificNoteName(tonic, SymbolSet.Unicode);
                    if (scaleType === ScaleType.NaturalMinor) {
                        tonicStr += "m";
                    }
                    let isSelected = scaleType === scale.scaleType && tonic === scale.tonic;
                    components.push(<div key={"kn_" + i + "_" + (k + 2)} style={{
                        position: "absolute",
                        cursor: "pointer",
                        left: (x + dx * fontSize * k * 1.5) - tonicSize / 2,
                        top: (y + dy * fontSize * k * 1.5) - tonicSize / 2,
                        width: tonicSize,
                        height: tonicSize,
                        backgroundColor: isSelected ? SelectedColor : "",
                        borderRadius: isSelected ? "50%" : "",
                        fontSize,
                        lineHeight: 1,
                        display: "flex",
                        justifyContent: "center", // Align horizontal
                        alignItems: "center" // Align vertical
                    }} onClick={() => this.onScaleChange(tonic, scaleType)}>
                        {tonicStr}
                    </div>);
                }
            }
        }

        return <div style={style}>{components}</div>;
    }
}
