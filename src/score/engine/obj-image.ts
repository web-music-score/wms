import { View } from "./view";
import { MusicObject } from "./music-object";
import { MImage } from "../pub";
import { AnchoredRect } from "@tspro/ts-utils-lib";

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

    layout(view: View) {
        let { anchorX, anchorY, image, imageScale } = this;
        let { unitSize } = view;

        try {
            let w = image.naturalWidth * imageScale * unitSize;
            let h = image.naturalHeight * imageScale * unitSize;

            this.rect = AnchoredRect.createSections(w * anchorX, w * (1 - anchorX), h * anchorY, h * (1 - anchorY));
        }
        catch (err) {
            // Image was not ready?
            this.rect = new AnchoredRect();
        }
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View) {
        let r = this.rect;
        view.drawDebugRect(r);
        view.drawImage(this.image, r.anchorX - r.leftw, r.anchorY - r.toph, r.width, r.height);
    }
}
