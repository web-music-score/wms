import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjScoreRow } from "./obj-score-row";
import { ObjMeasure } from "./obj-measure";
import { ObjHeader } from "./obj-header";
import { DivRect, DocumentOptions, MDocument, PickedPitch, StaffKind } from "../pub";
import { DocumentSettings } from "./settings";
import { RhythmSymbol } from "./obj-rhythm-column";
import { LayoutGroup, LayoutGroupId, VerticalPos } from "./layout-object";
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { DefaultTuningName, getTuningStrings, Note, SymbolSet, validateTuningName } from "../../theory";
import { ArcProps } from "./arc-props";

function validateMeasuresPerRow(measuresPerRow: number | undefined): number | undefined {
    if (measuresPerRow === undefined || typeof measuresPerRow === "number" && Utils.Math.isInteger(measuresPerRow) && measuresPerRow >= 1) {
        return measuresPerRow;
    }
    else {
        Assert.interrupt("Invalid measuresPerRow: " + measuresPerRow);
    }
}

export class ObjDocument extends MusicObject {
    private needLayout: boolean = true;
    private needUpdate: boolean = true;

    private renderer?: Renderer;

    private readonly rows: ObjScoreRow[] = [];
    private readonly measures: ObjMeasure[] = [];

    public readonly measuresPerRow?: number;
    public readonly tuningName: string;
    public readonly tuningStrings: ReadonlyArray<Note>;
    public readonly tuningLabel: string;

    private header?: ObjHeader;

    private layoutGroups: LayoutGroup[/* LayoutGroupOrder */] = [];

    private newRowRequested: boolean = false;

    private allArcsProps: ArcProps[] = [];

    constructor(readonly mi: MDocument, readonly staffKind: StaffKind, readonly options?: DocumentOptions) {
        super(undefined);

        this.measuresPerRow = validateMeasuresPerRow(options?.measuresPerRow);

        this.tuningName = validateTuningName(options?.tuning ?? DefaultTuningName);
        this.tuningStrings = getTuningStrings(this.tuningName);
        this.tuningLabel = this.tuningStrings.slice().reverse().map(n => n.formatOmitOctave(SymbolSet.Ascii)).join("-");

        // There is always row
        this.rows.push(new ObjScoreRow(this));
    }

    getMusicInterface(): MDocument {
        return this.mi;
    }

    addArcProps(arc: ArcProps) {
        this.allArcsProps.push(arc);
    }

    getLayoutGroup(lauoutGroupId: LayoutGroupId): LayoutGroup {
        let layoutGroup = this.layoutGroups[lauoutGroupId];

        if (!layoutGroup) {
            layoutGroup = this.layoutGroups[lauoutGroupId] = new LayoutGroup(lauoutGroupId);
        }

        return layoutGroup;
    }

    setRenderer(renderer?: Renderer) {
        if (this.renderer === renderer) {
            return;
        }

        let prevRenderer = this.renderer;

        this.renderer = renderer;

        if (prevRenderer) {
            prevRenderer.setDocument(undefined);
        }

        if (renderer) {
            renderer.setDocument(this.mi);
        }

        this.requestFullLayout();
    }

    setHeader(title?: string, composer?: string, arranger?: string) {
        this.header = new ObjHeader(this, title, composer, arranger);
        this.requestLayout();
    }

    getTitle(): string | undefined {
        return this.header?.title;
    }

    needFullPitchRange(): boolean {
        return this.renderer ? this.renderer.needFullPitchRange() : false;
    }

    hasSingleMeasure(): boolean {
        return this.measures.length === 1;
    }

    getFirstMeasure(): ObjMeasure | undefined {
        return this.measures.length > 0 ? this.measures[0] : undefined;
    }

    getLastMeasure(): ObjMeasure | undefined {
        return this.measures.length > 0 ? this.measures[this.measures.length - 1] : undefined;
    }

    getFirstRow(): ObjScoreRow | undefined {
        return this.rows[0];
    }

    getLastRow(): ObjScoreRow | undefined {
        return this.rows[this.rows.length - 1];
    }

    isLastRowEmpty(): boolean {
        let lastRow = this.getLastRow();
        return lastRow === undefined || lastRow.getMeasures().length === 0;
    }

    isLastRowFull(): boolean {
        let lastRow = this.getLastRow();
        return this.measuresPerRow !== undefined && lastRow !== undefined && lastRow.getMeasures().length >= this.measuresPerRow;
    }

    requestNewRow(): void {
        this.newRowRequested = true;
    }

    addMeasure(): ObjMeasure {
        if ((this.isLastRowFull() || this.newRowRequested) && !this.isLastRowEmpty()) {
            this.rows.push(new ObjScoreRow(this));
            this.newRowRequested = false;
        }

        let lastRow = Assert.require(this.getLastRow(), "Cannot add measure because last row is undefined.");

        let measure = new ObjMeasure(lastRow);

        this.measures.push(measure);

        // Add measure to last row.
        lastRow.addMeasure(measure);

        this.requestLayout();

        return measure;
    }

