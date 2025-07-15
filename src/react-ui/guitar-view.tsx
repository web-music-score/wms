import * as React from "react";
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { DivRect } from "web-music-score/core";
import { GuitarContext, GuitarNote, } from "./guitar-context";
import GuitarData from "./assets/guitar.json";
import GuitarImg from "./assets/guitar.png";

/**
 * Calculated fret positions for 24 frets here (scale length = 1):
 * https://www.liutaiomottola.com/formulae/fret.htm
 */
const t_table = [0, /* nut */
    0.056, 0.109, 0.159, 0.206, 0.251, 0.293, 0.333, 0.37, 0.405, 0.439, 0.47, 0.5,
    0.528, 0.555, 0.58, 0.603, 0.625, 0.646, 0.666, 0.685, 0.703, 0.719, 0.735, 0.75
];

function fret_t(fret: number) {
    Assert.int_between(fret, 0, t_table.length - 1, "Invalid fret: " + fret);
    return t_table[fret] * 2;
}

class Fret {
    constructor(readonly x: number, readonly topStringY: number, readonly bottomStringY: number) { }

    private static _lerp(from: Fret, to: Fret, t: number) {
        return new Fret(
            from.x * (1 - t) + to.x * t,
            from.topStringY * (1 - t) + to.topStringY * t,
            from.bottomStringY * (1 - t) + to.bottomStringY * t);
    }

    static lerp(fret0: Fret, fret12: Fret, fret: number) {
        return Fret._lerp(fret0, fret12, fret_t(fret));
    }

    static scale(fretData: Fret, scale: number) {
        return new Fret(fretData.x * scale, fretData.topStringY * scale, fretData.bottomStringY * scale);
    }
}

/** @public */
export type UpdateGuitarNoteFunc = (guitarNote: GuitarNote) => void;

/** @public */
export class CellData {
    constructor(readonly guitarNote: Readonly<GuitarNote>, readonly cellRect: DivRect, readonly noteRect: DivRect) { }
}

/** @public */
export interface GuitarViewProps {
    style?: React.CSSProperties;
    guitarContext: GuitarContext;
    updateGuitarNote?: UpdateGuitarNoteFunc;
    onClickNote?: (guitarNote: GuitarNote) => void;
}

/** @public */
export interface GuitarViewState {
    width: number;
    height: number;
    table: CellData[][];
}

/** @public */
export class GuitarView extends React.Component<GuitarViewProps, GuitarViewState> {
    state: GuitarViewState;

    constructor(props: GuitarViewProps) {
        super(props);

        this.state = this.getLayoutState();
    }

    componentDidUpdate(prevProps: GuitarViewProps) {
        let { style, guitarContext: guitarCtx } = this.props;

        if (Utils.Dom.styleLayoutChanged(style, prevProps.style) || guitarCtx !== prevProps.guitarContext) {
            this.setState(this.getLayoutState());
        }
    }

    getLayoutState() {
        let { guitarContext: guitarCtx, style } = this.props;

        let dim = Utils.Dom.getDimension(style);

        let width = dim.width ?? window.innerWidth;
        let height = GuitarData.height * width / GuitarData.width;

        let s = width / GuitarData.width;

        let nut = Fret.scale(GuitarData.nut, s);
        let fret12 = Fret.scale(GuitarData.fret12, s);

        let frets: Fret[] = [];

        for (let fret = 0; fret <= guitarCtx.maxFretId; fret++) {
            frets.push(Fret.lerp(nut, fret12, fret));
        }

        let noteWidth = Math.round(frets[frets.length - 2].x - frets[frets.length - 1].x);

        let table: CellData[][] = [[], [], [], [], [], []];

        for (let stringId = 0; stringId < 6; stringId++) {

            for (let fretId = 0; fretId < frets.length; fretId++) {
                let left = frets[fretId];
                let right = frets[fretId - 1] ?? new Fret(width, left.topStringY, left.bottomStringY);

                let cellHeight = (left.bottomStringY - left.topStringY) / 5;

                let cellRect = DivRect.create(
                    left.x,
                    left.bottomStringY - cellHeight * (stringId + 0.5),
                    right.x - left.x,
                    cellHeight);

                if (guitarCtx.handedness === "lh") {
                    cellRect = new DivRect(width - cellRect.right, width - cellRect.left, cellRect.top, cellRect.bottom);
                }

                let noteRect = DivRect.create(
                    cellRect.left + (guitarCtx.handedness === "lh" ? cellRect.width - noteWidth : 0),
                    cellRect.top,
                    noteWidth,
                    cellRect.height).scaleCopy(0.75, 0.95);

                let guitarNote = guitarCtx.getGuitarNote(stringId, fretId);

                table[stringId][fretId] = new CellData(guitarNote, cellRect, noteRect);
            }
        }

        return { table, width, height }
    }

    onHover(cell?: CellData) { }

    onClick(cell?: CellData) {
        let { onClickNote } = this.props;
        if (cell && onClickNote) {
            onClickNote(cell.guitarNote);
        }
    }

    render() {
        let { width, height, table } = this.state;
        let { guitarContext: guitarCtx, updateGuitarNote, style } = this.props;

        style = Object.assign({}, style, { width, height });

        let components: React.JSX.Element[] = [];

        /* Add guitar background image. */
        components.push(<img
            key={"guitar"}
            src={GuitarImg}
            className={guitarCtx.handedness === "lh" ? "left-handed" : ""}
            style={{ position: "absolute", width, height, zIndex: 0 }} />
        );

        /* Add visible notes */
        table.forEach(frets => frets.forEach(cell => {
            let { guitarNote, noteRect } = cell;

            if (updateGuitarNote) {
                updateGuitarNote(guitarNote);
            }

            if (guitarNote.isVisible) {
                // Create border with box-shadow
                let border = guitarNote.borderColor !== undefined ? Math.round(noteRect.width / 10) : 0;
                let boxShadow = "0 0 0 " + border + "px " + (guitarNote.borderColor ?? "black");

                components.push(<span
                    key={"sel_" + guitarNote.stringId + "_" + guitarNote.fretId}
                    style={{
                        position: "absolute",
                        zIndex: guitarNote.borderColor !== undefined ? 2 : 1,
                        cursor: "pointer",
                        borderRadius: guitarNote.fretId > 0 ? "50%" : "",
                        color: guitarNote.textColor,
                        background: guitarNote.fillColor,
                        boxShadow, WebkitBoxShadow: boxShadow, MozBoxShadow: boxShadow,
                        left: noteRect.left,
                        top: noteRect.top,
                        width: noteRect.width,
                        height: noteRect.height,
                        lineHeight: "0.75",
                        fontSize: noteRect.height * 0.6 + "px",
                        display: "flex",
                        justifyContent: "center", // Align horizontal
                        alignItems: "center" // Align vertical
                    }}>{guitarNote.text}</span>);
            }
        }));

        /* Add input table */
        table.forEach((string, stringId) => string.forEach((cell, fretId) => {
            components.push(<div
                key={"table_" + stringId + "_" + fretId}
                onClick={() => this.onClick(cell)}
                onMouseEnter={() => this.onHover(cell)}
                onMouseLeave={() => this.onHover(undefined)}
                style={{
                    position: "absolute",
                    zIndex: 3,
                    cursor: "pointer",
                    left: cell.cellRect.left,
                    top: cell.cellRect.top,
                    width: cell.cellRect.width,
                    height: cell.cellRect.height
                }} />);
        }))

        return <div style={style}>{components}</div>
    }
}
