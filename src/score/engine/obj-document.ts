import { Renderer } from "./renderer";
import { MusicObject } from "./music-object";
import { ObjScoreRow } from "./obj-score-row";
import { ObjMeasure } from "./obj-measure";
import { ObjHeader } from "./obj-header";
import { Clef, DivRect, MDocument, NotationLineId, ScoreConfiguration, StaffConfig, StaffPreset, TabConfig, VerticalPosition } from "../pub";
import { DocumentSettings } from "./settings";
import { RhythmSymbol } from "./obj-rhythm-column";
import { ConnectiveProps } from "./connective-props";
import { Utils } from "@tspro/ts-utils-lib";
import { LayoutObjectPositionGroup } from "./layout-object";

export class ObjDocument extends MusicObject {
    private needLayout: boolean = true;

    private renderer?: Renderer;

    private readonly rows: ObjScoreRow[] = [];
    private readonly measures: ObjMeasure[] = [];

    private measuresPerRow: number = Infinity;

    private curScoreConfig: (StaffConfig | TabConfig)[] = [{ type: "staff", clef: Clef.G }];

    private header?: ObjHeader;

    private newRowRequested: boolean = false;

    private allConnectiveProps: ConnectiveProps[] = [];

    private layoutObjectPositionGroups = new Map<string, LayoutObjectPositionGroup>();

    private readonly mi: MDocument;

    constructor() {
        super(undefined);

        this.mi = new MDocument(this);
    }

    getMusicInterface(): MDocument {
        return this.mi;
    }

    setScoreConfiguration(config: StaffPreset | ScoreConfiguration) {
        if (Utils.Is.isEnumValue(config, StaffPreset)) {
            switch (config) {
                default:
                case StaffPreset.Treble:
                    this.curScoreConfig = [{ type: "staff", clef: Clef.G }];
                    break;
                case StaffPreset.Bass:
                    this.curScoreConfig = [{ type: "staff", clef: Clef.F }];
                    break;
                case StaffPreset.Grand:
                    this.curScoreConfig = [
                        { type: "staff", clef: Clef.G, isGrand: true },
                        { type: "staff", clef: Clef.F, isGrand: true }
                    ];
                    break;
                case StaffPreset.GuitarTreble:
                    this.curScoreConfig = [{ type: "staff", clef: Clef.G, isOctaveDown: true }];
                    break;
                case StaffPreset.GuitarTab:
                    this.curScoreConfig = [{ type: "tab", tuning: "Standard" }];
                    break;
                case StaffPreset.GuitarCombined:
                    this.curScoreConfig = [
                        { type: "staff", clef: Clef.G, isOctaveDown: true },
                        { type: "tab", tuning: "Standard" }
                    ];
                    break;
            }
        }
        else if (Utils.Is.isArray(config)) {
            this.curScoreConfig = config;
        }
        else {
            this.curScoreConfig = [config];
        }

        // Setup grand staff.
        for (let i = 0; i < this.curScoreConfig.length - 1; i++) {
            let treble = this.curScoreConfig[i];
            let bass = this.curScoreConfig[i + 1];
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

        this.requestNewRow();
    }

    setMeasuresPerRow(measuresPerRow: number) {
        this.measuresPerRow = measuresPerRow;
    }

    addConnectiveProps(connectiveProps: ConnectiveProps) {
        this.allConnectiveProps.push(connectiveProps);
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

    private addNewRow(prevRow: ObjScoreRow | undefined): ObjScoreRow {
        let row = new ObjScoreRow(this, prevRow, this.curScoreConfig);
        this.rows.push(row);
        return row;
    }

    getFirstRow(): ObjScoreRow {
        return this.rows.length === 0 ? this.addNewRow(undefined) : this.rows[0];
    }

    getLastRow(): ObjScoreRow {
        return this.rows.length === 0 ? this.addNewRow(undefined) : this.rows[this.rows.length - 1];
    }

    requestNewRow(): void {
        this.newRowRequested = true;
    }

    addMeasure(): ObjMeasure {
        let lastRow: ObjScoreRow | undefined = this.rows[this.rows.length - 1];

        if (!lastRow || this.newRowRequested && lastRow.getMeasures().length > 0 || lastRow.getMeasures().length >= this.measuresPerRow) {
            lastRow = this.addNewRow(lastRow);
            this.newRowRequested = false;
        }

        let measure = new ObjMeasure(lastRow);

        this.measures.push(measure);

        // Add measure to last row.
        lastRow.addMeasure(measure);

        this.requestLayout();

        return measure;
    }

    addLayoutObjectPositionGroup(groupName: string, notationLineIds: NotationLineId | (NotationLineId)[], verticalPosition: VerticalPosition) {
        this.layoutObjectPositionGroups.set(groupName, new LayoutObjectPositionGroup(groupName, notationLineIds, verticalPosition));
    }

    getLayoutObjectPositionGroup(groupName: string): LayoutObjectPositionGroup | undefined {
        return this.layoutObjectPositionGroups.get(groupName);
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

        // Reset layout groups
        this.rows.forEach(row => row.resetLayoutGroups(renderer));

        // Layout rows
        this.rows.forEach(row => row.layout(renderer));

        // Calculate desired row width
        let rowWidth = Math.max(
            DocumentSettings.DocumentMinWidth * unitSize,
            ...this.rows.map(row => 1.4 * row.getMinWidth())
        );

        // Stretch row to desired width
        this.rows.forEach(row => row.layoutWidth(renderer, rowWidth));

        // Layout layout groups
        this.rows.forEach(row => row.layoutLayoutGroups(renderer));

        // Position notation lines
        this.rows.forEach(row => row.layoutPositionLines(renderer));

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
