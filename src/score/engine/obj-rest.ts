import { Note, NoteLength, NoteLengthProps, NoteLengthStr, RhythmProps, Tuplet, TupletRatio } from "@tspro/web-music-score/theory";
import { MRest, MStaffRest, MusicInterface, RestOptions, Stem, StringNumber, VoiceId } from "../pub";
import { MusicObject } from "./music-object";
import { RenderContext } from "./render-context";
import { AccidentalState } from "./acc-state";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjNotationLine, ObjStaff } from "./obj-staff-and-tab";
import { AnchoredRect } from "@tspro/ts-utils-lib";

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
    public restRect = new AnchoredRect();
    public dotRects: AnchoredRect[] = [];

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
        this.rect = this.restRect.clone();
        this.dotRects.forEach(r => this.rect.expandInPlace(r));
    }
}

export class ObjRest extends MusicObject {
    readonly color: string;
    readonly hide: boolean;
    readonly oldStyleTriplet: boolean;
    readonly rhythmProps: RhythmProps;

    static UndefinedDiatonicId: number = Infinity;

    readonly setDiatonicId: number;

    private runningDiatonicId: number; // Staff position of rest.
    private runningStemDir: Stem.Up | Stem.Down;

    private beamGroup?: ObjBeamGroup;

    readonly staffObjects: ObjStaffRest[] = [];

    readonly mi: MRest;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: VoiceId, noteLength: NoteLength | NoteLengthStr, readonly options?: RestOptions, tupletRatio?: TupletRatio) {
        super(col);


        this.setDiatonicId = getDiatonicIdFromStaffPos(this.options?.staffPos) ?? ObjRest.UndefinedDiatonicId;

        let staves = this.row.getStaves().filter(staff => staff.containsVoiceId(this.voiceId));

        if (this.setDiatonicId !== ObjRest.UndefinedDiatonicId && staves.length > 0 && staves[0].isSpace(this.setDiatonicId)) {
            this.setDiatonicId += this.setDiatonicId >= staves[0].middleLineDiatonicId ? 1 : -1;
        }

        // Init with something, will be updated.
        this.runningDiatonicId = this.setDiatonicId;
        this.runningStemDir = Stem.Up;

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

    getDiatonicId(staff?: ObjStaff): number {
        if (this.runningDiatonicId === ObjRest.UndefinedDiatonicId) {
            if (staff) {
                if (NoteLengthProps.equals(this.noteLength, "1n")) {
                    return staff.middleLineDiatonicId + 2;
                }
                else {
                    return staff.middleLineDiatonicId;
                }
            }
            else {
                return Note.getNote("G4").diatonicId;
            }
        }
        else {
            return this.runningDiatonicId;
        }
    }

    get stemDir(): Stem.Up | Stem.Down {
        return this.runningStemDir;
    }

    updateRunningArguments(diatonicId: number, stemDir: Stem.Up | Stem.Down, stringNumbers: StringNumber[]) {
        this.runningDiatonicId = diatonicId;
        this.runningStemDir = stemDir;
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
            let x = obj.getRect().anchorX;
            let y = this.stemDir === Stem.Up ? obj.getRect().top : obj.getRect().bottom;
            let stemHeight = Math.abs(obj.getRect().anchorY - y);
            return { staff, x, y, stemHeight }
        });
    }

    hasTuplet(): boolean {
        return this.rhythmProps.tupletRatio !== undefined;
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

    layout(ctx: RenderContext, accState: AccidentalState) {
        this.requestRectUpdate();
        this.staffObjects.length = 0;

        if (this.hide) {
            return;
        }

        let { unitSize } = ctx;
        let { noteSize, dotCount } = this.rhythmProps;

        this.row.getStaves().forEach(staff => {
            let diatonicId = this.getDiatonicId(staff);

            if (!staff.containsDiatonicId(diatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjStaffRest(staff, this);

            obj.restRect = ctx.getRestRect(noteSize);

            for (let i = 0; i < dotCount; i++) {
                let dotWidth = DocumentSettings.DotSize * unitSize;

                let dotX = obj.restRect.rightw + (DocumentSettings.RestDotSpace + DocumentSettings.DotSize * unitSize) + i * DocumentSettings.DotSize * unitSize * 1.5;
                let dotY = this.getRestDotVerticalDisplacement(noteSize) * unitSize;

                obj.dotRects.push(AnchoredRect.createCentered(dotX, dotY, dotWidth, dotWidth));
            }

            obj.offset(0, staff.getDiatonicIdY(diatonicId));

            this.staffObjects.push(obj);
            this.measure.addStaticObject(staff, obj);
        });
    }

    updateRect() {
        if (this.staffObjects.length === 0) {
            this.rect = new AnchoredRect();
        }
        else {
            this.rect = this.staffObjects[0].getRect().clone();
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

    draw(ctx: RenderContext) {
        if (this.staffObjects.length === 0) {
            return;
        }

        ctx.drawDebugRect(this.getRect());

        let { noteSize } = this.rhythmProps;

        ctx.color(this.color).lineWidth(1);

        this.staffObjects.forEach(obj => {
            let { dotRects, restRect } = obj;

            ctx.drawRest(noteSize, restRect.anchorX, restRect.anchorY);

            dotRects.forEach(r => ctx.fillCircle(r.anchorX, r.anchorY, r.width / 2));
        });
    }
}
