import { Note } from "@tspro/web-music-score/theory";
import { MusicObject } from "./music-object";
import { Arpeggio, DivRect, Stem, MRhythmColumn, getVoiceIds, VerseNumber, VoiceId } from "../pub";
import { RenderContext } from "./render-context";
import { AccidentalState } from "./acc-state";
import { ObjArpeggio } from "./obj-arpeggio";
import { ObjMeasure, validateVoiceId } from "./obj-measure";
import { ObjRest } from "./obj-rest";
import { ObjNoteGroup } from "./obj-note-group";
import { PlayerColumnProps } from "./player";
import { DocumentSettings } from "./settings";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjNotationLine, ObjStaff } from "./obj-staff-and-tab";
import { ObjLyrics } from "./obj-lyrics";
import { VerticalPos } from "./layout-object";
import { IndexArray, Map2, Map3 } from "@tspro/ts-utils-lib";

export type ScorePlayerNote = {
    note: Note,
    ticks: number,
    staccato: boolean
    slur: undefined | "first" | "slurred"
}

export type RhythmSymbol = ObjNoteGroup | ObjRest;

export class ObjRhythmColumn extends MusicObject {
    private readonly voiceSymbol = new IndexArray<RhythmSymbol>();

    private readonly lyricsObject = new Map3<VerseNumber, ObjNotationLine, VerticalPos, ObjLyrics>();

    private minDiatonicId?: number;
    private maxDiatonicId?: number;
    private staffMinDiatonicId = new Map<ObjStaff, number>();
    private staffMaxDiatonicId = new Map<ObjStaff, number>();

    private arpeggioDir: Arpeggio | undefined;
    private arpeggios: ObjArpeggio[] = [];

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
        this.getRect(); // executes this.updateRect() if required, which sets this.shapeRects.
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

