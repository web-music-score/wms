import { Utils, Vec, Device, UniMap, AnchoredRect, Rect, BiMap } from "@tspro/ts-utils-lib";
import { ObjDocument } from "./obj-document";
import { MDocument, ScoreEventListener, ScoreStaffPosEvent, ScoreObjectEvent, MRenderContext, Paint, ColorKey } from "../pub";
import { ObjScoreRow } from "./obj-score-row";
import { DebugSettings, DocumentSettings } from "./settings";
import { MusicObject } from "./music-object";
import { ObjStaff } from "./obj-staff-and-tab";
import { NoteLength, NoteLengthProps, validateNoteLength } from "theory/rhythm";

import G_clef_png from "./assets/G-clef.png";
import F_clef_png from "./assets/F-clef.png";

export enum ImageAsset { G_Clef, F_Clef }

const ImageData = new UniMap<ImageAsset, string>([
    [ImageAsset.G_Clef, G_clef_png],
    [ImageAsset.F_Clef, F_clef_png],
]);

const getImageData = (asset: ImageAsset): string => ImageData.getOrDefault(asset, "");

type HTMLImageData = {
    src: string;
    color: string;
    loaded: boolean;
    colorized: boolean;
    img?: HTMLImageElement;
}

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

export class RenderContext {
    readonly devicePixelRatio: number;

    readonly fontSize: number;
    readonly unitSize: number;

    readonly _lineWidth: number;

    private scoreEventListener?: ScoreEventListener;

    private canvas?: HTMLCanvasElement;
    private ctx?: CanvasRenderingContext2D;

    private mdoc?: MDocument;

    private paint: Paint = Paint.default;

    private cursorRect?: Rect;
    private mousePos?: Vec; // Mouse coord in document space

    private curStaffPos?: StaffPos;
    private curObjects?: MusicObject[];

    private hilightedStaffPos?: StaffPos;
    private hilightedObj?: MusicObject;

    private usingTouch = false;

    private onClickFn: (e: MouseEvent) => void;
    private onMouseMoveFn: (e: MouseEvent) => void;
    private onMouseLeaveFn: (e: MouseEvent) => void;
    private onTouchEndFn: (e: TouchEvent) => void;

    private imageCache = new BiMap<ImageAsset, string, HTMLImageData>();

    constructor(private readonly mi: MRenderContext) {
        this.devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;
        this.fontSize = Device.FontSize * DocumentSettings.DocumentScale * this.devicePixelRatio;
        this.unitSize = this.fontSize * 0.3;
        this._lineWidth = this.unitSize * 0.2;

        this.onClickFn = this.onClick.bind(this);
        this.onMouseMoveFn = this.onMouseMove.bind(this);
        this.onMouseLeaveFn = this.onMouseLeave.bind(this);
        this.onTouchEndFn = this.onTouchEnd.bind(this);
    }

    getMusicInterface(): MRenderContext {
        return this.mi;
    }

    get doc(): ObjDocument | undefined {
        return this.mdoc?.getMusicObject();
    }

    getImageAsset(asset: ImageAsset, color?: string): HTMLImageElement | undefined {
        color ??= "";
        return this.imageCache.getOrCreate(asset, color, () => {
            const a: HTMLImageData = { src: getImageData(asset), color, loaded: false, colorized: false };
            const img = new Image();
            img.src = a.src;
            img.onload = () => {
                a.img = img;
                this.onImageLoaded(a);
            }
            img.onerror = () => {
                console.error("Failed to load image: " + a.src);
            }
            return a;
        })?.img;
    }

    private forceDraw() {
        this.doc?.requestFullLayout();
        this.draw();
    }

