import { colorKey, getVoiceIds, MTabRhythm, VoiceId } from "../pub";
import { View } from "./view";
import { MusicObject } from "./music-object";
import { ObjMeasure } from "./obj-measure";
import { ObjTab } from "./obj-staff-and-tab";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { AnchoredRect, Rect, UniMap, Utils } from "@tspro/ts-utils-lib";
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

    get doc() { return this.measure.doc; }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        let columns = this.measure.getColumns();

        let numColsInVoiceId: number[] = getVoiceIds().map(voiceId => Utils.Math.sum(columns.map(col => col.getVoiceSymbol(voiceId) ? 1 : 0)));

        this.voiceId.sort((a, b) => Utils.Math.cmp(numColsInVoiceId[a], numColsInVoiceId[b]));

        this.rect = new AnchoredRect();
    }

    private hasTuplets(): boolean {
        return this.measure.getBeamGroups().some(beamGroup => beamGroup.isTuplet());
    }

    layoutFitToMeasure(view: View) {
        let { unitSize, fontSizePx } = view;
        let { measure } = this;
        let cr = measure.getColumnsContentRect();
        let stemHeight = unitSize * 5;

        this.rect.left = cr.left;
        this.rect.anchorX = cr.centerX;
        this.rect.right = cr.right;
        this.rect.top = this.hasTuplets() ? -fontSizePx : 0;
        this.rect.anchorY = 0; // Center line is at stem top, under the tuplet number.
        this.rect.bottom = stemHeight;
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    // Keep non-static
    private readonly tupletPartsTextObjMap = new UniMap<string, ObjText>();

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.drawDebugRect(this.rect);

        view.lineWidth(1)

        let { unitSize, fontSizePx } = view;

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
                    view.lineWidth(1);
                    view.color(colorKey("tab.note"));

                    if (sym.rhythmProps.noteSize >= 2) {
                        view.lineWidth(sym.rhythmProps.noteSize === 4 ? 2 : 1);
                        view.strokeLine(colX, stemBottom, colX, stemTop)
                    }

                    if (symbols.length === 1) {
                        for (let i = 0; i < sym.rhythmProps.flagCount; i++) {
                            view.drawFlag(new AnchoredRect(colX, colX + flagSize, stemTop + i * flagSize, stemTop + (i + 2) * flagSize), "up");
                        }
                    }

                    for (let i = 0; i < sym.rhythmProps.dotCount; i++) {
                        view.fillCircle(colX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }
                }
                else if (sym instanceof ObjRest) {
                    view.lineWidth(1);
                    view.color(colorKey("tab.rest"));

                    let cx = colX;
                    let cy = (stemTop + stemBottom) / 2;
                    let scale = 0.65;
                    view.save();
                    view.scale(scale, scale);
                    view.drawRest(sym.rhythmProps.noteSize, cx / scale, cy / scale);
                    view.restore();

                    for (let i = 0; i < sym.rhythmProps.dotCount; i++) {
                        cx += dotSpace * 1.5;
                        view.fillCircle(cx, cy + dotSpace, dotWidth);
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

                    view.color(colorKey("tab.note"));
                    view.lineWidth(2);

                    for (let i = 0; i < maxBeamCount; i++) {
                        let leftT = rightBeamCount > leftBeamCount && i >= leftBeamCount ? 0.75 : 0;
                        let rightT = leftBeamCount > rightBeamCount && i >= rightBeamCount ? 0.25 : 1;
                        view.strokePartialLine(leftX, stemTop + i * flagSize, rightX, stemTop + i * flagSize, leftT, rightT);
                    }

                    view.lineWidth(1);

                    for (let i = 0; i < left.rhythmProps.dotCount; i++) {
                        view.fillCircle(leftX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }

                    for (let i = 0; i < right.rhythmProps.dotCount; i++) {
                        view.fillCircle(rightX + dotSpace * (i + 1), stemBottom - dotWidth, dotWidth);
                    }
                }

                if (beamGroup && beamGroup.isTuplet()) {
                    view.color(colorKey("tab.note"));

                    // Add tuplet number
                    let cx = (symbols[0].col.getRect().anchorX + symbols[symbols.length - 1].col.getRect().anchorX) / 2;
                    let text = beamGroup.getTupletRatioText();
                    let textObj = this.tupletPartsTextObjMap.get(text);
                    if (!textObj) {
                        this.tupletPartsTextObjMap.set(text, textObj = new ObjText(this, { text, scale: 0.75 }, 0.5, 0.5));
                        textObj.layout(view);
                    }
                    textObj.setCenter(cx, stemTop - fontSizePx / 2);
                    textObj.draw(view, clipRect);
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
