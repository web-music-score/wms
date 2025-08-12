import { Utils } from "@tspro/ts-utils-lib";
import { Note, NoteLength, RhythmProps } from "@tspro/web-music-score/theory";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { DivRect, MNoteGroup, Stem, Arpeggio, NoteOptions, NoteAnchor, TieType, StringNumber, Connective } from "../pub";
import { ConnectiveProps } from "./connective-props";
import { AccidentalState } from "./acc-state";
import { ObjAccidental } from "./obj-accidental";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { BeamGroupType, ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
import { ObjText } from "./obj-text";
import { MusicError, MusicErrorType } from "@tspro/web-music-score/core";
import { ObjTab, ObjStaff } from "./obj-staff-and-tab";

function sortNoteStringData(notes: ReadonlyArray<Note>, strings?: StringNumber | StringNumber[]) {
    let stringArr = Utils.Arr.isArray(strings) ? strings : (strings !== undefined ? [strings] : []);

    let noteStringData = notes.map((note, i) => { return { note, string: stringArr[i] } });

    noteStringData = Utils.Arr
        .removeDuplicatesCmp(noteStringData, (a, b) => Note.equals(a.note, b.note))
        .sort((a, b) => Note.compareFunc(a.note, b.note));

    return {
        notes: noteStringData.map(e => e.note),
        strings: noteStringData.every(e => e.string === undefined) ? undefined : noteStringData.map(e => e.string)
    }
}

function solveArpeggio(a: Arpeggio | boolean | undefined): Arpeggio | undefined {
    return a === true || a === Arpeggio.Up ? Arpeggio.Up : (a === Arpeggio.Down ? Arpeggio.Down : undefined);
}

class NoteStaffVisual {
    constructor(readonly staff: ObjStaff) { }
    public noteHeadRects: DivRect[] = [];
    public dotRects: DivRect[] = [];
    public accidentals: ObjAccidental[] = [];
    public stemRect: DivRect | undefined;
    public flagRects: DivRect[] = [];

    offset(dx: number, dy: number) {
        this.noteHeadRects.forEach(n => n.offsetInPlace(dx, dy));
        this.dotRects.forEach(n => n.offsetInPlace(dx, dy));
        this.accidentals.forEach(n => n.offset(dx, dy));
        this.stemRect?.offsetInPlace(dx, dy);
        this.flagRects.forEach(n => n.offsetInPlace(dx, dy));
    }
}

class NoteTabVisual {
    constructor(readonly tab: ObjTab) { }
    public fretNumbers: ObjText[] = [];

    offset(dx: number, dy: number) {
        this.fretNumbers.forEach(f => f.offset(dx, dy));
    }
}

export class ObjNoteGroup extends MusicObject {
    readonly minDiatonicId: number;
    readonly maxDiatonicId: number;

    readonly ownDiatonicId: number; // Average diatonicId of notes.
    readonly ownStemDir: Stem.Up | Stem.Down;
    readonly ownString: StringNumber[];

    readonly color: string;
    readonly staccato: boolean;
    readonly diamond: boolean;
    readonly arpeggio: Arpeggio | undefined;
    readonly rhythmProps: RhythmProps;

    private startConnnectives: ConnectiveProps[] = [];
    private runningConnectives: ConnectiveProps[] = [];

    private leftBeamCount = 0;
    private rightBeamCount = 0;
    private beamGroup?: ObjBeamGroup;

    private readonly staffVisuals: NoteStaffVisual[] = [];
    private readonly tabVsuals: NoteTabVisual[] = [];

    readonly mi: MNoteGroup;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: number, readonly notes: ReadonlyArray<Note>, noteLength: NoteLength, options?: NoteOptions) {
        super(col);

        if (!Utils.Is.isIntegerGte(notes.length, 1)) {
            throw new MusicError(MusicErrorType.Score, "Cannot create note group object because notes array is empty.");
        }

        let noteStringData = sortNoteStringData(notes, options?.string);

        this.notes = noteStringData.notes;

        this.minDiatonicId = this.notes[0].diatonicId;
        this.maxDiatonicId = this.notes[this.notes.length - 1].diatonicId;

        this.ownDiatonicId = this.measure.updateOwnDiatonicId(voiceId, Math.round((this.minDiatonicId + this.maxDiatonicId) / 2));
        this.ownStemDir = this.measure.updateOwnStemDir(this, options?.stem);
        this.ownString = this.measure.updateOwnString(this, noteStringData.strings);

        this.color = options?.color ?? "black";
        this.staccato = options?.staccato ?? false;
        this.diamond = options?.diamond ?? false;
        this.arpeggio = solveArpeggio(options?.arpeggio);
        this.rhythmProps = new RhythmProps(noteLength, options?.dotted, options?.triplet);

        if (options?.tieSpan !== undefined) {
            this.startConnective(new ConnectiveProps(Connective.Tie, options.tieSpan, options.tieAnchor ?? NoteAnchor.Auto, this));
        }
        if (options?.slurSpan !== undefined) {
            this.startConnective(new ConnectiveProps(Connective.Slur, options.slurSpan, options.slurAnchor ?? NoteAnchor.Auto, this));
        }

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

    enableConnective(line: ObjStaff | ObjTab): boolean {
        return line.containsVoiceId(this.voiceId) && (line instanceof ObjTab || line.containsDiatonicId(this.ownDiatonicId));
    }

    startConnective(connectiveProps: ConnectiveProps) {
        if (!this.row.hasStaff && connectiveProps.connective === Connective.Tie) {
            throw new MusicError(MusicErrorType.Score, "Ties not implemented for guitar tabs alone, staff is required!");
        }
        else if (!this.row.hasStaff && connectiveProps.connective === Connective.Slur) {
            throw new MusicError(MusicErrorType.Score, "Slurs not implemented for guitar tabs alone, staff is required!");
        }

        this.startConnnectives.push(connectiveProps);
        this.doc.addConnectiveProps(connectiveProps);
    }

    pick(x: number, y: number): MusicObject[] {
        if (!this.rect.contains(x, y)) {
            return [];
        }

        for (let j = 0; j < this.staffVisuals.length; j++) {
            let visual = this.staffVisuals[j];
            for (let i = 0; i < visual.accidentals.length; i++) {
                let acc = visual.accidentals[i];
                if (acc) {
                    let arr = acc.pick(x, y);
                    if (arr.length > 0) {
                        return [this, ...arr];
                    }
                }
            }
        }


        for (let j = 0; j < this.tabVsuals.length; j++) {
            let visual = this.tabVsuals[j];
            for (let i = 0; i < visual.fretNumbers.length; i++) {
                let fn = visual.fretNumbers[i];
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

    getConnectiveAnchorPoint(connectiveProps: ConnectiveProps, line: ObjStaff | ObjTab, noteIndex: number, noteAnchor: NoteAnchor, side: "left" | "right"): { x: number, y: number } {
        if (line instanceof ObjStaff) {
            let staff = line;

            if (noteIndex < 0 || noteIndex >= this.notes.length) {
                throw new MusicError(MusicErrorType.Score, "Invalid noteIndex: " + noteIndex);
            }

            let visual = this.staffVisuals.find(visual => visual.staff === staff);

            if (!visual || noteIndex < 0 || noteIndex >= visual.noteHeadRects.length) {
                let r = this.getRect();
                return { x: r.centerX, y: r.bottom }
            }

            let noteHeadRect = visual.noteHeadRects[noteIndex];
            let stemRect = visual.stemRect;
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

            if (noteAnchor === NoteAnchor.Auto) {
                // Auto is solved in CopnnectivePorps, but this is just in case.
                noteAnchor = NoteAnchor.Below;
            }
            else if (noteAnchor === NoteAnchor.StemTip && !hasStem) {
                noteAnchor = stemDir === Stem.Up ? NoteAnchor.Above : NoteAnchor.Below;
            }

            switch (noteAnchor) {
                case NoteAnchor.Center:
                    return side === "left" ? { x: rightX, y: centerY } : { x: leftX, y: centerY };
                case NoteAnchor.Above:
                    if (!hasStem || stemDir === Stem.Down) {
                        return { x: centerX, y: aboveY }
                    }
                    else {
                        return {
                            x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : centerX),
                            y: aboveY
                        }
                    }
                case NoteAnchor.Below:
                    if (!hasStem || stemDir === Stem.Up) {
                        return { x: centerX, y: belowY }
                    }
                    else {
                        return {
                            x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : centerX),
                            y: belowY
                        }
                    }
                case NoteAnchor.StemTip:
                    // stemRect is defined.
                    if (stemDir === Stem.Up) {
                        return { x: centerX, y: stemRect!.top - padding }
                    }
                    else if (stemDir === Stem.Down) {
                        return { x: centerX, y: stemRect!.bottom + padding }
                    }
                default:
                    throw new MusicError(MusicErrorType.Score, "Invalid noteAnchor: " + noteAnchor);
            }
        }
        else {
            let tab = line;

            let visual = this.tabVsuals.find(visual => visual.tab === tab);

            let fretNumber = visual?.fretNumbers[noteIndex];


            if (!visual || !fretNumber) {
                return { x: 0, y: 0 }
            }

            let r = fretNumber.getRect();

            let x = side === "right" ? r.left : r.right;
            let y: number;
            let s = 0.9;

            if (connectiveProps.connective === Connective.Slide) {
                let leftFretNumber = connectiveProps.noteGroups[0].getFretNumber(visual, 0);
                let rightFretNumber = connectiveProps.noteGroups[1].getFretNumber(visual, 0);
                let slideUp = leftFretNumber === undefined || rightFretNumber === undefined || leftFretNumber <= rightFretNumber;

                if (side === "left") {
                    y = slideUp ? r.centerY + r.bottomh * s : r.centerY - r.toph * s;
                }
                else {
                    y = slideUp ? r.centerY - r.toph * s : r.centerY + r.bottomh * s;
                }
            }
            else {
                y = r.centerY + r.bottomh * s;
            }

            return { x, y }
        }
    }

    getFretNumberString(noteIndex: number): number | undefined {
        return this.ownString[noteIndex];
    }

    getFretNumber(visual: NoteTabVisual, noteIndex: number): number | undefined {
        let fretNumber = visual.fretNumbers[noteIndex];
        return fretNumber === undefined ? undefined : +fretNumber.getText();
    }

    private getNextNoteGroup(): ObjNoteGroup | undefined {
        let voiceNoteGroups = this.measure.getVoiceSymbols(this.voiceId).filter(s => s instanceof ObjNoteGroup);

        let i = voiceNoteGroups.indexOf(this);
        if (i < 0) {
            return undefined;
        }
        else if (i < voiceNoteGroups.length - 1) {
            return voiceNoteGroups[i + 1];
        }

        let m = this.measure.getNextMeasure();

        while (m) {
            let voiceNoteGroups = m.getVoiceSymbols(this.voiceId).filter(s => s instanceof ObjNoteGroup);

            if (voiceNoteGroups.length > 0) {
                return voiceNoteGroups[0];
            }

            m = m.getNextMeasure();
        }

        return undefined;
    }

    collectConnectiveProps() {
        this.startConnnectives.forEach(connective => {
            this.runningConnectives.push(connective);

            let next = this.getNextNoteGroup();

            while (next && connective.addNoteGroup(next)) {
                next.runningConnectives.push(connective);
                next = next.getNextNoteGroup();
            }
        });
    }

    removeConnectiveProps() {
        this.runningConnectives = [];
    }

    getPlaySlur(): "first" | "slurred" | undefined {
        let slurs = this.runningConnectives
            .filter(c => c.connective === Connective.Slur)
            .map(c => c.startsWith(this) ? "first" : "slurred");

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
        return this.beamGroup;
    }

    setBeamGroup(beam: ObjBeamGroup) {
        this.beamGroup = beam;
    }

    resetBeamGroup() {
        this.leftBeamCount = this.rightBeamCount = 0;
        this.beamGroup = undefined;
    }

    getBeamX(staff: ObjStaff): number {
        let rect = this.staffVisuals.find(visual => visual.staff === staff)?.stemRect ?? this.rect;
        return rect.centerX;
    }

    getBeamY(staff: ObjStaff): number {
        let rect = this.staffVisuals.find(visual => visual.staff === staff)?.stemRect ?? this.rect;
        return this.stemDir === Stem.Up ? rect.top : rect.bottom;
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
        let tiedTicks = this.runningConnectives
            .filter(c => c.connective === Connective.Tie)
            .map(tie => {
                let tieNoteGroups = tie.noteGroups;

                let j = tieNoteGroups.indexOf(this);

                if (j < 0) {
                    return 0;
                }

                if (tie.span === TieType.Stub || tie.span === TieType.ToMeasureEnd) {
                    return Math.max(this.rhythmProps.ticks, this.measure.getMeasureTicks() - this.col.positionTicks);
                }

                let prev: ObjNoteGroup | undefined = tieNoteGroups[j - 1];

                if (prev && prev.notes.some(n => Note.equals(n, note))) {
                    return 0;
                }

                tieNoteGroups = tieNoteGroups.slice(j);

                j = tieNoteGroups.findIndex(ng => ng.notes.every(n => !Note.equals(n, note)));

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

        let dotWidth = DocumentSettings.DotSize * unitSize;

        let noteHeadWidth = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadWidth) * unitSize;
        let noteHeadHeight = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadHeight) * unitSize;

        this.staffVisuals.length = 0;

        row.getNotationLines().filter(line => line instanceof ObjStaff).forEach(staff => {
            if (!staff.containsDiatonicId(this.ownDiatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let visual = new NoteStaffVisual(staff);

            this.notes.forEach((note, noteIndex) => {
                let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
                let noteY = staff.getDiatonicIdY(note.diatonicId);

                // Setup note head
                let noteHeadRect = visual.noteHeadRects[noteIndex] = DivRect.createCentered(noteX, noteY, noteHeadWidth, noteHeadHeight);

                // Setup accidental
                if (accState.needAccidental(note)) {
                    let acc = visual.accidentals[noteIndex] = new ObjAccidental(this, note.diatonicId, note.accidental, this.color);
                    if (acc) {
                        acc.layout(renderer);
                        acc.offset(-noteHeadRect.leftw - unitSize * DocumentSettings.NoteAccSpace - acc.getRect().rightw, noteY);
                    }
                }

                // Setup dot
                if (dotted) {
                    let dotX = noteHeadRect.right + DocumentSettings.NoteDotSpace * unitSize + dotWidth / 2;
                    let dotY = noteY + this.getDotVerticalDisplacement(staff, note.diatonicId, stemDir) * unitSize;

                    visual.dotRects[noteIndex] = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
                }
            });

            // Add staccato dot
            if (this.staccato) {
                let dotX = visual.noteHeadRects[0].centerX;

                if (stemDir === Stem.Up) {
                    let diatonicId = this.getBottomNote().diatonicId;
                    let dotY = staff.getDiatonicIdY(diatonicId) + unitSize * (staff.isLine(diatonicId) ? 3 : 2);
                    visual.dotRects.push(DivRect.createCentered(dotX, dotY, dotWidth, dotWidth));
                }
                else {
                    let diatonicId = this.getTopNote().diatonicId;
                    let dotY = staff.getDiatonicIdY(diatonicId) - unitSize * (staff.isLine(diatonicId) ? 3 : 2);
                    visual.dotRects.push(DivRect.createCentered(dotX, dotY, dotWidth, dotWidth));
                }
            }

            // Calculate stem
            let bottomNoteY = staff.getDiatonicIdY(this.getBottomNote().diatonicId);
            let topNoteY = staff.getDiatonicIdY(this.getTopNote().diatonicId);

            if (bottomNoteY === undefined || topNoteY === undefined) {
                throw new MusicError(MusicErrorType.Score, "bottomNoteY or topNoteY is undefined!");
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
                visual.stemRect = new DivRect(stemX, stemX, Math.min(stemBaseY, stemTipY), Math.max(stemBaseY, stemTipY));
            }

            // Setup flag rects
            if (!this.hasBeamCount()) {
                let flagWidth = flagCount === 0 ? 0 : DocumentSettings.FlagWidth * unitSize;
                let flagHeight = flagCount === 0 ? 0 : DocumentSettings.FlagHeight * unitSize;

                for (let i = 0; i < flagCount; i++) {
                    let flagAddY = i * unitSize * DocumentSettings.FlagSeparation;

                    visual.flagRects[i] = stemDir === Stem.Up
                        ? new DivRect(stemX, stemX + flagWidth, stemTipY + flagAddY, stemTipY + flagHeight + flagAddY)
                        : new DivRect(stemX, stemX + flagWidth, stemTipY - flagHeight - flagAddY, stemTipY - flagAddY);
                }
            }

            if (visual.noteHeadRects.length > 0) {
                this.staffVisuals.push(visual);
            }
        });

        this.tabVsuals.length = 0;

        row.getNotationLines().filter(line => line instanceof ObjTab).forEach(tab => {
            if (!tab.containsVoiceId(this.voiceId)) {
                return;
            }

            let visual = new NoteTabVisual(tab);

            this.notes.forEach((note, noteIndex) => {
                // Add tab fret numbers
                if (this.ownString[noteIndex] !== undefined) {
                    let stringId = this.ownString[noteIndex] - 1;
                    let fretId = note.chromaticId - this.doc.tuningStrings[stringId].chromaticId;
                    let color = fretId < 0 ? "red" : "black";

                    let fretNumber = new ObjText(this, { text: String(fretId), color, bgcolor: "white" }, 0.5, 0.5);
                    visual.fretNumbers.push(fretNumber);

                    fretNumber.layout(renderer);

                    let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
                    let stemX = this.staffVisuals[0]?.stemRect?.centerX;

                    let x = stemX ?? noteX;
                    let y = tab.getStringY(stringId);
                    fretNumber.offset(x, y);
                }
            });

            if (visual.fretNumbers.length > 0) {
                this.tabVsuals.push(visual);
            }
        });

        this.updateRect();
    }

    private updateRect() {
        if (this.staffVisuals.length > 0) {
            this.rect = this.staffVisuals[0].noteHeadRects[0].copy();
        }
        else if (this.tabVsuals.length > 0 && this.tabVsuals[0].fretNumbers.length > 0) {
            this.rect = this.tabVsuals[0].fretNumbers[0].getRect().copy();
        }
        else {
            this.rect = new DivRect();
            return
        }

        this.staffVisuals.forEach(visual => {
            visual.noteHeadRects.forEach(r => this.rect.expandInPlace(r));

            if (visual.stemRect) {
                this.rect.expandInPlace(visual.stemRect);
            }

            visual.dotRects.forEach(r => this.rect.expandInPlace(r));
            visual.flagRects.forEach(r => this.rect.expandInPlace(r));
            visual.accidentals.forEach(a => this.rect.expandInPlace(a.getRect()));
        });

        this.tabVsuals.forEach(visual => {
            visual.fretNumbers.forEach(fn => this.rect.expandInPlace(fn.getRect()));
        });
    }

    setStemTipY(staff: ObjStaff, stemTipY: number) {
        let visual = this.staffVisuals.find(visual => visual.staff === staff);

        if (!visual?.stemRect) {
            return;
        }

        let oldStemTipY = this.stemDir === Stem.Up ? visual.stemRect.top : visual.stemRect.bottom;

        if (stemTipY === oldStemTipY) {
            return;
        }

        let r = visual.stemRect;

        let top = this.stemDir === Stem.Up ? stemTipY : r.top;
        let bottom = this.stemDir === Stem.Up ? r.bottom : stemTipY;

        visual.stemRect = new DivRect(r.left, r.right, top, bottom);

        this.updateRect();
    }

    offset(dx: number, dy: number) {
        this.staffVisuals.forEach(visual => visual.offset(dx, dy));
        this.tabVsuals.forEach(visual => visual.offset(dx, dy));
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

        this.staffVisuals.forEach(visual => {
            // Draw accidentals
            visual.accidentals.forEach(d => d.draw(renderer));

            ctx.strokeStyle = ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;

            // Draw note heads
            visual.noteHeadRects.forEach(r => {
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
            visual.dotRects.forEach(r => renderer.fillCircle(r.centerX, r.centerY, r.width / 2));

            // Draw stem
            if (visual.stemRect) {
                ctx.beginPath();
                ctx.moveTo(visual.stemRect.centerX, visual.stemRect.bottom);
                ctx.lineTo(visual.stemRect.centerX, visual.stemRect.top);
                ctx.stroke();
            }

            // Draw flags
            visual.flagRects.forEach(rect => {
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
        });

        // Draw tab fret numbers
        this.tabVsuals.forEach(visual => {
            visual.fretNumbers.forEach(fn => fn.draw(renderer));
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
            throw new MusicError(MusicErrorType.Score, "Cannot set triplet beam count because triplet beam group type is invalid.");
        }
    }

    getDotVerticalDisplacement(staff: ObjStaff, diatonicId: number, stemDir: Stem) {
        if (staff.isLine(diatonicId)) {
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
            if (note1.diatonicId !== note2.diatonicId || note1.accidental !== note2.accidental) {
                return false;
            }
        }
        return true;
    }
}
