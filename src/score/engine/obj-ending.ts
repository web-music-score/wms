import { Guard } from "@tspro/ts-utils-lib";
import { MusicObject } from "./music-object";
import { RenderContext } from "./render-context";
import { ObjText } from "./obj-text";
import { ObjMeasure } from "./obj-measure";
import { DivRect, MEnding, Navigation } from "../pub";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class ObjEnding extends MusicObject {
    private endingText: ObjText;
    private shapeRects: DivRect[] = [];

    readonly mi: MEnding;

    constructor(readonly measure: ObjMeasure, readonly passages: number[]) {
        super(measure);

        this.mi = new MEnding(this);

        if (!Guard.isIntegerGte(passages.length, 1)) {
            throw new MusicError(MusicErrorType.Score, "Passages is empty.");
        }
        else if (!this.passages.every(p => Guard.isIntegerGte(p, 1))) {
            throw new MusicError(MusicErrorType.Score, "Invalid passages: " + this.passages);
        }

        // Sort ascending
        this.passages.sort((a, b) => a - b);

        let text = this.passages.map(p => p + ".").join("");

        this.endingText = new ObjText(this, text, 0, 1);
    }

    getMusicInterface(): MEnding {
        return this.mi;
    }

    getShapeRects(): DivRect[] {
        return this.shapeRects;
    }

    isSingleMeasureEnding(): boolean {
        let { measure } = this;
        let next = measure.getNextMeasure();

        return next?.hasNavigation(Navigation.Ending) === true ||
            measure.hasNavigation(Navigation.EndRepeat) ||
            measure.isLastMeasure();
    }

    hasPassage(pass: number) {
        return this.passages.some(p => p === pass);
    }

    getHighestPassage() {
        return Math.max(0, ...this.passages);
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        this.rect = new DivRect();
        this.shapeRects = [this.rect.copy()];
    }

    layoutFitToMeasure(ctx: RenderContext) {
        let { unitSize } = ctx;
        let { measure } = this;

        this.endingText.layout(ctx);
        let textRect = this.endingText.getRect();

        let measureContent = measure.getColumnsContentRect();

        let endingHeight = textRect.height;

        this.rect = new DivRect(measureContent.left + unitSize, measureContent.right - unitSize, -endingHeight, 0);

        this.endingText.offset(this.rect.left + unitSize / 2, this.rect.bottom);

        this.shapeRects = [
            new DivRect(this.rect.left, this.rect.left + 1, this.rect.top, this.rect.bottom),
            new DivRect(this.rect.left, this.rect.right, this.rect.top, this.rect.top + 1),
            new DivRect(this.rect.right - 1, this.rect.right, this.rect.top, this.rect.bottom),
            this.endingText.getRect().copy()
        ];
    }

    offset(dx: number, dy: number) {
        this.endingText.offset(dx, dy);
        this.shapeRects.forEach(r => r.offsetInPlace(dx, dy));
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        let { rect } = this;

        ctx.drawDebugRect(this.rect);

        ctx.color("black").lineWidth(1);

        ctx.beginPath();
        ctx.moveTo(rect.left, rect.bottom);
        ctx.lineTo(rect.left, rect.top);
        ctx.lineTo(rect.right, rect.top);

        if (this.isSingleMeasureEnding()) {
            ctx.lineTo(rect.right, rect.bottom);
        }

        ctx.stroke();

        this.endingText.draw(ctx);
    }
}
