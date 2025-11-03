import { MusicObject } from "./music-object";
import { RenderContext } from "./render-context";
import { ObjMeasure } from "./obj-measure";
import { MBarLineRight, MBarLineLeft, Navigation, MusicInterface, MStaffTabBarLine } from "../pub";
import { PlayerColumnProps } from "./player";
import { DocumentSettings } from "./settings";
import { ObjNotationLine, ObjStaff } from "./obj-staff-and-tab";
import { AnchoredRect } from "@tspro/ts-utils-lib";

enum BarLineType { None, Single, Double, EndSong, StartRepeat, EndRepeat, EndStartRepeat }

export class ObjStaffTabBarLine extends MusicObject {
    public verticalLines: { left: number, width: number }[] = [];
    public dots: { x: number, y: number, r: number }[] = [];

    readonly mi: MStaffTabBarLine;

    constructor(readonly barLine: ObjBarLine, readonly line: ObjNotationLine) {
        super(line);

        line.addObject(this);

        this.mi = new MStaffTabBarLine(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    setRect(r: AnchoredRect) {
        this.rect = r;
    }

    offset(dx: number, dy: number) {
        this.verticalLines.forEach(l => l.left += dx);
        this.dots.forEach(d => { d.x += dx; d.y += dy; });
        this.rect.offsetInPlace(dx, dy);
    }
}

abstract class ObjBarLine extends MusicObject {
    protected staffTabObjects: ObjStaffTabBarLine[] = [];
    protected staffTabObjectGroups: ObjStaffTabBarLine[][] = [];
    protected barLineType = BarLineType.None;

    constructor(readonly measure: ObjMeasure) {
        super(measure);
    }

    abstract solveBarLineType(): BarLineType;

    pick(x: number, y: number): MusicObject[] {
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.staffTabObjects.length; i++) {
            let arr = this.staffTabObjects[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layout(ctx: RenderContext) {
        this.requestRectUpdate();
        this.staffTabObjects.length = 0;

        this.barLineType = this.solveBarLineType();

        let { unitSize, _lineWidth } = ctx;
        let { measure, barLineType } = this;
        let { row } = measure;

        let thinW = _lineWidth;
        let thicW = 0.7 * unitSize;
        let spaceW = 0.7 * unitSize;
        let dotW = DocumentSettings.DotSize * unitSize;
        let dotRadius = dotW / 2;

        row.getNotationLines().forEach(line => {
            let obj = new ObjStaffTabBarLine(this, line);

            let lineCenterY: number;
            let lineDotOff: number;
            let top: number, bottom: number;

            const addVerticalLine = (left: number, width: number) => {
                obj.verticalLines.push({ left, width });
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

            top = line.getTopLineY();
            bottom = line.getBottomLineY();

            switch (barLineType) {
                case BarLineType.None:
                    obj.setRect(new AnchoredRect(0, 0, 0, top, 0, bottom));
                    break;
                case BarLineType.Single:
                    obj.setRect(new AnchoredRect(-thinW, 0, 0, top, 0, bottom));
                    addVerticalLine(-thinW, thinW);
                    break;
                case BarLineType.Double:
                    obj.setRect(new AnchoredRect(-thinW - spaceW - thinW, 0, 0, top, 0, bottom));
                    addVerticalLine(-thinW - spaceW - thinW, thinW);
                    addVerticalLine(-thinW, thinW);
                    break;
                case BarLineType.EndSong:
                    obj.setRect(new AnchoredRect(-thicW - spaceW - thinW, 0, 0, top, 0, bottom));
                    addVerticalLine(-thinW - spaceW - thicW, thinW);
                    addVerticalLine(-thicW, thicW);
                    break;
                case BarLineType.StartRepeat:
                    obj.setRect(new AnchoredRect(0, 0, thicW + spaceW + thinW + spaceW + dotW, top, 0, bottom));
                    addVerticalLine(0, thicW);
                    addVerticalLine(thicW + spaceW, thinW);
                    addDotPair(thicW + spaceW + thinW + spaceW + dotRadius);
                    break;
                case BarLineType.EndRepeat:
                    obj.setRect(new AnchoredRect(-thicW - spaceW - thinW - spaceW - dotW, 0, 0, top, 0, bottom));
                    addVerticalLine(-thinW - spaceW - thicW, thinW);
                    addVerticalLine(-thicW, thicW);
                    addDotPair(-thinW - spaceW - thicW - spaceW - dotRadius);
                    break;
                case BarLineType.EndStartRepeat:
                    obj.setRect(new AnchoredRect(-dotW - spaceW - thinW - spaceW - thicW / 2, 0, thicW / 2 + spaceW + thinW + spaceW + dotW, top, 0, bottom));
                    addVerticalLine(-thicW / 2, thicW);
                    addVerticalLine(-thicW / 2 - spaceW - thinW, thinW);
                    addVerticalLine(thicW / 2 + spaceW, thinW);
                    addDotPair(-thicW / 2 - spaceW - thinW - spaceW - dotRadius);
                    addDotPair(thicW / 2 + spaceW + thinW + spaceW + dotRadius);
                    break;
            }

            this.staffTabObjects.push(obj);
        });

        this.staffTabObjectGroups = row.getInstrumentLineGroups().map(lines =>
            lines.map(line => this.staffTabObjects.find(obj => obj.line === line)).filter(obj => obj !== undefined)
        );
    }

    updateRect() {
        if (this.staffTabObjects.length > 0) {
            this.rect = this.staffTabObjects[0].getRect().clone();
            for (let i = 1; i < this.staffTabObjects.length; i++) {
                this.rect.expandInPlace(this.staffTabObjects[i].getRect());
            }
        }
        else {
            this.rect = new AnchoredRect();
        }
    }

    offset(dx: number, dy: number) {
        this.staffTabObjects.forEach(obj => obj.offset(dx, 0));
        this.requestRectUpdate();
    }

    draw(ctx: RenderContext) {
        if (this.barLineType === BarLineType.None) {
            return;
        }

        ctx.drawDebugRect(this.getRect());

        ctx.color("black");

        this.staffTabObjectGroups.forEach(objs => {
            if (objs.length > 0) {
                objs.forEach(obj => obj.dots.forEach(d => ctx.fillCircle(d.x, d.y, d.r)));

                let top = objs[0].getRect().top;
                let height = objs[objs.length - 1].getRect().bottom - top;

                objs[0].verticalLines.forEach(vline => ctx.fillRect(vline.left, top, vline.width, height));
            }
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
