import { AnchoredRect, Guard, Rect, Utils } from "@tspro/ts-utils-lib";
import { Note, NoteLength, NoteLengthProps, NoteLengthStr, RhythmProps, Tuplet, TupletRatio } from "web-music-score/theory";
import { MusicObject } from "./music-object";
import { DrawSymbol, View } from "./view";
import { MNoteGroup, Stem, Arpeggio, NoteOptions, NoteAnchor, TieType, StringNumber, Connective, MusicInterface, MStaffNoteGroup, MTabNoteGroup, VoiceId, colorKey, AnnotationKind } from "../pub";
import { ConnectiveProps } from "./connective-props";
import { AccidentalState } from "./acc-state";
import { ObjAccidental } from "./obj-accidental";
import { ObjRhythmColumn } from "./obj-rhythm-column";
import { ObjBeamGroup } from "./obj-beam-group";
import { DocumentSettings } from "./settings";
import { ObjText } from "./obj-text";
import { ObjTab, ObjStaff, ObjNotationLine } from "./obj-staff-and-tab";
import { ObjRest } from "./obj-rest";
import { getNoteArticulationDrawSymbol, isNoteArticulation, sortNoteArticulations } from "./annotation-utils";
import { ScoreError } from "./error-utils";

function getArpeggio(a: boolean | Arpeggio | `${Arpeggio}` | undefined): Arpeggio | undefined {
    return Guard.isEnumValue(a, Arpeggio) ? a : (a === true ? Arpeggio.Up : undefined);
}

function sortNotesAndStrings(notes: ReadonlyArray<Note>, strings?: StringNumber | StringNumber[]) {
    let stringArr = Utils.Arr.isArray(strings) ? strings : (strings !== undefined ? [strings] : []);

    let noteStringData = notes.map((note, i) => { return { note, string: stringArr[i] } });

    noteStringData = Utils.Arr
        .removeDuplicates(noteStringData, (a, b) => Note.equals(a.note, b.note))
        .sort((a, b) => Note.compareFunc(a.note, b.note));

    return {
        sortedNotes: noteStringData.map(e => e.note),
        sortedStrings: noteStringData.every(e => e.string === undefined) ? undefined : noteStringData.map(e => e.string)
    }
}

export class ObjStaffNoteGroup extends MusicObject {
    public noteHeadRects: AnchoredRect[] = [];
    public articulations: { drawSymbol: DrawSymbol, rect: AnchoredRect }[] = [];
    public dotRects: AnchoredRect[] = [];
    public accidentals: ObjAccidental[] = [];
    public stemTip?: AnchoredRect;
    public stemBase?: AnchoredRect;
    public flagRects: AnchoredRect[] = [];

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
        if (!this.getRect().contains(x, y)) {
            return [];
        }

        for (let i = 0; i < this.accidentals.length; i++) {
            let arr = this.accidentals[i].pick(x, y);
            if (arr.length > 0) {
                return [this, ...arr];
            }
        }

        return [this];
    }

    updateRect() {
        this.rect = this.noteHeadRects[0].clone();
        this.noteHeadRects.forEach(r => this.rect.unionInPlace(r));
        if (this.stemTip) this.rect.unionInPlace(this.stemTip);
        if (this.stemBase) this.rect.unionInPlace(this.stemBase);
        this.articulations.forEach(ar => this.rect.unionInPlace(ar.rect));
        this.dotRects.forEach(r => this.rect.unionInPlace(r));
        this.flagRects.forEach(r => this.rect.unionInPlace(r));
        this.accidentals.forEach(a => this.rect.unionInPlace(a.getRect()));
    }

    getRect(): AnchoredRect {
        let bottomNoteRect = this.noteHeadRects[0];
        let topNoteRect = this.noteHeadRects[this.noteHeadRects.length - 1];

        if (this.prevTopNoteY !== topNoteRect.anchorY || this.prevBottomNoteY !== bottomNoteRect.anchorY) {
            this.prevTopNoteY = topNoteRect.anchorY;
            this.prevBottomNoteY = bottomNoteRect.anchorY;
            this.requestRectUpdate();
        }

        return super.getRect();
    }

    offset(dx: number, dy: number) {
        this.noteHeadRects.forEach(n => n.offsetInPlace(dx, dy));
        this.articulations.forEach(ar => ar.rect.offsetInPlace(dx, dy));
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

        // Add in layout, if fretNumbers.length > 0.
        //tab.addObject(this);

        this.mi = new MTabNoteGroup(this);
    }

    getMusicInterface(): MusicInterface {
        return this.mi;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.getRect().contains(x, y) ? [this] : [];
    }

    updateRect() {
        this.rect = this.fretNumbers[0].getRect().clone();
        this.fretNumbers.forEach(fn => this.rect.unionInPlace(fn.getRect()));
    }

    offset(dx: number, dy: number) {
        this.fretNumbers.forEach(f => f.offset(dx, dy));
        this.requestRectUpdate();
        this.noteGroup.requestRectUpdate();
    }
}

