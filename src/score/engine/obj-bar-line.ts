import { MusicObject } from "./music-object";
import { View } from "./view";
import { ObjMeasure } from "./obj-measure";
import { MBarLineRight, MBarLineLeft, Navigation, MusicInterface, MStaffBarLine } from "../pub";
import { PlayerColumnProps } from "./player-engine";
import { DocumentSettings } from "./settings";
import { ObjNotationLine, ObjStaff } from "./obj-staff-and-tab";
import { AnchoredRect, UniMap } from "@tspro/ts-utils-lib";
import { ObjScoreRowGroup } from "./obj-score-row-group";

enum BarLineType { None, Single, Double, EndSong, StartRepeat, EndRepeat, EndStartRepeat }

export class ObjStaffBarLine extends MusicObject {
    public vlines: { left: number, width: number }[] = [];
    public dots: { x: number, y: number, r: number }[] = [];

    readonly mi: MStaffBarLine;

    constructor(readonly barLine: ObjBarLine, readonly line: ObjNotationLine, readonly rowGroup: ObjScoreRowGroup) {
        super(line);

        line.addObject(this);

        this.mi = new MStaffBarLine(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    updateRect(): void {
        this.rect = new AnchoredRect(0, 0, this.line.getTopLineY(), this.line.getBottomLineY())
        this.vlines.forEach(l =>
            this.rect.unionInPlace(new AnchoredRect(l.left, l.left + l.width, this.rect.top, this.rect.bottom))
        );
        this.dots.forEach(d =>
            this.rect.unionInPlace(new AnchoredRect(d.x - d.r, d.x + d.r, d.y - d.r, d.y + d.r))
        );
    }

    offset(dx: number, dy: number) {
        this.vlines.forEach(l => l.left += dx);
        this.dots.forEach(d => { d.x += dx; d.y += dy; });
        this.rect.offsetInPlace(dx, dy);
    }
}

abstract class ObjBarLine extends MusicObject {
    protected notationLineObjects: ObjStaffBarLine[] = [];
    protected notationLineObjectsByGrp = new UniMap<ObjScoreRowGroup, ObjStaffBarLine[]>();
    protected barLineType = BarLineType.None;

    constructor(readonly measure: ObjMeasure) {
        super(measure);
    }

    abstract solveBarLineType(): BarLineType;

    get doc() { return this.measure.doc; }
    get row() { return this.measure.row; }

    pick(x: number, y: number): MusicObject[] {
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.notationLineObjects.length; i++) {
            let arr = this.notationLineObjects[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layout(view: View) {
        this.requestRectUpdate();

        this.barLineType = this.solveBarLineType();

        let { unitSize, lineWidthPx } = view;
        let { measure, barLineType } = this;
        let { row } = measure;

        let thinW = lineWidthPx;
        let thicW = 0.7 * unitSize;
        let spaceW = 0.7 * unitSize;
        let dotW = DocumentSettings.DotSize * unitSize;
        let dotRadius = dotW / 2;

        this.notationLineObjects = [];
        this.notationLineObjectsByGrp.clear();

        row.getRowGroups().forEach(grp => {
            grp.lines.forEach(line => {
                let obj = new ObjStaffBarLine(this, line, grp);

                this.notationLineObjects.push(obj);
                this.notationLineObjectsByGrp.getOrCreate(grp, []).push(obj);

                let lineCenterY: number;
                let lineDotOff: number;

                const addVerticalLine = (left: number, width: number) => {
                    obj.vlines.push({ left, width });
                }

                const addDotPair = (cx: number) => {
                    for (let i = -1; i <= 1; i += 2) {
                        let y = lineCenterY + i * lineDotOff;
                        obj.dots.push({ x: cx, y, r: dotRadius });
                    }
                }

                if (line instanceof ObjStaff) {
                    lineCenterY = line.getMiddleLineY();
                    lineDotOff = line.getDiatonicSpacing();
                }
                else {
                    lineCenterY = (line.getBottomLineY() + line.getTopLineY()) / 2;
                    lineDotOff = (line.getBottomLineY() - line.getTopLineY()) / 6;
                }

                switch (barLineType) {
                    case BarLineType.None:
                        break;
                    case BarLineType.Single:
                        addVerticalLine(-thinW, thinW);
                        break;
                    case BarLineType.Double:
                        addVerticalLine(-thinW - spaceW - thinW, thinW);
                        addVerticalLine(-thinW, thinW);
                        break;
                    case BarLineType.EndSong:
                        addVerticalLine(-thinW - spaceW - thicW, thinW);
                        addVerticalLine(-thicW, thicW);
                        break;
                    case BarLineType.StartRepeat:
                        addVerticalLine(0, thicW);
                        addVerticalLine(thicW + spaceW, thinW);
                        addDotPair(thicW + spaceW + thinW + spaceW + dotRadius);
                        break;
                    case BarLineType.EndRepeat:
                        addVerticalLine(-thinW - spaceW - thicW, thinW);
                        addVerticalLine(-thicW, thicW);
                        addDotPair(-thinW - spaceW - thicW - spaceW - dotRadius);
                        break;
                    case BarLineType.EndStartRepeat:
                        addVerticalLine(-thicW / 2, thicW);
                        addVerticalLine(-thicW / 2 - spaceW - thinW, thinW);
                        addVerticalLine(thicW / 2 + spaceW, thinW);
                        addDotPair(-thicW / 2 - spaceW - thinW - spaceW - dotRadius);
                        addDotPair(thicW / 2 + spaceW + thinW + spaceW + dotRadius);
                        break;
                }
                obj.forceRectUpdate();
            });
        });
    }

    updateRect() {
        if (this.notationLineObjects.length > 0) {
            this.rect = this.notationLineObjects[0].getRect().clone();
            for (let i = 1; i < this.notationLineObjects.length; i++) {
                this.rect.unionInPlace(this.notationLineObjects[i].getRect());
            }
        }
        else {
            this.rect = new AnchoredRect();
        }
    }

    offset(dx: number, dy: number) {
        this.notationLineObjects.forEach(obj => obj.offset(dx, 0));
        this.requestRectUpdate();
    }

    draw(view: View) {
        if (this.barLineType === BarLineType.None)
            return;

        view.drawDebugRect(this.getRect());

        this.notationLineObjects.forEach(o => {
            o.vlines.forEach(l => o.line.drawVerticalLine(view, l.left, l.width));
            o.dots.forEach(d => view.fillCircle(d.x, d.y, d.r));
        });
    }
}

export class ObjBarLineLeft extends ObjBarLine {
    readonly mi: MBarLineLeft;

    constructor(measure: ObjMeasure) {
        super(measure);

        this.mi = new MBarLineLeft(this);
    }

    getMusicInterface(): MBarLineLeft {
        return this.mi;
    }

    solveBarLineType(): BarLineType {
        let m = this.measure;
        let prev = m.getPrevMeasure();

        if (m.hasNavigation(Navigation.StartRepeat)) {
            // If prev measure on same row has end-repeat:
            //     prev measure draws end-start-repeat and this measure does not draw start-repeat
            if (prev && prev.row === m.row && prev.hasNavigation(Navigation.EndRepeat)) {
                return BarLineType.None;
            }
            else {
                return BarLineType.StartRepeat;
            }
        }
        else {
            return BarLineType.None;
        }
    }
}

export class ObjBarLineRight extends ObjBarLine {
    private readonly playerProps: PlayerColumnProps;

    readonly mi: MBarLineRight;

    constructor(measure: ObjMeasure) {
        super(measure);

        this.playerProps = new PlayerColumnProps(this);

        this.mi = new MBarLineRight(this);
    }

    getMusicInterface(): MBarLineRight {
        return this.mi;
    }

    getPlayerProps() {
        return this.playerProps;
    }

    solveBarLineType(): BarLineType {
        let m = this.measure;
        let next = m.getNextMeasure();

        if (m.hasNavigation(Navigation.EndRepeat)) {
            // If next measure on same row has start-repeat:
            //     this measure draws end-start-repeat and next measure does not draw start-repeat
            if (next && next.row === m.row && next.hasNavigation(Navigation.StartRepeat)) {
                return BarLineType.EndStartRepeat;
            }
            else {
                return BarLineType.EndRepeat;
            }
        }
        else if (!m.doc.hasSingleMeasure() && (m.hasEndSong() || !m.getNextMeasure())) {
            return BarLineType.EndSong;
        }
        else if (m.hasEndSection()) {
            // If new section begins next measure
            return BarLineType.Double;
        }

        if (m === m.row.getLastMeasure() && next && next.row === m.row.getNextRow() && next.hasNavigation(Navigation.StartRepeat)) {
            // IF this is last measure of row && next row begins with start repeat
            return BarLineType.Double;
        }

        if (next && next.hasNavigation(Navigation.StartRepeat)) {
            return BarLineType.None;
        }

        return BarLineType.Single;
    }
}