    private onImageLoaded(data: HTMLImageData) {
        if (data.loaded || !data.img) return;

        const color = this.paint.getColor(data.color);

        if (data.colorized ||
            color === "" || color === "black" ||
            color === "#000" || color === "#0000" ||
            color === "#000000" || color === "#00000000"
        ) {
            this.forceDraw();
            data.loaded = true;
            return;
        }

        // rgb values
        const [nr, ng, nb, na] = Paint.colorNameToRGBA(color);

        // threshold to decide what counts as "black"
        const threshold = 40; // 0..255; tweak as needed

        if (typeof document === "undefined") {
            console.error("Failed to colorize image: document is undefined.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = data.img.width;
        canvas.height = data.img.height;

        const ctx = canvas.getContext("2d");
        if (ctx == null) {
            console.error("Failed to colorize image: ctx = null.");
            return;
        }

        ctx.drawImage(data.img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
            if (a === 0) continue;

            // If pixel is dark enough, replace with red while preserving alpha
            if (r < threshold && g < threshold && b < threshold) {
                d[i + 0] = nr;
                d[i + 1] = ng;
                d[i + 2] = nb;
                //d[i + 3] = na;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        data.img.src = canvas.toDataURL("image/png");
        data.img.onload = () => {
            data.colorized = true;
            this.onImageLoaded(data);
        }
        data.img.onerror = () => {
            console.error("Failed to colorize image.");
        }
    }

    setDocument(mdoc?: MDocument) {
        if (this.mdoc === mdoc) {
            return;
        }

        this.updateCursorRect(undefined);

        let prevMDoc = this.mdoc;

        this.mdoc = mdoc;

        if (prevMDoc) {
            prevMDoc.getMusicObject().setRenderContext(undefined);
        }

        if (mdoc) {
            mdoc.getMusicObject().setRenderContext(this);
        }
    }

    setPaint(paint?: Paint) {
        this.paint = paint ?? Paint.default;
    }

    getPaint() {
        return this.paint;
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

    getMousePos(e: MouseEvent): Vec {
        return new Vec(e.offsetX, e.offsetY);
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

    hilightObject(obj?: MusicObject) {
        this.hilightedObj = obj;
    }

    hilightStaffPos(staffPos?: { scoreRow: ObjScoreRow, diatonicId: number }) {
        this.hilightedStaffPos = staffPos;
    }

    updateCursorRect(cursorRect: Rect | undefined) {
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
        try {
            let { doc } = this;

            if (doc) {
                doc.layout();

                this.updateCanvasSize();
                this.clearCanvas();

                this.drawHilightStaffPosRect();
                this.drawHilightObjectRect();
                this.drawPlayCursor();

                doc.drawContent();
            }
        }
        catch (err) {
            console.error("Render failed!", err);
        }
    }

    drawHilightStaffPosRect() {
        let { mousePos, hilightedStaffPos, unitSize } = this;

        if (!hilightedStaffPos) {
            return;
        }

        let { scoreRow, diatonicId } = hilightedStaffPos;
        let staff = scoreRow.getStaff(diatonicId);

        if (!staff) {
            return;
        }

        this.fillColor(this.paint.colors["hilight.staffpos"]);
        this.fillRect(staff.row.getRect().left, staff.getDiatonicIdY(diatonicId) - unitSize, staff.row.getRect().width, 2 * unitSize);

        if (mousePos !== undefined) {
            this.drawLedgerLines(staff, diatonicId, mousePos.x);
        }
    }

    drawHilightObjectRect() {
        let { hilightedObj } = this;

        if (!hilightedObj) {
            return;
        }

        let rect = hilightedObj.getRect();

        this.lineColor(this.paint.colors["hilight.object"]);
        this.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }

    drawPlayCursor() {
        let { cursorRect: r } = this;

        if (r) {
            this.color(this.paint.colors["play.cursor"]).lineWidth(2).strokeLine(r.centerX, r.top, r.centerX, r.bottom);
        }
    }

    txFromScreenCoord(screenCoord: Vec) {
        return screenCoord.mul(this.devicePixelRatio);
    }

    txToScreenCoord(coord: Vec) {
        return coord.div(this.devicePixelRatio);
    }

    clearCanvas() {
        if (this.ctx) {
            this.ctx.canvas.style.background = this.getPaint().colors["background"];
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
    }

    drawDebugRect(r: AnchoredRect | Rect) {
        if (DebugSettings.DrawDebugRects) {
            this.color("red").lineWidth(1).strokeRect(r.left, r.top, r.width, r.height);
        }
    }

    drawLedgerLines(staff: ObjStaff, diatonicId: number, x: number) {
        let { unitSize } = this;

        let ledgerLineWidth = unitSize * DocumentSettings.LedgerLineWidth;

        if (diatonicId >= staff.topLineDiatonicId + 2) {
            for (let lineDiatonicId = staff.topLineDiatonicId + 2; lineDiatonicId <= diatonicId; lineDiatonicId += 2) {
                if (staff.containsDiatonicId(lineDiatonicId)) {
                    let y = staff.getDiatonicIdY(lineDiatonicId);
                    this.strokeLine(x - ledgerLineWidth / 2, y, x + ledgerLineWidth / 2, y);
                }
            }
        }
        else if (diatonicId <= staff.bottomLineDiatonicId - 2) {
            for (let lineDiatonicId = staff.bottomLineDiatonicId - 2; lineDiatonicId >= diatonicId; lineDiatonicId -= 2) {
                if (staff.containsDiatonicId(lineDiatonicId)) {
                    let y = staff.getDiatonicIdY(lineDiatonicId);
                    this.strokeLine(x - ledgerLineWidth / 2, y, x + ledgerLineWidth / 2, y);
                }
            }
        }
    }

    getRestRect(restSize: number): AnchoredRect {
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

        return new AnchoredRect(-leftw, 0, rightw, -toph, 0, bottomh);
    }

    drawRest(restSize: number, x: number, y: number) {
        let { unitSize } = this;
        let { flagCount } = NoteLengthProps.get(validateNoteLength(restSize + "n"));

        if (NoteLengthProps.equals(restSize, NoteLength.Whole)) {
            this.fillRect(x - unitSize, y, unitSize * 2, unitSize);
        }
        else if (NoteLengthProps.equals(restSize, NoteLength.Half)) {
            this.fillRect(x - unitSize, y - unitSize, unitSize * 2, unitSize);
        }
        else if (NoteLengthProps.equals(restSize, NoteLength.Quarter)) {
            this.beginPath();
            // Upper part
            this.moveTo(x - unitSize * 0.6, y - unitSize * 3.2);
            this.lineTo(x + unitSize * 0.7, y - unitSize * 1.5);
            this.quadraticCurveTo(
                x - unitSize * 0.8, y - unitSize * 0.5,
                x + unitSize * 1, y + unitSize * 1.5
            );
            this.lineTo(x - unitSize * 1, y - unitSize * 0.75);
            this.quadraticCurveTo(
                x + unitSize * 0.2, y - unitSize * 1.5,
                x - unitSize * 0.6, y - unitSize * 3.2
            );
            // Lower part
            this.moveTo(x + unitSize * 1, y + unitSize * 1.5);
            this.quadraticCurveTo(
                x - unitSize * 0.8, y + unitSize * 1,
                x - unitSize * 0.2, y + unitSize * 2.8
            );
            this.bezierCurveTo(
                x - unitSize * 1.8, y + unitSize * 1.5,
                x - unitSize * 0.6, y - unitSize * 0.2,
                x + unitSize * 0.9, y + unitSize * 1.5
            );
            this.fill();
            this.stroke();
        }
        else if (flagCount > 0) {
            let adj = 1 - flagCount % 2;
            let fx = (p: number) => x + (-p * 0.25 + 0.5) * unitSize;
            let fy = (p: number) => y + (p + adj) * unitSize;

            this.beginPath();
            this.moveTo(fx(1 + flagCount), fy(1 + flagCount));
            this.lineTo(fx(-0.5 - flagCount), fy(-0.5 - flagCount));
            this.stroke();

            for (let i = 0; i < flagCount; i++) {
                let t = flagCount - i * 2;
                this.beginPath();
                this.moveTo(fx(t - 2.5), fy(t - 2.5));
                this.quadraticCurveTo(
                    fx(t - 0.5) + unitSize * 0.25, fy(t - 1.5),
                    fx(t - 1.5) - unitSize * 1.5, fy(t - 1.5));
                this.stroke();
                this.beginPath();
                this.arc(fx(t - 2) - unitSize * 1.5, fy(t - 2), unitSize * 0.5, 0, Math.PI * 2);
                this.fill();
            }
        }
    }

    drawFlag(rect: Rect | AnchoredRect, dir: "up" | "down") {
        let left = rect.left;
        let right = rect.right;
        let width = right - left;
        let top = dir === "up" ? rect.top : rect.bottom;
        let bottom = dir === "up" ? rect.bottom : rect.top;

        this.beginPath();
        this.moveTo(left, top);
        this.bezierCurveTo(
            left, top * 0.75 + bottom * 0.25,
            left + width * 1.5, top * 0.5 + bottom * 0.5,
            left + width * 0.5, bottom);
        this.stroke();
    }

    color(color: string | ColorKey): RenderContext {
        if (this.ctx)
            this.ctx.strokeStyle = this.ctx.fillStyle = this.paint.getColor(color);
        return this;
    }

    lineColor(color: string): RenderContext {
        if (this.ctx) this.ctx.strokeStyle = this.paint.getColor(color);
        return this;
    }

    fillColor(color: string): RenderContext {
        if (this.ctx) this.ctx.fillStyle = this.paint.getColor(color);
        return this;

    }

    lineWidth(lineWidth?: number): RenderContext {
        if (this.ctx) this.ctx.lineWidth = this._lineWidth * (lineWidth ?? 1)
        return this;
    }

    font(font: string): RenderContext {
        if (this.ctx) this.ctx.font = font;
        return this;
    }

    beginPath(): RenderContext {
        if (this.ctx) this.ctx.beginPath();
        return this;
    }

    stroke(): RenderContext {
        if (this.ctx) this.ctx.stroke();
        return this;
    }

    fill(): RenderContext {
        if (this.ctx) this.ctx.fill();
        return this;
    }

    moveTo(x: number, y: number): RenderContext {
        if (this.ctx) this.ctx.moveTo(x, y);
        return this;
    }

    lineTo(x: number, y: number): RenderContext {
        if (this.ctx) this.ctx.lineTo(x, y);
        return this;
    }

    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): RenderContext {
        if (this.ctx) this.ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
        return this;
    }

    quadraticCurveTo(x1: number, y1: number, x2: number, y2: number): RenderContext {
        if (this.ctx) this.ctx.quadraticCurveTo(x1, y1, x2, y2);
        return this;
    }

    fillRect(x: number, y: number, w: number, h: number): RenderContext {
        if (this.ctx) this.ctx.fillRect(x, y, w, h);
        return this;
    }

    setLineDash(pattern: number[]): RenderContext {
        if (this.ctx) this.ctx.setLineDash(pattern);
        return this;
    }

    drawImage(img: CanvasImageSource, x: number, y: number, w: number, h: number): RenderContext {
        if (this.ctx) this.ctx.drawImage(img, x, y, w, h);
        return this;
    }

    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number): RenderContext {
        if (this.ctx) this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        return this;
    }

    clip(): RenderContext {
        if (this.ctx) this.ctx.clip();
        return this;
    }

    save(): RenderContext {
        if (this.ctx) this.ctx.save();
        return this;
    }

    restore(): RenderContext {
        if (this.ctx) this.ctx.restore();
        return this;
    }

    rect(x: number, y: number, w: number, h: number): RenderContext {
        if (this.ctx) this.ctx.rect(x, y, w, h);
        return this;
    }

    scale(x: number, y: number): RenderContext {
        if (this.ctx) this.ctx.scale(x, y);
        return this;
    }

    strokeRect(x: number, y: number, w: number, h: number): RenderContext {
        if (this.ctx) this.ctx.strokeRect(x, y, w, h);
        return this;
    }

    fillText(text: string, x: number, y: number): RenderContext {
        if (this.ctx) this.ctx.fillText(text, x, y);
        return this;
    }

    getTextWidth(text: string, font: string): number {
        if (this.ctx) {
            let savedFont = this.ctx.font;
            this.ctx.font = font;
            let metrics = this.ctx.measureText(text);
            this.ctx.font = savedFont;
            return metrics.width;
        }
        else {
            return Utils.Dom.getCanvasTextWidth(text, font);
        }
    }

    arc(x: number, y: number, radius: number, startRadians: number, endRadians: number): RenderContext {
        if (this.ctx) this.ctx.arc(x, y, radius, startRadians, endRadians);
        return this;
    }

    fillCircle(x: number, y: number, radius: number): RenderContext {
        if (!this.ctx) return this;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        return this;
    }

    strokeLine(startX: number, startY: number, endX: number, endY: number): RenderContext {
        if (!this.ctx) return this;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        return this;
    }

    strokePartialLine(startX: number, startY: number, endX: number, endY: number, startT: number, endT: number): RenderContext {
        if (!this.ctx) return this;
        let x1 = startX + (endX - startX) * startT;
        let y1 = startY + (endY - startY) * startT;
        let x2 = startX + (endX - startX) * endT;
        let y2 = startY + (endY - startY) * endT;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        return this;
    }

    drawBracket(rect: AnchoredRect, bracket: "(" | ")" | "[" | "]" | "{" | "}" | "<" | ">"): RenderContext {
        if (!this.ctx) return this;
        let { left, right, width, top, bottom, height, anchorY } = rect;
        if ([")", "]", "}", ">"].includes(bracket)) {
            [left, right, width] = [right, left, -width];
        }
        switch (bracket) {
            case "(": case ")":
                this.ctx.beginPath();
                this.ctx.moveTo(right, top);
                this.ctx.bezierCurveTo(
                    left - width * 0.2, top + height * 0.3,
                    left - width * 0.2, top + height * 0.7,
                    right, bottom);
                this.ctx.stroke();
                break;
            case "{": case "}":
                this.ctx.beginPath();
                this.ctx.moveTo(right, top);
                this.ctx.bezierCurveTo(
                    left + width * 0.1, top,
                    left + width * 0.8, anchorY,
                    left, anchorY);
                this.ctx.moveTo(right, bottom);
                this.ctx.bezierCurveTo(
                    left + width * 0.1, bottom,
                    left + width * 0.8, anchorY,
                    left, anchorY);
                this.ctx.stroke();
                break;
            case "[": case "]":
                this.ctx.beginPath();
                this.ctx.moveTo(right, top);
                this.ctx.lineTo(left, top);
                this.ctx.lineTo(left, bottom);
                this.ctx.lineTo(right, bottom);
                this.ctx.stroke();
                break;
            case "<": case ">":
                this.ctx.beginPath();
                this.ctx.moveTo(right, top);
                this.ctx.lineTo(left, anchorY);
                this.ctx.lineTo(right, bottom);
                this.ctx.stroke();
                break;
        }
        return this;
    }
}
