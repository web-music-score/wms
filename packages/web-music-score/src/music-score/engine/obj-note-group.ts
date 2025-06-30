import { Note } from "../../music-theory/note";
import { NoteLength, RhythmProps } from "../../music-theory/rhythm";
import { Assert, Utils } from "@tspro/ts-utils-lib";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { DivRect, MNoteGroup, Stem, Arpeggio, NoteOptions, ArcPos, TieLength } from "../pub";
import { CollectedArcData } from "./arc-data";
import { AccidentalState } from "./acc-state";
import { ObjAccidental } from "./obj-accidental";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { BeamGroupType, ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";

export class ObjNoteGroup extends MusicObject {
    readonly minPitch: number;
    readonly maxPitch: number;

    readonly ownAvgPitch: number;
    readonly ownStemDir: Stem.Up | Stem.Down;

    readonly color: string;
    readonly staccato: boolean;
    readonly diamond: boolean;
    readonly arpeggio: Arpeggio | undefined;
    readonly tieSpan: number | TieLength | undefined;
    readonly slurSpan: number | undefined;
    readonly arcPos: ArcPos;
    readonly rhythmProps: RhythmProps;

    private tieDatas: CollectedArcData[] = [];
    private slurDatas: CollectedArcData[] = [];

    private noteHeadRects: DivRect[] = [];
    private dotRects: DivRect[] = [];
    private accidentals: ObjAccidental[] = [];
    private stemRect: DivRect | undefined;
    private flagRects: DivRect[] = [];

    private beamGroup?: ObjBeamGroup;

    private leftBeamCount = 0;
    private rightBeamCount = 0;

    readonly mi: MNoteGroup;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: number, readonly notes: ReadonlyArray<Note>, noteLength: NoteLength, options?: NoteOptions) {
        super(col);

        Assert.int_gte(notes.length, 1, "Cannot create note group object because notes array is empty.");

        this.notes = Note.sort(Note.removeDuplicates(notes));

        this.minPitch = this.notes[0].pitch;
        this.maxPitch = this.notes[this.notes.length - 1].pitch;

        this.ownAvgPitch = this.measure.updateOwnAvgPitch(voiceId, Math.round((this.minPitch + this.maxPitch) / 2));
        this.ownStemDir = this.measure.updateOwnStemDir(this, options?.stem);

        this.color = options?.color ?? "black";
        this.staccato = options?.staccato ?? false;
        this.diamond = options?.diamond ?? false;
        this.arpeggio = options?.arpeggio;
        this.tieSpan = options?.tieSpan;
        this.slurSpan = options?.slurSpan;
        this.arcPos = options?.tiePos ?? options?.slurPos ?? ArcPos.Auto;
        this.rhythmProps = new RhythmProps(noteLength, options?.dotted, options?.triplet);

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
        return this.beamGroup ? this.beamGroup.stemDir : this.ownStemDir;
    }

    get triplet() {
        return this.rhythmProps.triplet;
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.accidentals.length; i++) {
            let acc = this.accidentals[i];
            if (acc) {
                let arr = acc.pick(x, y);
                if (arr.length > 0) {
                    return [this, ...arr];
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

    getArcAnchorPoint(renderer: Renderer, noteGroup: ObjNoteGroup, note: Note, arcPos: ArcPos, side: "left" | "right"): { x: number, y: number } | undefined {
        if (arcPos === ArcPos.Auto) {
            arcPos = ArcPos.Below;
        }

        let hasStem = !!this.stemRect;
        let stemSide: "left" | "right" | undefined = !hasStem ? undefined : (this.stemDir === Stem.Up ? "right" : "left");
        let stemDir = this.stemDir;

        let noteId = this.notes.findIndex(note2 => note2.equals(note));

        if (noteId < 0) {
            return undefined;
        }

        let r = this.noteHeadRects[noteId];

        if (!r) {
            return undefined;
        }

        let { unitSize } = renderer;

        if (arcPos === ArcPos.StemTip && !hasStem) {
            arcPos = this.stemDir === Stem.Up ? ArcPos.Above : ArcPos.Below;
        }

        let centerX = r.centerX;
        let centerY = r.centerY;
        let leftX = centerX - unitSize * 1.5;
        let rightX = centerX + unitSize * 1.5;
        let aboveY = centerY - unitSize * 1.5;
        let belowY = centerY + unitSize * 1.5;

        if (arcPos === ArcPos.Middle) {
            return side === "left" ? { x: rightX, y: centerY } : { x: leftX, y: centerY };
        }
        else if (arcPos === ArcPos.Above) {
            if (!hasStem || stemDir === Stem.Down) {
                return { x: centerX, y: aboveY }
            }
            else {
                return {
                    x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : centerX),
                    y: aboveY
                }
            }
        }
        else if (arcPos === ArcPos.Below) {
            if (!hasStem || stemDir === Stem.Up) {
                return { x: centerX, y: belowY }
            }
            else {
                return {
                    x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : centerX),
                    y: belowY
                }
            }
        }
        else if (arcPos === ArcPos.StemTip) {
            let stemRect = Assert.require(this.stemRect, "Cannot get stem tip arc anchort point because this note group has no stem.");

            if (noteGroup.stemDir === Stem.Up) {
                return { x: centerX, y: stemRect.top - unitSize }
            }
            else if (noteGroup.stemDir === Stem.Down) {
                return { x: centerX, y: stemRect.bottom + unitSize }
            }
        }

        return undefined;
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

    collectArcDatas() {
        if (this.tieSpan !== undefined) {
            this.tieDatas.push(new CollectedArcData("tie", this.tieSpan, this.arcPos, this));
        }

        if (this.slurSpan !== undefined) {
            this.slurDatas.push(new CollectedArcData("slur", this.slurSpan, this.arcPos, this));
        }

        let prevNoteGroup = this.getPrevNoteGroup();

        if (prevNoteGroup) {
            prevNoteGroup.tieDatas.forEach(tieData => {
                if (tieData.add(this)) {
                    this.tieDatas.push(tieData);
                }
            });

            prevNoteGroup.slurDatas.forEach(slurData => {
                if (slurData.add(this)) {
                    this.slurDatas.push(slurData);
                }
            });
        }
    }

    getPlaySlur(): "first" | "slurred" | undefined {
        let slurs = this.slurDatas.map(slurData => slurData.startsWith(this) ? "first" : "slurred");

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

    createObjArcs() {
        this.tieDatas.forEach(tieData => tieData.createObjArcs());
        this.slurDatas.forEach(slurData => slurData.createObjArcs());
    }

    getBeamGroup() {
        return this.beamGroup;
    }

    setBeamGroup(beam: ObjBeamGroup) {
        this.beamGroup = beam;
    }

    resetBeamGroup() {
        this.leftBeamCount = this.rightBeamCount = 0;
        this.beamGroup = undefined;
    }

    getBeamX() {
        let stemRect = Assert.require(this.stemRect, "Cannot get beam x-coordinate because this note group has no stem.");
        return stemRect.centerX;
    }

    getBeamY() {
        let stemRect = Assert.require(this.stemRect, "Cannot get beam y-coordinate because this note group has no stem.");
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
        let tiedTicks = this.tieDatas.map(tieData => {
            let tieNoteGroups = tieData.noteGroups;

            let j = tieNoteGroups.indexOf(this);

            if (j < 0) {
                return 0;
            }

            if (tieData.arcSpan === TieLength.Short || tieData.arcSpan === TieLength.ToMeasureEnd) {
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
        let { dotted, flagCount, noteLength } = this.rhythmProps;

        this.noteHeadRects = [];
        this.dotRects = [];
        this.accidentals = [];
        this.stemRect = undefined;

        let dotWidth = Renderer.DotSize * unitSize;

        let noteHeadWidth = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadWidth) * unitSize;
        let noteHeadHeight = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadHeight) * unitSize;

        this.notes.forEach((note, noteId) => {

            let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
            let noteY = this.row.getPitchY(note.pitch);

            // Setup note head
            let noteHeadRect = this.noteHeadRects[noteId] = DivRect.createCentered(noteX, noteY, noteHeadWidth, noteHeadHeight);

            if (accState.needAccidental(note)) {
                let acc = this.accidentals[noteId] = new ObjAccidental(this, note.accidental, this.color);
                if (acc) {
                    acc.layout(renderer);
                    acc.offset(-noteHeadRect.leftw - unitSize * DocumentSettings.NoteAccSpace - acc.getRect().rightw, noteY);
                }
            }

            // Set dot
            if (dotted) {
                let dotX = noteHeadRect.right + DocumentSettings.NoteDotSpace * unitSize + dotWidth / 2;
                let dotY = noteY + this.getDotVerticalDisplacement(note.pitch, stemDir) * unitSize;

                this.dotRects[noteId] = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
            }
        });

        // Add staccato dot
        if (this.staccato) {
            let dotX = this.noteHeadRects[0].centerX;
            let dotY = 0;

            if (stemDir === Stem.Up) {
                let pitch = this.notes[0].pitch;
                dotY = this.row.getPitchY(pitch) + unitSize * (row.isPitchLine(pitch) ? 3 : 2);
            }
            else {
                let pitch = this.notes[this.notes.length - 1].pitch;
                dotY = this.row.getPitchY(pitch) - unitSize * (row.isPitchLine(pitch) ? 3 : 2);
            }

            this.dotRects.push(DivRect.createCentered(dotX, dotY, dotWidth, dotWidth));
        }

        // Calculate stem
        let bottomNoteY = this.row.getPitchY(this.getBottomNote().pitch);
        let topNoteY = this.row.getPitchY(this.getTopNote().pitch);

        let stemX = stemDir === Stem.Up ? noteHeadWidth / 2 : -noteHeadWidth / 2;

        let stemHeight = this.getStemHeight(renderer);

        let stemTipY = stemDir === Stem.Up
            ? topNoteY - stemHeight
            : bottomNoteY + stemHeight;

        let stemBaseY = stemDir === Stem.Up
            ? bottomNoteY
            : topNoteY;

        if (this.rhythmProps.hasStem()) {
            this.stemRect = new DivRect(stemX, stemX, Math.min(stemBaseY, stemTipY), Math.max(stemBaseY, stemTipY));
        }

        // Setup flag rects
        this.flagRects = [];

        if (!this.hasBeamCount()) {
            let flagWidth = flagCount === 0 ? 0 : DocumentSettings.FlagWidth * unitSize;
            let flagHeight = flagCount === 0 ? 0 : DocumentSettings.FlagHeight * unitSize;

            for (let i = 0; i < flagCount; i++) {
                let flagAddY = i * unitSize * DocumentSettings.FlagSeparation;

                this.flagRects[i] = stemDir === Stem.Up
                    ? new DivRect(stemX, stemX + flagWidth, stemTipY + flagAddY, stemTipY + flagHeight + flagAddY)
                    : new DivRect(stemX, stemX + flagWidth, stemTipY - flagHeight - flagAddY, stemTipY - flagAddY);
            }
        }

        this.updateRect();
    }

    updateRect() {
        this.rect = this.noteHeadRects[0].copy();

        this.noteHeadRects.forEach(r => this.rect.expandInPlace(r));

        if (this.stemRect) {
            this.rect.expandInPlace(this.stemRect);
        }

        this.dotRects.forEach(r => this.rect.expandInPlace(r));
        this.flagRects.forEach(r => this.rect.expandInPlace(r));
        this.accidentals.forEach(acc => this.rect.expandInPlace(acc.getRect()));
    }

    setStemTipY(stemTipY: number) {
        if (!this.stemRect) {
            return;
        }

        let oldStemTipY = this.stemDir === Stem.Up ? this.stemRect.top : this.stemRect.bottom;

        if (stemTipY === oldStemTipY) {
            return;
        }

        let r = this.stemRect;

        let top = this.stemDir === Stem.Up ? stemTipY : r.top;
        let bottom = this.stemDir === Stem.Up ? r.bottom : stemTipY;

        this.stemRect = new DivRect(r.left, r.right, top, bottom);

        this.updateRect();
    }

    offset(dx: number, dy: number) {
        this.noteHeadRects.forEach(r => r.offsetInPlace(dx, dy));
        this.dotRects.forEach(r => r.offsetInPlace(dx, dy));
        this.accidentals.forEach(d => d.offset(dx, dy));
        if (this.stemRect) {
            this.stemRect.offsetInPlace(dx, dy);
        }
        this.flagRects.forEach(r => r.offsetInPlace(dx, dy));
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

        // Draw accidentals
        this.accidentals.forEach(d => d.draw(renderer));

        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        // Draw note heads
        this.noteHeadRects.forEach(r => {
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
        this.dotRects.forEach(r => renderer.fillCircle(r.centerX, r.centerY, r.width / 2));

        // Draw stem
        if (this.stemRect) {
            ctx.beginPath();
            ctx.moveTo(this.stemRect.centerX, this.stemRect.bottom);
            ctx.lineTo(this.stemRect.centerX, this.stemRect.top);
            ctx.stroke();
        }

        // Draw flags
        this.flagRects.forEach(rect => {
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
        if (this.row.isPitchLine(pitch)) {
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
