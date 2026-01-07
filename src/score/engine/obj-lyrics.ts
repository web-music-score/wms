import { LyricsAlign, LyricsHyphen, LyricsOptions, MLyrics, VerseNumber } from "../pub";
import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { NoteLength, RhythmProps } from "web-music-score/theory";
import { ObjText } from "./obj-text";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjNotationLine } from "./obj-staff-and-tab";
import { VerticalPos } from "./layout-object";
import { Guard } from "@tspro/ts-utils-lib";
import { ObjMeasure } from "./obj-measure";

export class ObjLyrics extends MusicObject {
    private nextLyricsObject?: ObjLyrics;

    readonly rhythmProps: RhythmProps;

    private readonly color: string = "black";
    private readonly hyphen?: LyricsHyphen;
    private readonly text: ObjText;

    readonly mi: MLyrics;

    constructor(readonly col: ObjRhythmColumn, readonly verse: VerseNumber, readonly line: ObjNotationLine, readonly vpos: VerticalPos, lyricsLength: NoteLength, lyricsText: string, lyricsOptions?: LyricsOptions) {
        super(col);

        this.rhythmProps = RhythmProps.get(lyricsLength);

        let halign = lyricsOptions?.align === LyricsAlign.Left ? 0 : lyricsOptions?.align === LyricsAlign.Right ? 1 : 0.5;

        this.hyphen = Guard.isEnumValue(lyricsOptions?.hyphen, LyricsHyphen) ? lyricsOptions?.hyphen : undefined;

        this.text = new ObjText(this, { text: lyricsText, color: this.color, scale: 0.8 }, halign, 0);
        this.rect = this.text.getRect().clone();

        this.mi = new MLyrics(this);
    }

    getMusicInterface(): MLyrics {
        return this.mi;
    }

    get measure(): ObjMeasure {
        return this.col.measure;
    }

    getText(): string {
        return this.text.getText();
    }

    setNextLyricsObject(lyricsObj: ObjLyrics) {
        this.nextLyricsObject = lyricsObj;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        this.text.layout(ctx);
        this.rect = this.text.getRect().clone();
    }

    offset(dx: number, dy: number) {
        this.text.offset(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        this.text.draw(ctx);

        if (this.hyphen !== undefined) {
            ctx.color(this.color).lineWidth(1);

            // Draw hyphen/extender line between this and next lyrics.
            let l = this.getRect();
            let r = this.nextLyricsObject?.getRect();

            let hyphenw = ctx.unitSize * 1.5;
            let maxw = r ? (r.left - l.right) * 0.85 : hyphenw;
            let w = this.hyphen === LyricsHyphen.Hyphen ? Math.min(hyphenw, maxw) : maxw;

            if (w > 0) {
                let cx = r ? (l.right + r.left) / 2 : (l.right + w / 0.85)
                let cy = l.centerY;

                ctx.moveTo(cx - w / 2, cy);
                ctx.lineTo(cx + w / 2, cy);
                ctx.stroke();
            }
        }
    }
}
