import { Utils } from "@tspro/ts-utils-lib";
import { MinNoteLength, NoteLength } from "@tspro/web-music-score/theory";
import { ObjNoteGroup } from "./obj-note-group";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { DivRect, Stem, MBeamGroup, MusicInterface, MStaffBeamGroup } from "../pub";
import { RhythmSymbol } from "./obj-rhythm-column";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjStaff } from "./obj-staff-and-tab";

export enum BeamGroupType {
    RegularBeam,
    TripletBeam,
    TripletGroup
}

const adjustBeamAngle = (dx: number, dy: number) => {
    let T = DocumentSettings.BeamAngleFactor;

    if (!Number.isFinite(T) || T === 0) {
        return dy;
    }
    else {
        let k = dx / dy / T;
        k = Math.sign(k) * Math.sqrt(Math.abs(k));
        return dx / k * T;
    }
}

class BeamPoint {
    public topBeamsHeight = 0;
    public bottomBeamsHeight = 0;

    constructor(public staff: ObjStaff, public beamGroup: ObjBeamGroup, public symbol: RhythmSymbol, public x: number, public y: number) {
        staff.addObject(this);
    }

    offset(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
        this.beamGroup.requestRectUpdate();
    }

    getRect(): DivRect {
        return new DivRect(this.x, this.x, this.x, this.y - this.topBeamsHeight, this.y, this.y + this.bottomBeamsHeight);
    }
}

export class ObjStaffBeamGroup extends MusicObject {
    public tripletNumber?: ObjText;
    public tripletNumberOffsetY = 0;

    public points: BeamPoint[] = [];

    readonly mi: MStaffBeamGroup;

