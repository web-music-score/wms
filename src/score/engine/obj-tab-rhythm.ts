import { DivRect, getVoiceIds, MTabRhythm, VoiceId } from "../pub";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjMeasure } from "./obj-measure";
import { ObjTab } from "./obj-staff-and-tab";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { Utils } from "@tspro/ts-utils-lib";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjRest } from "./obj-rest";
import { ObjText } from "./obj-text";

export class ObjTabRhythm extends MusicObject {

    private readonly voiceIds: VoiceId[];

    readonly mi: MTabRhythm;

    constructor(readonly measure: ObjMeasure, readonly tab: ObjTab) {
        super(measure);

        this.voiceIds = getVoiceIds().filter(voiceId => tab.containsVoiceId(voiceId));

        this.rect = new DivRect();

        this.mi = new MTabRhythm(this);
    }

    getMusicInterface(): MTabRhythm {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let columns = this.measure.getColumns();

        let numColsInVoiceId: number[] = getVoiceIds().map(voiceId => Utils.Math.sum(columns.map(col => col.getVoiceSymbol(voiceId) ? 1 : 0)));

        this.voiceIds.sort((a, b) => Utils.Math.cmp(numColsInVoiceId[a], numColsInVoiceId[b]));

        this.rect = new DivRect();
    }

    private hasTuplets(): boolean {
        return this.measure.getBeamGroups().some(beamGroup => beamGroup.isTuplet());
    }

    layoutFitToMeasure(renderer: Renderer) {
        let { unitSize, fontSize } = renderer;
        let { measure } = this;

        let { left, right } = measure.getColumnsContentRect();

        this.rect.left = left;
        this.rect.centerX = (left + right) / 2;
        this.rect.right = right;
        this.rect.top = this.hasTuplets() ? -fontSize : 0;
        this.rect.centerY = 0; // Center line is above stem top, under tuplet number.
        this.rect.bottom = unitSize * 5;
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    // Keep non-static
    private readonly tupletPartsTextObjMap = new Map<string, ObjText>();

    draw(renderer: Renderer) {
        const ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        let { unitSize, lineWidth, fontSize } = renderer;

        let flagSize = unitSize;
        let dotSpace = unitSize;
        let dotWidth = unitSize * 0.25;
        let { bottom, centerY } = this.getRect();

        let stemTop = centerY;
        let stemBottom = bottom;

        let columns = this.measure.getColumns();

        for (let colId = 0; colId < columns.length; colId++) {
            let cur: ObjRhythmColumn = columns[colId];

            let curVoiceSymbol = this.voiceIds.map(voiceId => cur.getVoiceSymbol(voiceId)).find(sym => sym !== undefined);

            if (!curVoiceSymbol) {
                continue;
            }

            let beamGroup = curVoiceSymbol.getBeamGroup();
            let symbols = beamGroup ? beamGroup.getSymbols() : [curVoiceSymbol];

            for (let j = 0; j < symbols.length; j++) {
                let sym = symbols[j];
                let nextSym = symbols[j + 1];
                let colX = sym.col.getRect().centerX;
                if (sym instanceof ObjNoteGroup) {
                    if (sym.rhythmProps.noteSize >= 2) {
                        let stemThickness = sym.rhythmProps.noteSize === 4 ? lineWidth * 2 : lineWidth;
                        renderer.drawLine(colX, stemBottom, colX, stemTop, "black", stemThickness);
                    }

                    if (symbols.length === 1) {
                        for (let i = 0; i < sym.rhythmProps.flagCount; i++) {
                            renderer.drawFlag(new DivRect(colX, colX + flagSize, stemTop + i * flagSize, stemTop + (i + 2) * flagSize), "up");
                        }
                    }

                    for (let i = 0; i < sym.rhythmProps.dotCount; i++) {
                        renderer.fillCircle(colX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }
                }
                else if (sym instanceof ObjRest) {
                    let cx = colX;
                    let cy = (stemTop + stemBottom) / 2;
                    let scale = 0.65;
                    ctx.save();
                    ctx.scale(scale, scale);
                    renderer.drawRest(sym.rhythmProps.noteSize, cx / scale, cy / scale, "black");
                    ctx.restore();

                    for (let i = 0; i < sym.rhythmProps.dotCount; i++) {
                        cx += dotSpace * 1.5;
                        renderer.fillCircle(cx, cy + dotSpace, dotWidth);
                    }
                }

                if (nextSym) {
                    let left = sym;
                    let right = nextSym;
                    let leftX = left.col.getRect().centerX;
                    let rightX = right.col.getRect().centerX;
                    let leftBeamCount = left.hasTuplet() ? 1 : left instanceof ObjNoteGroup ? left.getRightBeamCount() : 1;
                    let rightBeamCount = right.hasTuplet() ? 1 : right instanceof ObjNoteGroup ? right.getLeftBeamCount() : 1;
                    let maxBeamCount = Math.max(leftBeamCount, rightBeamCount);
                    for (let i = 0; i < maxBeamCount; i++) {
                        let leftT = rightBeamCount > leftBeamCount && i >= leftBeamCount ? 0.75 : 0;
                        let rightT = leftBeamCount > rightBeamCount && i >= rightBeamCount ? 0.25 : 1;
                        renderer.drawPartialLine(leftX, stemTop + i * flagSize, rightX, stemTop + i * flagSize, leftT, rightT, "black", lineWidth * 2);
                    }

                    for (let i = 0; i < left.rhythmProps.dotCount; i++) {
                        renderer.fillCircle(leftX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }

                    for (let i = 0; i < right.rhythmProps.dotCount; i++) {
                        renderer.fillCircle(rightX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }
                }

                if (beamGroup && beamGroup.isTuplet()) {
                    // Add tuplet number
                    let cx = (symbols[0].col.getRect().centerX + symbols[symbols.length - 1].col.getRect().centerX) / 2;
                    let text = beamGroup.getTupletRatioText();
                    let textObj = this.tupletPartsTextObjMap.get(text);
                    if (!textObj) {
                        this.tupletPartsTextObjMap.set(text, textObj = new ObjText(this, { text, scale: 0.75 }, 0.5, 0.5));
                        textObj.layout(renderer);
                    }
                    textObj.offset(-textObj.getRect().centerX, -textObj.getRect().centerY);
                    textObj.offset(cx, stemTop - fontSize / 2);
                    textObj.draw(renderer);
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
