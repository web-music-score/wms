import { DivRect, MusicInterface } from "../pub";
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
    protected rect = new DivRect();

    private anchoredLayoutObjects: LayoutObjectWrapper[] = [];

    private link?: MusicObjectLink = undefined;

    constructor(protected readonly parent: MusicObject | undefined) { }

    abstract getMusicInterface(): MusicInterface;

    getParent(): MusicObject | undefined {
        return this.parent;
    }

    getRect(): DivRect {
        return this.rect;
    }

    /**
     * Most objects are simple rects in shape.
     * Some objects might be more complex consisting of multiple rects.
     * These rects are used to dodge overlapping objects.
     * 
     * @returns Array of rects.
     */
    getShapeRects(): DivRect[] {
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
}
