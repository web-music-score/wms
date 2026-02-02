import { Accidental } from "web-music-score/theory";
import { MAccidental } from "../pub";
import { View } from "./view";
import { MusicObject } from "./music-object";
import { MusicError, MusicErrorType } from "web-music-score/core";
import { AnchoredRect, Rect } from "@tspro/ts-utils-lib";

export class ObjAccidental extends MusicObject {
    readonly mi: MAccidental;
    constructor(parent: MusicObject, readonly diatonicId: number, readonly accidental: Accidental, readonly color: string = "black") {
        super(parent);
        this.mi = new MAccidental(this);
    }

    getMusicInterface(): MAccidental {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        let { unitSize } = view;

        switch (this.accidental) {
            case -2:
                this.rect = AnchoredRect.createSections(unitSize * 1.25, unitSize * 1.25, unitSize * 4, unitSize * 1.2);
                break;
            case -1:
                this.rect = AnchoredRect.createSections(unitSize * 0.75, unitSize * 0.75, unitSize * 4, unitSize * 1.2);
                break;
            case 0:
                this.rect = AnchoredRect.createSections(unitSize * 0.75, unitSize * 0.75, unitSize * 2.2, unitSize * 2.2);
                break;
            case 1:
                this.rect = AnchoredRect.createSections(unitSize * 0.75, unitSize * 0.75, unitSize * 2, unitSize * 2);
                break;
            case 2:
                this.rect = AnchoredRect.createSections(unitSize * 1, unitSize * 1, unitSize * 1, unitSize * 1);
                break;
            default:
                throw new MusicError(MusicErrorType.Score, "Invalid accidental value: " + this.accidental);
        }
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.drawDebugRect(this.rect);

        let { unitSize } = view;
        let { accidental } = this;

        let x = this.rect.anchorX;
        let y = this.rect.anchorY;

        view.color(this.color);

        const draw_b = (x: number, y: number) => {
            view.lineWidth(1)
                .beginPath()
                .moveTo(x - unitSize * 0.75, y - unitSize * 4)
                .lineTo(x - unitSize * 0.75, y + unitSize * 1.1)
                .bezierCurveTo(
                    x + unitSize * 0.75, y - unitSize * 0,
                    x + unitSize * 0.75, y - unitSize * 2.2,
                    x - unitSize * 0.75, y - unitSize * 0.5)
                .stroke();
        }

        if (accidental === -2) {
            // bb
            draw_b(x - unitSize * 0.5, y);
            draw_b(x + unitSize * 0.5, y);
        }
        else if (accidental === -1) {
            // b
            draw_b(x, y);
        }
        if (accidental === 0) {
            // neutral
            view.beginPath()
                .lineWidth(1)
                .moveTo(x - unitSize * 0.5, y - unitSize * 2.2)
                .lineTo(x - unitSize * 0.5, y + unitSize * 1)
                .moveTo(x + unitSize * 0.5, y + unitSize * 2.2)
                .lineTo(x + unitSize * 0.5, y - unitSize * 1)
                .stroke()
                .beginPath()
                .lineWidth(2)
                .moveTo(x - unitSize * 0.5, y + unitSize * 1)
                .lineTo(x + unitSize * 0.5, y + unitSize * 0.6)
                .moveTo(x + unitSize * 0.5, y - unitSize * 1)
                .lineTo(x - unitSize * 0.5, y - unitSize * 0.6)
                .stroke();
        }
        else if (accidental === 1) {
            // #
            view.lineWidth(1)
                .beginPath()
                .moveTo(x - unitSize * 0.3, y - unitSize * 1.6)
                .lineTo(x - unitSize * 0.3, y + unitSize * 2)
                .moveTo(x + unitSize * 0.3, y - unitSize * 2)
                .lineTo(x + unitSize * 0.3, y + unitSize * 1.6)
                .stroke()
                .lineWidth(2)
                .beginPath()
                .moveTo(x - unitSize * 0.75, y - unitSize * 0.5)
                .lineTo(x + unitSize * 0.75, y - unitSize * 0.9)
                .moveTo(x - unitSize * 0.75, y + unitSize * 0.9)
                .lineTo(x + unitSize * 0.75, y + unitSize * 0.5)
                .stroke();
        }
        else if (accidental === 2) {
            // x
            view.lineWidth(1)
                .beginPath()
                .moveTo(x - unitSize * 0.75, y - unitSize * 0.75)
                .lineTo(x + unitSize * 0.75, y + unitSize * 0.75)
                .moveTo(x - unitSize * 0.75, y + unitSize * 0.75)
                .lineTo(x + unitSize * 0.75, y - unitSize * 0.75)
                .stroke()
                .fillRect(x - unitSize * 1, y - unitSize * 1, unitSize * 0.7, unitSize * 0.7)
                .fillRect(x + unitSize * 0.3, y - unitSize * 1, unitSize * 0.7, unitSize * 0.7)
                .fillRect(x - unitSize * 1, y + unitSize * 0.3, unitSize * 0.7, unitSize * 0.7)
                .fillRect(x + unitSize * 0.3, y + unitSize * 0.3, unitSize * 0.7, unitSize * 0.7);
        }
    }
}
