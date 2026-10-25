import { Rect, UniMap, Utils, ValueSet } from "@tspro/ts-utils-lib";
import { Note, NoteLength, RhythmProps, Tempo, alterTempoSpeed } from "web-music-score/theory";
import * as Audio from "web-music-score/audio";
import { ObjDocument } from "./obj-document";
import { ObjMeasure } from "./obj-measure";
import { PlayState, PlayStateChangeListener, getVoiceIds, AnnotationKind, AnnotationGroup } from "../pub";
import { ObjRhythmColumn, RhythmSymbol } from "./obj-rhythm-column";
import { ObjBarLineRight } from "./obj-bar-line";
import { SpanProps, SpanRange } from "./span-props";
import { getDynamicsVolume, isDynamicsText, isTempoText } from "./annotation-utils";
import { ObjEnding } from "./obj-ending";
import { ObjAnnotation } from "./obj-annotation";

function _setTimeout(cb: () => any, ms: number): number | undefined {
    return typeof window === "undefined"
        ? undefined
        : window.setTimeout(cb, ms);
}

function _clearTimeout(t: number | undefined) {
    if (typeof window !== "undefined")
        window.clearTimeout(t);
}

export type CursorPositionChangeListener = (cursorRect: Rect | undefined) => void;

const AccelerandoSpeedMul = 2;
const RitardandoSpeedDiv = 2;

const CrescendoVolumeAdd = 0.5;
const DiminuendoVolumeSub = 0.5;

function calcTicksDuration(ticks: number, tempo: Tempo): number {
    let beatTicks = RhythmProps.get(tempo.options.beatLength, tempo.options.dotCount).ticks;
    let ticksPerMinute = tempo.beatsPerMinute * beatTicks;
    return 60 * ticks / ticksPerMinute;
}

function getDefaultVolume(): number {
    return getDynamicsVolume("m")!;
}

function adjustVolume(linearVolume: number) {
    return linearVolume * 1.25;
}

// Make bad slur effect by softening slurred notes.
const SlurredVolumeFactor = 0.5;

function requiresDummySpan(annotation: ObjAnnotation) {
    const { kind, group } = annotation;

    return (
        group === AnnotationGroup.Tempo && (
            kind === AnnotationKind.accel ||
            kind === AnnotationKind.rit ||
            kind === AnnotationKind.rall
        ) ||
        group === AnnotationGroup.Dynamics && (
            kind === AnnotationKind.cresc ||
            kind === AnnotationKind.cresc_hairpin ||
            kind === AnnotationKind.decresc ||
            kind === AnnotationKind.dim ||
            kind === AnnotationKind.decresc_hairpin ||
            kind === AnnotationKind.dim_hairpin
        )
    );
}

type PlayerColumn = ObjRhythmColumn | ObjBarLineRight;

export class PlayerColumnProps {
    private speed: number;
    private volume: number;
    private octaveShift: number;
    private fermataHoldTicks: number; // TODO

    constructor(readonly col: PlayerColumn) {
        this.speed = 1.0;
        this.volume = getDefaultVolume();
        this.octaveShift = 0;
        this.fermataHoldTicks = 0;
    }

    get measure(): ObjMeasure {
        return this.col.measure;
    }

    init() {
        this.speed = 1.0;
        this.volume = getDefaultVolume();
        this.octaveShift = 0;
    }

    getSpeed(): number {
        return this.speed;
    }

    getTempo(): Tempo {
        let speed = Utils.Math.clamp(this.getSpeed(), 0.1, 10);
        return alterTempoSpeed(this.measure.getTempo(), speed);
    }

    getVolume(): number {
        return this.volume;
    }

    getOctaveShift(): number {
        return this.octaveShift;
    }

    hasFermata(): boolean {
        return this.measure.hasFermata(this.col);
    }

    getFermataHoldTicks(): number {
        if (!this.hasFermata()) {
            return 0;
        }

        const { col } = this;

        if (col instanceof ObjBarLineRight) {
            return this.measure.getMeasureTicks() / 2;
        }
        else {
            let symbols = getVoiceIds().map(i => col.getVoiceSymbol(i)).filter(s => !!s) as RhythmSymbol[];
            let symbolsTicks = symbols.map(s => s.rhythmProps.ticks);

            if (symbolsTicks.length === 0) {
                return 0;
            }
            else {
                // Return average
                return Utils.Math.sum(symbolsTicks) / symbolsTicks.length;
            }
        }
    }

