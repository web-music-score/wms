import { Note, NoteLength, NoteLengthProps, NoteLengthStr, RhythmProps, Tuplet, TupletRatio } from "@tspro/web-music-score/theory";
import { DivRect, MRest, MStaffRest, MusicInterface, RestOptions, Stem, VoiceId } from "../pub";
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

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: VoiceId, noteLength: NoteLength | NoteLengthStr, options?: RestOptions, tupletRatio?: TupletRatio) {
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
        this.oldStyleTriplet = tupletRatio === undefined && (options?.triplet === true || NoteLengthProps.get(noteLength).isTriplet);

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

    private getRestDotVerticalDisplacement(noteSize: number): number {
        switch (noteSize) {
            case 1: return 1;
            case 2: return -1;
            case 4: return -1;
            case 8: return -1;
            case 16: return -1;
            case 32: return -3;
            case 64: return -3;
            default:
                throw new MusicError(MusicErrorType.Score, `Get rest dot vertical displacement: Invalid note size: ${noteSize}`);
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
        let { noteSize, dotCount } = this.rhythmProps;

        this.row.getStaves().forEach(staff => {
            if (!staff.containsDiatonicId(ownDiatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjStaffRest(staff, this);

            obj.restRect = renderer.getRestRect(noteSize);

            for (let i = 0; i < dotCount; i++) {
                let dotWidth = DocumentSettings.DotSize * unitSize;

                let dotX = obj.restRect.rightw + (DocumentSettings.RestDotSpace + DocumentSettings.DotSize * unitSize) + i * DocumentSettings.DotSize * unitSize * 1.5;
                let dotY = this.getRestDotVerticalDisplacement(noteSize) * unitSize;

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

        let { lineWidth } = renderer;
        let { color } = this;
        let { noteSize } = this.rhythmProps;

        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        this.staffObjects.forEach(obj => {
            let { dotRects, restRect } = obj;

            let x = restRect.centerX;
            let y = restRect.centerY;

            renderer.drawRest(noteSize, x, y, color);

            dotRects.forEach(r => {
                renderer.fillCircle(r.centerX, r.centerY, r.width / 2);
            });
        });
    }
}
