import { DivRect, MText } from "../pub";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";

const DefaultBoxedPadding = 0.5;

type BoxType = "square" | "rectangle" | "circle" | "ellipse";

export type TextProps = string | {
    text: string,
    scale?: number,
    color?: string,
    bold?: boolean,
    italic?: boolean,
    boxed?: BoxType,
    padding?: number,
    bgcolor?: string
}

export class ObjText extends MusicObject {
    private readonly text: string;
    private readonly scale: number;
    private readonly color: string;
    private readonly bold: boolean;
    private readonly italic: boolean;
    private readonly boxed: BoxType | false;
    private readonly padding: number;
    private readonly bgcolor?: string;

    private font = "";
    private textLines: string[];
    private lineWidths: number[] = [];
    private lineHeight = 0;

    readonly mi: MText;

    constructor(parent: MusicObject, text: TextProps, private anchorX: number, private anchorY: number) {
        super(parent);

        let textProps = typeof text === "string" ? { text } : text;

        this.text = textProps.text;
        this.scale = textProps.scale ?? 1;
        this.color = textProps.color ?? "black";
        this.bold = textProps.bold ?? false;
        this.italic = textProps.italic ?? false;
        this.boxed = textProps.boxed ?? false;
        this.padding = textProps.padding ?? (this.boxed ? DefaultBoxedPadding : 0);
        this.bgcolor = textProps.bgcolor;

        if (!isFinite(this.padding) || this.padding < 0) {
            this.padding = 0;
        }

        this.textLines = this.text.split("\n");

        if (this.textLines.length === 0) {
            this.textLines = [""];
        }

        this.rect = new DivRect();

        this.mi = new MText(this);
    }

    getMusicInterface(): MText {
        return this.mi;
    }

    getText() {
        return this.text;
    }

    updateAnchorX(anchorX: number) {
        this.anchorX = anchorX;
        let { width } = this.rect;
        // this.rect.centerX does not move
        this.rect.left = this.rect.centerX - width * anchorX;
        this.rect.right = this.rect.centerX + width * (1 - anchorX);
    }

    updateAnchorY(anchorY: number) {
        this.anchorY = anchorY;
        let { height } = this.rect;
        // this.rect.centerY does not move
        this.rect.top = this.rect.centerY - height * anchorY;
        this.rect.bottom = this.rect.centerY + height * (1 - anchorY);
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let { scale, anchorX, anchorY, bold, italic } = this;

        let fontSize = renderer.fontSize * scale;

        this.font = (italic ? "italic " : "") + (bold ? "bold " : "") + fontSize + "px Times New Roman";

        this.lineWidths = this.textLines.map(text => renderer.getTextWidth(text, this.font));
        this.lineHeight = fontSize;

        let p = this.padding * renderer.unitSize;

        let w = p + Math.max(...this.lineWidths) + p;
        let h = p + this.lineHeight * this.textLines.length + p;

        if (this.boxed === "square" || this.boxed === "circle") {
            h = w = Math.max(h, w);
        }

        this.rect = DivRect.createSections(w * anchorX, w * (1 - anchorX), h * anchorY, h * (1 - anchorY));
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

        ctx.lineWidth = renderer.lineWidth;
        ctx.strokeStyle = ctx.fillStyle = this.color;
        ctx.font = this.font;

        let { rect, padding, lineHeight, lineWidths, anchorX, anchorY, italic } = this;

        if (this.bgcolor !== undefined) {
            ctx.save();
            ctx.fillStyle = this.bgcolor;
            ctx.beginPath();
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            ctx.fill();
            ctx.restore();
        }

        let lineCount = this.textLines.length;
        let textHeight = lineCount * lineHeight;
        let fixY = -lineHeight * (italic ? 0.25 : 0.175);
        let p = padding * renderer.unitSize;

        let centerX = (rect.left + p) * (1 - anchorX) + (rect.right - p) * anchorX;
        let centerY = (rect.top + p) * (1 - anchorY) + (rect.bottom - p) * anchorY;

        this.textLines.forEach((textLine, i) => {
            let x = centerX - lineWidths[i] * anchorX;
            let y = centerY - textHeight * anchorY + lineHeight * (i + 1) + fixY;
            ctx.fillText(textLine, x, y);
        });

        switch (this.boxed) {
            case "square":
            case "rectangle":
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                break;
            case "circle":
            case "ellipse":
                let x = (rect.left + rect.right) / 2;
                let y = (rect.top + rect.bottom) / 2;
                let rx = (rect.right - rect.left) / 2;
                let ry = (rect.bottom - rect.top) / 2;
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;
        }
    }
}