    applyAnnotation(ann: ObjAnnotation) {
        const { kind, group } = ann;

        if (group === AnnotationGroup.Dynamics) {
            const vol = getDynamicsVolume(kind);
            if (vol !== undefined) {
                this.volume = vol;
            }
        }
        else if (group === AnnotationGroup.Tempo) {
            if (kind === AnnotationKind.a_tempo) {
                this.speed = 1;
            }
        }
        else if (group === AnnotationGroup.Misc) {
            if (kind === AnnotationKind.loco) {
                this.octaveShift = 0;
            }
            else if (kind === AnnotationKind._8va) {
                this.octaveShift = 1;
            }
            else if (kind === AnnotationKind._8vb) {
                this.octaveShift = -1;
            }
        }
    }

    applySpan(ann: ObjAnnotation, spanRange: SpanRange, t: number) {
        const stopAnn = spanRange.stopObject instanceof ObjAnnotation ? spanRange.stopObject : undefined;

        const { kind, group } = ann;

        if (group === AnnotationGroup.Dynamics) {
            let vol: number | undefined;
            if ((vol = getDynamicsVolume(kind))) {
                // Set volume
                if (t >= 0 && t < 1) this.applyAnnotation(ann);
            }
            else if (kind === AnnotationKind.cresc || kind === AnnotationKind.cresc_hairpin) {
                // Gradually louder
                let startVol = this.volume;
                let endVol = startVol + CrescendoVolumeAdd;
                if (
                    stopAnn && stopAnn.group === AnnotationGroup.Dynamics &&
                    (vol = getDynamicsVolume(stopAnn.kind)) !== undefined && vol > startVol
                ) {
                    endVol = vol;
                }
                this.volume = startVol + (endVol - startVol) * t;
            }
            else if (kind === AnnotationKind.decresc || kind === AnnotationKind.dim || kind === AnnotationKind.decresc_hairpin || kind === AnnotationKind.dim_hairpin) {
                // Gradually quieter
                let startVol = this.volume;
                let endVol = startVol - DiminuendoVolumeSub;
                if (
                    stopAnn && stopAnn.group === AnnotationGroup.Dynamics &&
                    (vol = getDynamicsVolume(stopAnn.kind)) !== undefined && vol < startVol
                ) {
                    endVol = vol;
                }
                this.volume = startVol + (endVol - startVol) * t;
            }
        }
        else if (group === AnnotationGroup.Tempo) {
            if (kind === AnnotationKind.accel) {
                // Gradually faster
                let startSpeed = this.speed;
                let endSpeed = startSpeed * AccelerandoSpeedMul;
                this.speed = startSpeed + (endSpeed - startSpeed) * t;
            }
            else if (kind === AnnotationKind.rit || kind === AnnotationKind.rall) {
                // Gradually slower
                let startSpeed = this.speed;
                let endSpeed = startSpeed / RitardandoSpeedDiv;
                this.speed = startSpeed + (endSpeed - startSpeed) * t;
            }
        }
        else if (group === AnnotationGroup.Misc) {
            if (kind === AnnotationKind._8va) {
                // Octave higher
                if (t >= 0 && t < 1) this.applyAnnotation(ann);
            }
            else if (kind === AnnotationKind._8vb) {
                // Octave lower
                if (t >= 0 && t < 1) this.applyAnnotation(ann);
            }
        }
    }
}

export class PlayerEngine {
    private playTimer: number | undefined = undefined;

    private playPos: number | undefined;

    private playState = PlayState.Stopped;

    private doc?: ObjDocument;

    private cursorPositionChangeListener?: CursorPositionChangeListener;
    private playStateChnageListeners = new ValueSet<PlayStateChangeListener>();

    private playerColumnSequence: PlayerColumn[] = [];

    constructor() { }

    setDocument(doc: ObjDocument) {
        this.doc = doc;
    }

    setCursorPositionChangeListener(fn: CursorPositionChangeListener) {
        this.cursorPositionChangeListener = fn;
    }

    setPlayStateChangeListener(fn: PlayStateChangeListener) {
        this.playStateChnageListeners.add(fn);
    }

    removePlayStateChangeListener(fn: PlayStateChangeListener) {
        this.playStateChnageListeners.delete(fn);
    }

