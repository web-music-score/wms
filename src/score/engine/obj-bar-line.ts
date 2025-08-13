import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { ObjMeasure } from "./obj-measure";
import { MBarLineRight, MBarLineLeft, Navigation, DivRect, MusicInterface, MBarLineVisual } from "../pub";
import { PlayerColumnProps } from "./player";
import { DocumentSettings } from "./settings";
import { ObjStaff, ObjTab } from "./obj-staff-and-tab";

enum BarLineType { None, Single, Double, EndSong, StartRepeat, EndRepeat, EndStartRepeat }

export class ObjBarLineVisual extends MusicObject {
    public lineRects: DivRect[] = [];
    public dotRects: DivRect[] = [];

    readonly mi: MBarLineVisual;

    constructor(readonly line: ObjStaff | ObjTab) {
        super(line);

        line.addObject(this);

        this.mi = new MBarLineVisual(this);
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
        this.lineRects.forEach(r => r.offsetInPlace(dx, dy));
        this.dotRects.forEach(r => r.offsetInPlace(dx, dy));
        this.rect.offsetInPlace(dx, dy);
    }
}

abstract class ObjBarLine extends MusicObject {
    protected staffTabVisuals: ObjBarLineVisual[] = [];
    protected barLineType = BarLineType.None;

    constructor(readonly measure: ObjMeasure) {
        super(measure);
    }

    abstract solveBarLineType(): BarLineType;

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.staffTabVisuals.length; i++) {
            let arr = this.staffTabVisuals[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    layout(renderer: Renderer) {
        this.staffTabVisuals.length = 0;

        this.barLineType = this.solveBarLineType();

        let { unitSize, lineWidth } = renderer;
        let { measure, barLineType } = this;
        let { row } = measure;

        let thinW = lineWidth;
        let thicW = 0.7 * unitSize;
        let spaceW = 0.7 * unitSize;
        let dotW = DocumentSettings.DotSize * unitSize;
        let dotRadius = dotW / 2;

        row.getNotationLines().forEach(line => {
            let visual = new ObjBarLineVisual(line);

            let lineCenterY: number;
            let lineDotOff: number;
            let top: number, bottom: number;

            const addRect = (left: number, width: number) => {
                visual.lineRects.push(new DivRect(left, left + width / 2, left + width, top, 0, bottom));
            }

            const addDots = (cx: number) => {
                for (let i = -1; i <= 1; i += 2) {
                    let y = lineCenterY + i * lineDotOff;
                    visual.dotRects.push(new DivRect(cx - dotRadius, cx, cx + dotRadius, y - dotRadius, y, y + dotRadius));
                }
            }

            if (line instanceof ObjStaff) {
                lineCenterY = line.getMiddleLineY();
                lineDotOff = line.getDiatonicSpacing();
                top = line.getTopLineY();
                bottom = line.getBottomLineY();
            }
            else {
                lineCenterY = (line.getBottom() + line.getTop()) / 2;
                lineDotOff = (line.getBottom() - line.getTop()) / 6;
                top = line.getTopStringY();
                bottom = line.getBottomStringY();
            }

            switch (barLineType) {
                case BarLineType.None:
                    visual.setRect(new DivRect(0, 0, 0, top, 0, bottom));
                    break;
                case BarLineType.Single:
                    visual.setRect(new DivRect(-thinW, 0, 0, top, 0, bottom));
                    addRect(-thinW, thinW);
                    break;
                case BarLineType.Double:
                    visual.setRect(new DivRect(-thinW - spaceW - thinW, 0, 0, top, 0, bottom));
                    addRect(-thinW - spaceW - thinW, thinW);
                    addRect(-thinW, thinW);
                    break;
                case BarLineType.EndSong:
                    visual.setRect(new DivRect(-thicW - spaceW - thinW, 0, 0, top, 0, bottom));
                    addRect(-thinW - spaceW - thicW, thinW);
                    addRect(-thicW, thicW);
                    break;
                case BarLineType.StartRepeat:
                    visual.setRect(new DivRect(0, 0, thicW + spaceW + thinW + spaceW + dotW, top, 0, bottom));
                    addRect(0, thicW);
                    addRect(thicW + spaceW, thinW);
                    addDots(thicW + spaceW + thinW + spaceW + dotRadius);
                    break;
                case BarLineType.EndRepeat:
                    visual.setRect(new DivRect(-thicW - spaceW - thinW - spaceW - dotW, 0, 0, top, 0, bottom));
                    addRect(-thinW - spaceW - thicW, thinW);
                    addRect(-thicW, thicW);
                    addDots(-thinW - spaceW - thicW - spaceW - dotRadius);
                    break;
                case BarLineType.EndStartRepeat:
                    visual.setRect(new DivRect(-dotW - spaceW - thinW - spaceW - thicW / 2, 0, thicW / 2 + spaceW + thinW + spaceW + dotW, top, 0, bottom));
                    addRect(-thicW / 2, thicW);
                    addRect(-thicW / 2 - spaceW - thinW, thinW);
                    addRect(thicW / 2 + spaceW, thinW);
                    addDots(-thicW / 2 - spaceW - thinW - spaceW - dotRadius);
                    addDots(thicW / 2 + spaceW + thinW + spaceW + dotRadius);
                    break;
            }

            this.staffTabVisuals.push(visual);
        });

        this.rect = this.staffTabVisuals[0].getRect().copy();

        if (this.staffTabVisuals.length > 1) {
            this.staffTabVisuals.forEach(visual => this.rect.expandInPlace(visual.getRect()));
        }
    }

    offset(dx: number, dy: number) {
        this.rect.offsetInPlace(dx, dy);
        this.staffTabVisuals.forEach(visual => visual.offset(dx, 0));
    }

    draw(renderer: Renderer) {
        const ctx = renderer.getCanvasContext();

        if (!ctx || this.barLineType === BarLineType.None) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        ctx.strokeStyle = ctx.fillStyle = "black";

        this.staffTabVisuals.forEach(visual => {
            visual.lineRects.forEach(r => ctx.fillRect(r.left, r.top, r.width, r.height));
            visual.dotRects.forEach(r => renderer.fillCircle(r.centerX, r.centerY, r.width / 2));
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
