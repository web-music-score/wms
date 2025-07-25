import { Utils } from "@tspro/ts-utils-lib";
import { MinNoteLength, NoteLength } from "@tspro/web-music-score/theory";
import { ObjNoteGroup } from "./obj-note-group";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { DivRect, Stem, MBeamGroup } from "../pub";
import { RhythmSymbol } from "./obj-rhythm-column";
import { DocumentSettings } from "./settings";
import { getScoreError } from "./misc";

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

export class ObjBeamGroup extends MusicObject {
    readonly mi: MBeamGroup;

    private readonly type: BeamGroupType;

    private tripletNumber?: ObjText;

    private groupLineLeft?: { x: number, y: number };
    private groupLineRight?: { x: number, y: number };

    private constructor(private readonly symbols: RhythmSymbol[], triplet: boolean) {
        super(symbols[0].measure);

        this.mi = new MBeamGroup(this);

        if (!symbols.every(s => s.measure === symbols[0].measure)) {
            throw getScoreError("All beam group symbols are not in same measure.");
        }
        else if (symbols.length < 2) {
            throw getScoreError("Beam group need minimum 2 symbols, but " + symbols.length + " given.");
        }

        if (triplet) {
            if (!symbols.every(s => s.triplet)) {
                throw getScoreError("Not every symbol's triplet property is true.");
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
            throw getScoreError("Cannot add beam group because some symbol already has one.");
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

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
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

    getBeamY(symbol: RhythmSymbol) {
        let first = this.getFirstSymbol();
        let last = this.getLastSymbol();

        if (!(first instanceof ObjNoteGroup) || !(last instanceof ObjNoteGroup) || !(symbol instanceof ObjNoteGroup)) {
            return 0;
        }
        else if (this.getFirstSymbol() === symbol || this.getLastSymbol() === symbol) {
            return symbol.getBeamY();
        }
        else {
            return Utils.Math.interpolateY(first.getBeamX(), first.getBeamY(), last.getBeamX(), last.getBeamY(), symbol.getBeamX());
        }
    }

    layout(renderer: Renderer) {
        let symbols = this.getSymbols();

        if (symbols.length === 0) {
            return;
        }

        let { unitSize, beamThickness } = renderer;
        let { stemDir } = this;

        let leftX = symbols[0].getBeamX();
        let leftY = symbols[0].getBeamY();

        let rightX = symbols[symbols.length - 1].getBeamX();
        let rightY = symbols[symbols.length - 1].getBeamY();

        let groupLineDy = unitSize * 2 * (stemDir === Stem.Up ? -1 : 1);

        // Make beam less tilted
        let centerY = (rightY + leftY) / 2;
        let halfDy = adjustBeamAngle(rightX - leftX, rightY - leftY) / 2;

        leftY = centerY - halfDy;
        rightY = centerY + halfDy;

        // Find beams y-position
        let raiseBeamY = 0;

        symbols.forEach(s => {
            let beamY = Utils.Math.interpolateY(leftX, leftY, rightX, rightY, s.getBeamX());
            let raiseY = s.getBeamY() - beamY;
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

            this.groupLineLeft = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, -ef);
            this.groupLineRight = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, 1 + ef);

            this.rect = new DivRect(this.groupLineLeft.x, this.groupLineRight.x, Math.min(this.groupLineLeft.y, this.groupLineRight.y), Math.max(this.groupLineLeft.y, this.groupLineRight.y));
        }
        else if (this.type === BeamGroupType.RegularBeam || this.type === BeamGroupType.TripletBeam) {
            raiseBeamY *= 0.5;

            // Update stem tips to beams
            this.symbols.forEach(s => {
                if (s instanceof ObjNoteGroup) {
                    let beamY = Utils.Math.interpolateY(leftX, leftY, rightX, rightY, s.getBeamX());
                    s.setStemTipY(beamY);
                }
            });

            this.rect = new DivRect(leftX, rightX, Math.min(leftY, rightY) - beamThickness / 2, Math.max(leftY, rightY) + beamThickness / 2);
        }

        if (this.isTriplet()) {
            this.tripletNumber = new ObjText(this, "3", 0.5, 0.5);

            this.tripletNumber.layout(renderer);
            this.tripletNumber.offset((leftX + rightX) / 2, (leftY + rightY) / 2 + groupLineDy);

            this.rect.expandInPlace(this.tripletNumber.getRect());
        }
        else {
            this.tripletNumber = undefined;
        }
    }

    offset(dx: number, dy: number) {
        if (this.tripletNumber) {
            this.tripletNumber.offset(dx, dy);
        }

        if (this.groupLineLeft) {
            this.groupLineLeft.x += dx;
            this.groupLineLeft.y += dy;
        }

        if (this.groupLineRight) {
            this.groupLineRight.x += dx;
            this.groupLineRight.y += dy;
        }

        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        let { unitSize, beamThickness, lineWidth } = renderer;
        let color = "black";

        let symbols = this.getSymbols();

        if (this.type === BeamGroupType.TripletGroup) {
            if (this.groupLineLeft && this.groupLineRight) {
                let l = this.groupLineLeft;
                let r = this.groupLineRight;

                let tf = this.tripletNumber ? (this.tripletNumber.getRect().width / (r.x - l.x) * 1.2) : 0;

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

                let leftX = left.getBeamX();
                let leftY = left.getBeamY();

                let rightX = right.getBeamX();
                let rightY = right.getBeamY();

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

        if (this.tripletNumber) {
            this.tripletNumber.draw(renderer);
        }
    }
}