    getPlayStateChangeListeners(): PlayStateChangeListener[] {
        return this.playStateChnageListeners.toArray();
    }

    private notifyCursorPositionChanged() {
        if (this.cursorPositionChangeListener) {
            this.cursorPositionChangeListener(this.getCursorRect());
        }
    }

    private notifyPlayStateChanged() {
        let newPlayState = (this.playPos !== undefined && this.playTimer !== undefined)
            ? PlayState.Playing
            : (this.playPos !== undefined && this.playTimer === undefined)
                ? PlayState.Paused
                : PlayState.Stopped;

        if (this.playState !== newPlayState) {
            this.playStateChnageListeners.forEach(listener => listener(newPlayState));
            this.playState = newPlayState;
        }
    }

    private collectPlayerMeasureSequence(): ObjMeasure[] {
        if (!this.doc) {
            return [];
        }

        let measureSequence: ObjMeasure[] = [];

        let curMeasure = this.doc.getFirstMeasure();
        let startRepeatMeasure = curMeasure;
        let segnoMeasure: ObjMeasure | undefined;
        let alFine = false;
        let alCoda = false;
        let doNotRepeatRepeats = false;
        let endingsPassed: { pass: number, ending: ObjEnding }[] = [];
        let isEndRepeatUnderEnding = false;

        // Just add some limit if there is bug that causes infinite loop.
        let measuresLeft = this.doc.getMeasures().length * 10;

        while (curMeasure && --measuresLeft >= 0) {
            curMeasure.incPassCount();

            let curPassage = curMeasure.getPassCount();
            let curEnding = curMeasure.getEnding();

            if (curEnding) {
                const curPass = endingsPassed.length === 0 ? 1 : endingsPassed[endingsPassed.length - 1].pass + 1;
                const prevFirstEnding = endingsPassed.slice().reverse().find(e => e.pass === 1)?.ending;

                if (curEnding.hasPlayNumber(curPass)) {
                    endingsPassed.push({ pass: curPass, ending: curEnding });
                }
                else if (curEnding.hasPlayNumber(1) && prevFirstEnding !== curEnding) {
                    endingsPassed.push({ pass: 1, ending: curEnding });
                }
                else {
                    // Did jump to another ending?
                    curEnding = PlayerEngine.resolveNextEnding(curEnding, curPass);
                    curMeasure = curEnding?.measure;
                    if (!curMeasure) break;
                }
                isEndRepeatUnderEnding = true;
            }

            measureSequence.push(curMeasure);

            if (curMeasure.hasAnnotationKind(AnnotationKind.StartRepeat)) {
                startRepeatMeasure = curMeasure;
                isEndRepeatUnderEnding = false;
            }

            if (curMeasure.hasAnnotationKind(AnnotationKind.Segno)) {
                segnoMeasure = curMeasure;
            }

            if (alCoda && curMeasure.hasAnnotationKind(AnnotationKind.toCoda)) {
                // Played to coda mark, jump to designated coda section.
                while (curMeasure && !curMeasure.hasAnnotationKind(AnnotationKind.Coda)) {
                    curMeasure = curMeasure.getNextMeasure();
                }
            }
            else if (alFine && curMeasure.hasAnnotationKind(AnnotationKind.Fine)) {
                // Reached Fine.
                curMeasure = undefined;
            }
            else if (curMeasure.hasAnnotationKind(AnnotationKind.DC_al_Coda)) {
                alCoda = true;
                curMeasure = this.doc.getFirstMeasure();
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasAnnotationKind(AnnotationKind.DC_al_Fine)) {
                alFine = true;
                curMeasure = this.doc.getFirstMeasure();
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasAnnotationKind(AnnotationKind.DS_al_Coda)) {
                alCoda = true;
                curMeasure = segnoMeasure;
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasAnnotationKind(AnnotationKind.DS_al_Fine)) {
                alFine = true;
                curMeasure = segnoMeasure;
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasAnnotationKind(AnnotationKind.EndRepeat) && (!doNotRepeatRepeats || isEndRepeatUnderEnding)) {
                const playCount = curMeasure.getEndRepeatPlayCount();
                const unexpectedEnding = false;

                if (curPassage < playCount || isEndRepeatUnderEnding)
                    curMeasure = startRepeatMeasure;
                else if (unexpectedEnding)
                    curMeasure = undefined;
                else
                    curMeasure = curMeasure.getNextMeasure();
            }
            else if (curMeasure.hasEndSong()) {
                curMeasure = undefined;
            }
            else {
                curMeasure = curMeasure.getNextMeasure();
            }
        }

        return measureSequence;
    }

