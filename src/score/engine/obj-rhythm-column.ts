import { Note, NoteLength } from "@tspro/web-music-score/theory";
import { MusicObject } from "./music-object";
import { Arpeggio, DivRect, Stem, MRhythmColumn, getVoiceIds } from "../pub";
import { Renderer } from "./renderer";
import { AccidentalState } from "./acc-state";
import { ObjArpeggio } from "./obj-arpeggio";
import { ObjMeasure, validateVoiceId } from "./obj-measure";
import { ObjRest } from "./obj-rest";
import { ObjNoteGroup } from "./obj-note-group";
import { PlayerColumnProps } from "./player";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjStaff } from "./obj-staff-and-tab";

type NoteHeadDisplacementData = {
    noteGroup: ObjNoteGroup,
    note: Note,
    displacement?: -1 | 0 | 1
}

const noteHeadDataCompareFunc = (a: NoteHeadDisplacementData, b: NoteHeadDisplacementData) => {
    let cmp = Note.compareFunc(a.note, b.note);

    if (cmp === 0) {
        cmp = a.noteGroup.stemDir === b.noteGroup.stemDir
            ? 0
            : a.noteGroup.stemDir === Stem.Up
                ? 1
                : -1;
    }

    return cmp;
}

export type ScorePlayerNote = {
    note: Note,
    ticks: number,
    staccato: boolean
    slur: undefined | "first" | "slurred"
}

export type RhythmSymbol = ObjNoteGroup | ObjRest;

export class ObjRhythmColumn extends MusicObject {
    private readonly voiceSymbol: RhythmSymbol[/* voiceId */] = [];

    private minDiatonicId?: number;
    private maxDiatonicId?: number;
    private staffMinDiatonicId = new Map<ObjStaff, number>();
    private staffMaxDiatonicId = new Map<ObjStaff, number>();

    private arpeggioDir: Arpeggio | undefined;
    private arpeggios: ObjArpeggio[] = [];

    private noteHeadDisplacements: NoteHeadDisplacementData[] = [];

    private readonly playerProps: PlayerColumnProps;

    private needLayout = true;

    private shapeRects: DivRect[] = [];

    readonly mi: MRhythmColumn;

    constructor(readonly measure: ObjMeasure, readonly positionTicks: number) {
        super(measure);

        this.playerProps = new PlayerColumnProps(this);

        this.mi = new MRhythmColumn(this);
    }

    getMusicInterface(): MRhythmColumn {
        return this.mi;
    }

    getPlayerProps() {
        return this.playerProps;
    }

    /**
     * Get next column in column's measure.
     * @returns 
     */
    getNextColumnInMeasure(): ObjRhythmColumn | undefined {
        let colId = this.measure.getColumns().indexOf(this);

        if (colId >= 0 && colId < this.measure.getColumnCount()) {
            // Next column in measure or undefined
            return this.measure.getColumn(colId + 1);
        }
        else {
            throw new MusicError(MusicErrorType.Score, "Cannot get next column in measure because current column's id in mesure is invalid.");
        }
    }

    /**
     * Get next column. Goes into next measure if necessary.
     * Does not care navigation elements: repeats, endings, etc.
     * @returns 
     */
    getNextColumn(): ObjRhythmColumn | undefined {
        let nextCol = this.getNextColumnInMeasure();

        if (nextCol) {
            return nextCol;
        }
        else {
            // Goto next measure
            return this.measure.getNextMeasure()?.getColumn(0);
        }
    }

    getTicksToNextColumn(): number {
        let next = this.getNextColumnInMeasure();

        let curPositionTicks = this.positionTicks;
        let nextPositionTicks = next ? next.positionTicks : this.measure.getConsumedTicks();

        return Math.max(0, nextPositionTicks - curPositionTicks);
    }

    getShapeRects(): DivRect[] {
        return this.shapeRects;
    }

    get doc() {
        return this.measure.doc;
    }

