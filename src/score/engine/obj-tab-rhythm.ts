import { getVoiceIds, MTabRhythm, VoiceId } from "../pub";
import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjMeasure } from "./obj-measure";
import { ObjTab } from "./obj-staff-and-tab";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { AnchoredRect, UniMap, Utils } from "@tspro/ts-utils-lib";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjRest } from "./obj-rest";
import { ObjText } from "./obj-text";

export class ObjTabRhythm extends MusicObject {

    private readonly voiceId: VoiceId[];

    readonly mi: MTabRhythm;

    constructor(readonly measure: ObjMeasure, readonly tab: ObjTab) {
        super(measure);

        this.voiceId = getVoiceIds().filter(voiceId => tab.containsVoiceId(voiceId));

        this.rect = new AnchoredRect();

        this.mi = new MTabRhythm(this);
    }

    getMusicInterface(): MTabRhythm {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        let columns = this.measure.getColumns();

        let numColsInVoiceId: number[] = getVoiceIds().map(voiceId => Utils.Math.sum(columns.map(col => col.getVoiceSymbol(voiceId) ? 1 : 0)));

        this.voiceId.sort((a, b) => Utils.Math.cmp(numColsInVoiceId[a], numColsInVoiceId[b]));

        this.rect = new AnchoredRect();
    }

    private hasTuplets(): boolean {
        return this.measure.getBeamGroups().some(beamGroup => beamGroup.isTuplet());
    }

    layoutFitToMeasure(ctx: RenderContext) {
        let { unitSize, fontSize } = ctx;
        let { measure } = this;
        let cr = measure.getColumnsContentRect();
        let stemHeight = unitSize * 5;

        this.rect.left = cr.left;
        this.rect.anchorX = cr.centerX;
        this.rect.right = cr.right;
        this.rect.top = this.hasTuplets() ? -fontSize : 0;
        this.rect.anchorY = 0; // Center line is at stem top, under the tuplet number.
        this.rect.bottom = stemHeight;
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    // Keep non-static
    private readonly tupletPartsTextObjMap = new UniMap<string, ObjText>();

    draw(ctx: RenderContext) {
        ctx.drawDebugRect(this.rect);

        ctx.color("black").lineWidth(1)

        let { unitSize, fontSize } = ctx;

        let flagSize = unitSize;
        let dotSpace = unitSize;
        let dotWidth = unitSize * 0.25;
        let { bottom, anchorY } = this.getRect();

        let stemTop = anchorY;
        let stemBottom = bottom;

        let columns = this.measure.getColumns();

        for (let colId = 0; colId < columns.length; colId++) {
            let cur: ObjRhythmColumn = columns[colId];

            let curVoiceSymbol = this.voiceId.map(voiceId => cur.getVoiceSymbol(voiceId)).find(sym => sym !== undefined);

            if (!curVoiceSymbol) {
                continue;
            }

            let beamGroup = curVoiceSymbol.getBeamGroup();
            let symbols = beamGroup ? beamGroup.getSymbols() : [curVoiceSymbol];

            for (let j = 0; j < symbols.length; j++) {
                let sym = symbols[j];
                let nextSym = symbols[j + 1];
                let colX = sym.col.getRect().anchorX;
                if (sym instanceof ObjNoteGroup) {
                    if (sym.rhythmProps.noteSize >= 2) {
                        ctx.lineWidth(sym.rhythmProps.noteSize === 4 ? 2 : 1);
                        ctx.strokeLine(colX, stemBottom, colX, stemTop)
                    }

                    ctx.lineWidth(1);

                    if (symbols.length === 1) {
                        for (let i = 0; i < sym.rhythmProps.flagCount; i++) {
                            ctx.drawFlag(new AnchoredRect(colX, colX + flagSize, stemTop + i * flagSize, stemTop + (i + 2) * flagSize), "up");
                        }
                    }

                    for (let i = 0; i < sym.rhythmProps.dotCount; i++) {
                        ctx.fillCircle(colX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }
                }
                else if (sym instanceof ObjRest) {
                    let cx = colX;
                    let cy = (stemTop + stemBottom) / 2;
                    let scale = 0.65;
                    ctx.save();
                    ctx.scale(scale, scale);
                    ctx.drawRest(sym.rhythmProps.noteSize, cx / scale, cy / scale);
                    ctx.restore();

                    for (let i = 0; i < sym.rhythmProps.dotCount; i++) {
                        cx += dotSpace * 1.5;
                        ctx.fillCircle(cx, cy + dotSpace, dotWidth);
                    }
                }

                if (nextSym) {
                    let left = sym;
                    let right = nextSym;
                    let leftX = left.col.getRect().anchorX;
                    let rightX = right.col.getRect().anchorX;
                    let leftBeamCount = left.hasTuplet() ? 1 : left instanceof ObjNoteGroup ? left.getRightBeamCount() : 1;
                    let rightBeamCount = right.hasTuplet() ? 1 : right instanceof ObjNoteGroup ? right.getLeftBeamCount() : 1;
                    let maxBeamCount = Math.max(leftBeamCount, rightBeamCount);

                    ctx.lineWidth(2);

                    for (let i = 0; i < maxBeamCount; i++) {
                        let leftT = rightBeamCount > leftBeamCount && i >= leftBeamCount ? 0.75 : 0;
                        let rightT = leftBeamCount > rightBeamCount && i >= rightBeamCount ? 0.25 : 1;
                        ctx.strokePartialLine(leftX, stemTop + i * flagSize, rightX, stemTop + i * flagSize, leftT, rightT);
                    }

                    ctx.lineWidth(1);

                    for (let i = 0; i < left.rhythmProps.dotCount; i++) {
                        ctx.fillCircle(leftX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }

                    for (let i = 0; i < right.rhythmProps.dotCount; i++) {
                        ctx.fillCircle(rightX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }
                }

                if (beamGroup && beamGroup.isTuplet()) {
                    // Add tuplet number
                    let cx = (symbols[0].col.getRect().anchorX + symbols[symbols.length - 1].col.getRect().anchorX) / 2;
                    let text = beamGroup.getTupletRatioText();
                    let textObj = this.tupletPartsTextObjMap.get(text);
                    if (!textObj) {
                        this.tupletPartsTextObjMap.set(text, textObj = new ObjText(this, { text, scale: 0.75 }, 0.5, 0.5));
                        textObj.layout(ctx);
                    }
                    textObj.setCenter(cx, stemTop - fontSize / 2);
                    textObj.draw(ctx);
                }

                if (symbols.length > 1) {
                    colId = columns.indexOf(symbols[symbols.length - 1].col);
                    if (colId < 0) {
                        colId = columns.length;
                    }
                }
            }
        }
    }
}
