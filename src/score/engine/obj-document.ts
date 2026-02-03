import { StaffPos, View } from "./view";
import { MusicObject } from "./music-object";
import { ObjScoreRow, ScoreRowRegions } from "./obj-score-row";
import { ObjMeasure } from "./obj-measure";
import { ObjHeader } from "./obj-header";
import { Clef, MDocument, MeasureOptions, ScoreConfiguration, StaffConfig, StaffPreset, TabConfig, VerticalPosition, VoiceId, Player } from "../pub";
import { DocumentSettings } from "./settings";
import { RhythmSymbol } from "./obj-rhythm-column";
import { ConnectiveProps } from "./connective-props";
import { AnchoredRect, Guard, Rect, UniMap, ValueSet } from "@tspro/ts-utils-lib";
import { StaffGroup } from "./layout-object";
import { MusicError, MusicErrorType } from "web-music-score/core";

export class ObjDocument extends MusicObject {
    private needLayout: boolean = true;

    private attachedViews = new ValueSet<View>();

    readonly regions = new ScoreRowRegions();

    private readonly rows: ObjScoreRow[] = [];
    private readonly measures: ObjMeasure[] = [];

    private measuresPerRow: number = Infinity;

    private curScoreConfig: (StaffConfig | TabConfig)[] = [{ type: "staff", clef: Clef.G }];

    private header?: ObjHeader;

    private newRowRequested: boolean = false;

    private allConnectiveProps: ConnectiveProps[] = [];

    private staffGroups = new UniMap<string, StaffGroup>();

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

    addView(view?: View) {
        if (!view) return;
        this.attachedViews.add(view);
        view.setDocument(this);
        this.requestFullLayout();
    }

    removeView(view?: View) {
        if (!view) return;
        view.setDocument(undefined);
        this.attachedViews.delete(view);
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

    updateCursorRect(player: Player, cursorRect?: Rect) {
        for (const view of this.attachedViews)
            view.updateCursorOverlay(player, cursorRect);
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

    layout(view: View) {
        if (!this.needLayout) {
            return;
        }

        let { unitSize } = view;

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
        this.rows.forEach(row => row.resetLayoutGroups(view));

        this.regions.resetWidths();
        this.regions.addRowstaffWidth(DocumentSettings.MinStaffWidth * unitSize);

        // Layout rows
        this.rows.forEach(row => row.layout(view));

        // Stretch row accordsing to region data
        this.rows.forEach(row => row.layoutStretch(view));

        // Layout layout groups
        this.rows.forEach(row => row.layoutLayoutGroups(view));

        // Position notation lines
        this.rows.forEach(row => row.layoutSetNotationLines(view));

        // Set document rect and set row positions
        this.rect = new AnchoredRect();

        if (this.header) {
            // Layout header with
            this.header.layout(view);
            this.rect.unionInPlace(this.header.getRect());
        }

        // Stack rows on top of each other
        this.rows.forEach(row => {
            row.setLeft(0);
            row.setTop(this.rect.bottom + unitSize * 2);
            this.rect.unionInPlace(row.getRect());
        });

        // Done
        this.rows.forEach(row => row.layoutDone());

        // Mark whole view dirty.
        view.isAllDirty = true;

        this.needLayout = false;
    }

    offset(dx: number, dy: number) { }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        this.header?.draw(view, clipRect);
        this.rows.forEach(row => row.draw(view, clipRect));
    }

    pickStaffPosAt(x: number, y: number): StaffPos | undefined {
        if (!this.rect.contains(x, y)) {
            return undefined;
        }

        for (let r = 0; r < this.rows.length; r++) {
            const row = this.rows[r];

            for (let s = 0; s < row.getStaves().length; s++) {
                const staff = row.getStaves()[s];

                const m = row.getMeasures().find(m => m.getRect().contains(x, y));

                if (!m) continue;

                let diatonicId = staff.getDiatonicIdAt(y);
                let { minDiatonicId, maxDiatonicId } = staff.calcUsedDiatonicIdRange();

                if (diatonicId !== undefined && diatonicId >= minDiatonicId && diatonicId <= maxDiatonicId) {
                    return {
                        staff,
                        diatonicId,
                        measure: m,
                        accidental: m.getKeySignature().getAccidental(diatonicId)
                    };
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
