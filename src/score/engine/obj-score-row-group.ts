import { View } from "./view";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { ObjNotationLine, ObjTab } from "./obj-staff-and-tab";
import { ObjScoreRow } from "./obj-score-row";
import { colorKey, MScoreRowGroup } from "../pub";
import { AnchoredRect, Rect } from "@tspro/ts-utils-lib";

function parseInstr(instr: string) {
    const instrName = (
        instr.startsWith("!{") ? instr.substring(2) : instr.startsWith("!") ? instr.substring(1) : instr
    ).trim();
    const hideInstr = instr.startsWith("!");
    const hideBrace = instr.startsWith("!{");
    return { instrName, hideInstr, hideBrace }
}

export class ObjScoreRowGroup extends MusicObject {
    private space = 0;
    readonly instrument: string;
    readonly hasBrace: boolean;

    private readonly instrText: ObjText;
    private braceRect = new AnchoredRect();

    readonly mi: MScoreRowGroup;

    constructor(readonly lines: readonly ObjNotationLine[]) {
        super(lines[0].row);

        const color = colorKey("rowgroup.instrument");

        const instr = parseInstr(lines[0].getConfig().instrument ?? "");

        this.instrument = instr.instrName;
        this.hasBrace = instr.hideBrace ? false : (this.hasInstrument && lines.length >= 2);

        const text = instr.hideInstr ? "" : this.instrument;
        this.instrText = new ObjText(this, { text, color, scale: 1 }, 1, 0.5);

        this.mi = new MScoreRowGroup(this);
    }

    getMusicInterface(): MScoreRowGroup {
        return this.mi;
    }

    get row(): ObjScoreRow {
        return this.lines[0].row;
    }

    get hasInstrument(): boolean {
        return this.instrument.length > 0;
    }

    hasNotationLine(line: ObjNotationLine) {
        return this.lines.includes(line);
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.getRect().contains(x, y))
            return [];

        let arr = this.instrText.pick(x, y);
        if (arr.length > 0) {
            return [this, ...arr];
        }

        return [this];
    }

    updateRect() {
        this.instrText.setRight(this.braceRect.left - this.space);
        this.instrText.setCenterY(this.braceRect.anchorY);
        this.rect = this.instrText.getRect().clone().expandInPlace(this.braceRect);
    }

    layout(view: View) {
        this.space = view.unitSize;
        this.instrText.layout(view);
        this.braceRect = new AnchoredRect(-(this.hasBrace ? view.unitSize * 5 : 0), 0, 0, 0);
        this.forceRectUpdate();
    }

    layoutToNotationLines() {
        this.braceRect.top = this.lines[0].getTopLineY();
        this.braceRect.bottom = this.lines[this.lines.length - 1].getBottomLineY();
        this.braceRect.anchorY = this.braceRect.centerY;
        this.forceRectUpdate();
    }

    offset(dx: number, dy: number) {
        this.instrText.offset(dx, dy);
        this.braceRect.offsetInPlace(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        this.instrText.draw(view);

        if (this.hasBrace) {
            const r = this.braceRect;
            view.color(colorKey("rowgroup.frame")).lineWidth(1).drawBracket(r, "{");
        }
    }
}
