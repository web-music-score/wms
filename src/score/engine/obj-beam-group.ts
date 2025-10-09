import { Utils } from "@tspro/ts-utils-lib";
import { NoteLength, Tuplet, TupletRatio, NoteLengthProps } from "@tspro/web-music-score/theory";
import { ObjNoteGroup } from "./obj-note-group";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { DivRect, Stem, MBeamGroup, MusicInterface, MStaffBeamGroup, TupletOptions } from "../pub";
import { RhythmSymbol } from "./obj-rhythm-column";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjStaff } from "./obj-staff-and-tab";

export enum BeamGroupType {
    RegularBeam,
    TupletBeam,
    TupletGroup
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
    public tupletNumber?: ObjText;
    public tupletNumberOffsetY = 0;

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
        this.tupletNumber?.offset(dx, dy);
        this.requestRectUpdate();
        this.beamGroup.requestRectUpdate();
    }

    updateRect() {
        if (this.points.length > 0) {
            this.rect = this.points[0].getRect().copy();
        }
        else if (this.tupletNumber) {
            this.rect = this.tupletNumber.getRect().copy();
        }
        this.points.forEach(pt => this.rect.expandInPlace(pt.getRect()));
        if (this.tupletNumber) {
            this.rect.expandInPlace(this.tupletNumber.getRect());
        }
    }
}

export class ObjBeamGroup extends MusicObject {
    readonly mi: MBeamGroup;

    private readonly type: BeamGroupType;
    private readonly staffObjects: ObjStaffBeamGroup[] = [];

    private constructor(private readonly symbols: RhythmSymbol[], readonly tupletRatio: TupletRatio & TupletOptions | undefined) {
        super(symbols[0].measure);

        this.mi = new MBeamGroup(this);

        let beamGroupName = tupletRatio ? "Tuplet" : "BeamGroup";

        if (!symbols.every(s => s.measure === symbols[0].measure)) {
            throw new MusicError(MusicErrorType.Score, `All ${beamGroupName} symbols are not in same measure.`);
        }
        else if (symbols.length < 2) {
            throw new MusicError(MusicErrorType.Score, `${beamGroupName} needs minimum 2 symbols, but ${symbols.length} given.`);
        }

        if (tupletRatio !== undefined) {
            let isGroup =
                symbols.length < 3 ||
                symbols.some(s => !(s instanceof ObjNoteGroup)) ||
                symbols.some(s => s.rhythmProps.flagCount !== symbols[0].rhythmProps.flagCount);

            // There can be rest between edge notes, no group needed.
            if (symbols.length >= 3 &&
                symbols[0] instanceof ObjNoteGroup &&
                symbols[symbols.length - 1] instanceof ObjNoteGroup &&
                symbols[0].rhythmProps.flagCount === symbols[symbols.length - 1].rhythmProps.flagCount) {
                isGroup = false;
            }

            // Quarter notes or longer do not have beam => use group.
            if (symbols.some(s => NoteLengthProps.cmp(s.rhythmProps.noteLength, NoteLength.Quarter) >= 0)) {
                isGroup = true;
            }

            this.type = isGroup ? BeamGroupType.TupletGroup : BeamGroupType.TupletBeam;

            this.setTupletBeamCounts();
        }
        else {
            this.type = BeamGroupType.RegularBeam;

            this.setBeamCounts();
        }

        // Add this beam group to symbols and measure.
        if (symbols.every(s => s.getBeamGroup() === undefined)) {
            symbols.forEach(s => s.setBeamGroup(this));
            symbols[0].measure.addBeamGroup(this);
        }
        else {
            throw new MusicError(MusicErrorType.Score, `Cannot add ${beamGroupName} because some symbol already has one.`);
        }

        // If regular beam has zero left or right beam count then detach.
        if (this.type === BeamGroupType.RegularBeam) {
            this.symbols.filter(sym => sym instanceof ObjNoteGroup).some((sym, i) => {
                let first = i === 0;
                let last = i === this.symbols.length - 1;
                if (first && sym.getRightBeamCount() === 0 ||
                    last && sym.getLeftBeamCount() === 0 ||
                    !first && !last && (sym.getLeftBeamCount() === 0 || sym.getRightBeamCount() === 0)
                ) {
                    throw this;
                }
            });
        }
    }