    get row() {
        return this.measure.row;
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.voiceSymbol.length; i++) {
            if (this.voiceSymbol[i]) {
                let arr = this.voiceSymbol[i].pick(x, y);
                if (arr.length > 0) {
                    return [this, ...arr];
                }
            }
        }

        for (let i = 0; i < this.arpeggios.length; i++) {
            let arr = this.arpeggios[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    hasArpeggio() {
        return this.arpeggioDir !== undefined;
    }

    getArpeggioDir(): Arpeggio {
        return this.arpeggioDir ?? Arpeggio.Up;
    }

    setVoiceSymbol(voiceId: number, symbol: RhythmSymbol) {
        validateVoiceId(voiceId);

        this.voiceSymbol[voiceId] = symbol;

        if (symbol instanceof ObjRest) {
            if (!symbol.hide && symbol.noteLength >= NoteLength.Half) {
                this.minDiatonicId = this.minDiatonicId === undefined ? symbol.ownDiatonicId : Math.min(this.minDiatonicId, symbol.ownDiatonicId);
                this.maxDiatonicId = this.maxDiatonicId === undefined ? symbol.ownDiatonicId : Math.max(this.maxDiatonicId, symbol.ownDiatonicId);
            }
        }
        else if (symbol instanceof ObjNoteGroup) {
            // notes are sorted.
            this.minDiatonicId = this.minDiatonicId === undefined
                ? symbol.notes[0].diatonicId
                : Math.min(this.minDiatonicId, symbol.notes[0].diatonicId);

            this.maxDiatonicId = this.maxDiatonicId === undefined
                ? symbol.notes[symbol.notes.length - 1].diatonicId
                : Math.max(this.maxDiatonicId, symbol.notes[symbol.notes.length - 1].diatonicId);

            if (symbol.arpeggio !== undefined) {
                this.arpeggioDir = symbol.arpeggio;
            }

            this.setupNoteHeadDisplacements();
        }

        this.requestLayout();
    }

    getVoiceSymbol(voiceId: number): RhythmSymbol | undefined {
        return this.voiceSymbol[voiceId];
    }

    getMinWidth() {
        let maxNoteLength = Math.max(...this.voiceSymbol.map(s => s.rhythmProps.noteLength));

        let w = DocumentSettings.NoteHeadWidth;

        switch (maxNoteLength) {
            case NoteLength.Whole: return w * 5;
            case NoteLength.Half: return w * 3;
            case NoteLength.Quarter: return w * 2;
            default: return w;
        }
    }

    setupNoteHeadDisplacements() {
        this.noteHeadDisplacements = [];

        this.voiceSymbol.forEach(symbol => {
            if (symbol instanceof ObjNoteGroup) {
                symbol.notes.forEach(note => {
                    this.noteHeadDisplacements.push({ noteGroup: symbol, note });
                });
            }
        });

        this.noteHeadDisplacements.sort(noteHeadDataCompareFunc);

        if (this.noteHeadDisplacements.length < 2) {
            return;
        }

        for (let i = 0; i < this.noteHeadDisplacements.length; i++) {
            let cur = this.noteHeadDisplacements[i];
            let next = this.noteHeadDisplacements[i + 1];

            if (next && cur.note.diatonicId === next.note.diatonicId) {
                cur.displacement = next.displacement = 0;
            }
        }

        for (let i = 0; i < this.noteHeadDisplacements.length; i++) {
            let prev = this.noteHeadDisplacements[i - 1];
            let cur = this.noteHeadDisplacements[i];
            let next = this.noteHeadDisplacements[i + 1];

            if (cur.displacement !== undefined) {
                continue;
            }

            let d: -1 | 1 = cur.noteGroup.stemDir === Stem.Down ? -1 : 1;

            if (prev && cur.note.diatonicId - prev.note.diatonicId <= 1) {
                cur.displacement = prev.displacement === 0 ? d : 0;
            }
            else if (next && next.note.diatonicId - cur.note.diatonicId <= 1) {
                cur.displacement = next.displacement === 0 ? d : 0;
            }
        }
    }

    getNoteHeadDisplacement(noteGroup: ObjNoteGroup, note: Note): -1 | 0 | 1 {
        let data = this.noteHeadDisplacements.find(d => d.noteGroup === noteGroup && Note.equals(d.note, note));

        if (data?.displacement !== undefined) {
            return data.displacement;
        }
        else {
            return 0;
        }
    }

    isEmpty(): boolean {
        for (let i = 0; i < this.voiceSymbol.length; i++) {
            if (this.voiceSymbol[i] !== undefined && !this.voiceSymbol[i].isEmpty()) {
                return false;
            }
        }
        return true;
    }

    getPlayerNotes() {
        let playerNotes: ScorePlayerNote[] = [];

        function addNote(note: Note, ticks: number, staccato: boolean, slur: undefined | "first" | "slurred") {
            if (ticks <= 0) {
                return;
            }

            let hasSameDiatonicId = playerNotes.some(n => {
                if (note.diatonicId === n.note.diatonicId && note.accidental === n.note.accidental) {
                    // If note with same diatonicId already in list then set note length to max.
                    n.ticks = Math.max(n.ticks, ticks);
                    return true;
                }
                else {
                    return false;
                }
            });

            if (!hasSameDiatonicId) {
                // Add note to list
                playerNotes.push({ note, ticks, staccato, slur });
            }
        }

        getVoiceIds().forEach(voiceId => {
            const symbol = this.getVoiceSymbol(voiceId);

            if (symbol instanceof ObjNoteGroup) {
                let slur = symbol.getPlaySlur();

                symbol.notes.forEach(note => {
                    let ticks = symbol.getPlayTicks(note);
                    let staccato = symbol.staccato;

                    addNote(note, ticks, staccato, slur);
                });
            }
        });

        // Sort notes (required for arpeggio)
        playerNotes.sort((a, b) => Note.compareFunc(a.note, b.note));

        if (this.hasArpeggio() && this.getArpeggioDir() === Arpeggio.Down) {
            playerNotes.reverse();
        }

        return playerNotes;
    }

    requestLayout() {
        if (!this.needLayout) {
            this.needLayout = true;
            this.measure.requestLayout();
        }
    }

    layout(renderer: Renderer, accState: AccidentalState) {
        if (!this.needLayout) {
            return;
        }

        this.rect = new DivRect();

        let { row } = this;
        let { unitSize } = renderer;

        // Set initially column's min width
        let halfMinWidth = this.getMinWidth() * unitSize / 2;

        let leftw = halfMinWidth;
        let rightw = halfMinWidth;

        // Layout voice symbols
        this.voiceSymbol.forEach(symbol => {
            symbol.layout(renderer, accState);

            let r = symbol.getRect();

            leftw = Math.max(leftw, r.leftw);
            rightw = Math.max(rightw, r.rightw);
        });

        if (this.arpeggioDir !== undefined) {
            let arpeggioWidth = 0;
            this.arpeggios = row.getNotationLines().filter(line => line instanceof ObjStaff).map(staff => {
                let arpeggio = new ObjArpeggio(this, this.getArpeggioDir());
                arpeggio.layout(renderer);
                arpeggio.offset(-leftw - arpeggio.getRect().right, staff.getMiddleLineY() - arpeggio.getRect().centerY);
                arpeggioWidth = Math.max(arpeggioWidth, arpeggio.getRect().width);
                staff.addObject(arpeggio);
                return arpeggio;
            });
            leftw += arpeggioWidth;
        }
        else {
            this.arpeggios = [];
        }

        // Widen column by anchored score objects
        let widenColumnObjs = this.getAnchoredLayoutObjects().filter(layoutObj => layoutObj.layoutGroup.widensColumn);

        if (widenColumnObjs.length > 0) {
            widenColumnObjs.forEach(layoutObj => {
                leftw = Math.max(leftw, layoutObj.musicObj.getRect().leftw);
                rightw = Math.max(rightw, layoutObj.musicObj.getRect().rightw);
            });
        }

        // Update accidental states
        this.voiceSymbol.forEach(symbol => symbol.updateAccidentalState(accState));

        this.rect.left = -leftw;
        this.rect.centerX = 0;
        this.rect.right = rightw;

        this.requestRectUpdate();

        // Find min/max diatonicId for each staff.
        this.row.getNotationLines().filter(line => line instanceof ObjStaff).forEach(staff => {
            let minDiatonicId: number | undefined = undefined;
            let maxDiatonicId: number | undefined = undefined;

            this.voiceSymbol.forEach(symbol => {
                if (symbol.visibleInStaff(staff)) {
                    if (symbol instanceof ObjNoteGroup) {
                        minDiatonicId = minDiatonicId === undefined ? symbol.minDiatonicId : Math.min(minDiatonicId, symbol.minDiatonicId);
                        maxDiatonicId = maxDiatonicId === undefined ? symbol.maxDiatonicId : Math.max(maxDiatonicId, symbol.maxDiatonicId);
                    }
                    else if (symbol instanceof ObjRest) {
                        minDiatonicId = minDiatonicId === undefined ? symbol.ownDiatonicId : Math.min(minDiatonicId, symbol.ownDiatonicId);
                        maxDiatonicId = maxDiatonicId === undefined ? symbol.ownDiatonicId : Math.max(maxDiatonicId, symbol.ownDiatonicId);
                    }
                }
            });

            if (minDiatonicId !== undefined) {
                this.staffMinDiatonicId.set(staff, minDiatonicId);
            }
            else {
                this.staffMinDiatonicId.delete(staff);
            }

            if (maxDiatonicId !== undefined) {
                this.staffMaxDiatonicId.set(staff, maxDiatonicId);
            }
            else {
                this.staffMaxDiatonicId.delete(staff);
            }
        });
    }

    layoutDone() {
        this.needLayout = false;
    }

    updateRect() {
        this.voiceSymbol.filter(s => s !== undefined).forEach(s => s.updateRect());

        this.shapeRects = [
            ...this.voiceSymbol.filter(s => s !== undefined).map(s => s.getRect().copy()),
            ...this.arpeggios.map(a => a.getRect().copy())
        ];

        this.rect.top = Math.min(...this.shapeRects.map(r => r.top));
        this.rect.bottom = Math.max(...this.shapeRects.map(r => r.bottom));
        this.rect.centerY = (this.rect.top + this.rect.bottom) / 2;
    }

    offset(dx: number, dy: number) {
        this.voiceSymbol.forEach(symbol => {
            if (symbol) {
                symbol.offset(dx, dy);
            }
        });

        this.arpeggios.forEach(arpeggio => arpeggio.offset(dx, 0));
        this.shapeRects.forEach(r => r.offsetInPlace(dx, dy));
        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        // Draw ledger lines
        this.row.getNotationLines().filter(line => line instanceof ObjStaff).forEach(staff => {
            let minDiatonicId = this.staffMinDiatonicId.get(staff);
            let maxDiatonicId = this.staffMaxDiatonicId.get(staff);

            if (minDiatonicId !== undefined) {
                renderer.drawLedgerLines(staff, minDiatonicId, this.getRect().centerX);
            }

            if (maxDiatonicId !== undefined) {
                renderer.drawLedgerLines(staff, maxDiatonicId, this.getRect().centerX);
            }
        });

        // Draw symbols
        this.voiceSymbol.forEach(symbol => {
            if (symbol) {
                symbol.draw(renderer);
            }
        });

        // Draw arpeggios
        this.arpeggios.forEach(arpeggio => arpeggio.draw(renderer));
    }
}