        for (const symbol of this.voiceSymbol.values()) {
            let arr = symbol.pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.arpeggios.length; i++) {
            let arr = this.arpeggios[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return []; // Do not return [this].
    }

    hasArpeggio() {
        return this.arpeggioDir !== undefined;
    }

    getArpeggioDir(): Arpeggio {
        return this.arpeggioDir ?? Arpeggio.Up;
    }

    setVoiceSymbol(voiceId: VoiceId, symbol: RhythmSymbol) {
        validateVoiceId(voiceId);

        this.voiceSymbol.set(voiceId, symbol);

        if (symbol instanceof ObjRest && !symbol.hide) {
            this.row.getStaves().forEach(staff => {
                let diatonicId = symbol.getDiatonicId(staff);
                this.minDiatonicId = this.minDiatonicId === undefined ? diatonicId : Math.min(this.minDiatonicId, diatonicId);
                this.maxDiatonicId = this.maxDiatonicId === undefined ? diatonicId : Math.max(this.maxDiatonicId, diatonicId);
            });
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

            this.updateNoteDisplacements();
        }

        this.requestLayout();
        this.requestRectUpdate();
    }

    getVoiceSymbol(voiceId: VoiceId): RhythmSymbol | undefined {
        return this.voiceSymbol.get(voiceId);
    }

    getLyricsObject(verse: VerseNumber, line: ObjNotationLine, vpos: VerticalPos): ObjLyrics | undefined {
        return this.lyricsObject.get(verse, line, vpos);
    }

    addLyricsObject(lyricsObj: ObjLyrics) {
        this.lyricsObject.set(lyricsObj.verse, lyricsObj.line, lyricsObj.vpos, lyricsObj);
    }

    getMinWidth() {
        let maxNoteSize = Math.max(...this.voiceSymbol.mapToArray(s => s.rhythmProps.noteSize));

        let w = DocumentSettings.NoteHeadWidth;

        switch (maxNoteSize) {
            case 1: return w * 5; // whole note
            case 2: return w * 3; // half note
            case 4: return w * 2; // quarter note
            default: return w;
        }
    }

    updateNoteDisplacements() {
        type NoteHeadDisplacement = {
            noteGroup: ObjNoteGroup,
            note: Note,
            isDisplaced?: boolean
        }

        let data: NoteHeadDisplacement[] = [];

        this.voiceSymbol.forEach(symbol => {
            if (symbol instanceof ObjNoteGroup) {
                symbol.notes.forEach(note => {
                    symbol.setNoteDisplacement(note, false);
                    data.push({ noteGroup: symbol, note });
                });
            }
        });

        const noteHeadDataCompareFunc = (a: NoteHeadDisplacement, b: NoteHeadDisplacement) => {
            let cmp = Note.compareFunc(a.note, b.note);
            return cmp === 0
                ? a.noteGroup.stemDir === b.noteGroup.stemDir ? 0 : a.noteGroup.stemDir === Stem.Up ? 1 : -1
                : cmp;
        }

        data.sort(noteHeadDataCompareFunc);

        if (data.length < 2) {
            return;
        }

        for (let i = 0; i < data.length; i++) {
            let cur = data[i];
            let next = data[i + 1];

            if (next && cur.note.diatonicId === next.note.diatonicId) {
                cur.isDisplaced = next.isDisplaced = false;
            }
        }

        for (let i = 0; i < data.length; i++) {
            let prev = data[i - 1];
            let cur = data[i];
            let next = data[i + 1];

            if (cur.isDisplaced === undefined) {
                if (prev && cur.note.diatonicId - prev.note.diatonicId <= 1) {
                    cur.isDisplaced = !prev.isDisplaced;
                }
                else if (next && next.note.diatonicId - cur.note.diatonicId <= 1) {
                    cur.isDisplaced = !next.isDisplaced;
                }
            }
        }

        data.forEach(el => el.noteGroup.setNoteDisplacement(el.note, el.isDisplaced ?? false));
    }

    isEmpty(): boolean {
        return this.voiceSymbol.size === 0 || this.voiceSymbol.every(symbol => symbol.isEmpty());
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

    layout(ctx: RenderContext, accState: AccidentalState) {
        if (!this.needLayout) {
            return;
        }

        this.requestRectUpdate();

        this.rect = new DivRect();

        let { row } = this;
        let { unitSize } = ctx;

        // Set initially column's min width
        let halfMinWidth = this.getMinWidth() * unitSize / 2;

        let leftw = halfMinWidth;
        let rightw = halfMinWidth;

        // Layout voice symbols
        this.voiceSymbol.forEach(symbol => {
            symbol.layout(ctx, accState);

            let r = symbol.getRect();

            leftw = Math.max(leftw, r.leftw);
            rightw = Math.max(rightw, r.rightw);
        });

        if (this.arpeggioDir !== undefined) {
            let arpeggioWidth = 0;
            this.arpeggios = row.getNotationLines().map(line => {
                let arpeggio = new ObjArpeggio(this, line, this.getArpeggioDir());
                arpeggio.layout(ctx);
                arpeggio.offset(-leftw - arpeggio.getRect().right, line.getRect().centerY - arpeggio.getRect().centerY);
                arpeggioWidth = Math.max(arpeggioWidth, arpeggio.getRect().width);
                line.addObject(arpeggio);
                this.measure.addStaticObject(line, arpeggio);
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

        // Find min/max diatonicId for each staff.
        this.row.getStaves().forEach(staff => {
            let minDiatonicId: number | undefined = undefined;
            let maxDiatonicId: number | undefined = undefined;

            this.voiceSymbol.forEach(symbol => {
                if (symbol.visibleInStaff(staff)) {
                    if (symbol instanceof ObjNoteGroup) {
                        minDiatonicId = minDiatonicId === undefined ? symbol.minDiatonicId : Math.min(minDiatonicId, symbol.minDiatonicId);
                        maxDiatonicId = maxDiatonicId === undefined ? symbol.maxDiatonicId : Math.max(maxDiatonicId, symbol.maxDiatonicId);
                    }
                    else if (symbol instanceof ObjRest) {
                        let diatonicId = symbol.getDiatonicId(staff);
                        minDiatonicId = minDiatonicId === undefined ? diatonicId : Math.min(minDiatonicId, diatonicId);
                        maxDiatonicId = maxDiatonicId === undefined ? diatonicId : Math.max(maxDiatonicId, diatonicId);
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
        this.shapeRects = [
            ...this.voiceSymbol.filter(s => !!s).mapToArray(s => s.getRect().copy()),
            ...this.arpeggios.map(a => a.getRect().copy())
        ];

        this.rect.top = Math.min(...this.shapeRects.map(r => r.top));
        this.rect.bottom = Math.max(...this.shapeRects.map(r => r.bottom));
        this.rect.centerY = (this.rect.top + this.rect.bottom) / 2;
    }

    offset(dx: number, dy: number) {
        this.voiceSymbol.forEach(symbol => symbol.offset(dx, 0));
        this.arpeggios.forEach(arpeggio => arpeggio.offset(dx, 0));
        this.shapeRects.forEach(r => r.offsetInPlace(dx, dy));
        this.rect.offsetInPlace(dx, dy);
    }

    draw(ctx: RenderContext) {
        // Draw ledger lines
        this.row.getStaves().forEach(staff => {
            let minDiatonicId = this.staffMinDiatonicId.get(staff);
            let maxDiatonicId = this.staffMaxDiatonicId.get(staff);

            if (minDiatonicId !== undefined) {
                ctx.drawLedgerLines(staff, minDiatonicId, this.getRect().centerX);
            }

            if (maxDiatonicId !== undefined) {
                ctx.drawLedgerLines(staff, maxDiatonicId, this.getRect().centerX);
            }
        });

        // Draw symbols
        this.voiceSymbol.forEach(symbol => symbol.draw(ctx));

        // Draw arpeggios
        this.arpeggios.forEach(arpeggio => arpeggio.draw(ctx));
    }
}