    getVoiceSymbols(voiceId: number): ReadonlyArray<RhythmSymbol> {
        let voiceSymbols: RhythmSymbol[] = [];
        this.forEachMeasure(m => voiceSymbols = voiceSymbols.concat(m.getVoiceSymbols(voiceId)));
        return voiceSymbols;
    }

    removeLayoutObjects(musicObj: MusicObject) {
        this.forEachMeasure(m => m.removeLayoutObjects(musicObj));
    }

    update() {
        if (!this.needUpdate) {
            return;
        }

        // Update beams.
        this.forEachMeasure(m => m.updateBeams());

        // Update extensions.
        this.forEachMeasure(m => m.updateExtensions());

        // Update arcs.
        this.allArcsProps.forEach(arc => arc.removeArcs());
        this.allArcsProps.forEach(arc => arc.createArcs());

        this.needUpdate = false;
    }

    private forEachMeasure(func: (m: ObjMeasure) => void) {
        let m = this.getFirstMeasure();
        while (m) {
            func(m);
            m = m.getNextMeasure();
        }
    }

    resetMeasures() {
        this.measures.forEach(m => m.resetPassCount());
    }

    updateCursorRect(cursorRect?: DivRect) {
        if (this.renderer) {
            this.renderer.updateCursorRect(cursorRect);
        }
    }

    requestLayout() {
        this.needLayout = true;
        this.needUpdate = true;
    }

    requestFullLayout() {
        this.rows.forEach(row => row.requestLayout());

        this.forEachMeasure(m => {
            m.getColumns().forEach(col => col.requestLayout());
            m.requestLayout();
        });

        this.requestLayout();
    }

    layout() {
        if (!this.needLayout) {
            return;
        }

        this.update();

        const { renderer } = this;

        if (!renderer) {
            return;
        }

        let { unitSize } = renderer;

        let layoutGroups = this.layoutGroups.filter(layoutGroup => !!layoutGroup);

        // Clear resolved position and layout objects
        layoutGroups.forEach(layoutGroup => layoutGroup.clearPositionAndLayout(renderer));

        // Layout rows
        this.rows.forEach(row => row.layout(renderer));

        // Calculate desired row width
        let rowWidth = Math.max(
            DocumentSettings.DocumentMinWidth * unitSize,
            ...this.rows.map(row => 1.4 * row.getMinWidth())
        );

        // Stretch row to desired width
        this.rows.forEach(row => row.layoutWidth(renderer, rowWidth));

        // Layout arcs and beams
        this.rows.forEach(row => row.layoutArcsAndBeams(renderer));

        // Layout layout groups
        layoutGroups.forEach(layoutGroup => {
            this.rows.forEach(row => {
                row.layoutLayoutGroup(renderer, layoutGroup, VerticalPos.AboveStaff);
                row.layoutLayoutGroup(renderer, layoutGroup, VerticalPos.BelowStaff);
            });
        });

        // Add padding to rows
        this.rows.forEach(row => row.layoutPadding(renderer));

        // Set document rect and set row positions
        this.rect = new DivRect();

        if (this.header) {
            // Layout header with desired width
            this.header.layoutWidth(renderer, rowWidth);

            this.rect.expandInPlace(this.header.getRect());
        }

        // Stack rows on top of each other
        this.rows.forEach(row => {
            row.offset(-this.rect.left, this.rect.bottom + unitSize * 2 - row.getRect().top);
            this.rect.expandInPlace(row.getRect())
        });

        // Done
        this.rows.forEach(row => row.layoutDone());

        this.needLayout = false;
    }

    drawContent() {
        const { renderer } = this;

        if (!renderer) {
            return;
        }

        this.rows.forEach(row => row.draw(renderer));

        if (this.header) {
            this.header.draw(renderer);
        }
    }

    pickPitch(x: number, y: number): PickedPitch | undefined {
        if (!this.rect.contains(x, y)) {
            return undefined;
        }

        for (let ri = 0; ri < this.rows.length; ri++) {
            let row = this.rows[ri];

            if (!row.hasStaff) {
                continue;
            }

            let minPitch = row.getBottomStaff().minPitch;
            let maxPitch = row.getTopStaff().maxPitch;

            if (!row.getRect().contains(x, y)) {
                continue;
            }

            for (let mi = 0; mi < row.getMeasures().length; mi++) {
                let measure = row.getMeasures()[mi].getMusicInterface();
                let rect = measure.getMusicObject().getRect();

                if (x >= rect.left && x <= rect.right) {
                    let pitch = row.getPitchAt(y);
                    if (pitch !== undefined && pitch >= minPitch && pitch <= maxPitch) {
                        return { measure, pitch };
                    }
                }
            }
        }

        return undefined;
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        if (this.header) {
            let arr = this.header.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.rows.length; i++) {
            let arr = this.rows[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }
}