    private collectPlayerColumnSequence(): PlayerColumn[] {
        let measureSequence = this.collectPlayerMeasureSequence();

        // Create column play sequence
        let columnSequence: PlayerColumn[] = [];

        for (let i = 0; i < measureSequence.length; i++) {
            let m = measureSequence[i];

            columnSequence = columnSequence.concat(m.getColumns());

            if (m.hasFermata(m.getBarLineRight())) {
                columnSequence.push(m.getBarLineRight());
            }
        }

        return columnSequence;
    }

    private updatePlayerProps() {
        // Init player props to default values.
        this.playerColumnSequence.forEach(col => col.getPlayerProps().init());

        if (!this.doc) {
            return;
        }

        for (let curColId = 0; curColId < this.playerColumnSequence.length; curColId++) {
            const curCol = this.playerColumnSequence[curColId];

            if (!(curCol instanceof ObjRhythmColumn)) {
                return;
            }

            curCol.getAnchoredLayoutObjects().forEach(layoutObj => {
                const ann = layoutObj.musicObj instanceof ObjAnnotation ? layoutObj.musicObj : undefined;

                if (!ann) return;

                let spanProps = ann.getSpanProps();

                if (!spanProps && requiresDummySpan(ann)) {
                    // Create dummy span.
                    spanProps = new SpanProps(layoutObj, curCol, Infinity, false);
                }

                if (!spanProps) {
                    // Handle simple annotations
                    for (let applyColId = curColId; applyColId < this.playerColumnSequence.length; applyColId++) {
                        const applyCol = this.playerColumnSequence[applyColId];

                        if (applyCol instanceof ObjRhythmColumn) {
                            applyCol.getPlayerProps().applyAnnotation(ann);
                        }
                    }
                }
                else {
                    // Handle span annotations
                    const spanRange = spanProps.getRange();

                    let totalTicks = Utils.Math.sum(spanRange.columnRange.map(c => c.getTicksToNextColumn()));
                    let accuTicks = 0;

                    for (let applyColId = curColId; applyColId < this.playerColumnSequence.length; applyColId++) {
                        const applyCol = this.playerColumnSequence[applyColId];

                        if (applyCol instanceof ObjRhythmColumn) {
                            const t = Math.min(1, accuTicks / totalTicks)
                            applyCol.getPlayerProps().applySpan(ann, spanRange, t);
                            accuTicks += applyCol.getTicksToNextColumn();
                        }
                    }
                }
            });
        }
    }

    private static resolveNextEnding(curEnding: ObjEnding, passage: number): ObjEnding | undefined {
        let m: ObjMeasure | undefined = curEnding.measure.getNextMeasure()
        while (m) {
            const ending = m.getEnding();

            if (ending && ending.hasPlayNumber(passage))
                return ending;

            let next = m.getNextMeasure();

            if (
                !next ||
                m.hasEndSong() || m.hasEndSection() ||
                next.hasAnnotationKind(AnnotationKind.StartRepeat) && !next.hasAnnotationKind(AnnotationKind.Ending)
            ) {
                // Hit song end, new-section or start-repeat. No passage found.
                return undefined;
            }

            m = m.getNextMeasure();
        }

        return undefined;
    }

    private initializeForPlayback() {
        this.doc?.resetMeasures();
        this.playerColumnSequence = this.collectPlayerColumnSequence();
        this.updatePlayerProps();
    }

