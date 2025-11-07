import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { ObjScoreRow } from "./obj-score-row";
import { MScoreRowGroup } from "score/pub";
import { AnchoredRect } from "@tspro/ts-utils-lib";
import { DocumentColor } from "./settings";

export class ObjScoreRowGroup extends MusicObject {
    private space = 0;
    readonly instrument: string;

    private readonly instrText: ObjText;
    private braceRect = new AnchoredRect();

    readonly mi: MScoreRowGroup;

    constructor(readonly lines: readonly ObjNotationLine[]) {
        super(lines[0].row);

        const color = DocumentColor.RowGroupInstrument;

        this.instrument = lines[0].getConfig().instrument ?? "";
        this.instrText = new ObjText(this, { text: this.instrument, color, scale: 1 }, 1, 0.5);

        this.mi = new MScoreRowGroup(this);
    }

    getMusicInterface(): MScoreRowGroup {
        return this.mi;
    }

    get row(): ObjScoreRow {
        return this.lines[0].row;
    }

    get hasBrace(): boolean {
        return this.hasInstrument && this.lines.length > 1;
    }

    get hasInstrument(): boolean {
        return this.instrument.length > 0;
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

    layout(ctx: RenderContext) {
        this.space = ctx.unitSize;
        this.instrText.layout(ctx);
        this.braceRect = new AnchoredRect(-(this.hasBrace ? ctx.unitSize * 5 : 0), 0, 0, 0);
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

    draw(ctx: RenderContext) {
        this.instrText.draw(ctx);

        if (this.hasBrace) {
            ctx.color(DocumentColor.RowGroupBrace).lineWidth(1).drawBracket(this.braceRect, "{");
        }
    }
}
