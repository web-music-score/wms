import { DivRect, LyricsAlign, LyricsHyphen, LyricsOptions, MLyrics, VerseNumber } from "../pub";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { NoteLength, RhythmProps } from "theory/rhythm";
import { ObjText } from "./obj-text";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { VerticalPos } from "./layout-object";
import { Utils } from "@tspro/ts-utils-lib";

export class LyricsContainer {
    readonly lyricsObjects: ObjLyrics[] = [];
    readonly rhythmProps: RhythmProps;

    constructor(readonly col: ObjRhythmColumn, lyricsLength: NoteLength) {
        this.rhythmProps = RhythmProps.get(lyricsLength);
    }

    addLyricsObject(addObj: ObjLyrics) {
        this.lyricsObjects.push(addObj);

        try {
            let prevLyricsObject: ObjLyrics | undefined;

            let measures = this.col.measure.getPrevMeasure()
                ? [this.col.measure.getPrevMeasure()!, this.col.measure]
                : [this.col.measure];

            measures.forEach(m => {
                m.getColumns().forEach(col => {
                    col.getLyricsContainerDatas().forEach(data => {
                        data.lyricsContainer.lyricsObjects.forEach(curObj => {
                            if (curObj.verse === addObj.verse && curObj.line === addObj.line && curObj.vpos === addObj.vpos) {
                                if (curObj === addObj) {
                                    prevLyricsObject?.setNextLyricsObject(addObj);
                                    throw 0;
                                }
                                else {
                                    prevLyricsObject = curObj;
                                }
                            }
                        });
                    });
                });
            });
        }
        catch (e) { }
    }
}

export class ObjLyrics extends MusicObject {
    private nextLyricsObject?: ObjLyrics;

    private readonly color: string = "black";
    private readonly hyphen?: LyricsHyphen;
    private readonly text: ObjText;

    readonly mi: MLyrics;

    constructor(parent: MusicObject, readonly verse: VerseNumber, readonly line: ObjNotationLine, readonly vpos: VerticalPos, lyricsText: string, lyricsOptions?: LyricsOptions) {
        super(parent);

        let halign = lyricsOptions?.align === LyricsAlign.Left ? 0 : lyricsOptions?.align === LyricsAlign.Right ? 1 : 0.5;

        this.hyphen = Utils.Is.isEnumValue(lyricsOptions?.hyphen, LyricsHyphen) ? lyricsOptions?.hyphen : undefined;

        this.text = new ObjText(this, { text: lyricsText, color: this.color, scale: 0.8 }, halign, 0);

        this.rect = new DivRect();

        this.mi = new MLyrics(this);
    }

    getMusicInterface(): MLyrics {
        return this.mi;
    }

    getText(): string {
        return this.text.getText();
    }

    setNextLyricsObject(lyricsObj: ObjLyrics) {
        this.nextLyricsObject = lyricsObj;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        this.text.layout(renderer);
        this.rect = this.text.getRect().copy();
    }

    offset(dx: number, dy: number) {
        this.text.offset(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        this.text.draw(renderer);

        const ctx = renderer.getCanvasContext();

        if (ctx && this.hyphen !== undefined) {
            // Draw hyphen/extender line between this and next lyrics.
            let l = this.getRect();
            let r = this.nextLyricsObject?.getRect();

            let hyphenw = renderer.unitSize * 1.5;
            let maxw = r ? (r.left - l.right) * 0.85 : hyphenw;
            let w = this.hyphen === LyricsHyphen.Hyphen ? Math.min(hyphenw, maxw) : maxw;

            if (w > 0) {
                ctx.lineWidth = renderer.lineWidth;
                ctx.strokeStyle = ctx.fillStyle = this.color;

                let cx = r ? (r.left + l.right) / 2 : (l.right + w / 0.85)
                let cy = (l.top + l.bottom) / 2;

                ctx.moveTo(cx - w / 2, cy);
                ctx.lineTo(cx + w / 2, cy);
                ctx.stroke();
            }
        }
    }
}