    private get showTupletRatio(): boolean {
        return this.tupletRatio?.showRatio === true;
    }

    static createBeam(noteGroups: ObjNoteGroup[]): boolean {
        if (noteGroups.length > 1 && noteGroups.every(ng => !ng.hasTuplet())) {
            try {
                new ObjBeamGroup(noteGroups, undefined);
                return true;
            }
            catch (err) {
                if (err instanceof ObjBeamGroup) {
                    err.detach();
                }
            }
        }
        return false;
    }

    static createOldStyleTriplet(symbols: RhythmSymbol[]): number {
        let s2 = symbols.slice(0, 2);
        let n2 = s2.map(s => s.rhythmProps.noteSize);

        if (s2.length === 2 && s2.every(s => s.oldStyleTriplet && s.getBeamGroup() === undefined) && (n2[0] * 2 === n2[1] || n2[1] * 2 === n2[0])) {
            new ObjBeamGroup(s2, Tuplet.Triplet);
            return 2;
        }

        let s3 = symbols.slice(0, 3);
        let n3 = s3.map(s => s.rhythmProps.noteSize);

        if (s3.length === 3 && s3.every(s => s.oldStyleTriplet && s.getBeamGroup() === undefined) && n3.every(n => n === n3[0])) {
            new ObjBeamGroup(s3, Tuplet.Triplet);
            return 3;
        }

        return 0;
    }

    static createTuplet(symbols: RhythmSymbol[], tupletRatio: TupletRatio & TupletOptions): void {
        new ObjBeamGroup(symbols, tupletRatio);
    }

    getMusicInterface(): MBeamGroup {
        return this.mi;
    }

    detach() {
        this.getSymbols().forEach(s => s.resetBeamGroup());
    }

