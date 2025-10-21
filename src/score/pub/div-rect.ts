import { Utils } from "@tspro/ts-utils-lib";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

/**
 * DivRect class, left, top, right, bottom rectangle divided into four sections by centerX, centerY.
 */
export class DivRect {
    left: number;
    centerX: number;
    right: number;
    top: number;
    centerY: number;
    bottom: number;

    /**
     * Create rectangle with all zero values.
     */
    constructor();

    /**
     * Create rectangle with left, right, top, bottom.
     * Properties centerX and centerY will be centered in the middle.
     * 
     * @param left - Left coordinate.
     * @param right - Right coordinate.
     * @param top - Top coordinate.
     * @param bottom - Bottom coordinate.
     */
    constructor(left: number, right: number, top: number, bottom: number);

    /**
     * Create rectangle with full arguments.
     * 
     * @param left - Left coordinate.
     * @param centerX - Center x-coordinate.
     * @param right - Right coordinate.
     * @param top - Top coordinate.
     * @param centerY - Center y-coordinate.
     * @param bottom - Bottom coordinate.
     */
    constructor(left: number, centerX: number, right: number, top: number, centerY: number, bottom: number);

    constructor(...args: unknown[]) {
        if (args.length === 6) {
            this.left = args[0] as number;
            this.centerX = args[1] as number;
            this.right = args[2] as number;
            this.top = args[3] as number;
            this.centerY = args[4] as number;
            this.bottom = args[5] as number;
        }
        else if (args.length === 4) {
            this.left = args[0] as number;
            this.right = args[1] as number;
            this.centerX = (this.left + this.right) / 2;
            this.top = args[2] as number;
            this.bottom = args[3] as number;
            this.centerY = (this.top + this.bottom) / 2;
        }
        else if (args.length === 0) {
            this.left = this.centerX = this.right = 0;
            this.top = this.centerY = this.bottom = 0;
        }
        else {
            throw new MusicError(MusicErrorType.InvalidArg, `Invalid DivRect args: ${args}`);
        }
    }

    /**
     * Create rect from basic left, top, width and height arguments.
     * 
     * @param left - Left coordinate.
     * @param top - Top coordinate.
     * @param width - With.
     * @param height - Height.
     * @returns - DivRect.
     */
    static create(left: number, top: number, width: number, height: number): DivRect {
        return new DivRect(left, left + width, top, top + height);
    }

    /**
     * Create rect from centerX, centerY, width, height arguments.
     * 
     * @param centerX - Center x-coordinate.
     * @param centerY - Center y-coordinate.
     * @param width - Width.
     * @param height - Height.
     * @returns - DivRect.
     */
    static createCentered(centerX: number, centerY: number, width: number, height: number): DivRect {
        return new DivRect(centerX - width / 2, centerX + width / 2, centerY - height / 2, centerY + height / 2);
    }

    /**
     * Create rect from sections.
     * 
     * @param leftw - Left section width.
     * @param rightw - Right section width.
     * @param toph - Top section height.
     * @param bottomh - Bottomsection height.
     * @returns - DivRect.
     */
    static createSections(leftw: number, rightw: number, toph: number, bottomh: number): DivRect {
        return new DivRect(-leftw, 0, rightw, -toph, 0, bottomh);
    }

    /**
     * Width getter.
     */
    get width() {
        return this.right - this.left;
    }

    /**
     * Height getter.
     */
    get height() {
        return this.bottom - this.top;
    }

    /**
     * Left section width getter.
     */
    get leftw() {
        return this.centerX - this.left;
    }

    /**
     * Right section width getter.
     */
    get rightw() {
        return this.right - this.centerX;
    }

    /**
     * Top section height getter.
     */
    get toph() {
        return this.centerY - this.top;
    }

    /**
     * Bottom section height getter.
     */
    get bottomh() {
        return this.bottom - this.centerY;
    }

    /**
     * Does this Rect contain given (x, y)-point?
     * 
     * @param x - X-coordinate.
     * @param y - Y-coordinate.
     * @returns - True/false.
     */
    contains(x: number, y: number): boolean {
        return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
    }

    /**
     * Do a and b rects overlap?
     * 
     * @param a - DivRect a.
     * @param b - DivRect b.
     * @returns - True/false.
     */
    static overlap(a: DivRect, b: DivRect): boolean {
        return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
    }

    /**
     * Do horizontal measures of a and b rects overlap?
     * 
     * @param a - DivRect a.
     * @param b - DivRect b.
     * @returns - True/false.
     */
    static overlapX(a: DivRect, b: DivRect): boolean {
        return a.right > b.left && a.left < b.right;
    }

    /**
     * Check if this Rect equals with given Rect.
     * @param a - DivRect a.
     * @param b - DivRect b.
     * @returns - True/false.
     */
    static equals(a: DivRect | null | undefined, b: DivRect | null | undefined): boolean {
        if (a == null && b == null) {
            // handles null and undefined
            return true;
        }
        else if (a == null || b == null) {
            return false;
        }
        else {
            return a === b || a.left === b.left && a.centerX === b.centerX && a.right === b.right && a.top === b.top && a.centerY === b.centerY && a.bottom === b.bottom;
        }
    }