    constructor(readonly staff: ObjStaff, readonly beamGroup: ObjBeamGroup) {
        super(staff);

        staff.addObject(this);

        this.mi = new MStaffBeamGroup(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    offset(dx: number, dy: number) {
        this.points.forEach(p => p.offset(dx, 0));
        this.tripletNumber?.offset(dx, dy);
        this.requestRectUpdate();
        this.beamGroup.requestRectUpdate();
    }

    updateRect() {
        if (this.points.length > 0) {
            this.rect = this.points[0].getRect().copy();
        }
        else if (this.tripletNumber) {
            this.rect = this.tripletNumber.getRect().copy();
        }
        this.points.forEach(pt => this.rect.expandInPlace(pt.getRect()));
        if (this.tripletNumber) {
            this.rect.expandInPlace(this.tripletNumber.getRect());
        }
    }
}

export class ObjBeamGroup extends MusicObject {
    readonly mi: MBeamGroup;

    private readonly type: BeamGroupType;

    private readonly staffObjects: ObjStaffBeamGroup[] = [];

    private constructor(private readonly symbols: RhythmSymbol[], triplet: boolean) {
        super(symbols[0].measure);

        this.mi = new MBeamGroup(this);

        if (!symbols.every(s => s.measure === symbols[0].measure)) {
            throw new MusicError(MusicErrorType.Score, "All beam group symbols are not in same measure.");
        }
        else if (symbols.length < 2) {
            throw new MusicError(MusicErrorType.Score, "Beam group need minimum 2 symbols, but " + symbols.length + " given.");
        }

        if (triplet) {
            if (!symbols.every(s => s.triplet)) {
                throw new MusicError(MusicErrorType.Score, "Not every symbol's triplet property is true.");
            }

            let isGroup =
                symbols.length < 3 ||
                symbols.some(s => !(s instanceof ObjNoteGroup)) ||
                symbols.some(s => s.rhythmProps.flagCount !== symbols[0].rhythmProps.flagCount);

            // There can be rest between edge notes, no group needed.
            if (symbols.length === 3 &&
                symbols[0] instanceof ObjNoteGroup &&
                symbols[symbols.length - 1] instanceof ObjNoteGroup &&
                symbols[0].rhythmProps.flagCount === symbols[symbols.length - 1].rhythmProps.flagCount) {
                isGroup = false;
            }

            // Quarter notes or longer do not have beam => use group.
            if (symbols.some(s => s.rhythmProps.noteLength >= NoteLength.Quarter)) {
                isGroup = true;
            }

            this.type = isGroup ? BeamGroupType.TripletGroup : BeamGroupType.TripletBeam;

            ObjNoteGroup.setTripletBeamCounts(this);
        }
        else {
            this.type = BeamGroupType.RegularBeam;
        }

        // Add this beam group to symbols and measure.
        if (symbols.every(s => s.getBeamGroup() === undefined)) {
            symbols.forEach(s => s.setBeamGroup(this));
            symbols[0].measure.addBeamGroup(this);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Cannot add beam group because some symbol already has one.");
        }
    }

    static createBeam(noteGroups: ObjNoteGroup[]) {
        if (noteGroups.length > 1) {
            new ObjBeamGroup(noteGroups, false);
        }
    }

    static createTriplet(symbols: RhythmSymbol[]) {
        if (!symbols.every(s => s.triplet)) {
            return false;
        }

        // max triplet note length (must have stem)
        let MaxTripletNoteLenght = NoteLength.Half;

        let len = symbols.map(s => s.rhythmProps.noteLength);

        if (symbols.length == 2) {
            if (
                (len[0] <= MaxTripletNoteLenght && len[1] === len[0] / 2 && len[0] / 2 >= MinNoteLength) ||
                (len[1] <= MaxTripletNoteLenght && len[0] === len[1] / 2 && len[1] / 2 >= MinNoteLength)
            ) {
                new ObjBeamGroup(symbols, true);
                return true;
            }
        }
        else if (symbols.length === 3) {
            if (len[0] <= MaxTripletNoteLenght && len.every(l => l === len[0])) {
                new ObjBeamGroup(symbols, true);
                return true;
            }
        }

        return false;
    }

    getMusicInterface(): MBeamGroup {
        return this.mi;
    }

    detach() {
        this.getSymbols().forEach(s => s.resetBeamGroup());
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

        return [this];
    }

    getType() {
        return this.type;
    }

    isTriplet() {
        return this.type === BeamGroupType.TripletBeam || this.type === BeamGroupType.TripletGroup;
    }

    getSymbols(): ReadonlyArray<RhythmSymbol> {
        return this.symbols;
    }

    getFirstSymbol(): RhythmSymbol | undefined {
        return this.symbols[0];
    }

    getLastSymbol(): RhythmSymbol | undefined {
        return this.symbols[this.symbols.length - 1];
    }

    get stemDir(): Stem.Up | Stem.Down {
        return this.symbols[0].ownStemDir;
    }

    layout(renderer: Renderer) {
        this.requestRectUpdate();
        this.staffObjects.length = 0;

        let symbols = this.getSymbols();

        if (symbols.length === 0) {
            return;
        }

        let { unitSize } = renderer;
        let { stemDir } = this;

        let symbolsBeamCoords = symbols.map(s => s.getBeamCoords());

        symbolsBeamCoords[0].map(s => s?.staff).forEach((mainStaff, index) => {
            if (!mainStaff) {
                return;
            }

            let symbolX = symbolsBeamCoords.map(s => s[index]?.x);
            let symbolY = symbolsBeamCoords.map(s => s[index]?.y);
            let symbolStaff = symbolsBeamCoords.map(s => s[index]?.staff);

            let leftSymbol = symbols[0];
            let leftX = symbolX[0];
            let leftY = symbolY[0];
            let leftStaff = symbolStaff[0];

            let rightSymbol = symbols[symbols.length - 1];
            let rightX = symbolX[symbolX.length - 1];
            let rightY = symbolY[symbolY.length - 1];
            let rightStaff = symbolStaff[symbolY.length - 1];

            if (leftX === undefined || leftY === undefined || leftStaff === undefined ||
                rightX === undefined || rightY === undefined || rightStaff === undefined) {
                return;
            }

            let groupLineDy = unitSize * 2 * (stemDir === Stem.Up ? -1 : 1);

            // Make beam less tilted
            let centerY = (rightY + leftY) / 2;
            let halfDy = adjustBeamAngle(rightX - leftX, rightY - leftY) / 2;

            leftY = centerY - halfDy;
            rightY = centerY + halfDy;

            // Find beams y-position
            let raiseBeamY = 0;

            symbolY.forEach((symY, i) => {
                let symX = symbolX[i];
                if (symX !== undefined && symY !== undefined) {
                    let beamY = Utils.Math.interpolateY(leftX, leftY!, rightX, rightY!, symX);
                    let raiseY = symY - beamY;
                    if (stemDir === Stem.Up && raiseY < 0) {
                        raiseBeamY = Math.min(raiseBeamY, raiseY);
                    }
                    else if (stemDir === Stem.Down && raiseY > 0) {
                        raiseBeamY = Math.max(raiseBeamY, raiseY);
                    }
                }
            });

            leftY += raiseBeamY;
            rightY += raiseBeamY;
            symbolY = symbolY.map(y => y === undefined ? undefined : y + raiseBeamY);

            let obj = new ObjStaffBeamGroup(mainStaff, this);

            if (this.type === BeamGroupType.TripletGroup) {
                let ef = unitSize / (rightX - leftX);

                let l = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, -ef);
                let r = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, 1 + ef);

                obj.points.push(new BeamPoint(leftStaff, this, leftSymbol, l.x, l.y));
                obj.points.push(new BeamPoint(rightStaff, this, rightSymbol, r.x, r.y));

                obj.tripletNumberOffsetY = 0;
            }
            else if (this.type === BeamGroupType.RegularBeam || this.type === BeamGroupType.TripletBeam) {
                raiseBeamY *= 0.5;

                let { beamThickness } = renderer;

                const beamHeight = (i: number) => {
                    let sym = symbols[i];
                    if (sym instanceof ObjNoteGroup) {
                        let beamCount = sym instanceof ObjNoteGroup ? Math.max(sym.getLeftBeamCount(), sym.getRightBeamCount()) : 0;
                        return DocumentSettings.BeamSeparation * unitSize * (this.stemDir === Stem.Up ? beamCount - 1 : 0);
                    }
                    else {
                        return 0;
                    }
                }

                symbols.forEach((sym, i) => {
                    let symStaff = symbolStaff[i];
                    let symX = symbolX[i];
                    let symY = symbolY[i];
                    if (symStaff && symX !== undefined && symY !== undefined) {
                        let pt = new BeamPoint(symStaff, this, sym, symX, symY);
                        pt.topBeamsHeight = beamThickness / 2 + (stemDir === Stem.Down ? beamHeight(i) : 0);
                        pt.bottomBeamsHeight = beamThickness / 2 + (stemDir === Stem.Up ? beamHeight(i) : 0);
                        obj.points.push(pt);
                    }
                });

                obj.tripletNumberOffsetY = groupLineDy;
            }

            if (this.isTriplet()) {
                obj.tripletNumber = new ObjText(this, "3", 0.5, 0.5);

                obj.tripletNumber.layout(renderer);
                obj.tripletNumber.offset((leftX + rightX) / 2, (leftY + rightY) / 2 + obj.tripletNumberOffsetY);
            }

            if (obj.points.length >= 2) {
                this.staffObjects.push(obj);
            }
        });
    }

