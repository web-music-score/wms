import { DivRect, LyricsAlign, LyricsOptions, MLyrics, VerseNumber } from "../pub";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { NoteLength, RhythmProps } from "theory/rhythm";
import { ObjText } from "./obj-text";
import { ObjRhythmColumn } from "./obj-rhythm-column";

export class LyricsContainer {
    readonly lyricsObjects: ObjLyrics[] = [];
    readonly rhythmProps: RhythmProps;

    constructor(readonly col: ObjRhythmColumn, lyricsLength: NoteLength) {
        this.rhythmProps = RhythmProps.get(lyricsLength);
    }

    addLyricsObject(lyricsObj: ObjLyrics) {
        this.lyricsObjects.push(lyricsObj);
    }
}

export class ObjLyrics extends MusicObject {
    private readonly color: string = "black";

    private readonly text: ObjText;

    readonly mi: MLyrics;

    constructor(parent: MusicObject, lyricsText: string, lyricsOptions?: LyricsOptions) {
        super(parent);

        let halign = lyricsOptions?.align === LyricsAlign.Left ? 0 : lyricsOptions?.align === LyricsAlign.Right ? 1 : 0.5;

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
    }
}
