import { DivRect, getVoiceIds, MTabRhythm, VoiceId } from "../pub";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjMeasure } from "./obj-measure";
import { ObjTab } from "./obj-staff-and-tab";
import { ObjRhythmColumn, RhythmSymbol } from "./obj-rhythm-column";
import { Utils } from "@tspro/ts-utils-lib";
import { ObjNoteGroup } from "./obj-note-group";
import { ObjRest } from "./obj-rest";

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

    layoutFitToMeasure(renderer: Renderer) {
        let { unitSize } = renderer;
        let { measure } = this;

        let measureContent = measure.getColumnsContentRect();

        let rhythmHeight = unitSize * 5;

        this.rect = new DivRect(measureContent.left, measureContent.right, -rhythmHeight, 0);
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        const ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        let { unitSize, lineWidth } = renderer;

        let flagSize = unitSize;

        const drawNote = (sym: ObjNoteGroup, drawFlag: boolean) => {
            if (sym.rhythmProps.noteSize >= 2) {
                renderer.drawLine(
                    sym.col.getRect().centerX,
                    this.getRect().bottom,
                    sym.col.getRect().centerX,
                    this.getRect().top,
                    "black",
                    sym.rhythmProps.noteSize === 4 ? lineWidth * 2 : lineWidth
                );
            }
            if (drawFlag) {
                for (let i = 0; i < sym.rhythmProps.flagCount; i++) {
                    renderer.drawLine(
                        sym.col.getRect().centerX,
                        this.getRect().top + i * flagSize,
                        sym.col.getRect().centerX + flagSize,
                        this.getRect().top + (i + 1) * flagSize,
                        "black",
                        lineWidth
                    );
                }
            }
        }

        const drawRest = (sym: ObjRest) => {
            ctx.save();
            let scale = 0.75;
            let x = sym.col.getRect().centerX / scale;
            let y = (this.getRect().top + this.getRect().bottom) / 2 / scale;
            ctx.scale(scale, scale);
            renderer.drawRest(
                sym.rhythmProps.noteSize,
                x,
                y,
                "black"
            );
            ctx.restore();
        }

        const drawBeam = (left: RhythmSymbol, right: RhythmSymbol) => {
            if (!(left instanceof ObjNoteGroup && right instanceof ObjNoteGroup)) {
                return;
            }
            let leftBeamCount = left.getRightBeamCount();
            let rightBeamCount = right.getLeftBeamCount();
            let maxBeamCount = Math.max(leftBeamCount, rightBeamCount);
            for (let i = 0; i < maxBeamCount; i++) {
                let leftT = 0;
                let rightT = 1;
                if (rightBeamCount > leftBeamCount && i >= leftBeamCount) {
                    leftT = 0.75;
                }
                else if (leftBeamCount > rightBeamCount && i >= rightBeamCount) {
                    rightT = 0.25;
                }
                renderer.drawPartialLine(
                    left.col.getRect().centerX,
                    this.getRect().top + i * flagSize,
                    right.col.getRect().centerX,
                    this.getRect().top + i * flagSize,
                    leftT,
                    rightT,
                    "black",
                    lineWidth * 2
                );
            }

            let dotSpace = unitSize;
            let dotWidth = unitSize * 0.25;

            for (let i = 0; i < left.rhythmProps.dotCount; i++) {
                renderer.fillCircle(
                    left.getRect().centerX + dotSpace * (i + 1),
                    this.getRect().bottom - dotWidth,
                    dotWidth
                );
            }
            for (let i = 0; i < right.rhythmProps.dotCount; i++) {
                renderer.fillCircle(
                    right.getRect().centerX + dotSpace * (i + 1),
                    this.getRect().bottom - dotWidth,
                    dotWidth
                );
            }
        }

        let columns = this.measure.getColumns();

        for (let colId = 0; colId < columns.length; colId++) {
            let cur: ObjRhythmColumn = columns[colId];

            let curVoiceId = this.voiceIds.find(voiceId => cur.getVoiceSymbol(voiceId) !== undefined);
            if (curVoiceId === undefined) {
                continue;
            }

            let curSym = cur.getVoiceSymbol(curVoiceId)!;
            let beamGroup = curSym.getBeamGroup();

            if (beamGroup) {
                for (let j = 0; j < beamGroup.getSymbols().length; j++) {
                    let cur = beamGroup.getSymbols()[j];
                    let next = beamGroup.getSymbols()[j + 1];
                    if (cur instanceof ObjNoteGroup) {
                        drawNote(cur, false);

                        if (next instanceof ObjNoteGroup) {
                            drawBeam(cur, next);
                        }
                    }

                    if (beamGroup.getLastSymbol()) {
                        colId = columns.indexOf(beamGroup.getLastSymbol()!.col);
                        if (colId < 0) {
                            colId = columns.length;
                        }
                    }
                }
            }
            else if (curSym instanceof ObjNoteGroup) {
                drawNote(curSym, true);
            }
            else if (curSym instanceof ObjRest) {
                drawRest(curSym);
            }
        }
    }
}
