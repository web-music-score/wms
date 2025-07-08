import { Utils, Vec2, Device, Assert } from "@tspro/ts-utils-lib";
import { ObjDocument } from "./obj-document";
import { MusicInterface, MDocument, DivRect, ClickObjectListener, ClickObjectSelector, ClickPitchListener, PickedPitch } from "../pub";
import { ObjScoreRow } from "./obj-score-row";
import TrebleClefPng from "./assets/treble-clef.png";
import BassClefPng from "./assets/bass-clef.png";
import { DebugSettings, DocumentSettings } from "./settings";

export enum ImageAsset { TrebleClefPng, BassClefPng }

const HilightPitchRectColor = "#55cc55";
const HilightObjectRectColor = "#55cc55";
const PlayPosIndicatorColor = "#44aa44";

type ImageAssetData = {
    url: string,
    finished?: true,
    img?: HTMLImageElement
}

const ImageAssets = new Map<ImageAsset, ImageAssetData>([
    [ImageAsset.TrebleClefPng, { url: TrebleClefPng }],
    [ImageAsset.BassClefPng, { url: BassClefPng }]
]);

export class Renderer {
    static readonly DotSize = 0.8;

    readonly devicePixelRatio: number;

    readonly fontSize: number;
    readonly unitSize: number;

    readonly lineWidth: number;
    readonly beamThickness: number;

    private clickPitchListener?: ClickPitchListener;

    private clickObjectSelector?: ClickObjectSelector;
    private clickObjectListener?: ClickObjectListener;

    private canvas?: HTMLCanvasElement;
    private ctx?: CanvasRenderingContext2D;

    private mdoc?: MDocument;

    private cursorRect?: DivRect;
    private mousePos?: Vec2; // Mouse coord in document space
    private hilightPitch?: PickedPitch;
    private hilightObj?: MusicInterface;
    private usingTouch = false;

    private onClickFn: (e: MouseEvent) => void;
    private onMouseMoveFn: (e: MouseEvent) => void;
    private onMouseLeaveFn: (e: MouseEvent) => void;
    private onTouchEndFn: (e: TouchEvent) => void;

    constructor() {
        this.devicePixelRatio = window.devicePixelRatio;
        this.fontSize = Device.FontSize * DocumentSettings.DocumentScale * this.devicePixelRatio;
        this.unitSize = this.fontSize * 0.3;
        this.lineWidth = this.unitSize * 0.2;
        this.beamThickness = this.unitSize * 0.8;

        // Load image assets
        ImageAssets.forEach(asset => {
            if (asset.finished !== true) {
                const img = new Image();
                img.src = asset.url;
                img.onload = () => {
                    asset.img = img;
                    this.finishImageAsset(asset);
                }
                img.onerror = () => {
                    this.finishImageAsset(asset);
                    Assert.interrupt("Failed to load image: " + asset.url);
                }
            }
        });

        this.onClickFn = this.onClick.bind(this);
        this.onMouseMoveFn = this.onMouseMove.bind(this);
        this.onMouseLeaveFn = this.onMouseLeave.bind(this);
        this.onTouchEndFn = this.onTouchEnd.bind(this);
    }

    get doc(): ObjDocument | undefined {
        return this.mdoc?.obj;
    }

    private finishImageAsset(asset: ImageAssetData) {
        asset.finished = true;

        let allFinished = Array.from(ImageAssets).every(asset => asset[1].finished === true);

        if (allFinished) {
            this.onLoad();
        }
    }

    getImageAsset(imageAsset: ImageAsset): HTMLImageElement | undefined {
        return ImageAssets.get(imageAsset)?.img;
    }

    setDocument(mdoc?: MDocument) {
        if (this.mdoc === mdoc) {
            return;
        }

        let prevMDoc = this.mdoc;

        this.mdoc = mdoc;

        if (prevMDoc) {
            prevMDoc.obj.setRenderer(undefined);
        }

        if (mdoc) {
            mdoc.obj.setRenderer(this);
        }
    }

    setCanvas(canvas: HTMLCanvasElement) {
        if (this.canvas !== canvas) {
            if (this.canvas) {
                this.canvas.removeEventListener("click", this.onClickFn);
                this.canvas.removeEventListener("mousemove", this.onMouseMoveFn);
                this.canvas.removeEventListener("mouseleave", this.onMouseLeaveFn);
                this.canvas.removeEventListener("touchend", this.onTouchEndFn);
            }

            this.canvas = canvas;

            this.canvas.addEventListener("click", this.onClickFn);
            this.canvas.addEventListener("mousemove", this.onMouseMoveFn);
            this.canvas.addEventListener("mouseleave", this.onMouseLeaveFn);
            this.canvas.addEventListener("touchend", this.onTouchEndFn);

            this.canvas.style.position = "relative";
        }

        this.ctx = this.canvas?.getContext("2d") ?? undefined;
    }

