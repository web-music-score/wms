import { Utils, Vec2, Device } from "@tspro/ts-utils-lib";
import { ObjDocument } from "./obj-document";
import { MDocument, DivRect, ScoreEventListener, ScoreStaffPosEvent, ScoreObjectEvent, MRenderer } from "../pub";
import { ObjScoreRow } from "./obj-score-row";
import { DebugSettings, DocumentSettings } from "./settings";
import { MusicObject } from "./music-object";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import TrebleClefPng from "./assets/treble-clef.png";
import BassClefPng from "./assets/bass-clef.png";
import { ObjStaff } from "./obj-staff-and-tab";
import { NoteLength, NoteLengthProps, validateNoteLength } from "theory/rhythm";

export enum ImageAsset { TrebleClefPng, BassClefPng }

const HilightStaffPosRectColor = "#55cc55";
const HilightObjectRectColor = "#55cc55";
const PlayPosIndicatorColor = "#44aa44";

type ImageAssetData = {
    src: string,
    finished?: true,
    img?: HTMLImageElement
}

const ImageAssets = new Map<ImageAsset, ImageAssetData>([
    [ImageAsset.TrebleClefPng, { src: TrebleClefPng }],
    [ImageAsset.BassClefPng, { src: BassClefPng }]
]);

type StaffPos = { scoreRow: ObjScoreRow, diatonicId: number }

function staffPosEquals(a: StaffPos | undefined, b: StaffPos | undefined): boolean {
    if (!a && !b) return true;
    else if (!a || !b) return false;
    else return a.scoreRow === b.scoreRow && a.diatonicId === b.diatonicId;
}

function objectsEquals(a: MusicObject[] | undefined, b: MusicObject[] | undefined): boolean {
    if (!a && !b) return true;
    else if (!a || !b) return false;
    else return a.length === b.length && a.every((a2, i) => a2 === b[i]);
}

export class Renderer {
    readonly devicePixelRatio: number;

    readonly fontSize: number;
    readonly unitSize: number;

    readonly lineWidth: number;
    readonly beamThickness: number;

    private scoreEventListener?: ScoreEventListener;

    private canvas?: HTMLCanvasElement;
    private ctx?: CanvasRenderingContext2D;

    private mdoc?: MDocument;

    private cursorRect?: DivRect;
    private mousePos?: Vec2; // Mouse coord in document space

    private curStaffPos?: StaffPos;
    private curObjects?: MusicObject[];

    private hilightedStaffPos?: StaffPos;
    private hilightedObj?: MusicObject;

    private usingTouch = false;

    private onClickFn: (e: MouseEvent) => void;
    private onMouseMoveFn: (e: MouseEvent) => void;
    private onMouseLeaveFn: (e: MouseEvent) => void;
    private onTouchEndFn: (e: TouchEvent) => void;

    constructor(private readonly mi: MRenderer) {
        this.devicePixelRatio = window.devicePixelRatio;
        this.fontSize = Device.FontSize * DocumentSettings.DocumentScale * this.devicePixelRatio;
        this.unitSize = this.fontSize * 0.3;
        this.lineWidth = this.unitSize * 0.2;
        this.beamThickness = this.unitSize * 0.8;

        // Load image assets
        ImageAssets.forEach(asset => {
            if (asset.finished !== true) {
                const img = new Image();
                img.src = asset.src;
                img.onload = () => {
                    asset.img = img;
                    this.finishImageAsset(asset);
                }
                img.onerror = () => {
                    this.finishImageAsset(asset);
                    throw new MusicError(MusicErrorType.Score, "Failed to load image: " + asset.src);
                }
            }
        });

        this.onClickFn = this.onClick.bind(this);
        this.onMouseMoveFn = this.onMouseMove.bind(this);
        this.onMouseLeaveFn = this.onMouseLeave.bind(this);
        this.onTouchEndFn = this.onTouchEnd.bind(this);
    }

