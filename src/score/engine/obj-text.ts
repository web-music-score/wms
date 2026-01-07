import { MText } from "../pub";
import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { AnchoredRect } from "@tspro/ts-utils-lib";

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

        this.rect = new AnchoredRect();

        this.mi = new MText(this);
    }

    getMusicInterface(): MText {
        return this.mi;
    }

    getText() {
        return this.text;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(ctx: RenderContext) {
        let { scale, anchorX, anchorY, bold, italic } = this;

        let fontSize = ctx.fontSizePx * scale;

        this.font = (italic ? "italic " : "") + (bold ? "bold " : "") + fontSize + "px Times New Roman";

        this.lineWidths = this.textLines.map(text => ctx.getTextWidth(text, this.font));
        this.lineHeight = fontSize;

        let p = this.padding * ctx.unitSize;

        let w = p + Math.max(...this.lineWidths) + p;
        let h = p + this.lineHeight * this.textLines.length + p;

        if (this.boxed === "square" || this.boxed === "circle") {
            h = w = Math.max(h, w);
        }

        this.rect = AnchoredRect.createSections(w * anchorX, w * (1 - anchorX), h * anchorY, h * (1 - anchorY));
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        ctx.drawDebugRect(this.rect);

        ctx.lineWidth(1).font(this.font);

        let { rect, padding, lineHeight, lineWidths, anchorX, anchorY, italic } = this;

        if (this.bgcolor !== undefined) {
            ctx.save();
            ctx.fillColor(this.bgcolor ?? "black");
            ctx.beginPath();
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            ctx.fill();
            ctx.restore();
        }

        let lineCount = this.textLines.length;
        let textHeight = lineCount * lineHeight;
        let fixY = -lineHeight * (italic ? 0.25 : 0.2);
        let p = padding * ctx.unitSize;

        let aX = (rect.left + p) * (1 - anchorX) + (rect.right - p) * anchorX;
        let aY = (rect.top + p) * (1 - anchorY) + (rect.bottom - p) * anchorY;

        ctx.color(this.color);

        this.textLines.forEach((textLine, i) => {
            let x = aX - lineWidths[i] * anchorX;
            let y = aY - textHeight * anchorY + lineHeight * (i + 1) + fixY;
            ctx.fillText(textLine, x, y);
        });

        switch (this.boxed) {
            case "square":
            case "rectangle":
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                break;
            case "circle":
            case "ellipse":
                ctx.beginPath();
                ctx.ellipse(rect.centerX, rect.centerY, rect.width / 2, rect.height / 2, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;
        }
    }
}