    setClickPitchListener(fn: ClickPitchListener) {
        this.clickPitchListener = fn;
        if (this.doc) {
            // Request layout to full pitch range
            this.doc.requestFullLayout();
        }
    }

    setClickObjectSelector(fn?: ClickObjectSelector) {
        this.clickObjectSelector = fn;
    }

    setClickObjectListener(fn?: ClickObjectListener) {
        this.clickObjectListener = fn;
    }

    needFullPitchRange() {
        return this.clickPitchListener !== undefined;
    }

    needMouseInput() {
        return this.clickPitchListener || this.clickObjectListener;
    }

    getMousePos(e: MouseEvent) {
        return new Vec2(e.offsetX, e.offsetY);
    }

    onClick(e: MouseEvent) {
        let { doc } = this;

        if (!this.needMouseInput() || !doc) {
            return;
        }

        this.mousePos = this.txFromScreenCoord(this.getMousePos(e));

        if (this.clickPitchListener) {
            let pickedPitch = doc.pickPitch(this.mousePos.x, this.mousePos.y);
            if (pickedPitch !== undefined) {
                this.clickPitchListener(pickedPitch);
                this.draw();
            }
        }

        if (this.clickObjectListener) {
            let arr = doc.pick(this.mousePos.x, this.mousePos.y).map(obj => obj.getMusicInterface());
            if (arr.length > 0) {
                let selObj = this.clickObjectSelector ? this.clickObjectSelector(arr) : arr[arr.length - 1];
                if (selObj) {
                    this.clickObjectListener(selObj);
                }
                this.draw();
            }
        }
    }

    onMouseMove(e: MouseEvent) {
        let { doc } = this;

        if (!this.needMouseInput() || !doc) {
            return;
        }

        this.mousePos = this.txFromScreenCoord(this.getMousePos(e));

        if (!this.usingTouch) {
            if (this.clickPitchListener) {
                let oldHilightPitch = this.hilightPitch;
                this.hilightPitch = doc.pickPitch(this.mousePos.x, this.mousePos.y);

                if (this.hilightPitch?.measure !== oldHilightPitch?.measure || this.hilightPitch?.pitch !== oldHilightPitch?.pitch) {
                    this.draw();
                }
            }

            if (this.clickObjectListener) {
                let oldHilightObj = this.hilightObj;
                let arr = doc.pick(this.mousePos.x, this.mousePos.y).map(obj => obj.getMusicInterface());
                if (arr.length > 0) {
                    let selObj = this.clickObjectSelector ? this.clickObjectSelector(arr) : arr[arr.length - 1];
                    this.hilightObj = selObj;
                }
                else {
                    this.hilightObj = undefined;
                }

                if (this.hilightObj !== oldHilightObj) {
                    this.draw();
                }
            }
        }
    }

    onMouseLeave(e: MouseEvent) {
        if (!this.needMouseInput()) {
            return;
        }

        this.mousePos = undefined;
        this.hilightPitch = undefined;
        this.hilightObj = undefined;

        this.draw();
    }

    onTouchEnd(e: TouchEvent) {
        this.usingTouch = true;
    }

    onLoad() {
        if (this.doc) {
            this.doc.requestFullLayout();
            this.draw();
        }
    }

    updateCursorRect(cursorRect: DivRect | undefined) {
        this.cursorRect = cursorRect;
        this.draw();
    }

    updateCanvasSize() {
        let { canvas, doc } = this;

        if (canvas && doc) {
            let rect = doc.getRect();

            let w = rect.width + 1;
            let h = rect.height + 1;

            // Canvas internal size
            canvas.width = w;
            canvas.height = h;

            // Canvas element size
            canvas.style.width = (w / this.devicePixelRatio) + "px";
            canvas.style.height = (h / this.devicePixelRatio) + "px";
        }
    }

    draw() {
        let { ctx, doc } = this;

        doc = Assert.require(doc, "Renderer draw failed because document is undefined.");
        ctx = Assert.require(ctx, "Renderer draw failed because canvas context is undefined.");

        doc.layout();

        this.updateCanvasSize();
        this.clearCanvas();

        this.drawHilightPitchRect();
        this.drawHilightObjectRect();
        this.drawPlayCursor();

        doc.drawContent();
    }

