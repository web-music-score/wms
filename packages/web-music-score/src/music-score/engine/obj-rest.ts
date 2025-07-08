import { NoteLength, RhythmProps } from "../../music-theory/rhythm";
import { Assert } from "@tspro/ts-utils-lib";
import { DivRect, MRest } from "../pub";
import { RestOptions, Stem } from "../pub/types";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { AccidentalState } from "./acc-state";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";

class RestStaffObjects {
    public dotRect = new DivRect();
    public beamGroup?: ObjBeamGroup;
}

export class ObjRest extends MusicObject {
    readonly ownStemDir: Stem.Up | Stem.Down;
    readonly ownAvgPitch: number;

    readonly color: string;
    readonly hide: boolean;
    readonly rhythmProps: RhythmProps;

    readonly staffObjs?: RestStaffObjects;

    readonly mi: MRest;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: number, noteLength: NoteLength, options?: RestOptions) {
        super(col);

        this.ownAvgPitch = this.measure.updateOwnAvgPitch(voiceId, options?.pitch);
        this.ownStemDir = this.measure.updateOwnStemDir(this/*, options?.stem*/);

        this.color = options?.color ?? "black";
        this.hide = options?.hide ?? false;
        this.rhythmProps = new RhythmProps(noteLength, options?.dotted, options?.triplet);

        this.staffObjs = this.row.hasStaff ? new RestStaffObjects() : undefined;

        this.mi = new MRest(this);
    }

    getMusicInterface(): MRest {
        return this.mi;
    }

    get doc() {
        return this.col.doc;
    }

    get measure() {
        return this.col.measure;
    }

    get row() {
        return this.col.row;
    }

    get noteLength() {
        return this.rhythmProps.noteLength;
    }

    get dotted() {
        return this.rhythmProps.dotted;
    }

    get stemDir(): Stem.Up | Stem.Down {
        if (this.staffObjs) {
            return this.staffObjs.beamGroup ? this.staffObjs.beamGroup.stemDir : this.ownStemDir;
        }
        else {
            return Stem.Up;
        }
    }

    get triplet() {
        return this.rhythmProps.triplet;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }


    getBeamGroup(): ObjBeamGroup | undefined {
        return this.staffObjs?.beamGroup;
    }

    setBeamGroup(beam: ObjBeamGroup) {
        if (this.staffObjs) {
            this.staffObjs.beamGroup = beam;
        }
    }

    resetBeamGroup() {
        if (this.staffObjs) {
            this.staffObjs.beamGroup = undefined;
        }
    }

    getBeamX() {
        return this.rect.centerX;
    }

    getBeamY() {
        return this.stemDir === Stem.Up ? this.rect.top : this.rect.bottom;
    }

    private getRestDotVerticalDisplacement(noteLength: NoteLength) {
        switch (noteLength) {
            case NoteLength.Whole: return 1;
            case NoteLength.Half: return -1;
            case NoteLength.Quarter: return -1;
            case NoteLength.Eighth: return -1;
            case NoteLength.Sixteenth: return -1;
            case NoteLength.ThirtySecond: return -3;
            case NoteLength.SixtyFourth: return -3;
            default:
                Assert.interrupt("Cannot get rest dot vertical displacement because note length is invalid.")
        }
    }

    updateAccidentalState(accState: AccidentalState) { }

    layout(renderer: Renderer, accState: AccidentalState) {
        if (this.hide || !this.staffObjs) {
            this.rect = new DivRect();
            return;
        }

        let { unitSize } = renderer;
        let { ownAvgPitch } = this;
        let { noteLength, dotted, flagCount } = this.rhythmProps;

        let leftw = 0;
        let rightw = 0;
        let toph = 0;
        let bottomh = 0;

        if (noteLength === NoteLength.Whole) {
            leftw = unitSize;
            rightw = unitSize;
            toph = 0;
            bottomh = unitSize;
        }
        else if (noteLength === NoteLength.Half) {
            leftw = unitSize;
            rightw = unitSize;
            toph = unitSize;
            bottomh = 0;
        }
        else if (noteLength === NoteLength.Quarter) {
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

        if (dotted) {
            let dotWidth = Renderer.DotSize * unitSize;

            let dotX = rightw + (DocumentSettings.RestDotSpace + Renderer.DotSize / 2) * unitSize;
            let dotY = this.getRestDotVerticalDisplacement(noteLength) * unitSize;

            this.staffObjs.dotRect = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);

            toph = Math.max(toph, this.staffObjs.dotRect.toph);
            bottomh = Math.max(bottomh, this.staffObjs.dotRect.bottomh);
            rightw += (DocumentSettings.RestDotSpace + Renderer.DotSize) * unitSize;
        }

        this.rect = new DivRect(-leftw, 0, rightw, -toph, 0, bottomh);

        let restPitch = ownAvgPitch;

        // Make sure restPitch is line, not space
        let staff = this.row.getStaff(restPitch);
        if (staff && staff.isPitchSpace(restPitch)) {
            restPitch += restPitch >= staff.middleLinePitch ? 1 : -1;
            this.offset(0, staff.getPitchY(restPitch));
        }
    }

    offset(dx: number, dy: number) {
        if (this.staffObjs) {
            this.staffObjs.dotRect.offsetInPlace(dx, dy);
        }

        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx || this.hide || !this.staffObjs) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        let { unitSize, lineWidth } = renderer;
        let { color, rect } = this;
        let { noteLength, dotted, flagCount } = this.rhythmProps;

        let x = rect.centerX;
        let y = rect.centerY;

        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        if (noteLength === NoteLength.Whole) {
            ctx.fillRect(x - unitSize, y, unitSize * 2, unitSize);
        }
        else if (noteLength === NoteLength.Half) {
            ctx.fillRect(x - unitSize, y - unitSize, unitSize * 2, unitSize);
        }
        else if (noteLength === NoteLength.Quarter) {
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

        if (dotted) {
            let r = this.staffObjs.dotRect;
            renderer.fillCircle(r.centerX, r.centerY, r.width / 2);
        }
    }
}