    isEmpty(): boolean {
        return this.staffObjects.length === 0;
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

    isTuplet() {
        return this.type === BeamGroupType.TupletBeam || this.type === BeamGroupType.TupletGroup;
    }

    getTupletRatioText(): string {
        return this.showTupletRatio
            ? String(this.tupletRatio?.parts) + ":" + String(this.tupletRatio?.inTimeOf)
            : String(this.tupletRatio?.parts);
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

    get color(): string {
        return this.symbols[0].color;
    }

    layout(renderer: Renderer) {
        this.requestRectUpdate();
        this.staffObjects.length = 0;

        let symbols = this.getSymbols();

        if (symbols.length === 0) {
            return;
        }

        let voiceId = symbols[0].voiceId;

        // All symbols should have same voiceId.
        if (symbols.some(symbol => symbol.voiceId !== voiceId)) {
            return;
        }

        let { unitSize } = renderer;
        let { stemDir, type } = this;

        let symbolsBeamCoords = symbols.map(s => s.getBeamCoords());

        symbolsBeamCoords[0].map(s => s?.staff).forEach((mainStaff, index) => {
            if (!mainStaff) {
                return;
            }

            let symbolX = symbolsBeamCoords.map(s => s[index]?.x);
            let symbolY = symbolsBeamCoords.map(s => s[index]?.y);
            let symbolStaff = symbolsBeamCoords.map(s => s[index]?.staff);
            let symbolStemHeight = symbolsBeamCoords.map(s => s[index]?.stemHeight);

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

            let leftStemHeight = symbolStemHeight[0] ?? 0;
            let rightStemHeight = symbolStemHeight[symbolStemHeight.length - 1] ?? 0;

            if (type !== BeamGroupType.TupletGroup) {
                let leftDy = leftStemHeight < rightStemHeight ? Math.sqrt(rightStemHeight - leftStemHeight) : 0;
                let rightDy = rightStemHeight < leftStemHeight ? Math.sqrt(leftStemHeight - rightStemHeight) : 0;
                if (stemDir === Stem.Up) {
                    leftDy *= -1;
                    rightDy *= -1;
                }
                if (leftDy !== 0) {
                    leftY += leftDy;
                    symbolY[0]! += leftDy;
                }
                if (rightDy !== 0) {
                    rightY += rightDy;
                    symbolY[symbolY.length - 1]! += rightDy;
                }
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

            if (type === BeamGroupType.TupletGroup) {
                let ef = unitSize / (rightX - leftX);

                let l = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, -ef);
                let r = Utils.Math.interpolateCoord(leftX, leftY + groupLineDy, rightX, rightY + groupLineDy, 1 + ef);

                obj.points.push(new BeamPoint(leftStaff, this, leftSymbol, l.x, l.y));
                obj.points.push(new BeamPoint(rightStaff, this, rightSymbol, r.x, r.y));

                obj.tupletNumberOffsetY = 0;
            }
            else if (type === BeamGroupType.RegularBeam || type === BeamGroupType.TupletBeam) {
                raiseBeamY *= 0.5;

                let { beamThickness } = renderer;

                const beamHeight = (i: number) => {
                    let sym = symbols[i];
                    if (sym instanceof ObjNoteGroup) {
                        let beamCount = sym instanceof ObjNoteGroup ? Math.max(sym.getLeftBeamCount(), sym.getRightBeamCount()) : 0;
                        return DocumentSettings.BeamSeparation * unitSize * (stemDir === Stem.Up ? beamCount - 1 : 0);
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

                obj.tupletNumberOffsetY = groupLineDy;
            }

            if (this.isTuplet()) {
                obj.tupletNumber = new ObjText(this, this.getTupletRatioText(), 0.5, 0.5);
                obj.tupletNumber.layout(renderer);
                obj.tupletNumber.offset((leftX + rightX) / 2, (leftY + rightY) / 2 + obj.tupletNumberOffsetY);
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

            if (this.type !== BeamGroupType.TupletGroup) {
                obj.points.forEach(pt => {
                    if (pt.symbol instanceof ObjNoteGroup) {
                        if (pt !== left && pt !== right) {
                            pt.y = Utils.Math.interpolateY(left.x, left.y, right.x, right.y, pt.x);
                        }
                        pt.symbol.setStemTipY(pt.staff, pt.y);
                    }
                });
            }

            if (obj.tupletNumber) {
                let y = (left.y + right.y) / 2 + obj.tupletNumberOffsetY;
                obj.tupletNumber.offset(0, -obj.tupletNumber.getRect().centerY + y);
            }
        });
    }

    offset(dx: number, dy: number) {
        this.staffObjects.forEach(obj => obj.offset(dx, 0));
        this.requestRectUpdate();
    }

    draw(renderer: Renderer) {
        let { unitSize, beamThickness, lineWidth } = renderer;
        let { stemDir, color, type } = this;

        if (type === BeamGroupType.TupletGroup) {
            let tipHeight = (stemDir === Stem.Up ? 1 : -1) * unitSize;
            this.staffObjects.forEach(obj => {
                let l = obj.points[0];
                let r = obj.points[obj.points.length - 1];

                if (l && r) {
                    if (obj.tupletNumber) {
                        let tf = obj.tupletNumber.getRect().width / (r.x - l.x) * 1.2;

                        let lc = Utils.Math.interpolateCoord(l.x, l.y, r.x, r.y, 0.5 - tf / 2);
                        let rc = Utils.Math.interpolateCoord(l.x, l.y, r.x, r.y, 0.5 + tf / 2);

                        // Draw lines from left tot tuplet number and from tuplet number to right.
                        renderer.drawLine(l.x, l.y, lc.x, lc.y, color, lineWidth);
                        renderer.drawLine(rc.x, rc.y, r.x, r.y, color, lineWidth);
                    }
                    else {
                        // Draw line from left to right.
                        renderer.drawLine(l.x, l.y, r.x, r.y, color, lineWidth);
                    }

                    // Draw tip
                    renderer.drawLine(l.x, l.y, l.x, l.y + tipHeight, color, lineWidth);
                    renderer.drawLine(r.x, r.y, r.x, r.y + tipHeight, color, lineWidth);
                }
            });
        }
        else if (type === BeamGroupType.RegularBeam || type === BeamGroupType.TupletBeam) {
            this.staffObjects.forEach(obj => {
                let noteGroupPoints = obj.points.filter(p => p.symbol instanceof ObjNoteGroup);

                // Calc beam separation, affected by beam angle.
                let { x: lx, y: ly } = noteGroupPoints[0];
                let { x: rx, y: ry } = noteGroupPoints[noteGroupPoints.length - 1];
                let beamSeparation = DocumentSettings.BeamSeparation
                    * unitSize * (stemDir === Stem.Up ? 1 : -1)
                    * (1 + 0.5 * Math.abs(Math.atan2(ry - ly, rx - lx)));

                for (let i = 0; i < noteGroupPoints.length - 1; i++) {
                    let { x: lx, y: ly, symbol: lsymbol } = noteGroupPoints[i];
                    let { x: rx, y: ry, symbol: rsymbol } = noteGroupPoints[i + 1];

                    ly += (stemDir === Stem.Up ? 1 : -1) * beamThickness / 2;
                    ry += (stemDir === Stem.Up ? 1 : -1) * beamThickness / 2;

                    let leftBeamCount = (<ObjNoteGroup>lsymbol).getRightBeamCount();
                    let rightBeamCount = (<ObjNoteGroup>rsymbol).getLeftBeamCount();

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
            });
        }

        this.staffObjects.forEach(obj => obj.tupletNumber?.draw(renderer));
    }

    private setBeamCounts() {
        const isADottedBHalf = (a: ObjNoteGroup, b: ObjNoteGroup) => {
            let { flagCount: aFlagCount, noteSize: aNoteSize, dotCount: aDotCount } = a.rhythmProps;
            let { flagCount: bFlagCount, noteSize: bNoteSize, dotCount: bDotCount } = b.rhythmProps;

            return aFlagCount > 0 && bFlagCount > 0 && aDotCount > 0 && bDotCount === 0 && aNoteSize * Math.pow(2, aDotCount) === bNoteSize;
        }

        let groupNotes = this.symbols.filter(s => s instanceof ObjNoteGroup);

        for (let i = 0; i < groupNotes.length; i++) {
            let center = groupNotes[i];
            let left = groupNotes[i - 1];
            let right = groupNotes[i + 1];

            if (center) {
                center.setLeftBeamCount(0);
                center.setRightBeamCount(0);

                // Set left beam count
                if (left) {
                    if (left.rhythmProps.flagCount === center.rhythmProps.flagCount || isADottedBHalf(left, center) || isADottedBHalf(center, left)) {
                        center.setLeftBeamCount(center.rhythmProps.flagCount);
                    }
                    else {
                        center.setLeftBeamCount(Math.min(left.rhythmProps.flagCount, center.rhythmProps.flagCount));
                    }
                }

                // Set right beam count
                if (right) {
                    if (right.rhythmProps.flagCount === center.rhythmProps.flagCount || isADottedBHalf(right, center) || isADottedBHalf(center, right)) {
                        center.setRightBeamCount(center.rhythmProps.flagCount);
                    }
                    else {
                        center.setRightBeamCount(Math.min(right.rhythmProps.flagCount, center.rhythmProps.flagCount));
                    }
                }
            }
        }

        // Fix beam counts
        let fixAgain: boolean;

        do {
            fixAgain = false;

            for (let i = 0; i < groupNotes.length; i++) {
                let center = groupNotes[i];
                let left = groupNotes[i - 1];
                let right = groupNotes[i + 1];

                // If neither left or right beam count equals flag count, then reset beam counts.
                if (center && center.getLeftBeamCount() !== center.rhythmProps.flagCount && center.getRightBeamCount() !== center.rhythmProps.flagCount) {
                    center.setLeftBeamCount(0);
                    center.setRightBeamCount(0);

                    if (left && left.getRightBeamCount() > 0) {
                        left.setRightBeamCount(0);
                        fixAgain = true; // left changed => fix again.
                    }

                    if (right && right.getLeftBeamCount() > 0) {
                        right.setLeftBeamCount(0);
                        fixAgain = true; // Right changed => fix again.
                    }
                }
            }
        } while (fixAgain);
    }

    private setTupletBeamCounts() {
        let type = this.getType();
        let symbols = this.getSymbols();

        if (type === BeamGroupType.TupletBeam) {
            symbols.forEach((s, i) => {
                if (s instanceof ObjNoteGroup) {
                    s.setLeftBeamCount(i === 0 ? 0 : s.rhythmProps.flagCount);
                    s.setRightBeamCount((i === symbols.length - 1) ? 0 : s.rhythmProps.flagCount);
                }
            });
        }
        else if (type === BeamGroupType.TupletGroup) {
            symbols.forEach(s => {
                if (s instanceof ObjNoteGroup) {
                    s.setLeftBeamCount(0);
                    s.setRightBeamCount(0);
                }
            });
        }
    }
}
