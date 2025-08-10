import { Note, NoteLength, RhythmProps } from "@tspro/web-music-score/theory";
import { DivRect, MRest, RestOptions, Stem } from "../pub";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { AccidentalState } from "./acc-state";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { MusicStaff } from "./staff-and-tab";

function getDiatonicIdFromStaffPos(staffPos: Note | string | number | undefined): number | undefined {
    if (typeof staffPos === "number") {
        // staffPos is midiNumber/chromaticId
        return Note.getChromaticNote(staffPos).diatonicId;
    }
    else if (typeof staffPos === "string") {
        return Note.getNote(staffPos).diatonicId;
    }
    else if (staffPos instanceof Note) {
        return staffPos.diatonicId;
    }
    else {
        return undefined;
    }
}

class RestStaffObjects {
    constructor(readonly staff: MusicStaff) { }
    public rect = new DivRect();
    public dotRect?: DivRect;

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
        this.dotRect?.offsetInPlace(dx, dy);
    }
}

export class ObjRest extends MusicObject {
    readonly ownStemDir: Stem.Up | Stem.Down;
    readonly ownDiatonicId: number;

    readonly color: string;
    readonly hide: boolean;
    readonly rhythmProps: RhythmProps;

    private beamGroup?: ObjBeamGroup;

    readonly staffObjs: RestStaffObjects[] = [];

    readonly mi: MRest;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: number, noteLength: NoteLength, options?: RestOptions) {
        super(col);

        let diatonicId = getDiatonicIdFromStaffPos(options?.staffPos);

        if (diatonicId !== undefined) {
            let hasStaff = this.row.hasStaff;
            let staff = this.row.getStaff(diatonicId);
            if (hasStaff && !staff) {
                throw new MusicError(MusicErrorType.Score, "Rest staffPos is out of staff boundaries!");
            }
        }

        this.ownDiatonicId = this.measure.updateOwnDiatonicId(voiceId, diatonicId);
        this.ownStemDir = this.measure.updateOwnStemDir(this/*, options?.stem*/);

        // Make sure ownDiatonicId is line, not space
        let staff = this.row.getStaff(this.ownDiatonicId);
        if (staff && staff.isSpace(this.ownDiatonicId)) {
            this.ownDiatonicId += this.ownDiatonicId >= staff.middleLineDiatonicId ? 1 : -1;
        }

        this.color = options?.color ?? "black";
        this.hide = options?.hide ?? false;
        this.rhythmProps = new RhythmProps(noteLength, options?.dotted, options?.triplet);

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
        return this.beamGroup ? this.beamGroup.stemDir : this.ownStemDir;
    }

    get triplet() {
        return this.rhythmProps.triplet;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }


    getBeamGroup(): ObjBeamGroup | undefined {
        return this.beamGroup;
    }

    setBeamGroup(beam: ObjBeamGroup) {
        this.beamGroup = beam;
    }

    resetBeamGroup() {
        this.beamGroup = undefined;
    }

    getBeamX(staff: MusicStaff): number {
        let rect = this.staffObjs.find(s => s.staff === staff)?.rect ?? this.rect;
        return rect.centerX;
    }

    getBeamY(staff: MusicStaff): number {
        let rect = this.staffObjs.find(s => s.staff === staff)?.rect ?? this.rect;
        return this.stemDir === Stem.Up ? rect.top : rect.bottom;
    }

    private getRestDotVerticalDisplacement(noteLength: NoteLength): number {
        switch (noteLength) {
            case NoteLength.Whole: return 1;
            case NoteLength.Half: return -1;
            case NoteLength.Quarter: return -1;
            case NoteLength.Eighth: return -1;
            case NoteLength.Sixteenth: return -1;
            case NoteLength.ThirtySecond: return -3;
            case NoteLength.SixtyFourth: return -3;
            default:
                throw new MusicError(MusicErrorType.Score, "Cannot get rest dot vertical displacement because note length is invalid.");
        }
    }

    updateAccidentalState(accState: AccidentalState) { }

    layout(renderer: Renderer, accState: AccidentalState) {
        this.rect = new DivRect();

        this.staffObjs.length = 0;

        if (this.hide) {
            return;
        }

        let { unitSize } = renderer;
        let { ownDiatonicId } = this;
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

        this.row.getNotationLines().filter(line => line instanceof MusicStaff).forEach(staff => {
            if (!staff.containsDiatonicId(ownDiatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let staffObjs = new RestStaffObjects(staff);

            staffObjs.rect = new DivRect(-leftw, 0, rightw, -toph, 0, bottomh);

            if (dotted) {
                let dotWidth = DocumentSettings.DotSize * unitSize;

                let dotX = rightw + (DocumentSettings.RestDotSpace + DocumentSettings.DotSize / 2) * unitSize;
                let dotY = this.getRestDotVerticalDisplacement(noteLength) * unitSize;

                staffObjs.dotRect = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
                staffObjs.rect.expandInPlace(staffObjs.dotRect);
            }

            staffObjs.offset(0, staff.getDiatonicIdY(ownDiatonicId));

            this.rect = staffObjs.rect.copy();
            this.staffObjs.push(staffObjs);
        });

        this.staffObjs.forEach(staffObjs => this.rect.expandInPlace(staffObjs.rect));
    }

    offset(dx: number, dy: number) {
        this.staffObjs.forEach(s => s.offset(dx, dy));
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx || this.staffObjs.length === 0) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        let { unitSize, lineWidth } = renderer;
        let { color } = this;
        let { noteLength, flagCount } = this.rhythmProps;

        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        this.staffObjs.forEach(staffObjs => {
            let { rect, dotRect } = staffObjs;

            let x = rect.centerX;
            let y = rect.centerY;

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

            if (dotRect) {
                renderer.fillCircle(dotRect.centerX, dotRect.centerY, dotRect.width / 2);
            }
        });
    }
}
