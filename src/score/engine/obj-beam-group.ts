import { Utils } from "@tspro/ts-utils-lib";
import { MinNoteLength, NoteLength } from "@tspro/web-music-score/theory";
import { ObjNoteGroup } from "./obj-note-group";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { DivRect, Stem, MBeamGroup, MusicInterface, MBeamGroupVisual } from "../pub";
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

class Segment {
    constructor(public lx: number, public ly: number, public rx: number, public ry: number, public start: number = 0, public end: number = 1) { }
    offset(dx: number, dy: number) {
        this.lx += dx;
        this.ly += dy;
        this.rx += dx;
        this.ry += dy;
    }
}

export class ObjBeamGroupVisual extends MusicObject {
    public tripletNumber?: ObjText;
    public segments: Segment[] = [];

    readonly mi: MBeamGroupVisual;

    constructor(readonly staff: ObjStaff) {
        super(staff);

        staff.addObject(this);

        this.mi = new MBeamGroupVisual(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    setRect(r: DivRect) {
        this.rect = r;
    }

    offset(dx: number, dy: number) {
        this.segments.forEach(s => s.offset(dx, dy));
        this.tripletNumber?.offset(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }
}

export class ObjBeamGroup extends MusicObject {
    readonly mi: MBeamGroup;

    private readonly type: BeamGroupType;

    private readonly staffVisuals: ObjBeamGroupVisual[] = [];

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
        if (!this.rect.contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.staffVisuals.length; i++) {
            let arr = this.staffVisuals[i].pick(x, y);
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
        this.rect = new DivRect();

        this.staffVisuals.length = 0;

        let symbols = this.getSymbols();

        if (symbols.length === 0) {
            return;
        }

        let { unitSize, beamThickness } = renderer;
        let { stemDir } = this;

        let symbolsBeamCoords = symbols.map(s => s.getBeamCoords());

        symbolsBeamCoords[0].map(s => s?.staff).forEach((staff, index) => {
            if (!staff) {
                return;
            }

            let symbolX = symbolsBeamCoords.map(s => s[index]?.x);
            let symbolY = symbolsBeamCoords.map(s => s[index]?.y);

            let leftX = symbolX[0];
            let leftY = symbolY[0];

            let rightX = symbolX[symbolX.length - 1];
            let rightY = symbolY[symbolY.length - 1];

            if (leftX === undefined || leftY === undefined || rightX === undefined || rightY === undefined) {
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

            let visual = new ObjBeamGroupVisual(staff);

            if (this.type === BeamGroupType.TripletGroup) {
                let ef = unitSize / (rightX - leftX);

                let l = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, -ef);
                let r = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, 1 + ef);

                visual.segments.push(new Segment(l.x, l.y, r.x, r.y));

                visual.setRect(new DivRect(l.x, r.x, Math.min(l.y, r.y), Math.max(l.y, r.y)));
            }
            else if (this.type === BeamGroupType.RegularBeam || this.type === BeamGroupType.TripletBeam) {
                raiseBeamY *= 0.5;

                // Update stem tips to beams
                symbols.forEach((s, i) => {
                    let symX = symbolX[i];
                    if (s instanceof ObjNoteGroup && symX !== undefined) {
                        let beamY = symbolY[i] = Utils.Math.interpolateY(leftX, leftY, rightX, rightY, symX);
                        s.setStemTipY(staff, beamY);
                    }
                });

                let beamSeparation = DocumentSettings.BeamSeparation * unitSize * (this.stemDir === Stem.Up ? 1 : -1);

                for (let i = 0; i < symbols.length - 1; i++) {
                    let left = symbols[i];
                    let right = symbols[i + 1];

                    if (!(left instanceof ObjNoteGroup && right instanceof ObjNoteGroup)) {
                        continue;
                    }

                    let leftBeamCount = left.getRightBeamCount();
                    let rightBeamCount = right.getLeftBeamCount();

                    let lx = symbolX[i];
                    let ly = symbolY[i];
                    let rx = symbolX[i + 1];
                    let ry = symbolY[i + 1];

                    if (lx !== undefined && ly !== undefined && rx !== undefined && ry !== undefined) {
                        for (let beamId = 0; beamId < Math.max(leftBeamCount, rightBeamCount); beamId++) {
                            if (beamId < leftBeamCount && beamId < rightBeamCount) {
                                visual.segments.push(new Segment(lx, ly, rx, ry));
                            }
                            else if (leftBeamCount > rightBeamCount) {
                                visual.segments.push(new Segment(lx, ly, rx, ry, 0, 0.25));
                            }
                            else if (rightBeamCount > leftBeamCount) {
                                visual.segments.push(new Segment(lx, ly, rx, ry, 0.75, 1));
                            }

                            ly += beamSeparation;
                            ry += beamSeparation;
                        }
                    }
                }

                if (visual.segments.length > 0) {
                    visual.setRect(new DivRect(
                        Math.min(...visual.segments.map(s => s.lx)),
                        Math.max(...visual.segments.map(s => s.rx)),
                        Math.min(...visual.segments.map(s => Math.min(s.ly, s.ry))) - beamThickness / 2,
                        Math.max(...visual.segments.map(s => Math.max(s.ly, s.ry))) + beamThickness / 2
                    ));
                }
            }

            if (this.isTriplet()) {
                visual.tripletNumber = new ObjText(this, "3", 0.5, 0.5);

                visual.tripletNumber.layout(renderer);
                visual.tripletNumber.offset((leftX + rightX) / 2, (leftY + rightY) / 2 + groupLineDy);

                visual.setRect(visual.getRect().expandInPlace(visual.tripletNumber.getRect()));
            }

            this.rect = visual.getRect().copy();

            if (visual.segments.length > 0) {
                this.staffVisuals.push(visual);
            }
        });

        this.staffVisuals.forEach(visual => this.rect.expandInPlace(visual.getRect()));
    }

    offset(dx: number, dy: number) {
        this.staffVisuals.forEach(visual => visual.offset(dx, 0));
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let { unitSize, beamThickness, lineWidth } = renderer;
        let color = "black";

        let symbols = this.getSymbols();

        this.staffVisuals.forEach(visual => {
            if (this.type === BeamGroupType.TripletGroup) {
                let s = visual.segments[0];

                if (s) {
                    let tf = visual.tripletNumber ? (visual.tripletNumber.getRect().width / (s.rx - s.lx) * 1.2) : 0;

                    let lc = Utils.Math.interpolateCoord(s.lx, s.ly, s.rx, s.ry, 0.5 - tf / 2);
                    let rc = Utils.Math.interpolateCoord(s.lx, s.ly, s.rx, s.ry, 0.5 + tf / 2);

                    let tipH = this.stemDir === Stem.Up ? unitSize : -unitSize;

                    renderer.drawLine(s.lx, s.ly, lc.x, lc.y, color, lineWidth);
                    renderer.drawLine(rc.x, rc.y, s.rx, s.ry, color, lineWidth);

                    renderer.drawLine(s.lx, s.ly, s.lx, s.ly + tipH, color, lineWidth);
                    renderer.drawLine(s.rx, s.ry, s.rx, s.ry + tipH, color, lineWidth);
                }
            }
            else if (this.type === BeamGroupType.RegularBeam || this.type === BeamGroupType.TripletBeam) {
                visual.segments.forEach(s => {
                    if (s.start === 0 && s.end === 1) {
                        renderer.drawLine(s.lx, s.ly, s.rx, s.ry, color, beamThickness);
                    }
                    else {
                        renderer.drawPartialLine(s.lx, s.ly, s.rx, s.ry, s.start, s.end, color, beamThickness);
                    }

                });
            }

            if (visual.tripletNumber) {
                visual.tripletNumber.draw(renderer);
            }
        });
    }
}
