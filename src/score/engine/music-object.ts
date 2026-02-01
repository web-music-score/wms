import { AnchoredRect, Rect } from "@tspro/ts-utils-lib";
import { MusicInterface } from "../pub";
import { LayoutObjectWrapper } from "./layout-object";

export class MusicObjectLink {
    private head: MusicObject;
    private tail: MusicObject[];

    constructor(head: MusicObject) {
        this.head = head;
        this.tail = [];
    }

    getHead(): MusicObject {
        return this.head;
    }

    getTails(): ReadonlyArray<MusicObject> {
        return this.tail;
    }

    addTail(obj: MusicObject) {
        this.tail.push(obj);
    }

    detachTail(obj: MusicObject) {
        let i = this.tail.indexOf(obj);
        if (i >= 0) {
            this.tail.splice(i, 1);
        }
    }
}

export abstract class MusicObject {
    private anchoredLayoutObjects: LayoutObjectWrapper[] = [];

    private link?: MusicObjectLink = undefined;

    public readonly userData: Record<string, unknown> = {};

    constructor(protected readonly parent: MusicObject | undefined) { }

    abstract getMusicInterface(): MusicInterface;

    getParent(): MusicObject | undefined {
        return this.parent;
    }

    protected rect = new AnchoredRect();
    private needRectUpdate = true;

    requestRectUpdate() {
        this.needRectUpdate = true;
    }

    updateRect() { }

    forceRectUpdate() {
        this.needRectUpdate = true;
        this.updateRect();
        this.needRectUpdate = false;
    }

    getRect(): AnchoredRect {
        if (this.needRectUpdate)
            this.forceRectUpdate();
        return this.rect;
    }

    abstract offset(dx: number, dy: number): void;

    offsetX(dx: number) { this.offset(dx, 0); }
    offsetY(dy: number) { this.offset(0, dy); }

    setLeft(x: number) { this.offset(x - this.getRect().left, 0); }
    setRight(x: number) { this.offset(x - this.getRect().right, 0); }
    setTop(y: number) { this.offset(0, y - this.getRect().top); }
    setBottom(y: number) { this.offset(0, y - this.getRect().bottom); }

    setAnchor(x: number, y: number) { this.offset(x - this.getRect().anchorX, y - this.getRect().anchorY); }
    setAnchorX(x: number) { this.offset(x - this.getRect().anchorX, 0); }
    setAnchorY(y: number) { this.offset(0, y - this.getRect().anchorY); }

    setCenter(x: number, y: number) { this.offset(x - this.getRect().centerX, y - this.getRect().centerY); }
    setCenterX(x: number) { this.offset(x - this.getRect().centerX, 0); }
    setCenterY(y: number) { this.offset(0, y - this.getRect().centerY); }

    /**
     * Most objects are simple rects in shape.
     * Some objects might be more complex consisting of multiple rects.
     * These rects are used to dodge overlapping objects.
     * 
     * @returns Array of rects.
     */
    getShapeRects(): AnchoredRect[] {
        return [this.rect];
    }

    /**
     * Pick objects.
     * 
     * @param x - X-coordinate.
     * @param y - Y-coordinate.
     * @returns Array of objects under (x, y)-coordinate in hierarchical order. Last object in array is the top-most object. 
     */
    abstract pick(x: number, y: number): MusicObject[];

    addAnchoredLayoutObject(layoutObj: LayoutObjectWrapper): void {
        this.anchoredLayoutObjects.push(layoutObj);
    }

    getAnchoredLayoutObjects(): ReadonlyArray<LayoutObjectWrapper> {
        return this.anchoredLayoutObjects;
    }

    setLink(link: MusicObjectLink): void {
        this.link = link;
    }

    getLink(): MusicObjectLink | undefined {
        return this.link;
    }

    isLinked(): boolean {
        return this.link !== null;
    }

    intersects(clipRect?: Rect): boolean {
        return !clipRect || this.getRect().intersects(clipRect);
    }
}