    getMusicInterface(): MRenderer {
        return this.mi;
    }

    get doc(): ObjDocument | undefined {
        return this.mdoc?.getMusicObject();
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

        this.updateCursorRect(undefined);

        let prevMDoc = this.mdoc;

        this.mdoc = mdoc;

        if (prevMDoc) {
            prevMDoc.getMusicObject().setRenderer(undefined);
        }

        if (mdoc) {
            mdoc.getMusicObject().setRenderer(this);
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

    setScoreEventListener(fn: ScoreEventListener) {
        this.scoreEventListener = fn;
    }

    needMouseInput(): boolean {
        return this.scoreEventListener !== undefined;
    }

    getMousePos(e: MouseEvent): Vec2 {
        return new Vec2(e.offsetX, e.offsetY);
    }

    private updateCurStaffPos(staffPos: StaffPos | undefined, click: boolean): boolean {
        let changed = !staffPosEquals(staffPos, this.curStaffPos);

        if (changed && this.curStaffPos && this.scoreEventListener) {
            let { scoreRow, diatonicId } = this.curStaffPos;
            this.scoreEventListener(new ScoreStaffPosEvent("leave", this.getMusicInterface(), scoreRow.getMusicInterface(), diatonicId));
        }

        if (changed && staffPos && this.scoreEventListener) {
            let { scoreRow, diatonicId } = staffPos;
            this.scoreEventListener(new ScoreStaffPosEvent("enter", this.getMusicInterface(), scoreRow.getMusicInterface(), diatonicId));
        }

        if (click && staffPos && this.scoreEventListener) {
            let { scoreRow, diatonicId } = staffPos;
            this.scoreEventListener(new ScoreStaffPosEvent("click", this.getMusicInterface(), scoreRow.getMusicInterface(), diatonicId));
        }

        this.curStaffPos = staffPos;

        return changed;
    }

    private updateCurObjects(objects: MusicObject[] | undefined, click: boolean): boolean {
        let changed = !objectsEquals(objects, this.curObjects);

        if (changed && this.curObjects && this.curObjects.length > 0 && this.scoreEventListener) {
            this.scoreEventListener(new ScoreObjectEvent("leave", this.getMusicInterface(), this.curObjects.map(o => o.getMusicInterface())));
        }

        if (changed && objects && objects.length > 0 && this.scoreEventListener) {
            this.scoreEventListener(new ScoreObjectEvent("enter", this.getMusicInterface(), objects.map(o => o.getMusicInterface())));
        }

        if (click && objects && objects.length > 0 && this.scoreEventListener) {
            this.scoreEventListener(new ScoreObjectEvent("click", this.getMusicInterface(), objects.map(o => o.getMusicInterface())));
        }

        this.curObjects = objects;

        return changed;
    }

    onClick(e: MouseEvent) {
        let { doc } = this;

        if (!this.needMouseInput() || !doc) {
            return;
        }

        this.mousePos = this.txFromScreenCoord(this.getMousePos(e));

        if (this.scoreEventListener) {
            let objects = doc.pick(this.mousePos.x, this.mousePos.y);
            let staffPos = doc.pickStaffPosAt(this.mousePos.x, this.mousePos.y);

            let staffPosChanged = this.updateCurStaffPos(staffPos, true);
            let objectsChanged = this.updateCurObjects(objects, true);

            if (staffPosChanged || objectsChanged) {
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
            let objects = doc.pick(this.mousePos.x, this.mousePos.y);
            let staffPos = doc.pickStaffPosAt(this.mousePos.x, this.mousePos.y);

            let staffPosChanged = this.updateCurStaffPos(staffPos, false);
            let objectsChanged = this.updateCurObjects(objects, false);

            if (staffPosChanged || objectsChanged) {
                this.draw();
            }
        }
    }

    onMouseLeave(e: MouseEvent) {
        if (!this.needMouseInput()) {
            return;
        }

        this.mousePos = undefined;

        let staffPosChanged = this.updateCurStaffPos(undefined, false);
        let objectsChanged = this.updateCurObjects(undefined, false);

        if (staffPosChanged || objectsChanged) {
            this.draw();
        }
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

    hilightObject(obj?: MusicObject) {
        this.hilightedObj = obj;
    }

    hilightStaffPos(staffPos?: { scoreRow: ObjScoreRow, diatonicId: number }) {
        this.hilightedStaffPos = staffPos;
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

        if (!ctx || !doc) {
            return;
        }

        doc.layout();

        this.updateCanvasSize();
        this.clearCanvas();

        this.drawHilightStaffPosRect();
        this.drawHilightObjectRect();
        this.drawPlayCursor();

        doc.drawContent();
    }

    drawHilightStaffPosRect() {
        let ctx = this.getCanvasContext();
        let { mousePos, hilightedStaffPos, unitSize } = this;

        if (!ctx || !hilightedStaffPos) {
            return;
        }

        let { scoreRow, diatonicId } = hilightedStaffPos;
        let staff = scoreRow.getStaff(diatonicId);

        if (!staff) {
            return;
        }

        ctx.fillStyle = HilightStaffPosRectColor;
        ctx.fillRect(0, staff.getDiatonicIdY(diatonicId) - unitSize, ctx.canvas.width, 2 * unitSize);

        if (mousePos !== undefined) {
            this.drawLedgerLines(staff, diatonicId, mousePos.x);
        }
    }

    drawHilightObjectRect() {
        let ctx = this.getCanvasContext();
        let { hilightedObj } = this;

        if (!ctx || !hilightedObj) {
            return;
        }

        let rect = hilightedObj.getRect();

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

    drawLedgerLines(staff: ObjStaff, diatonicId: number, x: number) {
        let { unitSize } = this;

        let ledgerLineWidth = unitSize * DocumentSettings.LedgerLineWidth;

        if (diatonicId >= staff.topLineDiatonicId + 2) {
            for (let lineDiatonicId = staff.topLineDiatonicId + 2; lineDiatonicId <= diatonicId; lineDiatonicId += 2) {
                if (staff.containsDiatonicId(lineDiatonicId)) {
                    let y = staff.getDiatonicIdY(lineDiatonicId);
                    this.drawLine(x - ledgerLineWidth / 2, y, x + ledgerLineWidth / 2, y);
                }
            }
        }
        else if (diatonicId <= staff.bottomLineDiatonicId - 2) {
            for (let lineDiatonicId = staff.bottomLineDiatonicId - 2; lineDiatonicId >= diatonicId; lineDiatonicId -= 2) {
                if (staff.containsDiatonicId(lineDiatonicId)) {
                    let y = staff.getDiatonicIdY(lineDiatonicId);
                    this.drawLine(x - ledgerLineWidth / 2, y, x + ledgerLineWidth / 2, y);
                }
            }
        }
    }

    getRestRect(restSize: number): DivRect {
        let { unitSize } = this;
        let { flagCount } = NoteLengthProps.get(validateNoteLength(restSize + "n"));

        let leftw = 0;
        let rightw = 0;
        let toph = 0;
        let bottomh = 0;

        if (NoteLengthProps.equals(restSize, NoteLength.Whole)) {
            leftw = unitSize;
            rightw = unitSize;
            toph = 0;
            bottomh = unitSize;
        }
        else if (NoteLengthProps.equals(restSize, NoteLength.Half)) {
            leftw = unitSize;
            rightw = unitSize;
            toph = unitSize;
            bottomh = 0;
        }
        else if (NoteLengthProps.equals(restSize, NoteLength.Quarter)) {
            leftw = unitSize * 1;
            rightw = unitSize * 1;
            toph = unitSize * 3.2;
            bottomh = unitSize * 3;
        }
        else {
            let adj = 1 - flagCount % 2;
            leftw = unitSize * (1 + flagCount * 0.25);
            rightw = unitSize * (1 + flagCount * 0.125);
            toph = unitSize * (0.5 + flagCount - adj);
            bottomh = unitSize * (1 + flagCount + adj);
        }

        return new DivRect(-leftw, 0, rightw, -toph, 0, bottomh);
    }

    drawRest(restSize: number, x: number, y: number, color: string) {
        let ctx = this.getCanvasContext();

        if (!ctx) {
            return;
        }

        let { unitSize, lineWidth } = this;
        let { flagCount } = NoteLengthProps.get(validateNoteLength(restSize + "n"));

        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        if (NoteLengthProps.equals(restSize, NoteLength.Whole)) {
            ctx.fillRect(x - unitSize, y, unitSize * 2, unitSize);
        }
        else if (NoteLengthProps.equals(restSize, NoteLength.Half)) {
            ctx.fillRect(x - unitSize, y - unitSize, unitSize * 2, unitSize);
        }
        else if (NoteLengthProps.equals(restSize, NoteLength.Quarter)) {
            ctx.beginPath();
            // Upper part
            ctx.moveTo(x - unitSize * 0.6, y - unitSize * 3.2);
            ctx.lineTo(x + unitSize * 0.7, y - unitSize * 1.5);
            ctx.quadraticCurveTo(
                x - unitSize * 0.8, y - unitSize * 0.5,
                x + unitSize * 1, y + unitSize * 1.5
            );
            ctx.lineTo(x - unitSize * 1, y - unitSize * 0.75);
            ctx.quadraticCurveTo(
                x + unitSize * 0.2, y - unitSize * 1.5,
                x - unitSize * 0.6, y - unitSize * 3.2
            );
            // Lower part
            ctx.moveTo(x + unitSize * 1, y + unitSize * 1.5);
            ctx.quadraticCurveTo(
                x - unitSize * 0.8, y + unitSize * 1,
                x - unitSize * 0.2, y + unitSize * 2.8
            );
            ctx.bezierCurveTo(
                x - unitSize * 1.8, y + unitSize * 1.5,
                x - unitSize * 0.6, y - unitSize * 0.2,
                x + unitSize * 0.9, y + unitSize * 1.5
            );
            ctx.fill();
            ctx.stroke();
        }
        else if (flagCount > 0) {
            let adj = 1 - flagCount % 2;
            let fx = (p: number) => x + (-p * 0.25 + 0.5) * unitSize;
            let fy = (p: number) => y + (p + adj) * unitSize;

            ctx.beginPath();
            ctx.moveTo(fx(1 + flagCount), fy(1 + flagCount));
            ctx.lineTo(fx(-0.5 - flagCount), fy(-0.5 - flagCount));
            ctx.stroke();

            for (let i = 0; i < flagCount; i++) {
                let t = flagCount - i * 2;
                ctx.beginPath();
                ctx.moveTo(fx(t - 2.5), fy(t - 2.5));
                ctx.quadraticCurveTo(
                    fx(t - 0.5) + unitSize * 0.25, fy(t - 1.5),
                    fx(t - 1.5) - unitSize * 1.5, fy(t - 1.5));
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(fx(t - 2) - unitSize * 1.5, fy(t - 2), unitSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawFlag(rect: DivRect, dir: "up" | "down") {
        let ctx = this.getCanvasContext();

        if (!ctx) {
            return;
        }

        let left = rect.left;
        let right = rect.right;
        let width = right - left;
        let top = dir === "up" ? rect.top : rect.bottom;
        let bottom = dir === "up" ? rect.bottom : rect.top;

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.bezierCurveTo(
            left, top * 0.75 + bottom * 0.25,
            left + width * 1.5, top * 0.5 + bottom * 0.5,
            left + width * 0.5, bottom);
        ctx.stroke();
    }
}
