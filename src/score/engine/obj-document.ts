import { RenderContext } from "./render-context";
import { MusicObject } from "./music-object";
import { ObjScoreRow } from "./obj-score-row";
import { ObjMeasure } from "./obj-measure";
import { ObjHeader } from "./obj-header";
import { Clef, MDocument, MeasureOptions, ScoreConfiguration, StaffConfig, StaffPreset, TabConfig, VerticalPosition, VoiceId } from "../pub";
import { DocumentSettings } from "./settings";
import { RhythmSymbol } from "./obj-rhythm-column";
import { ConnectiveProps } from "./connective-props";
import { AnchoredRect, Guard, Rect, UniMap } from "@tspro/ts-utils-lib";
import { StaffGroup } from "./layout-object";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";

export class InstrumentGroupRegions {
    nameLeft: number = 0;
    nameRight: number = 0;
    braceLeft: number = 0;
    braceRight: number = 0;
    get left() { return this.nameLeft; }
    get right() { return this.braceRight; }
    get width() { return this.right - this.left; }
}

export class ObjDocument extends MusicObject {
    private needLayout: boolean = true;

    private ctx?: RenderContext;

    private readonly rows: ObjScoreRow[] = [];
    private readonly measures: ObjMeasure[] = [];

    private measuresPerRow: number = Infinity;

    private curScoreConfig: (StaffConfig | TabConfig)[] = [{ type: "staff", clef: Clef.G }];

    private header?: ObjHeader;

    private newRowRequested: boolean = false;

    private allConnectiveProps: ConnectiveProps[] = [];

    private staffGroups = new UniMap<string, StaffGroup>();

    private instrumentGroupRegions = new InstrumentGroupRegions();

    private readonly mi: MDocument;

    constructor() {
        super(undefined);

        this.mi = new MDocument(this);
    }

    getMusicInterface(): MDocument {
        return this.mi;
    }