    drawHilightPitchRect() {
        let ctx = this.getCanvasContext();
        let { mousePos, hilightPitch, unitSize } = this;

        if (!ctx || hilightPitch === undefined) {
            return;
        }

        let { measure, pitch } = hilightPitch;
        let { row } = measure.getMusicObject();
        let staff = row.getStaff(pitch);

        if (!staff) {
            return;
        }

        ctx.fillStyle = HilightPitchRectColor;
        ctx.fillRect(0, staff.getPitchY(pitch) - unitSize, ctx.canvas.width, 2 * unitSize);

        if (mousePos !== undefined) {
            this.drawLedgerLines(row, pitch, mousePos.x);
        }
    }

    drawHilightObjectRect() {
        let ctx = this.getCanvasContext();
        let { hilightObj } = this;

        if (!ctx || !hilightObj) {
            return;
        }

        let rect = hilightObj.getMusicObject().getRect();

        ctx.strokeStyle = HilightObjectRectColor;
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }

    drawPlayCursor() {
        let { cursorRect: r, lineWidth } = this;

        if (r) {
            this.drawLine(r.centerX, r.top, r.centerX, r.bottom, PlayPosIndicatorColor, lineWidth * 2);
        }
    }

    txFromScreenCoord(screenCoord: Vec2) {
        return screenCoord.mul(this.devicePixelRatio);
    }

    txToScreenCoord(coord: Vec2) {
        return coord.div(this.devicePixelRatio);
    }

    getCanvasContext(): CanvasRenderingContext2D | undefined {
        return this.ctx;
    }

    clearCanvas() {
        let ctx = this.getCanvasContext();

        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    getTextWidth(text: string, font: string) {
        let ctx = this.getCanvasContext();
        if (ctx) {
            let savedFont = ctx.font;
            ctx.font = font;
            let metrics = ctx.measureText(text);
            ctx.font = savedFont;
            return metrics.width;
        }
        else {
            return Utils.Dom.getCanvasTextWidth(text, font);
        }
    }

    drawDebugRect(r: DivRect) {
        if (!DebugSettings.DrawDebugRects) {
            return;
        }

        let ctx = this.getCanvasContext();

        if (ctx) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.rect(r.left, r.top, r.right - r.left, r.bottom - r.top);
            ctx.stroke();
        }
    }

    fillCircle(x: number, y: number, radius: number, color?: string) {
        let ctx = this.getCanvasContext();

        if (ctx) {
            if (color !== undefined) {
                ctx.fillStyle = color;
            }

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    drawLine(startX: number, startY: number, endX: number, endY: number, color?: string, lineWidth?: number) {
        let ctx = this.getCanvasContext();

        if (ctx) {
            ctx.strokeStyle = color ?? "black";
            ctx.lineWidth = lineWidth ?? this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    drawPartialLine(startX: number, startY: number, endX: number, endY: number, startT: number, endT: number, color?: string, lineWidth?: number) {
        let ctx = this.getCanvasContext();

        if (ctx) {
            let x1 = startX + (endX - startX) * startT;
            let y1 = startY + (endY - startY) * startT;

            let x2 = startX + (endX - startX) * endT;
            let y2 = startY + (endY - startY) * endT;

            ctx.strokeStyle = color ?? "black";
            ctx.lineWidth = lineWidth ?? this.lineWidth;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    drawLedgerLines(row: ObjScoreRow, pitch: number, x: number) {
        let staff = row.getStaff(pitch);

        if (!staff) {
            return;
        }

        let { unitSize } = this;

        let ledgerLineWidth = unitSize * DocumentSettings.LedgerLineWidth;

        if (pitch >= staff.topLinePitch + 2) {
            for (let linePitch = staff.topLinePitch + 2; linePitch <= pitch; linePitch += 2) {
                if (staff.containsPitch(linePitch)) {
                    let y = staff.getPitchY(linePitch);
                    this.drawLine(x - ledgerLineWidth / 2, y, x + ledgerLineWidth / 2, y);
                }
            }
        }
        else if (pitch <= staff.bottomLinePitch - 2) {
            for (let linePitch = staff.bottomLinePitch - 2; linePitch >= pitch; linePitch -= 2) {
                if (staff.containsPitch(linePitch)) {
                    let y = staff.getPitchY(linePitch);
                    this.drawLine(x - ledgerLineWidth / 2, y, x + ledgerLineWidth / 2, y);
                }
            }
        }
    }
}
