import { Note, getTempoString, KeySignature } from "@tspro/web-music-score/theory";
import { Clef, DivRect, MStaffSignature, MTabSignature } from "../pub";
import { MusicObject } from "./music-object";
import { RenderContext } from "./render-context";
import { ObjImage } from "./obj-image";
import { ObjStaff, ObjTab } from "./obj-staff-and-tab";
import { ObjAccidental } from "./obj-accidental";
import { ObjText } from "./obj-text";
import { ObjMeasure } from "./obj-measure";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class ObjStaffSignature extends MusicObject {
    private clefImage?: ObjImage;
    private eightBelowClef?: ObjText;
    private measureNumber?: ObjText;
    private ksNeutralizeAccidentals: ObjAccidental[] = [];
    private ksNewAccidentals: ObjAccidental[] = [];
    private beatCountText?: ObjText;
    private beatSizeText?: ObjText;
    private tempoText?: ObjText;

    readonly mi: MStaffSignature;

    constructor(readonly measure: ObjMeasure, readonly staff: ObjStaff) {
        super(measure);

        this.mi = new MStaffSignature(this);
    }

    getMusicInterface(): MStaffSignature {
        return this.mi;
    }

    updateClefImage(ctx: RenderContext, showClef: boolean) {
        if (showClef) {
            let img = ctx.getImageAsset(this.staff.clefImageAsset);
            this.clefImage = img ? new ObjImage(this, img, 0, 0.5, 0.1) : undefined;

            this.eightBelowClef = this.clefImage && this.staff.isOctaveDown
                ? new ObjText(this, "8", 0.5, 0)
                : undefined;
        }
        else {
            this.clefImage = undefined;
        }
    }

    updateMeasureNumber(showMeasureNumber: boolean) {
        if (showMeasureNumber) {
            let text = this.measure.getMeasureNumber().toString();
            this.measureNumber = new ObjText(this, text, 0, 1);
        }
        else {
            this.measureNumber = undefined;
        }
    }

    updateKeySignature(showKeySignature: boolean) {
        if (showKeySignature) {
            let { measure } = this;
            let prevMeasure = measure.getPrevMeasure();

            let prevKeySignature = prevMeasure ? prevMeasure.getKeySignature() : undefined;
            let newKeySignature = measure.getKeySignature();

            this.ksNeutralizeAccidentals = [];
            this.ksNewAccidentals = [];

            // If key signatue changes then neutralize previous key signature
            if (prevKeySignature && !KeySignature.equals(newKeySignature, prevKeySignature)) {
                prevKeySignature.getOrderedAccidentalNotes().forEach(accNote => {
                    // Neutral accidental
                    this.ksNeutralizeAccidentals.push(new ObjAccidental(this, this.getAccidentalDiatonicId(accNote), 0));
                });
            }

            // Set new key signature
            newKeySignature.getOrderedAccidentalNotes().forEach(accNote => {
                this.ksNewAccidentals.push(new ObjAccidental(this, this.getAccidentalDiatonicId(accNote), accNote.accidental));
            });
        }
        else {
            this.ksNeutralizeAccidentals = [];
            this.ksNewAccidentals = [];
        }
    }

    updateTimeSignature(showTimeSignature: boolean) {
        if (showTimeSignature) {
            let timeSignature = this.measure.getTimeSignature();

            let beatCount = timeSignature.beatCount.toString();
            this.beatCountText = new ObjText(this, { text: beatCount, scale: 1.4 }, 0.5, 0.5);

            let beatSize = timeSignature.beatSize.toString();
            this.beatSizeText = new ObjText(this, { text: beatSize, scale: 1.4 }, 0.5, 0.5);
        }
        else {
            this.beatCountText = this.beatSizeText = undefined;
        }
    }

    updateTempo(showTempo: boolean) {
        if (showTempo) {
            let tempoStr = getTempoString(this.measure.getTempo());
            this.tempoText = new ObjText(this, tempoStr, 0.5, 1);
        }
        else {
            this.tempoText = undefined;
        }
    }

    private getAccidentalDiatonicId(accNote: Note): number {
        let { clef } = this.staff.staffConfig;

        let bottomAccidentalDiatonicId: number | undefined = undefined;

        if (clef === Clef.G) {
            if (accNote.accidental > 0) {
                bottomAccidentalDiatonicId = this.staff.bottomLineDiatonicId + 3;
            }
            else if (accNote.accidental < 0) {
                bottomAccidentalDiatonicId = this.staff.bottomLineDiatonicId + 1;
            }
        }
        else if (clef === Clef.F) {
            if (accNote.accidental > 0) {
                bottomAccidentalDiatonicId = this.staff.bottomLineDiatonicId + 1;
            }
            else if (accNote.accidental < 0) {
                bottomAccidentalDiatonicId = this.staff.bottomLineDiatonicId - 1;
            }
        }

        if (bottomAccidentalDiatonicId !== undefined) {
            return Note.findNextDiatonicIdAbove(accNote.diatonicId, bottomAccidentalDiatonicId, false);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Cannot get accidental diatonicId because note has no accidental.")
        }
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        if (this.eightBelowClef) {
            let arr = this.eightBelowClef.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.clefImage) {
            let arr = this.clefImage.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.ksNeutralizeAccidentals.length; i++) {
            let arr = this.ksNeutralizeAccidentals[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.ksNewAccidentals.length; i++) {
            let arr = this.ksNewAccidentals[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.beatCountText) {
            let arr = this.beatCountText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.beatSizeText) {
            let arr = this.beatSizeText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.tempoText) {
            let arr = this.tempoText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.measureNumber) {
            let arr = this.measureNumber.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layout(ctx: RenderContext) {
        let { unitSize } = ctx;
        let { staff } = this;

        let paddingX = unitSize;

        let x = 0;

        this.rect = new DivRect();

        if (this.clefImage) {
            x += paddingX;
            this.clefImage.layout(ctx);
            this.clefImage.offset(x, staff.getDiatonicIdY(staff.clefLineDiatonicId));
            this.rect.expandInPlace(this.clefImage.getRect());
            x = this.rect.right;

            if (this.eightBelowClef) {
                let r = this.clefImage.getRect();
                this.eightBelowClef.layout(ctx);
                this.eightBelowClef.offset(r.left + r.width / 2, Math.max(r.centerY + r.height * 0.3, staff.getBottomLineY()));
                this.rect.expandInPlace(this.eightBelowClef.getRect());
            }
        }

        if (this.measureNumber) {
            this.measureNumber.layout(ctx);
            let y = this.clefImage ? this.clefImage.getRect().top : staff.getTopLineY();
            this.measureNumber.offset(0, y);
            this.rect.expandInPlace(this.measureNumber.getRect());
            x = Math.max(x, this.rect.right);
        }

        if (this.ksNeutralizeAccidentals.length > 0) {
            x += paddingX;

            this.ksNeutralizeAccidentals.forEach(objAcc => {
                objAcc.layout(ctx);
                objAcc.offset(x + objAcc.getRect().leftw, staff.getDiatonicIdY(objAcc.diatonicId));
                this.rect.expandInPlace(objAcc.getRect());
                x = this.rect.right;
            });
        }

        if (this.ksNewAccidentals) {
            x += paddingX;

            this.ksNewAccidentals.forEach(objAcc => {
                objAcc.layout(ctx);
                objAcc.offset(x + objAcc.getRect().leftw, staff.getDiatonicIdY(objAcc.diatonicId));
                this.rect.expandInPlace(objAcc.getRect());
                x = this.rect.right;
            });
        }

        let right = x;

        this.beatCountText?.layout(ctx);
        this.beatSizeText?.layout(ctx);

        let tsWidth = Math.max(this.beatCountText?.getRect().width ?? 0, this.beatSizeText?.getRect().width ?? 0);

        if (this.beatCountText) {
            this.beatCountText.offset(x + tsWidth / 2 + paddingX, staff.getDiatonicIdY(staff.middleLineDiatonicId + 2));
            this.rect.expandInPlace(this.beatCountText.getRect());
            right = Math.max(right, this.rect.right);
        }

        if (this.beatSizeText) {
            this.beatSizeText.offset(x + tsWidth / 2 + paddingX, staff.getDiatonicIdY(staff.bottomLineDiatonicId + 2));
            this.rect.expandInPlace(this.beatSizeText.getRect());
            right = Math.max(right, this.rect.right);
        }

        x = right;

        if (this.tempoText) {
            let tempoBottom = Math.min(
                this.clefImage ? this.clefImage.getRect().top : staff.getTopLineY(),
                ...this.ksNeutralizeAccidentals.map(o => o.getRect().top),
                ...this.ksNewAccidentals.map(o => o.getRect().top)
            );
            this.tempoText.layout(ctx);
            this.tempoText.offset(x, tempoBottom);
            this.rect.expandInPlace(this.tempoText.getRect());
        }

        this.rect.right += paddingX;
    }

    offset(dx: number, dy: number) {
        this.clefImage?.offset(dx, dy);
        this.eightBelowClef?.offset(dx, dy);
        this.measureNumber?.offset(dx, dy);
        this.ksNeutralizeAccidentals.forEach(acc => acc.offset(dx, dy));
        this.ksNewAccidentals.forEach(acc => acc.offset(dx, dy));
        this.beatCountText?.offset(dx, dy);
        this.beatSizeText?.offset(dx, dy);
        this.tempoText?.offset(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        // Draw Clef
        this.clefImage?.draw(ctx);

        // DRaw 8 below clef
        this.eightBelowClef?.draw(ctx);

        // Draw measure number
        this.measureNumber?.draw(ctx);

        // Draw key signature
        this.ksNeutralizeAccidentals.forEach(acc => acc.draw(ctx));
        this.ksNewAccidentals.forEach(acc => acc.draw(ctx));

        // Draw time signature
        this.beatCountText?.draw(ctx);
        this.beatSizeText?.draw(ctx);

        // Draw tempo
        this.tempoText?.draw(ctx);
    }
}

export class ObjTabSignature extends MusicObject {
    private measureNumber?: ObjText;
    private beatCountText?: ObjText;
    private beatSizeText?: ObjText;
    private tempoText?: ObjText;

    readonly mi: MTabSignature;

    constructor(readonly measure: ObjMeasure, readonly tab: ObjTab) {
        super(measure);

        this.mi = new MTabSignature(this);
    }

    getMusicInterface(): MTabSignature {
        return this.mi;
    }

    updateMeasureNumber(showMeasureNumber: boolean) {
        if (showMeasureNumber) {
            let text = this.measure.getMeasureNumber().toString();
            this.measureNumber = new ObjText(this, text, 0, 1);
        }
        else {
            this.measureNumber = undefined;
        }
    }

    updateTimeSignature(showTimeSignature: boolean) {
        if (showTimeSignature) {
            let timeSignature = this.measure.getTimeSignature();

            let beatCount = timeSignature.beatCount.toString();
            this.beatCountText = new ObjText(this, { text: beatCount, scale: 1.4 }, 0.5, 0.5);

            let beatSize = timeSignature.beatSize.toString();
            this.beatSizeText = new ObjText(this, { text: beatSize, scale: 1.4 }, 0.5, 0.5);
        }
        else {
            this.beatCountText = this.beatSizeText = undefined;
        }
    }

    updateTempo(showTempo: boolean) {
        if (showTempo) {
            let tempoStr = getTempoString(this.measure.getTempo());
            this.tempoText = new ObjText(this, tempoStr, 0, 1);
        }
        else {
            this.tempoText = undefined;
        }
    }


    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        if (this.beatCountText) {
            let arr = this.beatCountText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.beatSizeText) {
            let arr = this.beatSizeText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.tempoText) {
            let arr = this.tempoText.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        if (this.measureNumber) {
            let arr = this.measureNumber.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layout(ctx: RenderContext) {
        let { unitSize } = ctx;
        let { tab } = this;

        let paddingX = unitSize;

        let x = 0;
        let topLineY = tab.getTopLineY();

        this.rect = new DivRect();

        if (this.measureNumber) {
            this.measureNumber.layout(ctx);
            this.measureNumber.offset(0, topLineY);
            this.rect.expandInPlace(this.measureNumber.getRect());
            x = Math.max(x, this.rect.right);
        }

        this.beatCountText?.layout(ctx);
        this.beatSizeText?.layout(ctx);

        let tsWidth = Math.max(this.beatCountText?.getRect().width ?? 0, this.beatSizeText?.getRect().width ?? 0);

        if (this.beatCountText) {
            this.beatCountText.offset(0 + tsWidth / 2 + paddingX, tab.getRect().centerY - this.beatCountText.getRect().bottomh);
            this.rect.expandInPlace(this.beatCountText.getRect());
        }

        if (this.beatSizeText) {
            this.beatSizeText.offset(0 + tsWidth / 2 + paddingX, tab.getRect().centerY + this.beatSizeText.getRect().toph);
            this.rect.expandInPlace(this.beatSizeText.getRect());
        }

        if (this.tempoText) {
            this.tempoText.layout(ctx);
            this.tempoText.offset(x + unitSize * 2, topLineY);
            this.rect.expandInPlace(this.tempoText.getRect());
        }

        this.rect.right += paddingX;
    }

    offset(dx: number, dy: number) {
        this.measureNumber?.offset(dx, dy);
        this.beatCountText?.offset(dx, dy);
        this.beatSizeText?.offset(dx, dy);
        this.tempoText?.offset(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        // Draw measure number
        this.measureNumber?.draw(ctx);

        // Draw time signature
        this.beatCountText?.draw(ctx);
        this.beatSizeText?.draw(ctx);

        // Draw tempo
        this.tempoText?.draw(ctx);
    }
}