export class ObjNoteGroup extends MusicObject {
    readonly setDiatonicId: number;
    readonly setStringsNumbers?: StringNumber[];

    private runningDiatonicId: number; // Average diatonicId of notes.
    private runningStemDir: Stem.Up | Stem.Down;
    private runningStringNumbers: StringNumber[];

    readonly color: string;
    readonly diamond: boolean;
    readonly arpeggio: Arpeggio | undefined;
    readonly oldStyleTriplet: boolean;
    readonly rhythmProps: RhythmProps;

    private articulations: AnnotationKind[] = [];

    private startConnnectives: ConnectiveProps[] = [];
    private runningConnectives: ConnectiveProps[] = [];

    private leftBeamCount = 0;
    private rightBeamCount = 0;
    private beamGroup?: ObjBeamGroup;

    private readonly staffObjects: ObjStaffNoteGroup[] = [];
    private readonly tabObjects: ObjTabNoteGroup[] = [];

    private isNoteDisplaced: boolean[];

    readonly mi: MNoteGroup;

    constructor(readonly col: ObjRhythmColumn, readonly voiceId: VoiceId, readonly notes: ReadonlyArray<Note>, noteLength: NoteLength | NoteLengthStr, readonly options?: NoteOptions, tupletRatio?: TupletRatio) {
        super(col);

        if (!Guard.isIntegerGte(notes.length, 1)) {
            throw new ScoreError("Cannot create note group object because notes array is empty.");
        }

        let { sortedNotes, sortedStrings } = sortNotesAndStrings(notes, options?.string);

        this.notes = sortedNotes;
        this.setStringsNumbers = sortedStrings;

        this.isNoteDisplaced = this.notes.map(() => false);

        this.setDiatonicId = Math.round((this.minDiatonicId + this.maxDiatonicId) / 2);

        // Init with something, will be updated.
        this.runningDiatonicId = this.setDiatonicId;
        this.runningStemDir = Stem.Up;
        this.runningStringNumbers = [];
        this.color = options?.color ?? colorKey("staff.note");
        this.diamond = options?.diamond ?? false;
        this.arpeggio = getArpeggio(options?.arpeggio);
        this.oldStyleTriplet = tupletRatio === undefined && NoteLengthProps.get(noteLength).isTriplet;

        if (options?.staccato) this.articulations = [AnnotationKind.staccato];

        this.rhythmProps = RhythmProps.get(noteLength, undefined, tupletRatio ?? this.oldStyleTriplet ? Tuplet.Triplet : undefined);

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

    addNoteArticulation(kind: AnnotationKind) {
        if (!isNoteArticulation(kind))
            return;

        // They are the same
        if (kind === AnnotationKind.staccatissimo)
            kind = AnnotationKind.spiccato;

        if (!this.articulations.includes(kind)) {
            this.articulations.push(kind);
            this.articulations = sortNoteArticulations(this.articulations);
        }
    }

    hasArticulation(kind: AnnotationKind): boolean {
        // They are the same
        if (kind === AnnotationKind.staccatissimo)
            kind = AnnotationKind.spiccato;

        return this.articulations.includes(kind);
    }

    get minDiatonicId(): number {
        return this.notes[0].diatonicId;
    }

    get maxDiatonicId(): number {
        return this.notes[this.notes.length - 1].diatonicId;
    }

    getDiatonicId(staff?: ObjStaff): number {
        return this.runningDiatonicId;
    }

    get stemDir(): Stem.Up | Stem.Down {
        return this.runningStemDir;
    }

    setNoteDisplacement(note: Note, isDisplaced: boolean) {
        let i = this.notes.indexOf(note);
        if (i >= 0) this.isNoteDisplaced[i] = isDisplaced;
    }

    enableConnective(line: ObjNotationLine): boolean {
        return line.containsVoiceId(this.voiceId) && (line instanceof ObjTab || line.containsDiatonicId(this.runningDiatonicId));
    }

    startConnective(connectiveProps: ConnectiveProps) {
        if (!this.row.hasStaff && connectiveProps.connective === Connective.Tie) {
            throw new ScoreError("Ties not implemented for guitar tabs alone, staff is required!");
        }
        else if (!this.row.hasStaff && connectiveProps.connective === Connective.Slur) {
            throw new ScoreError("Slurs not implemented for guitar tabs alone, staff is required!");
        }

        this.startConnnectives.push(connectiveProps);
        this.doc.addConnectiveProps(connectiveProps);
    }

    updateRunningArguments(diatonicId: number, stemDir: Stem.Up | Stem.Down, stringNumbers: StringNumber[]) {
        this.runningDiatonicId = diatonicId === ObjRest.UndefinedDiatonicId ? this.setDiatonicId : diatonicId;
        this.runningStemDir = stemDir;
        this.runningStringNumbers = stringNumbers;
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

        return []; // Do not return [this].
    }

    getTopNote() {
        return this.notes[this.notes.length - 1];
    }

    getBottomNote() {
        return this.notes[0];
    }

    getConnectiveAnchorPoint(connectiveProps: ConnectiveProps, line: ObjNotationLine, noteIndex: number, noteAnchor: NoteAnchor, side: "left" | "right"): { x: number, y: number } {
        if (line instanceof ObjStaff) {
            if (noteIndex < 0 || noteIndex >= this.notes.length) {
                throw new ScoreError("Invalid noteIndex: " + noteIndex);
            }

            let obj = this.staffObjects.find(obj => obj.staff === line);

            if (!obj || noteIndex < 0 || noteIndex >= obj.noteHeadRects.length) {
                let r = this.getRect();
                return { x: r.anchorX, y: r.bottom }
            }

            let noteHeadRect = obj.noteHeadRects[noteIndex];
            let stemTip = obj.stemTip;
            let stemDir = this.stemDir;
            let hasStem = stemTip !== undefined;
            let stemSide: "left" | "right" | undefined = !hasStem ? undefined : (stemDir === Stem.Up ? "right" : "left");

            let padding = noteHeadRect.height / 2;
            let anchorX = noteHeadRect.anchorX;
            let anchorY = noteHeadRect.anchorY;
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
                    return side === "left" ? { x: rightX, y: anchorY } : { x: leftX, y: anchorY };
                case NoteAnchor.Above:
                    if (!hasStem || stemDir === Stem.Down) {
                        return { x: anchorX, y: aboveY }
                    }
                    else {
                        return {
                            x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : anchorX),
                            y: aboveY
                        }
                    }
                case NoteAnchor.Below:
                    if (!hasStem || stemDir === Stem.Up) {
                        return { x: anchorX, y: belowY }
                    }
                    else {
                        return {
                            x: side === "left" && stemSide === "right" ? rightX : (side === "right" && stemSide === "left" ? leftX : anchorX),
                            y: belowY
                        }
                    }
                case NoteAnchor.StemTip:
                    return { x: anchorX, y: stemTip!.anchorY + (stemDir === Stem.Up ? -padding : padding) }
                default:
                    throw new ScoreError("Invalid noteAnchor: " + noteAnchor);
            }
        }
        else if (line instanceof ObjTab) {
            let fretNumber = this.tabObjects.find(obj => obj.tab === line)?.fretNumbers[noteIndex];

            if (!fretNumber) {
                return { x: 0, y: 0 }
            }

            let r = fretNumber.getRect();

            let x = side === "right" ? r.left : r.right;
            let y: number;
            let s = 0.9;

            if (connectiveProps.connective === Connective.Slide) {
                let leftFretNumber = connectiveProps.noteGroups[0].getFretNumber(line, 0);
                let rightFretNumber = connectiveProps.noteGroups[1].getFretNumber(line, 0);
                let slideUp = leftFretNumber === undefined || rightFretNumber === undefined || leftFretNumber <= rightFretNumber;

                if (side === "left") {
                    y = (slideUp ? (r.anchorY + r.bottomh) : (r.anchorY - r.toph)) * s;
                }
                else {
                    y = (slideUp ? (r.anchorY - r.toph) : (r.anchorY + r.bottomh)) * s;
                }
            }
            else {
                y = r.anchorY + r.bottomh * s;
            }

            return { x, y }
        }
        else {
            return { x: 0, y: 0 }
        }
    }

    getFretNumberString(noteIndex: number): StringNumber | undefined {
        return this.runningStringNumbers[noteIndex];
    }

    getFretNumber(tab: ObjTab, noteIndex: number): number | undefined {
        let tabObj = this.tabObjects.find(o => o.tab === tab);
        let fretNumber = tabObj?.fretNumbers[noteIndex];
        return fretNumber ? parseInt(fretNumber.getText()) : undefined;
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

    setBeamGroup(beamGroup: ObjBeamGroup) {
        this.beamGroup = beamGroup;
    }

    resetBeamGroup() {
        this.leftBeamCount = this.rightBeamCount = 0;
        this.beamGroup = undefined;
    }

    getBeamCoords(): ({ staff: ObjStaff, x: number, y: number, stemHeight: number } | undefined)[] {
        return this.staffObjects.map(obj => {
            let staff = obj.staff;
            let x = obj.stemTip?.anchorX ?? obj.noteHeadRects[0].anchorX;
            let y = obj.stemTip?.anchorY ?? (this.stemDir === Stem.Up ? obj.getRect().top : obj.getRect().bottom);
            let stemHeight = this.stemDir === Stem.Up ? Math.abs(obj.noteHeadRects[0].anchorY - y) : Math.abs(obj.noteHeadRects[obj.noteHeadRects.length - 1].anchorY - y);
            return { staff, x, y, stemHeight }
        });
    }

    getStemHeight(view: View) {
        let { unitSize } = view;
        let { flagCount, hasStem } = this.rhythmProps;

        if (hasStem) {
            let addY = this.hasBeamCount() ? DocumentSettings.BeamSeparation : DocumentSettings.FlagSeparation;
            return (DocumentSettings.StemHeight + Math.max(0, flagCount - 1) * addY) * unitSize;
        }
        else {
            return 0;
        }
    }

    hasBeamCount() {
        return this.leftBeamCount > 0 || this.rightBeamCount > 0;
    }

    getLeftBeamCount(): number {
        return this.leftBeamCount;
    }

    getRightBeamCount(): number {
        return this.rightBeamCount;
    }

    setLeftBeamCount(count: number) {
        this.leftBeamCount = count;
    }

    setRightBeamCount(count: number) {
        this.rightBeamCount = count;
    }

    hasTuplet(): boolean {
        return this.rhythmProps.tupletRatio !== undefined;
    }

    isEmpty(): boolean {
        return this.staffObjects.length === 0 && this.tabObjects.length === 0;
    }

    visibleInStaff(staff: ObjStaff): boolean {
        return staff.containsVoiceId(this.voiceId) &&
            this.staffObjects.some(obj => obj instanceof ObjStaffNoteGroup && obj.staff === staff);
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

    layout(view: View, accState: AccidentalState) {
        this.requestRectUpdate();

        let { unitSize } = view;
        let { row, stemDir } = this;
        let { dotCount, flagCount, hasStem } = this.rhythmProps;

        let dotRect = view.getSymbolRect(DrawSymbol.Dot);

        let noteHeadRect = view.getSymbolRect(this.diamond ? DrawSymbol.DiamondNoteHeadFilled : DrawSymbol.NoteHeadFilled);

        this.staffObjects.length = 0;

        row.getStaves().forEach(staff => {
            if (!staff.containsDiatonicId(this.runningDiatonicId) || !staff.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjStaffNoteGroup(staff, this);

            let stemBaseStaff: ObjStaff = staff;
            let stemTipStaff: ObjStaff = staff;

            this.notes.forEach((note, noteIndex) => {
                let isBottomNote = noteIndex === 0;
                let isTopNote = noteIndex === this.notes.length - 1;

                let noteStaff = staff.getActualStaff(note.diatonicId) ?? staff;
                let noteX = this.isNoteDisplaced[noteIndex] ? noteHeadRect.width * (stemDir === Stem.Down ? -1 : 1) : 0;
                let noteY = noteStaff.getDiatonicIdY(note.diatonicId);
                let isNoteOnLine = noteStaff.isLine(note.diatonicId);

                if (isBottomNote && stemDir === Stem.Up) stemBaseStaff = noteStaff;
                if (isTopNote && stemDir === Stem.Up) stemTipStaff = noteStaff;
                if (isBottomNote && stemDir === Stem.Down) stemTipStaff = noteStaff;
                if (isTopNote && stemDir === Stem.Down) stemBaseStaff = noteStaff;

                // Add note head
                noteStaff.addObject(obj.noteHeadRects[noteIndex] = noteHeadRect.offsetCopy(noteX, noteY));

                // Add accidental
                if (accState.needAccidental(note)) {
                    let acc = obj.accidentals[noteIndex] = new ObjAccidental(this, note.diatonicId, note.accidental, this.color);
                    if (acc) {
                        acc.layout(view);
                        acc.setAnchor(
                            -noteHeadRect.leftw - unitSize * DocumentSettings.NoteAccSpace - acc.getRect().rightw,
                            noteY
                        );
                    }
                    noteStaff.addObject(acc);
                }

                // Add dots
                for (let i = 0; i < dotCount; i++) {
                    let dotX = noteHeadRect.right + DocumentSettings.NoteDotSpace * unitSize + dotRect.width / 2 + i * dotRect.width * 1.5;
                    let dotY = noteY + this.getDotVerticalDisplacement(staff, note.diatonicId, stemDir) * unitSize;
                    let r = dotRect.offsetCopy(dotX, dotY);
                    obj.dotRects.push(r);
                    noteStaff.addObject(r);
                }

                // Add articulations
                if (stemDir === Stem.Up && isBottomNote || stemDir === Stem.Down && isTopNote) {
                    let dy = stemDir === Stem.Down ? -1 : 1;
                    let arX = noteX;
                    let arY = noteY + (isNoteOnLine ? 3 : 2) * unitSize * dy;

                    this.articulations.forEach((kind, kindId) => {
                        let drawSymbol = getNoteArticulationDrawSymbol(kind);
                        let rect = view.getSymbolRect(drawSymbol).offsetCopy(arX, arY);

                        obj.articulations.push({ drawSymbol, rect });
                        stemBaseStaff.addObject(rect);

                        arY += unitSize * 2 * dy;
                    });
                }
            });

            // Calculate stem
            let bottomNoteY = obj.noteHeadRects[0].anchorY;
            let topNoteY = obj.noteHeadRects[obj.noteHeadRects.length - 1].anchorY;
            let stemX = stemDir === Stem.Up ? noteHeadRect.width / 2 : -noteHeadRect.width / 2;
            let stemHeight = this.getStemHeight(view);
            let stemTipY = stemDir === Stem.Up ? topNoteY - stemHeight : bottomNoteY + stemHeight;
            let stemBaseY = stemDir === Stem.Up ? bottomNoteY : topNoteY;

            if (hasStem) {
                obj.stemTip = new AnchoredRect(stemX, stemX, stemTipY, stemTipY);
                obj.stemBase = new AnchoredRect(stemX, stemX, stemBaseY, stemBaseY);
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
                        ? new AnchoredRect(stemX, stemX + flagWidth, stemTipY + flagAddY, stemTipY + flagHeight + flagAddY)
                        : new AnchoredRect(stemX, stemX + flagWidth, stemTipY - flagHeight - flagAddY, stemTipY - flagAddY);

                    stemTipStaff.addObject(r);
                }
            }

            this.staffObjects.push(obj);
            this.measure.addStaticObject(staff, obj);
        });

        this.tabObjects.length = 0;

        row.getTabs().forEach(tab => {
            if (!tab.containsVoiceId(this.voiceId)) {
                return;
            }

            let obj = new ObjTabNoteGroup(tab, this);
            const bgcolor = colorKey("background");
            const color = colorKey("tab.note");

            this.notes.forEach((note, noteIndex) => {
                // Add tab fret numbers
                let stringNumber = this.runningStringNumbers[noteIndex];
                if (Guard.isIntegerBetween(stringNumber, 1, 6)) {
                    let fretId = note.chromaticId - tab.getTuningStrings()[stringNumber - 1].chromaticId;
                    let fretNumber = new ObjText(this, { text: String(fretId), color, bgcolor }, 0.5, 0.5);
                    fretNumber.layout(view);

                    fretNumber.setAnchor(this.col.getRect().anchorX, tab.getStringY(stringNumber - 1));

                    obj.fretNumbers.push(fretNumber);
                }
            });

            if (obj.fretNumbers.length > 0) {
                this.tabObjects.push(obj);
                tab.addObject(obj);
                this.measure.addStaticObject(tab, obj);
            }
        });
    }

    updateRect() {
        if (this.staffObjects.length > 0) {
            this.rect = this.staffObjects[0].noteHeadRects[0].clone();
        }
        else if (this.tabObjects.length > 0 && this.tabObjects[0].fretNumbers.length > 0) {
            this.rect = this.tabObjects[0].fretNumbers[0].getRect().clone();
        }
        else {
            this.rect = new AnchoredRect();
            return;
        }

        this.staffObjects.forEach(obj => this.rect.unionInPlace(obj.getRect()));
        this.tabObjects.forEach(obj => this.rect.unionInPlace(obj.getRect()));
    }

    setStemTipY(staff: ObjStaff, stemTipY: number) {
        let obj = this.staffObjects.find(obj => obj.staff === staff);

        if (this.hasBeamCount() && obj?.stemTip && stemTipY !== obj.stemTip.anchorY) {
            obj.stemTip.top = obj.stemTip.anchorY = obj.stemTip.bottom = stemTipY;
            this.requestRectUpdate();
            this.col.requestRectUpdate();
        }
    }

    offset(dx: number, dy: number) {
        this.staffObjects.forEach(obj => obj.offset(dx, 0));
        this.tabObjects.forEach(obj => obj.offset(dx, 0));
        this.requestRectUpdate();
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.drawDebugRect(this.getRect());

        let { stemDir } = this;
        let { isSolidNoteHead } = this.rhythmProps;

        this.staffObjects.forEach(obj => {
            // Draw accidentals
            obj.accidentals.forEach(d => d.draw(view, clipRect));

            view.color(this.color);
            view.lineWidth(1);

            // Draw note heads
            obj.noteHeadRects.forEach(r => {
                if (this.diamond) {
                    if (isSolidNoteHead)
                        view.drawSymbol(DrawSymbol.DiamondNoteHeadFilled, r);
                    else
                        view.drawSymbol(DrawSymbol.DiamondNoteHeadStroked, r);
                }
                else {
                    if (isSolidNoteHead)
                        view.drawSymbol(DrawSymbol.NoteHeadFilled, r);
                    else
                        view.drawSymbol(DrawSymbol.NoteHeadStroked, r);
                }
            });

            // Draw articulations
            obj.articulations.forEach(ar => view.drawSymbol(ar.drawSymbol, ar.rect));

            // Draw dots
            obj.dotRects.forEach(r => view.drawSymbol(DrawSymbol.Dot, r));

            // Draw stem
            if (obj.stemTip && obj.stemBase) {
                view.beginPath();
                view.moveTo(obj.stemBase.anchorX, obj.stemBase.anchorY);
                view.lineTo(obj.stemTip.anchorX, obj.stemTip.anchorY);
                view.stroke();
            }

            // Draw flags
            obj.flagRects.forEach(rect => view.drawSymbol(DrawSymbol.Flag, rect, false, stemDir === Stem.Down));
        });

        // Draw tab fret numbers
        this.tabObjects.forEach(obj => obj.fretNumbers.forEach(fn => fn.draw(view)));
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
