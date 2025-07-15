import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { DivRect, MImage } from "../pub";

export class ObjImage extends MusicObject {
    readonly mi: MImage;

    constructor(parent: MusicObject, readonly image: HTMLImageElement, readonly anchorX: number, readonly anchorY: number, readonly imageScale: number) {
        super(parent);
        this.mi = new MImage(this);
    }

    getMusicInterface(): MImage {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(renderer: Renderer) {
        let { anchorX, anchorY, image, imageScale } = this;
        let { unitSize } = renderer;

        try {
            let w = image.naturalWidth * imageScale * unitSize;
            let h = image.naturalHeight * imageScale * unitSize;

            this.rect = DivRect.createSections(w * anchorX, w * (1 - anchorX), h * anchorY, h * (1 - anchorY));
        }
        catch (err) {
            // Image was not ready?
            this.rect = new DivRect();
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

        let r = this.rect;

        renderer.drawDebugRect(r);

        try {
            ctx.drawImage(this.image, r.centerX - r.leftw, r.centerY - r.toph, r.width, r.height);
        }
        catch (err) {
            // Image was not read?
        }
    }
}