    updateRect() {
        if (this.staffObjects.length === 0) {
            this.rect = new DivRect();
        }
        else {
            this.staffObjects.forEach(obj => obj.updateRect());

            this.rect = this.staffObjects[0].getRect().copy();

            for (let i = 1; i < this.staffObjects.length; i++) {
                this.rect.expandInPlace(this.staffObjects[i].getRect());
            }
        }
    }

    updateStemTips() {
        this.staffObjects.forEach(obj => {
            let left = obj.points[0];
            let right = obj.points[obj.points.length - 1];

            if (this.type !== BeamGroupType.TripletGroup) {
                obj.points.forEach(pt => {
                    if (pt.symbol instanceof ObjNoteGroup) {
                        if (pt !== left && pt !== right) {
                            pt.y = Utils.Math.interpolateY(left.x, left.y, right.x, right.y, pt.x);
                        }
                        pt.symbol.setStemTipY(pt.staff, pt.y);
                    }
                });
            }

            if (obj.tripletNumber) {
                let y = (left.y + right.y) / 2 + obj.tripletNumberOffsetY;
                obj.tripletNumber.offset(0, -obj.tripletNumber.getRect().centerY + y);
            }
        });
    }

    offset(dx: number, dy: number) {
        this.staffObjects.forEach(obj => obj.offset(dx, 0));
        this.requestRectUpdate();
    }

