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

export class ObjBeamGroupVisual extends MusicObject {
    public tripletNumber?: ObjText;
    public groupLineLeft?: { x: number, y: number };
    public groupLineRight?: { x: number, y: number };

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
        if (this.groupLineLeft) {
            this.groupLineLeft.x += dx;
            this.groupLineLeft.y += dy;
        }
        if (this.groupLineRight) {
            this.groupLineRight.x += dx;
            this.groupLineRight.y += dy;
        }
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

        symbols[0].row.getNotationLines().filter(line => line instanceof ObjStaff).forEach(staff => {
            let visual = new ObjBeamGroupVisual(staff);

            let leftX = symbols[0].getBeamX(staff);
            let leftY = symbols[0].getBeamY(staff);

            let rightX = symbols[symbols.length - 1].getBeamX(staff);
            let rightY = symbols[symbols.length - 1].getBeamY(staff);

            let groupLineDy = unitSize * 2 * (stemDir === Stem.Up ? -1 : 1);

            // Make beam less tilted
            let centerY = (rightY + leftY) / 2;
            let halfDy = adjustBeamAngle(rightX - leftX, rightY - leftY) / 2;

            leftY = centerY - halfDy;
            rightY = centerY + halfDy;

            // Find beams y-position
            let raiseBeamY = 0;

            symbols.forEach(s => {
                let beamY = Utils.Math.interpolateY(leftX, leftY, rightX, rightY, s.getBeamX(staff));
                let raiseY = s.getBeamY(staff) - beamY;
                if (stemDir === Stem.Up && raiseY < 0) {
                    raiseBeamY = Math.min(raiseBeamY, raiseY);
                }
                else if (stemDir === Stem.Down && raiseY > 0) {
                    raiseBeamY = Math.max(raiseBeamY, raiseY);
                }
            });

            leftY += raiseBeamY;
            rightY += raiseBeamY;

            if (this.type === BeamGroupType.TripletGroup) {
                let { unitSize } = renderer;

                let ef = unitSize / (rightX - leftX);

                visual.groupLineLeft = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, -ef);
                visual.groupLineRight = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, 1 + ef);

                visual.setRect(new DivRect(
                    visual.groupLineLeft.x,
                    visual.groupLineRight.x,
                    Math.min(visual.groupLineLeft.y, visual.groupLineRight.y),
                    Math.max(visual.groupLineLeft.y, visual.groupLineRight.y)
                ));
            }
            else if (this.type === BeamGroupType.RegularBeam || this.type === BeamGroupType.TripletBeam) {
                raiseBeamY *= 0.5;

                // Update stem tips to beams
                this.symbols.forEach(s => {
                    if (s instanceof ObjNoteGroup) {
                        let beamY = Utils.Math.interpolateY(leftX, leftY, rightX, rightY, s.getBeamX(staff));
                        s.setStemTipY(staff, beamY);
                    }
                });

                visual.setRect(new DivRect(
                    leftX,
                    rightX,
                    Math.min(leftY, rightY) - beamThickness / 2,
                    Math.max(leftY, rightY) + beamThickness / 2
                ));
            }

            if (this.isTriplet()) {
                visual.tripletNumber = new ObjText(this, "3", 0.5, 0.5);

                visual.tripletNumber.layout(renderer);
                visual.tripletNumber.offset((leftX + rightX) / 2, (leftY + rightY) / 2 + groupLineDy);

                visual.setRect(visual.getRect().expandInPlace(visual.tripletNumber.getRect()));
            }

            this.rect = visual.getRect().copy();

            this.staffVisuals.push(visual);
        });

        this.staffVisuals.forEach(visual => this.rect.expandInPlace(visual.getRect()));
    }

    offset(dx: number, dy: number) {
        this.staffVisuals.forEach(visual => visual.offset(dx, 0)); // dy is offset in notation line
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let { unitSize, beamThickness, lineWidth } = renderer;
        let color = "black";

        let symbols = this.getSymbols();

        this.staffVisuals.forEach(visual => {
            if (this.type === BeamGroupType.TripletGroup) {
                if (visual.groupLineLeft && visual.groupLineRight) {
                    let l = visual.groupLineLeft;
                    let r = visual.groupLineRight;

                    let tf = visual.tripletNumber ? (visual.tripletNumber.getRect().width / (r.x - l.x) * 1.2) : 0;

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
                let noteGroups = symbols.filter(s => s instanceof ObjNoteGroup) as ObjNoteGroup[];

                let beamSeparation = DocumentSettings.BeamSeparation * unitSize * (this.stemDir === Stem.Up ? 1 : -1);

                for (let i = 0; i < noteGroups.length - 1; i++) {
                    let left = noteGroups[i];
                    let right = noteGroups[i + 1];

                    let leftX = left.getBeamX(visual.staff);
                    let leftY = left.getBeamY(visual.staff);

                    let rightX = right.getBeamX(visual.staff);
                    let rightY = right.getBeamY(visual.staff);

                    let leftBeamCount = left.getRightBeamCount();
                    let rightBeamCount = right.getLeftBeamCount();

                    for (let beamId = 0; beamId < Math.max(leftBeamCount, rightBeamCount); beamId++) {

                        if (beamId < leftBeamCount && beamId < rightBeamCount) {
                            renderer.drawLine(leftX, leftY, rightX, rightY, color, beamThickness);
                        }
                        else if (leftBeamCount > rightBeamCount) {
                            renderer.drawPartialLine(leftX, leftY, rightX, rightY, 0, 0.25, color, beamThickness);
                        }
                        else if (rightBeamCount > leftBeamCount) {
                            renderer.drawPartialLine(leftX, leftY, rightX, rightY, 0.75, 1, color, beamThickness);
                        }

                        leftY += beamSeparation;
                        rightY += beamSeparation;
                    }
                }
            }

            if (visual.tripletNumber) {
                visual.tripletNumber.draw(renderer);
            }
        });
    }
}
