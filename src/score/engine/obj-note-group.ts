import { Utils } from "@tspro/ts-utils-lib";
import { Note, NoteLength, RhythmProps } from "@tspro/web-music-score/theory";
import { MusicObject } from "./music-object";
import { Renderer } from "./renderer";
import { DivRect, MNoteGroup, Stem, Arpeggio, NoteOptions, NoteAnchor, TieType, StringNumber, Connective, MusicInterface, MStaffNoteGroup, MTabNoteGroup } from "../pub";
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

export class ObjStaffNoteGroup extends MusicObject {
    public noteHeadRects: DivRect[] = [];
    public dotRects: DivRect[] = [];
    public accidentals: ObjAccidental[] = [];
    public stemTip?: DivRect;
    public stemBase?: DivRect;
    public flagRects: DivRect[] = [];

    private prevTopNoteY = 0;
    private prevBottomNoteY = 0;

    readonly mi: MStaffNoteGroup;

    constructor(readonly staff: ObjStaff, readonly noteGroup: ObjNoteGroup) {
        super(staff);

        // Each rect/point is added to correct staff instead. Use getRect() to update rect.
        //staff.addObject(this);

        this.mi = new MStaffNoteGroup(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    updateRect() {
        this.rect = this.noteHeadRects[0].copy();
        this.noteHeadRects.forEach(r => this.rect.expandInPlace(r));
        if (this.stemTip) this.rect.expandInPlace(this.stemTip);
        if (this.stemBase) this.rect.expandInPlace(this.stemBase);
        this.dotRects.forEach(r => this.rect.expandInPlace(r));
        this.flagRects.forEach(r => this.rect.expandInPlace(r));
        this.accidentals.forEach(a => this.rect.expandInPlace(a.getRect()));
    }

    getRect(): DivRect {
        let bottomNoteRect = this.noteHeadRects[0];
        let topNoteRect = this.noteHeadRects[this.noteHeadRects.length - 1];

        if (this.prevTopNoteY !== topNoteRect.centerY || this.prevBottomNoteY !== bottomNoteRect.centerY) {
            this.prevTopNoteY = topNoteRect.centerY;
            this.prevBottomNoteY = bottomNoteRect.centerY;
            this.requestRectUpdate();
        }

        return super.getRect();
    }

    offset(dx: number, dy: number) {
        this.noteHeadRects.forEach(n => n.offsetInPlace(dx, dy));
        this.dotRects.forEach(n => n.offsetInPlace(dx, dy));
        this.accidentals.forEach(n => n.offset(dx, dy));
        this.stemTip?.offsetInPlace(dx, dy);
        this.stemBase?.offsetInPlace(dx, dy);
        this.flagRects.forEach(n => n.offsetInPlace(dx, dy));
        this.requestRectUpdate();
        this.noteGroup.requestRectUpdate();
    }
}

export class ObjTabNoteGroup extends MusicObject {
    public fretNumbers: ObjText[] = [];

    readonly mi: MTabNoteGroup;

    constructor(readonly tab: ObjTab, readonly noteGroup: ObjNoteGroup) {
        super(tab);

        tab.addObject(this);

        this.mi = new MTabNoteGroup(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    updateRect() {
        this.rect = this.fretNumbers[0].getRect().copy();
        this.fretNumbers.forEach(fn => this.rect.expandInPlace(fn.getRect()));
    }

    offset(dx: number, dy: number) {
        this.fretNumbers.forEach(f => f.offset(dx, dy));
        this.requestRectUpdate();
        this.noteGroup.requestRectUpdate();
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

    private readonly staffObjects: ObjStaffNoteGroup[] = [];
    private readonly tabObjects: ObjTabNoteGroup[] = [];

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
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.staffObjects.length; i++) {
            let arr = this.staffObjects[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        for (let i = 0; i < this.tabObjects.length; i++) {
            let arr = this.tabObjects[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
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

            let obj = this.staffObjects.find(obj => obj.staff === staff);

            if (!obj || noteIndex < 0 || noteIndex >= obj.noteHeadRects.length) {
                let r = this.getRect();
                return { x: r.centerX, y: r.bottom }
            }

            let noteHeadRect = obj.noteHeadRects[noteIndex];
            let stemTip = obj.stemTip;
            let stemDir = this.stemDir;
            let hasStem = stemTip !== undefined;
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
                    return { x: centerX, y: stemTip!.centerY + (stemDir === Stem.Up ? -padding : padding) }
                default:
                    throw new MusicError(MusicErrorType.Score, "Invalid noteAnchor: " + noteAnchor);
            }
        }
        else {
            let tab = line;

            let obj = this.tabObjects.find(obj => obj.tab === tab);

            let fretNumber = obj?.fretNumbers[noteIndex];


            if (!obj || !fretNumber) {
                return { x: 0, y: 0 }
            }

            let r = fretNumber.getRect();

            let x = side === "right" ? r.left : r.right;
            let y: number;
            let s = 0.9;

            if (connectiveProps.connective === Connective.Slide) {
                let leftFretNumber = connectiveProps.noteGroups[0].getFretNumber(obj, 0);
                let rightFretNumber = connectiveProps.noteGroups[1].getFretNumber(obj, 0);
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

    getFretNumber(tabObj: ObjTabNoteGroup, noteIndex: number): number | undefined {
        let fretNumber = tabObj.fretNumbers[noteIndex];
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

    getBeamCoords(): ({ staff: ObjStaff, x: number, y: number, stemHeight: number } | undefined)[] {
        return this.staffObjects.map(obj => {
            let staff = obj.staff;
            let x = obj.stemTip?.centerX ?? obj.noteHeadRects[0].centerX;
            let y = obj.stemTip?.centerY ?? (this.stemDir === Stem.Up ? obj.getRect().top : obj.getRect().bottom);
            let stemHeight = this.stemDir === Stem.Up ? Math.abs(obj.noteHeadRects[0].centerY - y) : Math.abs(obj.noteHeadRects[obj.noteHeadRects.length - 1].centerY - y);
            return { staff, x, y, stemHeight }
        });
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
        this.requestRectUpdate();

        let { unitSize } = renderer;
        let { row, stemDir } = this;
        let { dotted, flagCount } = this.rhythmProps;

        let dotWidth = DocumentSettings.DotSize * unitSize;

        let noteHeadWidth = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadWidth) * unitSize;
        let noteHeadHeight = (this.diamond ? DocumentSettings.DiamondNoteHeadSize : DocumentSettings.NoteHeadHeight) * unitSize;

        this.staffObjects.length = 0;

        row.getNotationLines().filter(line => line instanceof ObjStaff).forEach(staff => {
            if (!staff.containsDiatonicId(this.ownDiatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjStaffNoteGroup(staff, this);

            let stemBaseStaff: ObjStaff = staff;
            let stemTipStaff: ObjStaff = staff;

            this.notes.forEach((note, noteIndex) => {
                let isBottomNote = noteIndex === 0;
                let isTopNote = noteIndex === this.notes.length - 1;

                let noteStaff = staff.getActualStaff(note.diatonicId) ?? staff;
                let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
                let noteY = noteStaff.getDiatonicIdY(note.diatonicId);
                let isNoteOnLine = noteStaff.isLine(note.diatonicId);

                if (isBottomNote && stemDir === Stem.Up) stemBaseStaff = noteStaff;
                if (isTopNote && stemDir === Stem.Up) stemTipStaff = noteStaff;
                if (isBottomNote && stemDir === Stem.Down) stemTipStaff = noteStaff;
                if (isTopNote && stemDir === Stem.Down) stemBaseStaff = noteStaff;

                // Add note head
                let noteHeadRect = obj.noteHeadRects[noteIndex] = DivRect.createCentered(noteX, noteY, noteHeadWidth, noteHeadHeight);
                noteStaff.addObject(noteHeadRect);

                // Add accidental
                if (accState.needAccidental(note)) {
                    let acc = obj.accidentals[noteIndex] = new ObjAccidental(this, note.diatonicId, note.accidental, this.color);
                    if (acc) {
                        acc.layout(renderer);
                        acc.offset(-noteHeadRect.leftw - unitSize * DocumentSettings.NoteAccSpace - acc.getRect().rightw, noteY);
                    }
                    noteStaff.addObject(acc);
                }

                // Add dot
                if (dotted) {
                    let dotX = noteHeadRect.right + DocumentSettings.NoteDotSpace * unitSize + dotWidth / 2;
                    let dotY = noteY + this.getDotVerticalDisplacement(staff, note.diatonicId, stemDir) * unitSize;

                    let r = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
                    obj.dotRects.push(r);
                    noteStaff.addObject(r);
                }

                // Add staccato dot
                if (this.staccato) {
                    if (stemDir === Stem.Up && isBottomNote) {
                        let dotX = noteX;
                        let dotY = noteY + unitSize * (isNoteOnLine ? 3 : 2);
                        let r = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
                        obj.dotRects.push(r);
                        stemBaseStaff.addObject(r);
                    }
                    else if (stemDir === Stem.Down && isTopNote) {
                        let dotX = noteX;
                        let dotY = noteY - unitSize * (isNoteOnLine ? 3 : 2);
                        let r = DivRect.createCentered(dotX, dotY, dotWidth, dotWidth);
                        obj.dotRects.push(r);
                        stemBaseStaff.addObject(r);
                    }
                }
            });

            // Calculate stem
            let bottomNoteY = obj.noteHeadRects[0].centerY;
            let topNoteY = obj.noteHeadRects[obj.noteHeadRects.length - 1].centerY;
            let stemX = stemDir === Stem.Up ? noteHeadWidth / 2 : -noteHeadWidth / 2;
            let stemHeight = this.getStemHeight(renderer);
            let stemTipY = stemDir === Stem.Up ? topNoteY - stemHeight : bottomNoteY + stemHeight;
            let stemBaseY = stemDir === Stem.Up ? bottomNoteY : topNoteY;

            if (this.rhythmProps.hasStem()) {
                obj.stemTip = new DivRect(stemX, stemX, stemTipY, stemTipY);
                obj.stemBase = new DivRect(stemX, stemX, stemBaseY, stemBaseY);
                stemTipStaff.addObject(obj.stemTip);
                stemBaseStaff.addObject(obj.stemBase);
            }

            // Add flag rects
            if (!this.hasBeamCount()) {
                let flagWidth = flagCount === 0 ? 0 : DocumentSettings.FlagWidth * unitSize;
                let flagHeight = flagCount === 0 ? 0 : DocumentSettings.FlagHeight * unitSize;

                for (let i = 0; i < flagCount; i++) {
                    let flagAddY = i * unitSize * DocumentSettings.FlagSeparation;

                    let r = obj.flagRects[i] = stemDir === Stem.Up
                        ? new DivRect(stemX, stemX + flagWidth, stemTipY + flagAddY, stemTipY + flagHeight + flagAddY)
                        : new DivRect(stemX, stemX + flagWidth, stemTipY - flagHeight - flagAddY, stemTipY - flagAddY);

                    stemTipStaff.addObject(r);
                }
            }

            this.staffObjects.push(obj);
        });

        this.tabObjects.length = 0;

        row.getNotationLines().filter(line => line instanceof ObjTab).forEach(tab => {
            if (!tab.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjTabNoteGroup(tab, this);

            this.notes.forEach((note, noteIndex) => {
                // Add tab fret numbers
                if (this.ownString[noteIndex] !== undefined) {
                    let stringId = this.ownString[noteIndex] - 1;
                    let fretId = note.chromaticId - this.doc.tuningStrings[stringId].chromaticId;
                    let color = fretId < 0 ? "red" : "black";

                    let fretNumber = new ObjText(this, { text: String(fretId), color, bgcolor: "white" }, 0.5, 0.5);
                    obj.fretNumbers.push(fretNumber);

                    fretNumber.layout(renderer);

                    let noteX = this.col.getNoteHeadDisplacement(this, note) * noteHeadWidth;
                    let stemX = this.staffObjects[0]?.stemBase?.centerX;

                    let x = stemX ?? noteX;
                    let y = tab.getStringY(stringId);
                    fretNumber.offset(x, y);
                }
            });

            if (obj.fretNumbers.length > 0) {
                this.tabObjects.push(obj);
            }
        });
    }

    updateRect() {
        this.staffObjects.forEach(obj => obj.updateRect());
        this.tabObjects.forEach(obj => obj.updateRect());

        if (this.staffObjects.length > 0) {
            this.rect = this.staffObjects[0].noteHeadRects[0].copy();
        }
        else if (this.tabObjects.length > 0 && this.tabObjects[0].fretNumbers.length > 0) {
            this.rect = this.tabObjects[0].fretNumbers[0].getRect().copy();
        }
        else {
            this.rect = new DivRect();
            return;
        }

        this.staffObjects.forEach(obj => this.rect.expandInPlace(obj.getRect()));
        this.tabObjects.forEach(obj => this.rect.expandInPlace(obj.getRect()));
    }

    setStemTipY(staff: ObjStaff, stemTipY: number) {
        let obj = this.staffObjects.find(obj => obj.staff === staff);

        if (!obj?.stemTip || stemTipY === obj.stemTip.centerY) {
            return;
        }

        obj.stemTip.top = obj.stemTip.centerY = obj.stemTip.bottom = stemTipY;

        this.requestRectUpdate();
    }

    offset(dx: number, dy: number) {
        this.staffObjects.forEach(obj => obj.offset(dx, 0)); // dy is offset in notation line
        this.tabObjects.forEach(obj => obj.offset(dx, 0));   // dy is offset in notation line
        this.requestRectUpdate();
    }

    draw(renderer: Renderer) {
        const ctx = renderer.getCanvasContext();

        if (!ctx) {
            return;
        }

        renderer.drawDebugRect(this.getRect());

        let { lineWidth } = renderer;
        let { color, stemDir } = this;
        let { noteLength } = this.rhythmProps;

        this.staffObjects.forEach(obj => {
            // Draw accidentals
            obj.accidentals.forEach(d => d.draw(renderer));

            ctx.strokeStyle = ctx.fillStyle = color;
            ctx.lineWidth = lineWidth;

            // Draw note heads
            obj.noteHeadRects.forEach(r => {
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
            obj.dotRects.forEach(r => renderer.fillCircle(r.centerX, r.centerY, r.width / 2));

            // Draw stem
            if (obj.stemTip && obj.stemBase) {
                ctx.beginPath();
                ctx.moveTo(obj.stemBase.centerX, obj.stemBase.centerY);
                ctx.lineTo(obj.stemTip.centerX, obj.stemTip.centerY);
                ctx.stroke();
            }

            // Draw flags
            obj.flagRects.forEach(rect => {
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
        this.tabObjects.forEach(obj => {
            obj.fretNumbers.forEach(fn => fn.draw(renderer));
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