    private playStep() {
        this.notifyCursorPositionChanged();
        this.notifyPlayStateChanged();

        if (this.playPos === undefined) {
            this.stop();
            return;
        }

        const col = this.playerColumnSequence[this.playPos];

        if (!col) {
            this.stop();
            return;
        }

        const getDuration = (ticks: number, tempo: Tempo) => {
            let seconds = calcTicksDuration(ticks, tempo);
            return Math.max(0, seconds);
        }

        let tempo = col.getPlayerProps().getTempo();

        let fermataHoldTicks = col.getPlayerProps().getFermataHoldTicks();

        let timeoutSeconds: number;

        if (col instanceof ObjBarLineRight) {
            // Fermata at measure end.
            timeoutSeconds = getDuration(fermataHoldTicks, tempo);
        }
        else {
            // Play RhythmColumn
            let playerNotes = col.getPlayerNotes();

            playerNotes.forEach((note, i) => {
                let arpeggioDelayTicks = col.hasArpeggio() ? RhythmProps.get(NoteLength.ThirtySecond).ticks * i : 0;

                let noteSeconds = getDuration(note.ticks + fermataHoldTicks - arpeggioDelayTicks, tempo);

                if (noteSeconds > 0) {
                    if (note.staccato === "staccato") {
                        noteSeconds = Math.min(getDuration(RhythmProps.get(NoteLength.Eighth).ticks, tempo) / 2, noteSeconds / 2);
                    }
                    else if (note.staccato === "staccatissimo") {
                        noteSeconds = Math.min(getDuration(RhythmProps.get(NoteLength.Eighth).ticks, tempo) / 4, noteSeconds / 4);
                    }

                    let volume = adjustVolume(col.getPlayerProps().getVolume());

                    if (note.slur === "slurred") {
                        volume *= SlurredVolumeFactor;
                    }

                    let playNote = note.note;
                    let instrument = note.instrument;

                    let octaveShift = col.getPlayerProps().getOctaveShift();

                    if (octaveShift !== 0)
                        playNote = new Note(playNote.diatonicId + octaveShift * 7, playNote.accidental);

                    if (arpeggioDelayTicks > 0) {
                        let arpeggioDelay = getDuration(arpeggioDelayTicks, tempo);
                        _setTimeout(() => Audio.playNote(playNote, noteSeconds, volume, instrument, this), arpeggioDelay * 1000);
                    }
                    else {
                        Audio.playNote(playNote, noteSeconds, volume, instrument, this);
                    }
                }
            });

            timeoutSeconds = getDuration(col.getTicksToNextColumn() + fermataHoldTicks, tempo);
        }

        this.playTimer = _setTimeout(() => {
            this.playPos = this.getNextPlayPos();
            this.notifyPlayStateChanged();
            this.playStep();
        }, timeoutSeconds * 1000);
    }

    play() {
        this.initializeForPlayback();

        if (this.playState === PlayState.Playing) {
            // Restart playing
            this.stop();
        }
        else if (this.playState === PlayState.Paused) {
            // Continue by playing next step
            this.playStep();
            this.notifyPlayStateChanged();
            return;
        }

        let { doc } = this;

        if (!doc) {
            return;
        }

        // Load instruments but do not wait until done to start playing.
        doc.loadInstruments()
            .catch(err => console.error("Failed to load instrument:", err));

        let firstMeasure = doc.getFirstMeasure();

        if (firstMeasure) {
            this.playPos = 0;
            this.playStep();
        }
        else {
            this.playPos = undefined;
        }

        this.notifyPlayStateChanged();
    }

    pause() {
        Audio.stop(this);

        // To pause, stop timer
        if (this.playTimer) {
            _clearTimeout(this.playTimer);
            this.playTimer = undefined;
        }

        this.notifyCursorPositionChanged();
        this.notifyPlayStateChanged();

        // Set playback to continue from next position.
        this.playPos = this.getNextPlayPos();
    }

    stop() {
        Audio.stop(this);

        // Stop timer
        if (this.playTimer) {
            _clearTimeout(this.playTimer);
            this.playTimer = undefined;
        }

        // Set playPos to undefined.
        this.playPos = undefined;

        this.notifyCursorPositionChanged();
        this.notifyPlayStateChanged();
    }

    private getNextPlayPos() {
        if (this.playPos === undefined) return undefined;
        const nextPlayPos = this.playPos + 1;
        if (nextPlayPos >= this.playerColumnSequence.length)
            return undefined;
        return nextPlayPos;
    }

    getPlayState(): PlayState {
        return this.playState;
    }

    getCursorRect(): Rect | undefined {
        if (this.playPos === undefined) {
            return undefined;
        }

        let col = this.playerColumnSequence[this.playPos];

        if (!col) {
            return undefined;
        }

        let measure = col.measure;

        let x = col.getRect().anchorX;
        let { top, height } = measure.row.getRect();

        return new Rect(x, top, 0, height);
    }
}
