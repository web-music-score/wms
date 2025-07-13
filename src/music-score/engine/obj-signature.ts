import { Assert } from "@tspro/ts-utils-lib";
import { DivRect, MSignature } from "../pub";
import { Accidental, Note } from "../../music-theory/note";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { ObjImage } from "./obj-image";
import { ClefKind, MusicStaff } from "./staff-and-tab";
import { ObjAccidental } from "./obj-accidental";
import { ObjText } from "./obj-text";
import { ObjMeasure } from "./obj-measure";
import { getTempoString } from "../../music-theory/tempo";

type AccPitch = { obj: ObjAccidental, pitch: number }

export class ObjSignature extends MusicObject {
    private clefImage?: ObjImage;
    private eightBelowClef?: ObjText;
    private measureNumber?: ObjText;
    private ksNeutralizeAccidentals: AccPitch[] = [];
    private ksNewAccidentals: AccPitch[] = [];
    private beatCountText?: ObjText;
    private beatSizeText?: ObjText;
    private tempoText?: ObjText;

    readonly mi: MSignature;

    constructor(readonly measure: ObjMeasure, readonly staff: MusicStaff) {
        super(measure);

        this.mi = new MSignature(this);
    }

    getMusicInterface(): MSignature {
        return this.mi;
    }

    accPitch(accidental: Accidental, pitch: number): AccPitch {
        return { obj: new ObjAccidental(this, accidental), pitch }
    }

