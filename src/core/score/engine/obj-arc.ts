import { Assert, Utils } from "@tspro/ts-utils-lib";
import { ObjNoteGroup } from "./obj-note-group";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ArcProps } from "./arc-props";
import { Note } from "../../theory/note";
import { ObjMeasure } from "./obj-measure";
import { MArc, DivRect } from "../pub";
import { TieLength } from "../pub/types";
import { DocumentSettings } from "./settings";

export class ObjArc extends MusicObject {
    private lx = 0;
    private ly = 0;
    private rx = 0;
    private ry = 0;
    private cp1x = 0;
    private cp1y = 0;
    private cp2x = 0;
    private cp2y = 0;
    private arcHeight = 0;

    private readonly measure: ObjMeasure;
    private readonly leftNoteGroup: ObjNoteGroup;
    private readonly leftNote: Note;
    private readonly rightNoteGroup?: ObjNoteGroup;
    private readonly rightNote?: Note;
    private readonly tieLength?: TieLength;


    readonly mi: MArc;

    constructor(arcProps: ArcProps, measure: ObjMeasure, leftNoteGroup: ObjNoteGroup, leftNote: Note, rightNoteGroup: ObjNoteGroup, rightNote: Note);
    constructor(arcProps: ArcProps, measure: ObjMeasure, leftNoteGroup: ObjNoteGroup, leftNote: Note, tieLength: TieLength);
    constructor(readonly arcProps: ArcProps, measure: ObjMeasure, leftNoteGroup: ObjNoteGroup, leftNote: Note, ...args: unknown[]) {
        super(measure);

        this.measure = measure;

        this.leftNoteGroup = leftNoteGroup;
        this.leftNote = leftNote;

        if (args[0] instanceof ObjNoteGroup && args[1] instanceof Note) {
            this.rightNoteGroup = args[0];
            this.rightNote = args[1];
            this.tieLength = undefined;
        }
        else if (args[0] === TieLength.Short || args[0] === TieLength.ToMeasureEnd) {
            this.rightNoteGroup = undefined;
            this.rightNote = undefined;
            this.tieLength = args[0];
        }

        this.mi = new MArc(this);

        this.measure.addArcObject(this);
    }

    getMusicInterface(): MArc {
        return this.mi;
    }

    isTie() {
        return this.arcProps.arcType === "tie";
    }

    isSlur() {
        return this.arcProps.arcType === "slur";
    }

    isInsideMeasure() {
        return this.rightNoteGroup === undefined || this.leftNoteGroup.measure === this.rightNoteGroup.measure;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let { unitSize } = renderer;
        let { measure, leftNoteGroup, leftNote, rightNoteGroup, rightNote } = this;
        let { row } = measure;
        let prevRow = row.getPrevRow();
        let nextRow = row.getNextRow();

        let contentRect = row.getArcsContentRect();

        let { arcPos, arcDir } = this.arcProps;

        let leftPos = leftNoteGroup.getArcAnchorPoint(leftNote, arcPos, "left");

        let rightPos = rightNoteGroup !== undefined && rightNote !== undefined
            ? rightNoteGroup.getArcAnchorPoint(rightNote, arcPos, "right")
            : this.tieLength === TieLength.ToMeasureEnd
                ? { x: measure.getColumnsContentRect().right, y: leftPos.y }
                : { x: leftPos.x + unitSize * DocumentSettings.ShortTieLength, y: leftPos.y };

        let lx: number,
            ly: number,
            rx: number,
            ry: number;

        if (rightNoteGroup === undefined) {
            // TieLength.Short | TieLength.ToMeasureEnd
            lx = leftPos.x;
            ly = leftPos.y;
            rx = rightPos.x;
            ry = rightPos.y;
        }
        else if (leftNoteGroup.row === row && rightNoteGroup.row === row) {
            lx = leftPos.x;
            ly = leftPos.y;
            rx = rightPos.x;
            ry = rightPos.y;
        }
        else if (leftNoteGroup.row === prevRow && rightNoteGroup.row === row) {
            // left is on previous row, right is on current row
            let prevRowContentRect = prevRow.getArcsContentRect();
            let tLeft = prevRowContentRect.right - leftPos.x;
            let tRight = rightPos.x - contentRect.left;
            lx = contentRect.left;
            ly = leftPos.y + (rightPos.y - leftPos.y) * tLeft / (tLeft + tRight);
            rx = rightPos.x;
            ry = rightPos.y;
        }
        else if (leftNoteGroup.row === row && rightNoteGroup.row === nextRow) {
            // left is on current row, right is on next row
            let nextRowContentRect = nextRow.getArcsContentRect();
            let tLeft = contentRect.right - leftPos.x;
            let tRight = rightPos.x - nextRowContentRect.left;
            lx = leftPos.x;
            ly = leftPos.y;
            rx = contentRect.right;
            ry = leftPos.y + (rightPos.y - leftPos.y) * tLeft / (tLeft + tRight);
        }
        else {
            Assert.interrupt("Cannot layout arc object because no valid left and right note groups.");
        }

        let spanDy = arcDir === "up" ? -1 : 1;
        let arcHeight = spanDy * unitSize * Math.log2(rx - lx) / 3;

        this.lx = lx;
        this.ly = ly;
        this.rx = rx;
        this.ry = ry;
        this.arcHeight = arcHeight;

        let { nx, ny } = Utils.Math.calcNormal(lx, ly, rx, ry);

        this.cp1x = lx * 0.7 + rx * 0.3 + nx * this.arcHeight;
        this.cp1y = ly * 0.7 + ry * 0.3 + ny * this.arcHeight;
        this.cp2x = lx * 0.3 + rx * 0.7 + nx * this.arcHeight;
        this.cp2y = ly * 0.3 + ry * 0.7 + ny * this.arcHeight;

        this.rect = new DivRect(
            Math.min(this.lx, this.cp1x, this.cp2x, this.rx),
            Math.max(this.lx, this.cp1x, this.cp2x, this.rx),
            Math.min(this.ly, this.cp1y, this.cp2y, this.ry),
            Math.max(this.ly, this.cp1y, this.cp2y, this.ry));
    }

    offset(dx: number, dy: number) {
        this.lx += dx;
        this.ly += dy;
        this.rx += dx;
        this.ry += dy;
        this.cp1x += dx;
        this.cp1y += dy;
        this.cp2x += dx;
        this.cp2y += dy;
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        if (this.rightNoteGroup === undefined) { /* Draw */ }
        else if (this.leftNoteGroup.measure === this.rightNoteGroup.measure) { /* Draw */ }
        else if (this.leftNoteGroup.row.getNextRow() === this.rightNoteGroup.row) { /* Draw */ }
        else if (this.measure === this.rightNoteGroup.measure) { /* Draw for right measure only */ }
        else { return; }

        let { rect } = this;
        let { lineWidth } = renderer;

        renderer.drawDebugRect(rect);

        let t = lineWidth * 1.5;
        let s = lineWidth * 0.25;

        ctx.strokeStyle = ctx.fillStyle = "black";
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.lx, this.ly - s);
        ctx.bezierCurveTo(this.cp1x, this.cp1y - t, this.cp2x, this.cp2y - t, this.rx, this.ry - s);
        ctx.lineTo(this.rx, this.ry + s);
        ctx.bezierCurveTo(this.cp2x, this.cp2y + t, this.cp1x, this.cp1y + t, this.lx, this.ly + s);
        ctx.fill();
    }
}