    draw(renderer: Renderer) {
        let { unitSize, beamThickness, lineWidth } = renderer;
        let color = "black";

        this.staffObjects.forEach(obj => {
            if (this.type === BeamGroupType.TripletGroup) {
                let l = obj.points[0];
                let r = obj.points[obj.points.length - 1];

                if (l && r) {
                    let tf = obj.tripletNumber ? (obj.tripletNumber.getRect().width / (r.x - l.x) * 1.2) : 0;

                    let lc = Utils.Math.interpolateCoord(l.x, l.y, r.x, r.y, 0.5 - tf / 2);
                    let rc = Utils.Math.interpolateCoord(l.x, l.y, r.x, r.y, 0.5 + tf / 2);

                    let tipH = this.stemDir === Stem.Up ? unitSize : -unitSize;

                    renderer.drawLine(l.x, l.y, lc.x, lc.y, color, lineWidth);
                    renderer.drawLine(rc.x, rc.y, r.x, r.y, color, lineWidth);

                    renderer.drawLine(l.x, l.y, l.x, l.y + tipH, color, lineWidth);
                    renderer.drawLine(r.x, r.y, r.x, r.y + tipH, color, lineWidth);
                }
            }
            else if (this.type === BeamGroupType.RegularBeam || this.type === BeamGroupType.TripletBeam) {
                let beamSeparation = DocumentSettings.BeamSeparation * unitSize * (this.stemDir === Stem.Up ? 1 : -1);

                let noteGroupPoints = obj.points.filter(p => p.symbol instanceof ObjNoteGroup);

                for (let i = 0; i < noteGroupPoints.length - 1; i++) {
                    let left = noteGroupPoints[i];
                    let right = noteGroupPoints[i + 1];

                    if (!(left.symbol instanceof ObjNoteGroup && right.symbol instanceof ObjNoteGroup)) {
                        continue;
                    }

                    let leftBeamCount = left.symbol.getRightBeamCount();
                    let rightBeamCount = right.symbol.getLeftBeamCount();

                    let lx = left.x;
                    let ly = left.y;
                    let rx = right.x;
                    let ry = right.y;

                    for (let beamId = 0; beamId < Math.max(leftBeamCount, rightBeamCount); beamId++) {
                        if (beamId < leftBeamCount && beamId < rightBeamCount) {
                            renderer.drawLine(lx, ly, rx, ry, color, beamThickness);
                        }
                        else if (leftBeamCount > rightBeamCount) {
                            renderer.drawPartialLine(lx, ly, rx, ry, 0, 0.25, color, beamThickness);
                        }
                        else if (rightBeamCount > leftBeamCount) {
                            renderer.drawPartialLine(lx, ly, rx, ry, 0.75, 1, color, beamThickness);
                        }

                        ly += beamSeparation;
                        ry += beamSeparation;
                    }
                }
            }

            if (obj.tripletNumber) {
                obj.tripletNumber.draw(renderer);
            }
        });
    }
}