    updateClefImage(renderer: Renderer, showClef: boolean) {
        if (showClef) {
            let img = renderer.getImageAsset(this.staff.clefImageAsset);
            this.clefImage = img ? new ObjImage(this, img, 0, 0.5, 0.1) : undefined;

            this.eightBelowClef = this.clefImage && this.staff.octaveLower
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
            if (prevKeySignature && !newKeySignature.equals(prevKeySignature)) {
                prevKeySignature.getOrderedAccidentalNotes().forEach(acc => {
                    // Neutral accidental
                    this.ksNeutralizeAccidentals.push(this.accPitch(0, this.getAccidentalPitch(acc)));
                });
            }

            // Set new key signature
            newKeySignature.getOrderedAccidentalNotes().forEach(acc => {
                this.ksNewAccidentals.push(this.accPitch(acc.accidental, this.getAccidentalPitch(acc)));
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
            this.beatCountText = new ObjText(this, { text: beatCount, scale: 1.4 }, 0, 0.5);

            let beatSize = timeSignature.beatSize.toString();
            this.beatSizeText = new ObjText(this, { text: beatSize, scale: 1.4 }, 0, 0.5);
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

    private getAccidentalPitch(accNote: Note): number {
        let clefKind = this.staff.clefKind;

        let lowestAccidentalPitch: number | undefined = undefined;

        if (clefKind === ClefKind.Treble) {
            if (accNote.accidental > 0) {
                lowestAccidentalPitch = this.staff.bottomLinePitch + 3;
            }
            else if (accNote.accidental < 0) {
                lowestAccidentalPitch = this.staff.bottomLinePitch + 1;
            }
        }
        else if (clefKind === ClefKind.Bass) {
            if (accNote.accidental > 0) {
                lowestAccidentalPitch = this.staff.bottomLinePitch + 1;
            }
            else if (accNote.accidental < 0) {
                lowestAccidentalPitch = this.staff.bottomLinePitch - 1;
            }
        }

        if (lowestAccidentalPitch !== undefined) {
            // Calculate lowest pitch that is pitch >= lowestAccidentalPitch.
            let i = Math.floor(lowestAccidentalPitch / 7);
            let r = lowestAccidentalPitch % 7;
            return i * 7 + accNote.pitchMod7 + (accNote.pitchMod7 < r ? 7 : 0);
        }
        else {
            Assert.interrupt("Cannot get accidental pitch because note has no accidental.")
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
            let arr = this.ksNeutralizeAccidentals[i].obj.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.ksNewAccidentals.length; i++) {
            let arr = this.ksNewAccidentals[i].obj.pick(x, y);
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

        return [this];
    }

    layout(renderer: Renderer) {
        let { unitSize } = renderer;
        let { measure, staff } = this;
        let { row } = measure;

        let paddingX = unitSize;

        let x = 0;

        this.rect = new DivRect();

        if (this.clefImage) {
            x += paddingX;
            this.clefImage.layout(renderer);
            this.clefImage.offset(x, staff.getPitchY(staff.clefLinePitch));
            this.rect.expandInPlace(this.clefImage.getRect());
            x = this.rect.right;

            if (this.eightBelowClef) {
                let r = this.clefImage.getRect();
                this.eightBelowClef.layout(renderer);
                this.eightBelowClef.offset(r.left + r.width / 2, r.centerY + r.height * 0.3);
                this.rect.expandInPlace(this.eightBelowClef.getRect());
            }
        }

        if (this.measureNumber) {
            this.measureNumber.layout(renderer);
            let y = this.clefImage ? this.clefImage.getRect().top : staff.topLineY;
            this.measureNumber.offset(0, y);
            this.rect.expandInPlace(this.measureNumber.getRect());
            x = Math.max(x, this.rect.right);
        }

        if (this.ksNeutralizeAccidentals.length > 0) {
            x += paddingX;

            this.ksNeutralizeAccidentals.forEach(acc => {
                let accStaff = row.getStaff(acc.pitch);
                if (accStaff) {
                    acc.obj.layout(renderer);
                    acc.obj.offset(x + acc.obj.getRect().leftw, accStaff.getPitchY(acc.pitch));
                    this.rect.expandInPlace(acc.obj.getRect());
                    x = this.rect.right;
                }
            });
        }

        if (this.ksNewAccidentals) {
            x += paddingX;

            this.ksNewAccidentals.forEach(acc => {
                let accStaff = row.getStaff(acc.pitch);
                if (accStaff) {
                    acc.obj.layout(renderer);
                    acc.obj.offset(x + acc.obj.getRect().leftw, accStaff.getPitchY(acc.pitch));
                    this.rect.expandInPlace(acc.obj.getRect());
                    x = this.rect.right;
                }
            });
        }

        let right = x;

        if (this.beatCountText) {
            this.beatCountText.layout(renderer);
            this.beatCountText.offset(x + paddingX, staff.getPitchY(staff.middleLinePitch + 2));
            this.rect.expandInPlace(this.beatCountText.getRect());
            right = Math.max(right, this.rect.right);
        }

        if (this.beatSizeText) {
            this.beatSizeText.layout(renderer);
            this.beatSizeText.offset(x + paddingX, staff.getPitchY(staff.bottomLinePitch + 2));
            this.rect.expandInPlace(this.beatSizeText.getRect());
            right = Math.max(right, this.rect.right);
        }

        x = right;

        if (this.tempoText) {
            this.tempoText.layout(renderer);
            this.tempoText.offset(x, Math.min(this.rect.top, staff.topLineY));
            this.rect.expandInPlace(this.tempoText.getRect());
        }

        this.rect.expandInPlace(new DivRect(
            this.rect.left, this.rect.right + paddingX, this.rect.centerY, this.rect.centerY
        ));
    }

    offset(dx: number, dy: number) {
        if (this.clefImage) {
            this.clefImage.offset(dx, dy);
        }

        if (this.eightBelowClef) {
            this.eightBelowClef.offset(dx, dy);
        }

        if (this.measureNumber) {
            this.measureNumber.offset(dx, dy);
        }

        this.ksNeutralizeAccidentals.forEach(acc => acc.obj.offset(dx, dy));
        this.ksNewAccidentals.forEach(acc => acc.obj.offset(dx, dy));

        if (this.beatCountText) {
            this.beatCountText.offset(dx, dy);
        }

        if (this.beatSizeText) {
            this.beatSizeText.offset(dx, dy);
        }

        if (this.tempoText) {
            this.tempoText.offset(dx, dy);
        }

        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        // Draw Clef
        if (this.clefImage) {
            this.clefImage.draw(renderer);
        }

        if (this.eightBelowClef) {
            this.eightBelowClef.draw(renderer);
        }

        // Draw measure number
        if (this.measureNumber) {
            this.measureNumber.draw(renderer);
        }

        // Draw key signature
        this.ksNeutralizeAccidentals.forEach(acc => acc.obj.draw(renderer));
        this.ksNewAccidentals.forEach(acc => acc.obj.draw(renderer));

        // Draw time signature
        if (this.beatCountText) {
            this.beatCountText.draw(renderer);
        }
        if (this.beatSizeText) {
            this.beatSizeText.draw(renderer);
        }

        // Draw tempo
        if (this.tempoText) {
            this.tempoText.draw(renderer);
        }
    }
}
