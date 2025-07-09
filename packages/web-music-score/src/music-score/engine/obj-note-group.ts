import { Note } from "../../music-theory/note";
import { NoteLength, RhythmProps } from "../../music-theory/rhythm";
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { DivRect, MNoteGroup, Stem, Arpeggio, NoteOptions, ArcPos, TieLength, StringNumber } from "../pub";
import { ArcProps } from "./arc-props";
import { AccidentalState } from "./acc-state";
import { ObjAccidental } from "./obj-accidental";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { BeamGroupType, ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
import { ObjText } from "./obj-text";

function sortNoteStringData(notes: ReadonlyArray<Note>, strings?: StringNumber | StringNumber[]) {
    let stringArr = Utils.Arr.isArray(strings) ? strings : (strings !== undefined ? [strings] : []);

    let noteStringData = notes.map((note, i) => { return { note, string: stringArr[i] } });

    noteStringData = Utils.Arr
        .removeDuplicatesCmp(noteStringData, (a, b) => a.note.equals(b.note))
        .sort((a, b) => Note.compareFunc(a.note, b.note));

    return {
        notes: noteStringData.map(e => e.note),
        strings: noteStringData.every(e => e.string === undefined) ? undefined : noteStringData.map(e => e.string)
    }
}

function solveArpeggio(a: Arpeggio | boolean | undefined): Arpeggio | undefined {
    return a === true || a === Arpeggio.Up ? Arpeggio.Up : (a === Arpeggio.Down ? Arpeggio.Down : undefined);
}

class NoteStaffObjects {
    public noteHeadRects: DivRect[] = [];
    public dotRects: DivRect[] = [];
    public accidentals: ObjAccidental[] = [];
    public stemRect: DivRect | undefined;
    public flagRects: DivRect[] = [];
    public beamGroup?: ObjBeamGroup;
}

class NoteTabObjects {
    public fretNumbers: ObjText[] = [];
}

export class ObjNoteGroup extends MusicObject {
    readonly minPitch: number;
    readonly maxPitch: number;

    readonly ownAvgPitch: number;
    readonly ownStemDir: Stem.Up | Stem.Down;
    readonly ownString: StringNumber[];

    readonly color: string;
    readonly staccato: boolean;
    readonly diamond: boolean;
    readonly arpeggio: Arpeggio | undefined;
    readonly rhythmProps: RhythmProps;

    private startTie?: ArcProps;
    private startSlur?: ArcProps;

    private tieProps: ArcProps[] = [];
    private slurProps: ArcProps[] = [];

    private leftBeamCount = 0;
    private rightBeamCount = 0;

    private readonly staffObjs?: NoteStaffObjects;
    private readonly tabObjs?: NoteTabObjects;

    readonly mi: MNoteGroup;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: number, readonly notes: ReadonlyArray<Note>, noteLength: NoteLength, options?: NoteOptions) {
        super(col);

        Assert.int_gte(notes.length, 1, "Cannot create note group object because notes array is empty.");

        let noteStringData = sortNoteStringData(notes, options?.string);

        this.notes = noteStringData.notes;

        this.minPitch = this.notes[0].pitch;
        this.maxPitch = this.notes[this.notes.length - 1].pitch;

        this.ownAvgPitch = this.measure.updateOwnAvgPitch(voiceId, Math.round((this.minPitch + this.maxPitch) / 2));
        this.ownStemDir = this.measure.updateOwnStemDir(this, options?.stem);
        this.ownString = this.measure.updateOwnString(this, noteStringData.strings);

        this.color = options?.color ?? "black";
        this.staccato = options?.staccato ?? false;
        this.diamond = options?.diamond ?? false;
        this.arpeggio = solveArpeggio(options?.arpeggio);
        this.rhythmProps = new RhythmProps(noteLength, options?.dotted, options?.triplet);

        if (options?.tieSpan !== undefined) {
            this.startTie = new ArcProps("tie", options.tieSpan, options.tiePos ?? ArcPos.Auto, this);
            this.doc.addArcProps(this.startTie);
        }

        if (options?.slurSpan !== undefined) {
            this.startSlur = new ArcProps("slur", options.slurSpan, options.slurPos ?? ArcPos.Auto, this);
            this.doc.addArcProps(this.startSlur);
        }

        if (!this.row.hasStaff) {
            Assert.assert(this.startTie === undefined, "Ties not implemented for guitar tabs alone, staff is required!");
            Assert.assert(this.startSlur === undefined, "Slurs not implemented for guitar tabs alone, staff is required!");
        }

        this.staffObjs = this.row.hasStaff ? new NoteStaffObjects() : undefined;
        this.tabObjs = this.row.hasTab ? new NoteTabObjects() : undefined;

        this.mi = new MNoteGroup(this);
    }

    getMusicInterface(): MNoteGroup {
        return this.mi;
    }

    get doc() {
        return this.col.doc;
    }

    get measure() {
        return this.col.measure;
    }

    get row() {
        return this.col.row;
    }

    get stemDir(): Stem.Up | Stem.Down {
        if (this.staffObjs) {
            return this.staffObjs.beamGroup ? this.staffObjs.beamGroup.stemDir : this.ownStemDir;
        }
        else {
            return Stem.Up;
        }
    }

    get triplet() {
        return this.rhythmProps.triplet;
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        if (this.staffObjs) {
            for (let i = 0; i < this.staffObjs.accidentals.length; i++) {
                let acc = this.staffObjs.accidentals[i];
                if (acc) {
                    let arr = acc.pick(x, y);
                    if (arr.length > 0) {
                        return [this, ...arr];
                    }
                }
            }
        }

        if (this.tabObjs) {
            for (let i = 0; i < this.tabObjs.fretNumbers.length; i++) {
                let fn = this.tabObjs.fretNumbers[i];
                if (fn) {
                    let arr = fn.pick(x, y);
                    if (arr.length > 0) {
                        return [this, ...arr];
                    }
                }
            }
        }

        return [this];
    }

    getTopNote() {
        return this.notes[this.notes.length - 1];
    }

    getBottomNote() {
        return this.notes[0];
    }

    getArcAnchorPoint(note: Note, arcPos: ArcPos, side: "left" | "right"): { x: number, y: number } {
        let noteId = this.notes.findIndex(note2 => note2.equals(note));

        if (!this.staffObjs || noteId < 0 || noteId >= this.staffObjs.noteHeadRects.length) {
            let r = this.getRect();
            return { x: r.centerX, y: r.bottom }
        }

        let noteHeadRect = this.staffObjs.noteHeadRects[noteId];
        let stemRect = this.staffObjs.stemRect;
        let stemDir = this.stemDir;
        let hasStem = stemRect !== undefined;
        let stemSide: "left" | "right" | undefined = !hasStem ? undefined : (stemDir === Stem.Up ? "right" : "left");

        let padding = noteHeadRect.height / 2;
        let centerX = noteHeadRect.centerX;
        let centerY = noteHeadRect.centerY;
        let leftX = noteHeadRect.left - padding;
        let rightX = noteHeadRect.right + padding;
        let aboveY = noteHeadRect.top - padding;
        let belowY = noteHeadRect.bottom + padding;

        if (arcPos === ArcPos.Auto) {
            arcPos = ArcPos.Below;
        }
        else if (arcPos === ArcPos.StemTip && !hasStem) {
            arcPos = stemDir === Stem.Up ? ArcPos.Above : ArcPos.Below;
        }

        switch (arcPos) {
            case ArcPos.Middle:
                return side === "left" ? { x: rightX, y: centerY } : { x: leftX, y: centerY };
            case ArcPos.Above:
                if (!hasStem || stemDir === Stem.Down) {
                    return { x: centerX, y: aboveY }
                }
                else {
                    return {
                        x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : centerX),
                        y: aboveY
                    }
                }
            case ArcPos.Below:
                if (!hasStem || stemDir === Stem.Up) {
                    return { x: centerX, y: belowY }
                }
                else {
                    return {
                        x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : centerX),
                        y: belowY
                    }
                }
            case ArcPos.StemTip:
                // stemRect is defined.
                if (stemDir === Stem.Up) {
                    return { x: centerX, y: stemRect!.top - padding }
                }
                else if (stemDir === Stem.Down) {
                    return { x: centerX, y: stemRect!.bottom + padding }
                }
            default:
                Assert.interrupt("Invalid arcPos: " + arcPos);
        }
    }

    getPrevNoteGroup(): ObjNoteGroup | undefined {
        let voiceNoteGroups = this.measure.getVoiceSymbols(this.voiceId).filter(s => s instanceof ObjNoteGroup);

        let i = voiceNoteGroups.indexOf(this);

        if (i > 0) {
            return voiceNoteGroups[i - 1];
        }

        let m = this.measure.getPrevMeasure();

        while (m) {
            let voiceNoteGroups = m.getVoiceSymbols(this.voiceId).filter(s => s instanceof ObjNoteGroup);

            if (voiceNoteGroups.length > 0) {
                return voiceNoteGroups[voiceNoteGroups.length - 1];
            }

            m = m.getPrevMeasure();
        }

        return undefined;
    }

    collectArcProps() {
        if (this.startTie !== undefined) {
            this.tieProps.push(this.startTie);
        }

        if (this.startSlur !== undefined) {
            this.slurProps.push(this.startSlur);
        }

        let prevNoteGroup = this.getPrevNoteGroup();

        if (prevNoteGroup) {
            prevNoteGroup.tieProps.forEach(tie => {
                if (tie.add(this)) {
                    this.tieProps.push(tie);
                }
            });

            prevNoteGroup.slurProps.forEach(slur => {
                if (slur.add(this)) {
                    this.slurProps.push(slur);
                }
            });
        }
    }

    getPlaySlur(): "first" | "slurred" | undefined {
        let slurs = this.slurProps.map(slurData => slurData.startsWith(this) ? "first" : "slurred");

        if (slurs.indexOf("first") >= 0) {
            return "first";
        }
        else if (slurs.indexOf("slurred") >= 0) {
            return "slurred";
        }
        else {
            return undefined;
        }
    }

    getBeamGroup(): ObjBeamGroup | undefined {
        return this.staffObjs?.beamGroup;
    }

    setBeamGroup(beam: ObjBeamGroup) {
        if (this.staffObjs) {
            this.staffObjs.beamGroup = beam;
        }
    }

    resetBeamGroup() {
        if (this.staffObjs) {
            this.leftBeamCount = this.rightBeamCount = 0;
            this.staffObjs.beamGroup = undefined;
        }
    }

    getBeamX() {
        let stemRect = Assert.require(this.staffObjs?.stemRect, "Cannot get beam x-coordinate because this note group has no stem.");
        return stemRect.centerX;
    }

    getBeamY() {
        let stemRect = Assert.require(this.staffObjs?.stemRect, "Cannot get beam y-coordinate because this note group has no stem.");
        return this.stemDir === Stem.Up ? stemRect.top : stemRect.bottom;
    }

    getStemHeight(renderer: Renderer) {
        let { unitSize } = renderer;
        let { noteLength, flagCount } = this.rhythmProps;

        if (noteLength >= NoteLength.Whole) {
            return 0;
        }
        else {
            let addY = this.hasBeamCount() ? DocumentSettings.BeamSeparation : DocumentSettings.FlagSeparation;
            return (DocumentSettings.StemHeight + Math.max(0, flagCount - 1) * addY) * unitSize;
        }
    }

    hasBeamCount() {
        return this.leftBeamCount > 0 || this.rightBeamCount > 0;
    }

    getLeftBeamCount() {
        return this.leftBeamCount;
    }

    getRightBeamCount() {
        return this.rightBeamCount;
    }

    getPlayTicks(note: Note) {
        let tiedTicks = this.tieProps.map(tie => {
            let tieNoteGroups = tie.noteGroups;

            let j = tieNoteGroups.indexOf(this);

            if (j < 0) {
                return 0;
            }

            if (tie.arcSpan === TieLength.Short || tie.arcSpan === TieLength.ToMeasureEnd) {
                return Math.max(this.rhythmProps.ticks, this.measure.getMeasureTicks() - this.col.positionTicks);
            }

            let prev: ObjNoteGroup | undefined = tieNoteGroups[j - 1];

            if (prev && prev.notes.some(n => n.equals(note))) {
                return 0;
            }

            tieNoteGroups = tieNoteGroups.slice(j);

            j = tieNoteGroups.findIndex(ng => ng.notes.every(n => !n.equals(note)));

            if (j >= 0) {
                tieNoteGroups = tieNoteGroups.slice(0, j);
            }

            return Utils.Math.sum(tieNoteGroups.map(ng => ng.rhythmProps.ticks));
        });

        return tiedTicks.length === 0 ? this.rhythmProps.ticks : Math.max(...tiedTicks);
    }

    updateAccidentalState(accState: AccidentalState) {
        this.notes.forEach(note => {
            if (accState.needAccidental(note)) {
                accState.setAccidental(note);
            }
        });
    }

    layout(renderer: Renderer, accState: AccidentalState) {
        let { unitSize } = renderer;
        let { row, stemDir } = this;
        let { dotted, flagCount } = this.rhythmProps;

        if (this.staffObjs) {
            this.staffObjs.noteHeadRects = [];
            this.staffObjs.dotRects = [];
            this.staffObjs.accidentals = [];
            this.staffObjs.stemRect = undefined;
        }

        if (this.tabObjs) {
            this.tabObjs.fretNumbers = [];
        }

        let dotWidth = DocumentSettings.DotSize * unitSize;

        let noteHeadWidth = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadWidth) * unitSize;
        let noteHeadHeight = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadHeight) * unitSize;

        this.notes.forEach((note, noteId) => {
            let staff = row.getStaff(note.pitch);
            if (this.staffObjs && staff) {
                let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
                let noteY = staff.getPitchY(note.pitch);

                // Setup note head
                let noteHeadRect = this.staffObjs.noteHeadRects[noteId] = DivRect.createCentered(noteX, noteY, noteHeadWidth, noteHeadHeight);

                // Setup accidental
                if (accState.needAccidental(note)) {
                    let acc = this.staffObjs.accidentals[noteId] = new ObjAccidental(this, note.accidental, this.color);
                    if (acc) {
                        acc.layout(renderer);
                        acc.offset(-noteHeadRect.leftw - unitSize * DocumentSettings.NoteAccSpace - acc.getRect().rightw, noteY);
                    }
                }

                // Setup dot
                if (dotted) {
                    let dotX = noteHeadRect.right + DocumentSettings.NoteDotSpace * unitSize + dotWidth / 2;
                    let dotY = noteY + this.getDotVerticalDisplacement(note.pitch, stemDir) * unitSize;

                    this.staffObjs.dotRects[noteId] = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
                }
            }
        });

        // Add staccato dot
        if (this.staccato && this.staffObjs) {
            let dotX = this.staffObjs.noteHeadRects[0].centerX;

            if (stemDir === Stem.Up) {
                let pitch = this.getBottomNote().pitch;
                let staff = row.getStaff(pitch);
                if (staff) {
                    let dotY = staff.getPitchY(pitch) + unitSize * (staff.isPitchLine(pitch) ? 3 : 2);
                    this.staffObjs.dotRects.push(DivRect.createCentered(dotX, dotY, dotWidth, dotWidth));
                }
            }
            else {
                let pitch = this.getTopNote().pitch;
                let staff = row.getStaff(pitch);
                if (staff) {
                    let dotY = staff.getPitchY(pitch) - unitSize * (staff.isPitchLine(pitch) ? 3 : 2);
                    this.staffObjs.dotRects.push(DivRect.createCentered(dotX, dotY, dotWidth, dotWidth));
                }
            }
        }

        if (this.staffObjs) {
            // Calculate stem
            let bottomNoteY = row.getStaff(this.getBottomNote().pitch)?.getPitchY(this.getBottomNote().pitch);
            let topNoteY = row.getStaff(this.getTopNote().pitch)?.getPitchY(this.getTopNote().pitch);

            if (bottomNoteY === undefined || topNoteY === undefined) {
                Assert.interrupt("Top or bottom note is undefined!");
            }

            let stemX = stemDir === Stem.Up ? noteHeadWidth / 2 : -noteHeadWidth / 2;

            let stemHeight = this.getStemHeight(renderer);

            let stemTipY = stemDir === Stem.Up
                ? topNoteY - stemHeight
                : bottomNoteY + stemHeight;

            let stemBaseY = stemDir === Stem.Up
                ? bottomNoteY
                : topNoteY;

            if (this.rhythmProps.hasStem()) {
                this.staffObjs.stemRect = new DivRect(stemX, stemX, Math.min(stemBaseY, stemTipY), Math.max(stemBaseY, stemTipY));
            }

            // Setup flag rects
            this.staffObjs.flagRects = [];

            if (!this.hasBeamCount()) {
                let flagWidth = flagCount === 0 ? 0 : DocumentSettings.FlagWidth * unitSize;
                let flagHeight = flagCount === 0 ? 0 : DocumentSettings.FlagHeight * unitSize;

                for (let i = 0; i < flagCount; i++) {
                    let flagAddY = i * unitSize * DocumentSettings.FlagSeparation;

                    this.staffObjs.flagRects[i] = stemDir === Stem.Up
                        ? new DivRect(stemX, stemX + flagWidth, stemTipY + flagAddY, stemTipY + flagHeight + flagAddY)
                        : new DivRect(stemX, stemX + flagWidth, stemTipY - flagHeight - flagAddY, stemTipY - flagAddY);
                }
            }
        }

        let tab = row.getTab();

        this.notes.forEach((note, noteId) => {
            // Add tab fret numbers
            if (tab && this.tabObjs && this.ownString[noteId] !== undefined) {
                let stringId = this.ownString[noteId] - 1;
                let fretId = note.noteId - this.doc.tuningStrings[stringId].noteId;
                let color = fretId < 0 ? "red" : "black";

                let fretNumber = new ObjText(this, { text: String(fretId), color, bgcolor: "white" }, 0.5, 0.5);
                this.tabObjs.fretNumbers.push(fretNumber);

                fretNumber.layout(renderer);

                let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
                let stemX = this.staffObjs?.stemRect ? this.staffObjs.stemRect.centerX : undefined;

                let x = stemX ?? noteX;
                let y = tab.getStringY(stringId);
                fretNumber.offset(x, y);
            }
        });

        this.updateRect();
    }

    updateRect() {
        if (this.staffObjs) {
            this.rect = this.staffObjs.noteHeadRects[0].copy();

            this.staffObjs.noteHeadRects.forEach(r => this.rect.expandInPlace(r));

            if (this.staffObjs.stemRect) {
                this.rect.expandInPlace(this.staffObjs.stemRect);
            }

            this.staffObjs.dotRects.forEach(r => this.rect.expandInPlace(r));
            this.staffObjs.flagRects.forEach(r => this.rect.expandInPlace(r));
            this.staffObjs.accidentals.forEach(a => this.rect.expandInPlace(a.getRect()));
        }
        else if (this.tabObjs && this.tabObjs.fretNumbers.length > 0) {
            this.rect = this.tabObjs.fretNumbers[0].getRect().copy();
        }
        else {
            this.rect = new DivRect();
        }

        if (this.tabObjs) {
            this.tabObjs.fretNumbers.forEach(fn => this.rect.expandInPlace(fn.getRect()));
        }
    }

    setStemTipY(stemTipY: number) {
        if (!this.staffObjs || !this.staffObjs.stemRect) {
            return;
        }

        let oldStemTipY = this.stemDir === Stem.Up ? this.staffObjs.stemRect.top : this.staffObjs.stemRect.bottom;

        if (stemTipY === oldStemTipY) {
            return;
        }

        let r = this.staffObjs.stemRect;

        let top = this.stemDir === Stem.Up ? stemTipY : r.top;
        let bottom = this.stemDir === Stem.Up ? r.bottom : stemTipY;

        this.staffObjs.stemRect = new DivRect(r.left, r.right, top, bottom);

        this.updateRect();
    }

    offset(dx: number, dy: number) {
        if (this.staffObjs) {
            this.staffObjs.noteHeadRects.forEach(r => r.offsetInPlace(dx, dy));
            this.staffObjs.dotRects.forEach(r => r.offsetInPlace(dx, dy));
            this.staffObjs.accidentals.forEach(d => d.offset(dx, dy));
            if (this.staffObjs.stemRect) {
                this.staffObjs.stemRect.offsetInPlace(dx, dy);
            }
            this.staffObjs.flagRects.forEach(r => r.offsetInPlace(dx, dy));
        }

        if (this.tabObjs) {
            this.tabObjs.fretNumbers.forEach(fn => fn.offset(dx, dy));
        }

        this.rect.offsetInPlace(dx, dy);
    }

    draw(renderer: Renderer) {
        const ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        renderer.drawDebugRect(this.rect);

        let { lineWidth } = renderer;
        let { color, stemDir } = this;
        let { noteLength } = this.rhythmProps;

        if (this.staffObjs) {
            // Draw accidentals
            this.staffObjs.accidentals.forEach(d => d.draw(renderer));

            ctx.strokeStyle = ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;

            // Draw note heads
            this.staffObjs.noteHeadRects.forEach(r => {
                let outlinedNoteHead = noteLength >= NoteLength.Half;

                if (this.diamond) {
                    if (outlinedNoteHead) {
                        ctx.beginPath();
                        ctx.lineWidth = lineWidth * 2.5;
                        ctx.moveTo(r.centerX, r.top);
                        ctx.lineTo(r.right, r.centerY);
                        ctx.moveTo(r.left, r.centerY);
                        ctx.lineTo(r.centerX, r.bottom);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.lineWidth = lineWidth;
                        ctx.moveTo(r.right, r.centerY);
                        ctx.lineTo(r.centerX, r.bottom);
                        ctx.moveTo(r.centerX, r.top);
                        ctx.lineTo(r.left, r.centerY);
                        ctx.stroke();
                    }
                    else {
                        ctx.beginPath();
                        ctx.moveTo(r.centerX, r.top);
                        ctx.lineTo(r.right, r.centerY);
                        ctx.lineTo(r.centerX, r.bottom);
                        ctx.lineTo(r.left, r.centerY);
                        ctx.lineTo(r.centerX, r.top);
                        ctx.fill();
                    }
                }
                else {
                    ctx.beginPath();
                    ctx.ellipse(r.centerX, r.centerY, r.leftw, r.toph, -0.3, 0, Math.PI * 2);

                    if (outlinedNoteHead) {
                        ctx.stroke();
                    }
                    else {
                        ctx.fill();
                    }
                }
            });

            // Draw dots
            this.staffObjs.dotRects.forEach(r => renderer.fillCircle(r.centerX, r.centerY, r.width / 2));

            // Draw stem
            if (this.staffObjs.stemRect) {
                ctx.beginPath();
                ctx.moveTo(this.staffObjs.stemRect.centerX, this.staffObjs.stemRect.bottom);
                ctx.lineTo(this.staffObjs.stemRect.centerX, this.staffObjs.stemRect.top);
                ctx.stroke();
            }

            // Draw flags
            this.staffObjs.flagRects.forEach(rect => {
                let left = rect.left;
                let right = rect.right;
                let width = right - left;
                let top = stemDir === Stem.Up ? rect.top : rect.bottom;
                let bottom = stemDir === Stem.Up ? rect.bottom : rect.top;

                ctx.beginPath();
                ctx.moveTo(left, top);
                ctx.bezierCurveTo(
                    left, top * 0.75 + bottom * 0.25,
                    left + width * 1.5, top * 0.5 + bottom * 0.5,
                    left + width * 0.5, bottom);
                ctx.stroke();
            });
        }

        if (this.tabObjs) {
            // Draw tab fret numbers
            this.tabObjs.fretNumbers.forEach(fn => fn.draw(renderer));
        }
    }

    static setBeamCounts(groupNotes: (ObjNoteGroup | undefined)[]) {

        const isADottedBHalf = (a: ObjNoteGroup, b: ObjNoteGroup) => {
            return a.rhythmProps.noteLength === b.rhythmProps.noteLength * 2 &&
                a.rhythmProps.dotted && !b.rhythmProps.dotted &&
                a.rhythmProps.flagCount > 0 && b.rhythmProps.flagCount > 0;
        }

        for (let i = 0; i < groupNotes.length; i++) {
            let center = groupNotes[i];
            let left = groupNotes[i - 1];
            let right = groupNotes[i + 1];

            if (center) {
                center.leftBeamCount = 0;
                center.rightBeamCount = 0;

                // Set left beam count
                if (left) {
                    if (left.rhythmProps.flagCount === center.rhythmProps.flagCount || isADottedBHalf(left, center) || isADottedBHalf(center, left)) {
                        center.leftBeamCount = center.rhythmProps.flagCount;
                    }
                    else {
                        center.leftBeamCount = Math.min(left.rhythmProps.flagCount, center.rhythmProps.flagCount);
                    }
                }

                // Set right beam count
                if (right) {
                    if (right.rhythmProps.flagCount === center.rhythmProps.flagCount || isADottedBHalf(right, center) || isADottedBHalf(center, right)) {
                        center.rightBeamCount = center.rhythmProps.flagCount;
                    }
                    else {
                        center.rightBeamCount = Math.min(right.rhythmProps.flagCount, center.rhythmProps.flagCount);
                    }
                }
            }
        }

        // Fix beam counts
        let fixAgain: boolean;

        do {
            fixAgain = false;

            for (let i = 0; i < groupNotes.length; i++) {
                let center = groupNotes[i];
                let left = groupNotes[i - 1];
                let right = groupNotes[i + 1];

                // If neither left or right beam count equals flag count, then reset beam counts.
                if (center && center.leftBeamCount !== center.rhythmProps.flagCount && center.rightBeamCount !== center.rhythmProps.flagCount) {
                    center.leftBeamCount = center.rightBeamCount = 0;

                    if (left && left.rightBeamCount > 0) {
                        left.rightBeamCount = 0;
                        fixAgain = true; // left changed => fix again.
                    }

                    if (right && right.leftBeamCount > 0) {
                        right.leftBeamCount = 0;
                        fixAgain = true; // Right changed => fix again.
                    }
                }
            }
        } while (fixAgain);
    }

    static setTripletBeamCounts(triplet: ObjBeamGroup) {
        let type = triplet.getType();
        let symbols = triplet.getSymbols();

        if (type === BeamGroupType.TripletBeam) {
            symbols.forEach((s, i) => {
                if (s instanceof ObjNoteGroup) {
                    s.leftBeamCount = i === 0 ? 0 : s.rhythmProps.flagCount;
                    s.rightBeamCount = (i === symbols.length - 1) ? 0 : s.rhythmProps.flagCount;
                }
            });
        }
        else if (type === BeamGroupType.TripletGroup) {
            symbols.forEach(s => {
                if (s instanceof ObjNoteGroup) {
                    s.leftBeamCount = s.rightBeamCount = 0;
                }
            });
        }
        else {
            Assert.interrupt("Cannot set triplet beam count because triplet beam group type is invalid.");
        }
    }

    getDotVerticalDisplacement(pitch: number, stemDir: Stem) {
        let staff = this.row.getStaff(pitch);
        if (staff && staff.isPitchLine(pitch)) {
            return stemDir === Stem.Up ? -1 : 1;
        }
        else {
            return 0;
        }
    }

    static hasSameNotes(ng1: ObjNoteGroup, ng2: ObjNoteGroup) {
        if (ng1.notes.length !== ng2.notes.length) {
            return false;
        }
        for (let i = 0; i < ng1.notes.length; i++) {
            let note1 = ng1.notes[i];
            let note2 = ng2.notes[i];
            if (note1.pitch !== note2.pitch || note1.accidental !== note2.accidental) {
                return false;
            }
        }
        return true;
    }
}