    /**
     * Check if edges of given rects equal, ignoring centerX and centerY.
     * 
     * @param a - DivRect a.
     * @param b - DivRect b.
     * @returns - True/false.
     */
    static equalsEdges(a: DivRect | null | undefined, b: DivRect | null | undefined): boolean {
        if (a == null && b == null) {
            // handles null and undefined
            return true;
        }
        else if (a == null || b == null) {
            return false;
        }
        else {
            return a === b || a.left === b.left && a.right === b.right && a.top === b.top && a.bottom === b.bottom;
        }
    }

    /** @deprecated - Use `DivRect.equalsEdges()` instead. */
    static equalsFrame(a: DivRect | null | undefined, b: DivRect | null | undefined): boolean {
        return DivRect.equalsEdges(a, b);
    }

    /**
     * Created duplicate of this Rect.
     * 
     * @returns - Duplicate.
     */
    copy(): DivRect {
        return new DivRect(this.left, this.centerX, this.right, this.top, this.centerY, this.bottom);
    }

    /**
     * Move this rect by (dx, dy). Modifies this Rect.
     * 
     * @param dx - Offset amount in x-direction.
     * @param dy - Offset amount in y-direction.
     * @returns - This DivRect instance.
     */
    offsetInPlace(dx: number, dy: number): DivRect {
        this.left += dx;
        this.centerX += dx;
        this.right += dx;
        this.top += dy;
        this.centerY += dy;
        this.bottom += dy;
        return this;
    }

    /**
     * Move this rect by (dx, dy). Immutable, returns modified copy.
     * 
     * @param dx - Offset amount in x-direction.
     * @param dy - Offset amount in y-direction.
     * @returns - DivRect copy with applied offset.
     */
    offsetCopy(dx: number, dy: number): DivRect {
        return this.copy().offsetInPlace(dx, dy);
    }

    /**
     * Expand this Rect by given Rect. Modifies this Rect.
     * 
     * @param rect - DivRect to expand this instance with.
     * @returns - This DivRect instance.
     */
    expandInPlace(rect: DivRect): DivRect {
        this.left = Math.min(this.left, rect.left);
        this.right = Math.max(this.right, rect.right);
        this.top = Math.min(this.top, rect.top);
        this.bottom = Math.max(this.bottom, rect.bottom);
        return this;
    }

    /**
     * Expand this Rect by given Rect. Immutable, returns modified copy.
     * 
     * @param rect - DivRect to expand this instance with.
     * @returns - Expanded copy of this DivRect.
     */
    expandCopy(rect: DivRect): DivRect {
        return this.copy().expandInPlace(rect);
    }

    /**
     * Clip this Rect by given Rect. Mmodifies this Rect.
     * 
     * @param clipRect - DivRect to clip this instance with.
     * @returns - This DivRect instance.
     */
    clipInPlace(clipRect: DivRect): DivRect {
        this.left = Math.max(this.left, clipRect.left);
        this.right = Math.min(this.right, clipRect.right);
        this.centerX = Utils.Math.clamp(this.centerX, this.left, this.right);
        this.top = Math.max(this.top, clipRect.top);
        this.bottom = Math.min(this.bottom, clipRect.bottom);
        this.centerY = Utils.Math.clamp(this.centerY, this.top, this.bottom);
        return this;
    }

    /**
     * Clip this Rect by given Rect. Immutable, return modified copy.
     * 
     * @param clipRect - DivRecto to clip this instance with.
     * @returns - Clipped DivRect copy.
     */
    clipCopy(clipRect: DivRect): DivRect {
        return this.copy().clipInPlace(clipRect);
    }

    /**
     * Scale Rect. Anchor pos is (centerX, centerY). Modifies this Rect.
     * 
     * @param scaleX - Scale x-amount.
     * @param scaleY - Scale y-amount. If undefined then scale x-amount is used.
     * @returns This DivRect instance.
     */
    scaleInPlace(scaleX: number, scaleY?: number): DivRect {
        scaleY = scaleY ?? scaleX;

        this.left = this.centerX - this.leftw * scaleX;
        this.right = this.centerX + this.rightw * scaleX;
        this.top = this.centerY - this.toph * scaleY;
        this.bottom = this.centerY + this.bottomh * scaleY;
        return this;
    }

    /**
     * Scale Rect. Anchor pos is (centerX, centerY). Immutable, returns modified copy.
     * 
     * @param scaleX - Scale x-amount.
     * @param scaleY - Scale y-amount. If undefined then scale x-amount is used.
     * @returns Scaled copy of this DivRect.
     */
    scaleCopy(scaleX: number, scaleY?: number): DivRect {
        return this.copy().scaleInPlace(scaleX, scaleY);
    }

    /**
     * Get this DivRect instance.
     * @returns - This DivRect instance.
     */
    getRect(): DivRect {
        return this;
    }
}