    setScoreConfiguration(config: StaffPreset | ScoreConfiguration) {
        if (Guard.isEnumValue(config, StaffPreset)) {
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
                        { type: "staff", clef: Clef.G, grandId: "grand1" },
                        { type: "staff", clef: Clef.F, grandId: "grand1" }
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
        else if (Guard.isArray(config)) {
            this.curScoreConfig = config;
        }
        else {
            this.curScoreConfig = [config];
        }

        // Convert deprecated isGRand into grandId.
        for (let cfgId = 0, grandId = "grand"; cfgId < this.curScoreConfig.length;) {
            let treble = this.curScoreConfig[cfgId];
            let bass = this.curScoreConfig[cfgId + 1];

            // Create unique grandId.
            while (this.curScoreConfig.filter(cfg => cfg.type === "staff").findIndex(cfg => cfg.grandId === grandId) >= 0) {
                grandId += "A";
            }

            if (treble && treble.type === "staff" && treble.isGrand) {
                if (treble.grandId !== undefined) {
                    throw new MusicError(MusicErrorType.Score, `Grand staff error: mixing isGrand and grandId!`);
                }
                else if (bass && bass.type === "staff" && bass.isGrand) {
                    if (bass.grandId !== undefined) {
                        throw new MusicError(MusicErrorType.Score, `Grand staff error: mixing isGrand and grandId!`);
                    }
                    else {
                        treble.grandId = grandId;
                        bass.grandId = grandId;
                        treble.isGrand = bass.isGrand = false;
                        cfgId += 2;
                    }
                }
                else {
                    throw new MusicError(MusicErrorType.Score, `Grand staff error: invalid use of isGrand!`);
                }
            }
            else {
                cfgId++;
            }
        }

        // Setup grand staff.
        for (let cfgId: number = 0, usedGrandIdes: string[] = []; cfgId < this.curScoreConfig.length;) {
            let treble = this.curScoreConfig[cfgId];
            let bass = this.curScoreConfig[cfgId + 1];

            if (treble && bass && treble.type === "staff" && bass.type === "staff" && treble.grandId !== undefined && treble.grandId === bass.grandId) {
                if (usedGrandIdes.includes(treble.grandId)) {
                    throw new MusicError(MusicErrorType.Score, `Grand staff error: grandId "${treble.grandId}" already used!`);
                }
                else if (treble.clef !== Clef.G) {
                    throw new MusicError(MusicErrorType.Score, `Grand staff error: Invalid treble clef "${treble.clef}"!`);
                }
                else if (bass.clef !== Clef.F) {
                    throw new MusicError(MusicErrorType.Score, `Grand staff error: Invalid treble clef "${treble.clef}"!`);
                }
                else if (treble.isOctaveDown || bass.isOctaveDown) {
                    throw new MusicError(MusicErrorType.Score, `Grand staff error: cannot use isOctaveDown option!`);
                }

                usedGrandIdes.push(treble.grandId);

                treble.minNote = "C4";
                bass.maxNote = "B3";

                cfgId += 2;
            }
            else if (treble && treble.type === "staff" && treble.grandId !== undefined) {
                throw new MusicError(MusicErrorType.Score, `Grand staff error: invalid use of grandId "${treble.grandId}"!`);
            }
            else {
                cfgId++;
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

    setRenderContext(ctx?: RenderContext) {
        if (this.ctx === ctx) {
            return;
        }

        let prevCtx = this.ctx;

        this.ctx = ctx;

        if (prevCtx) {
            prevCtx.setDocument(undefined);
        }

        if (ctx) {
            ctx.setDocument(this.mi);
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

    getRows(): ReadonlyArray<ObjScoreRow> {
        return this.rows;
    }

    getMeasures(): ReadonlyArray<ObjMeasure> {
        return this.measures;
    }

    requestNewRow(): void {
        this.newRowRequested = true;
    }

    addMeasure(measureOptions: MeasureOptions): ObjMeasure {
        let lastRow: ObjScoreRow | undefined = this.rows[this.rows.length - 1];

        if (!lastRow || this.newRowRequested && lastRow.getMeasures().length > 0 || lastRow.getMeasures().length >= this.measuresPerRow) {
            lastRow = this.addNewRow(lastRow);
            this.newRowRequested = false;
        }

        let measure = new ObjMeasure(lastRow, measureOptions);

        this.measures.push(measure);

        // Add measure to last row.
        lastRow.addMeasure(measure);

        this.requestLayout();

        return measure;
    }

    addStaffGroup(groupName: string, layoutElements: number | string | (number | string)[], verticalPosition: VerticalPosition) {
        this.staffGroups.set(groupName, new StaffGroup(groupName, layoutElements, verticalPosition));
    }

    getStaffGroup(groupName: string): StaffGroup | undefined {
        return this.staffGroups.get(groupName);
    }

    getVoiceSymbols(voiceId: VoiceId): ReadonlyArray<RhythmSymbol> {
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

    updateCursorRect(cursorRect?: Rect) {
        if (this.ctx) {
            this.ctx.updateCursorRect(cursorRect);
        }
    }

    getInstrumentGroupRegions(ctx: RenderContext): InstrumentGroupRegions {
        let nameWidth = Math.max(0, ...this.rows.map(row => row.getInstrumentNameWidth(ctx)));
        let hasName = nameWidth > 0;
        let padding = hasName ? ctx.unitSize : 0;
        let braceWidth = hasName ? ctx.unitSize * 5 : 0;

        this.instrumentGroupRegions.nameLeft = 0;
        this.instrumentGroupRegions.nameRight = nameWidth;
        this.instrumentGroupRegions.braceLeft = nameWidth + padding;
        this.instrumentGroupRegions.braceRight = nameWidth + padding + braceWidth + padding;

        return this.instrumentGroupRegions;
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

        const { ctx } = this;

        if (!ctx) {
            return;
        }

        let { unitSize } = ctx;

        // Recreate beams.
        this.forEachMeasure(m => m.createBeams());

        // Update running parameters
        this.getFirstMeasure()?.updateRunningArguments();

        // Recreate extensions.
        this.forEachMeasure(m => m.createExtensions());

        // Create connectives.
        this.allConnectiveProps.forEach(props => props.removeConnectives());
        this.allConnectiveProps.forEach(props => props.createConnectives());

        // Reset layout groups
        this.rows.forEach(row => row.resetLayoutGroups(ctx));

        // Layout rows
        this.rows.forEach(row => row.layout(ctx));

        // Get row left and right
        let rowLeft = this.getInstrumentGroupRegions(ctx).right;
        let rowRight = rowLeft + Math.max(
            DocumentSettings.DocumentMinWidth * unitSize,
            ...this.rows.map(row => row.getMinWidth())
        );

        // Stretch row to desired width
        this.rows.forEach(row => row.layoutWidth(ctx, rowLeft, rowRight));

        // Layout layout groups
        this.rows.forEach(row => row.layoutLayoutGroups(ctx));

        // Position notation lines
        this.rows.forEach(row => row.layoutSetNotationLines(ctx));

        // Add padding to rows
        this.rows.forEach(row => row.layoutPadding(ctx));

        // Set document rect and set row positions
        this.rect = new AnchoredRect();

        if (this.header) {
            // Layout header with desired width
            this.header.layoutWidth(ctx, rowLeft, rowRight);

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
        const { ctx } = this;

        if (!ctx) {
            return;
        }

        this.rows.forEach(row => row.draw(ctx));

        if (this.header) {
            this.header.draw(ctx);
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
