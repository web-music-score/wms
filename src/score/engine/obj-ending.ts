import { AnchoredRect, Guard, Rect } from "@tspro/ts-utils-lib";
import { MusicObject } from "./music-object";
import { View } from "./view";
import { ObjText } from "./obj-text";
import { ObjMeasure } from "./obj-measure";
import { MEnding, AnnotationKind } from "../pub";
import { ScoreError } from "./error-utils";

export class ObjEnding extends MusicObject {
    private endingText: ObjText;
    private shapeRects: AnchoredRect[] = [];

    readonly mi: MEnding;

    constructor(readonly measure: ObjMeasure, readonly color: string, readonly playNumbers: number[]) {
        super(measure);

        this.mi = new MEnding(this);

        if (
            !Guard.isIntegerGte(playNumbers.length, 1) ||
            !this.playNumbers.every(p => Guard.isIntegerGte(p, 1))
        ) {
            throw new ScoreError(`Invalid ending playNumbers: ${this.playNumbers}.`);
        }

        // Sort ascending
        this.playNumbers.sort((a, b) => a - b);

        const text = this.playNumbers.map(p => p + ".").join("");

        this.endingText = new ObjText(this, { text, color }, 0, 1);
    }

    getMusicInterface(): MEnding {
        return this.mi;
    }

    getShapeRects(): AnchoredRect[] {
        return this.shapeRects;
    }

    isSingleMeasureEnding(): boolean {
        let { measure } = this;
        let next = measure.getNextMeasure();

        return next?.hasAnnotationKind(AnnotationKind.Ending) === true ||
            measure.hasAnnotationKind(AnnotationKind.EndRepeat) ||
            measure.isLastMeasure();
    }

    hasPlayNumber(playNumber: number) {
        return this.playNumbers.some(p => p === playNumber);
    }

    getHighestPlayNumber() {
        return Math.max(0, ...this.playNumbers);
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        this.rect = new AnchoredRect();
        this.shapeRects = [this.rect.clone()];
    }

    layoutFitToMeasure(view: View) {
        let { unitSize } = view;
        let { measure } = this;

        this.endingText.layout(view);
        let textRect = this.endingText.getRect();

        let measureContent = measure.getColumnsContentRect();

        let endingHeight = textRect.height;

        this.rect = new AnchoredRect(measureContent.left + unitSize, measureContent.right - unitSize, -endingHeight, 0);

        this.endingText.setLeft(this.rect.left + unitSize / 2);
        this.endingText.setBottom(this.rect.bottom);

        this.shapeRects = [
            new AnchoredRect(this.rect.left, this.rect.left + 1, this.rect.top, this.rect.bottom),
            new AnchoredRect(this.rect.left, this.rect.right, this.rect.top, this.rect.top + 1),
            new AnchoredRect(this.rect.right - 1, this.rect.right, this.rect.top, this.rect.bottom),
            this.endingText.getRect().clone()
        ];
    }

    offset(dx: number, dy: number) {
        this.endingText.offset(dx, dy);
        this.shapeRects.forEach(r => r.offsetInPlace(dx, dy));
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        let { rect } = this;

        view.drawDebugRect(this.rect);

        view.color(this.color).lineWidth(1);

        view.beginPath();
        view.moveTo(rect.left, rect.bottom);
        view.lineTo(rect.left, rect.top);
        view.lineTo(rect.right, rect.top);

        if (this.isSingleMeasureEnding()) {
            view.lineTo(rect.right, rect.bottom);
        }

        view.stroke();

        this.endingText.draw(view, clipRect);
    }
}
