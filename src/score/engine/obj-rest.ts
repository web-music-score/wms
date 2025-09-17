import { hasNoteLengthTriplet, Note, NoteLength, NoteLengthStr, RhythmProps, Tuplet, TupletRatio } from "@tspro/web-music-score/theory";
import { DivRect, MRest, MStaffRest, MusicInterface, RestOptions, Stem } from "../pub";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { AccidentalState } from "./acc-state";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjNotationLine, ObjStaff } from "./obj-staff-and-tab";

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

export class ObjStaffRest extends MusicObject {
    public restRect = new DivRect();
    public dotRects: DivRect[] = [];

    readonly mi: MStaffRest;

    constructor(readonly staff: ObjStaff, readonly rest: ObjRest) {
        super(staff);

        staff.addObject(this);

        this.mi = new MStaffRest(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    offset(dx: number, dy: number) {
        this.restRect.offsetInPlace(dx, dy);
        this.dotRects.forEach(r => r.offsetInPlace(dx, dy));
        this.requestRectUpdate();
        this.rest.requestRectUpdate();
    }

    updateRect(): void {
        this.rect = this.restRect.copy();
        this.dotRects.forEach(r => this.rect.expandInPlace(r));
    }
}

export class ObjRest extends MusicObject {
    readonly ownStemDir: Stem.Up | Stem.Down;
    readonly ownDiatonicId: number;

    readonly color: string;
    readonly hide: boolean;
    readonly oldStyleTriplet: boolean;
    readonly rhythmProps: RhythmProps;

    private beamGroup?: ObjBeamGroup;

    readonly staffObjects: ObjStaffRest[] = [];

    readonly mi: MRest;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: number, noteLength: NoteLength | NoteLengthStr, options?: RestOptions, tupletRatio?: TupletRatio) {
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
        this.oldStyleTriplet = tupletRatio === undefined && (options?.triplet === true || hasNoteLengthTriplet(noteLength));

        let dotCount = typeof options?.dotted === "number"
            ? (options.dotted > 0 ? options.dotted : undefined)
            : (options?.dotted === true ? 1 : undefined);

        this.rhythmProps = RhythmProps.get(noteLength, dotCount, tupletRatio ?? this.oldStyleTriplet ? Tuplet.Triplet : undefined);

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

    get stemDir(): Stem.Up | Stem.Down {
        return this.beamGroup ? this.beamGroup.stemDir : this.ownStemDir;
    }

    getStaticObjects(line: ObjNotationLine): ReadonlyArray<MusicObject> {
        let staticObjects: MusicObject[] = [];

        this.staffObjects.forEach(obj => {
            if (obj.staff === line) {
                staticObjects.push(obj);
            }
        });

        return staticObjects;
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.staffObjects.length; i++) {
            let arr = this.staffObjects[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return []; // Do not return [this].
    }


    getBeamGroup(): ObjBeamGroup | undefined {
        return this.beamGroup;
    }

    setBeamGroup(beamGroup: ObjBeamGroup) {
        this.beamGroup = beamGroup;
    }

    resetBeamGroup() {
        this.beamGroup = undefined;
    }

    getBeamCoords(): ({ staff: ObjStaff, x: number, y: number, stemHeight: number } | undefined)[] {
        return this.staffObjects.map(obj => {
            let staff = obj.staff;
            let x = obj.getRect().centerX;
            let y = this.stemDir === Stem.Up ? obj.getRect().top : obj.getRect().bottom;
            let stemHeight = Math.abs(obj.getRect().centerY - y);
            return { staff, x, y, stemHeight }
        });
    }

    isEmpty(): boolean {
        return this.staffObjects.length === 0;
    }

    visibleInStaff(staff: ObjStaff): boolean {
        return staff.containsVoiceId(this.voiceId) &&
            this.staffObjects.some(obj => obj instanceof ObjStaffRest && obj.staff === staff);
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
        this.requestRectUpdate();
        this.staffObjects.length = 0;

        if (this.hide) {
            return;
        }

        let { unitSize } = renderer;
        let { ownDiatonicId } = this;
        let { noteLength, dotCount, flagCount } = this.rhythmProps;

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

        this.row.getStaves().forEach(staff => {
            if (!staff.containsDiatonicId(ownDiatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjStaffRest(staff, this);

            obj.restRect = new DivRect(-leftw, 0, rightw, -toph, 0, bottomh);

            for (let i = 0; i < dotCount; i++) {
                let dotWidth = DocumentSettings.DotSize * unitSize;

                let dotX = rightw + (DocumentSettings.RestDotSpace + DocumentSettings.DotSize * unitSize) + i * DocumentSettings.DotSize * unitSize * 1.5;
                let dotY = this.getRestDotVerticalDisplacement(noteLength) * unitSize;

                obj.dotRects.push(DivRect.createCentered(dotX, dotY, dotWidth, dotWidth));
            }

            obj.offset(0, staff.getDiatonicIdY(ownDiatonicId));

            this.staffObjects.push(obj);
        });
    }

    updateRect() {
        if (this.staffObjects.length === 0) {
            this.rect = new DivRect();
        }
        else {
            this.rect = this.staffObjects[0].getRect().copy();
            if (this.staffObjects.length > 1) {
                for (let i = 1; i < this.staffObjects.length; i++) {
                    this.rect.expandInPlace(this.staffObjects[i].getRect());
                }
            }
        }
    }

    offset(dx: number, dy: number) {
        this.staffObjects.forEach(s => s.offset(dx, 0));
        this.requestRectUpdate();
    }

    draw(renderer: Renderer) {
        let ctx = renderer.getCanvasContext();

        if (!ctx || this.staffObjects.length === 0) {
            return;
        }

        renderer.drawDebugRect(this.getRect());

        let { unitSize, lineWidth } = renderer;
        let { color } = this;
        let { noteLength, flagCount } = this.rhythmProps;

        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        this.staffObjects.forEach(obj => {
            let { dotRects, restRect } = obj;

            let x = restRect.centerX;
            let y = restRect.centerY;

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

            dotRects.forEach(r => {
                renderer.fillCircle(r.centerX, r.centerY, r.width / 2);
            });
        });
    }
}
