import { Assert } from "@tspro/ts-utils-lib";
import { Accidental } from "@tspro/web-music-score/theory";
import { DivRect, MAccidental } from "../pub";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";

export class ObjAccidental extends MusicObject {
    readonly mi: MAccidental;
    constructor(parent: MusicObject, readonly pitch: number, readonly accidental: Accidental, readonly color: string = "black") {
        super(parent);
        this.mi = new MAccidental(this);
    }

    getMusicInterface(): MAccidental {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let { unitSize } = renderer;

        switch (this.accidental) {
            case -2:
                this.rect = DivRect.createSections(unitSize * 1.25, unitSize * 1.25, unitSize * 4, unitSize * 1.2);
                break;
            case -1:
                this.rect = DivRect.createSections(unitSize * 0.75, unitSize * 0.75, unitSize * 4, unitSize * 1.2);
                break;
            case 0:
                this.rect = DivRect.createSections(unitSize * 0.75, unitSize * 0.75, unitSize * 2.2, unitSize * 2.2);
                break;
            case 1:
                this.rect = DivRect.createSections(unitSize * 0.75, unitSize * 0.75, unitSize * 2, unitSize * 2);
                break;
            case 2:
                this.rect = DivRect.createSections(unitSize * 1, unitSize * 1, unitSize * 1, unitSize * 1);
                break;
            default:
                Assert.interrupt("Invalid accidental value: " + this.accidental);
        }
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        let { unitSize, lineWidth } = renderer;
        let { accidental } = this;

        let x = this.rect.centerX;
        let y = this.rect.centerY;

        ctx.strokeStyle = ctx.fillStyle = this.color;

        function draw_b(x: number, y: number) {
            if (ctx) {
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.moveTo(x - unitSize * 0.75, y - unitSize * 4);
                ctx.lineTo(x - unitSize * 0.75, y + unitSize * 1.1);
                ctx.bezierCurveTo(
                    x + unitSize * 0.75, y - unitSize * 0,
                    x + unitSize * 0.75, y - unitSize * 2.2,
                    x - unitSize * 0.75, y - unitSize * 0.5);
                ctx.stroke();
            }
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
            ctx.beginPath();
            ctx.lineWidth = lineWidth;
            ctx.moveTo(x - unitSize * 0.5, y - unitSize * 2.2);
            ctx.lineTo(x - unitSize * 0.5, y + unitSize * 1);
            ctx.moveTo(x + unitSize * 0.5, y + unitSize * 2.2);
            ctx.lineTo(x + unitSize * 0.5, y - unitSize * 1);
            ctx.stroke();
            ctx.beginPath();
            ctx.lineWidth = lineWidth * 2;
            ctx.moveTo(x - unitSize * 0.5, y + unitSize * 1);
            ctx.lineTo(x + unitSize * 0.5, y + unitSize * 0.6);
            ctx.moveTo(x + unitSize * 0.5, y - unitSize * 1);
            ctx.lineTo(x - unitSize * 0.5, y - unitSize * 0.6);
            ctx.stroke();
        }
        else if (accidental === 1) {
            // #
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x - unitSize * 0.3, y - unitSize * 1.6);
            ctx.lineTo(x - unitSize * 0.3, y + unitSize * 2);
            ctx.moveTo(x + unitSize * 0.3, y - unitSize * 2);
            ctx.lineTo(x + unitSize * 0.3, y + unitSize * 1.6);
            ctx.stroke();
            ctx.lineWidth = lineWidth * 2;
            ctx.beginPath();
            ctx.moveTo(x - unitSize * 0.75, y - unitSize * 0.5);
            ctx.lineTo(x + unitSize * 0.75, y - unitSize * 0.9);
            ctx.moveTo(x - unitSize * 0.75, y + unitSize * 0.9);
            ctx.lineTo(x + unitSize * 0.75, y + unitSize * 0.5);
            ctx.stroke();
        }
        else if (accidental === 2) {
            // x
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x - unitSize * 0.75, y - unitSize * 0.75);
            ctx.lineTo(x + unitSize * 0.75, y + unitSize * 0.75);
            ctx.moveTo(x - unitSize * 0.75, y + unitSize * 0.75);
            ctx.lineTo(x + unitSize * 0.75, y - unitSize * 0.75);
            ctx.stroke();
            ctx.fillRect(x - unitSize * 1, y - unitSize * 1, unitSize * 0.7, unitSize * 0.7);
            ctx.fillRect(x + unitSize * 0.3, y - unitSize * 1, unitSize * 0.7, unitSize * 0.7);
            ctx.fillRect(x - unitSize * 1, y + unitSize * 0.3, unitSize * 0.7, unitSize * 0.7);
            ctx.fillRect(x + unitSize * 0.3, y + unitSize * 0.3, unitSize * 0.7, unitSize * 0.7);
        }
    }
}
