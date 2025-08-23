import { DefaultTuningName, getTuningStrings, Note, SymbolSet, validateTuningName } from "@tspro/web-music-score/theory";
import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjScoreRow } from "./obj-score-row";
import { ObjMeasure } from "./obj-measure";
import { ObjHeader } from "./obj-header";
import { Clef, DivRect, DocumentOptions, MDocument, StaffConfig, StaffPreset, TabConfig } from "../pub";
import { DocumentSettings } from "./settings";
import { RhythmSymbol } from "./obj-rhythm-column";
import { LayoutGroup, LayoutGroupId, VerticalPos } from "./layout-object";
import { ConnectiveProps } from "./connective-props";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { Utils } from "@tspro/ts-utils-lib";

export class ObjDocument extends MusicObject {
    private needLayout: boolean = true;

    private renderer?: Renderer;

    private readonly rows: ObjScoreRow[] = [];
    private readonly measures: ObjMeasure[] = [];

    public readonly measuresPerRow?: number;
    public readonly tuningName: string;
    public readonly tuningStrings: ReadonlyArray<Note>;
    public readonly tuningLabel: string;
    public readonly fullDiatonicRange: boolean;

    public readonly config: (StaffConfig | TabConfig)[] = [];

    private header?: ObjHeader;

    private layoutGroups: LayoutGroup[/* LayoutGroupOrder */] = [];

    private newRowRequested: boolean = false;

    private allConnectiveProps: ConnectiveProps[] = [];

    constructor(readonly mi: MDocument, config: StaffPreset | StaffConfig | TabConfig | (StaffConfig | TabConfig)[], readonly options?: DocumentOptions) {
        super(undefined);

        this.measuresPerRow = options?.measuresPerRow;
        this.tuningName = validateTuningName(options?.tuning ?? DefaultTuningName);
        this.tuningStrings = getTuningStrings(this.tuningName);
        this.tuningLabel = this.tuningStrings.slice().reverse().map(n => n.formatOmitOctave(SymbolSet.Ascii)).join("-");
        this.fullDiatonicRange = options?.fullDiatonicRange === true;

        if (Utils.Is.isEnumValue(config, StaffPreset)) {
            switch (config) {
                default:
                case StaffPreset.Treble:
                    this.config = [{ type: "staff", clef: Clef.G, minNote: this.fullDiatonicRange ? "C3" : undefined, maxNote: this.fullDiatonicRange ? "C7" : undefined }];
                    break;
                case StaffPreset.Bass:
                    this.config = [{ type: "staff", clef: Clef.F, minNote: this.fullDiatonicRange ? "C1" : undefined, maxNote: this.fullDiatonicRange ? "C5" : undefined }];
                    break;
                case StaffPreset.Grand:
                    this.config = [
                        { type: "staff", clef: Clef.G, isGrand: true, minNote: undefined, maxNote: this.fullDiatonicRange ? "C7" : undefined },
                        { type: "staff", clef: Clef.F, isGrand: true, maxNote: undefined, minNote: this.fullDiatonicRange ? "C1" : undefined }
                    ];
                    break;
                case StaffPreset.GuitarTreble:
                    this.config = [{ type: "staff", clef: Clef.G, isOctaveDown: true, minNote: this.fullDiatonicRange ? "C2" : undefined, maxNote: this.fullDiatonicRange ? "C6" : undefined }];
                    break;
                case StaffPreset.GuitarTab:
                    this.config = [{ type: "tab", tuning: this.tuningName }];
                    break;
                case StaffPreset.GuitarCombined:
                    this.config = [
                        { type: "staff", clef: Clef.G, isOctaveDown: true, minNote: this.fullDiatonicRange ? "C2" : undefined, maxNote: this.fullDiatonicRange ? "C6" : undefined },
                        { type: "tab", tuning: this.tuningName }
                    ];
                    break;
            }
        }
        else if (Utils.Is.isArray(config)) {
            this.config = config;
        }
        else {
            this.config = [config];
        }

        // Setup grand staff.
        for (let i = 0; i < this.config.length - 1; i++) {
            let treble = this.config[i];
            let bass = this.config[i + 1];
            if (treble.type === "staff" && bass.type === "staff") {
                if (treble.clef === Clef.G && treble.isGrand && bass.clef === Clef.F && bass.isGrand) {
                    treble.minNote = "C4";
                    bass.maxNote = "B3";
                    treble.isOctaveDown = bass.isOctaveDown = false;
                }
                else {
                    treble.isGrand = bass.isGrand = false;
                }
            }
            else if (treble.type === "staff") {
                treble.isGrand = false;
            }
            else if (bass.type === "staff") {
                bass.isGrand = false;
            }
        }

        // There is always row
        this.rows.push(new ObjScoreRow(this));
    }

    getMusicInterface(): MDocument {
        return this.mi;
    }

    addConnectiveProps(connectiveProps: ConnectiveProps) {
        this.allConnectiveProps.push(connectiveProps);
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

    getComposer(): string | undefined {
        return this.header?.composer;
    }

    getArranger(): string | undefined {
        return this.header?.arranger;
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

        let lastRow = this.getLastRow();

        if (!lastRow) {
            throw new MusicError(MusicErrorType.Score, "Cannot add measure because last row is undefined.");
        }

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

        const { renderer } = this;

        if (!renderer) {
            return;
        }

        let { unitSize } = renderer;

        // Recreate beams.
        this.forEachMeasure(m => m.createBeams());

        // Recreate extensions.
        this.forEachMeasure(m => m.createExtensions());

        // Create connectives.
        this.allConnectiveProps.forEach(props => props.removeConnectives());
        this.allConnectiveProps.forEach(props => props.createConnectives());

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

        // Position notation lines
        this.rows.forEach(row => row.layoutPositionLines(renderer));

        // Align stems to beams beams
        this.rows.forEach(row => row.alignStemsToBeams());

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
            this.rect.expandInPlace(row.getRect());
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

    pickStaffPosAt(x: number, y: number): { scoreRow: ObjScoreRow, diatonicId: number } | undefined {
        if (!this.rect.contains(x, y)) {
            return undefined;
        }

        for (let ri = 0; ri < this.rows.length; ri++) {
            let row = this.rows[ri];

            if (!row.hasStaff) {
                continue;
            }

            if (!row.getRect().contains(x, y)) {
                continue;
            }

            let diatonicId = row.getDiatonicIdAt(y);

            if (diatonicId !== undefined) {
                return { scoreRow: row, diatonicId };
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
