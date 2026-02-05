import { Rect, UniMap, Utils, ValueSet } from "@tspro/ts-utils-lib";
import { NoteLength, RhythmProps, Tempo, alterTempoSpeed } from "web-music-score/theory";
import * as Audio from "web-music-score/audio";
import { ObjDocument } from "./obj-document";
import { ObjMeasure } from "./obj-measure";
import { Navigation, PlayState, PlayStateChangeListener, getVoiceIds, DynamicsAnnotation, TempoAnnotation } from "../pub";
import { ObjRhythmColumn, RhythmSymbol } from "./obj-rhythm-column";
import { ObjBarLineRight } from "./obj-bar-line";
import { Extension, getTextContent } from "./extension";
import { getDynamicsVolume, isDynamicsText, isTempoText } from "./annotation-utils";
import { ObjEnding } from "./obj-ending";

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

type PlayerColumn = ObjRhythmColumn | ObjBarLineRight;

export class PlayerColumnProps {
    private speed: number;
    private volume: number;

    constructor(readonly col: PlayerColumn) {
        this.speed = 1.0;
        this.volume = getDefaultVolume();
    }

    get measure() {
        return this.col.measure;
    }

    reset(): void {
        this.speed = 1.0;
        this.volume = getDefaultVolume();
    }

    setSpeed(speed: number): void {
        this.speed = speed;
    }

    getSpeed(): number {
        return this.speed;
    }

    getTempo(): Tempo {
        let speed = Utils.Math.clamp(this.getSpeed(), 0.1, 10);
        return alterTempoSpeed(this.measure.getTempo(), speed);
    }
    setVolume(volume: number) {
        this.volume = volume;
    }

    getVolume() {
        return this.volume;
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

                if (curEnding.hasPassage(curPass)) {
                    endingsPassed.push({ pass: curPass, ending: curEnding });
                }
                else if (curEnding.hasPassage(1) && prevFirstEnding !== curEnding) {
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

            if (curMeasure.hasNavigation(Navigation.StartRepeat)) {
                startRepeatMeasure = curMeasure;
                isEndRepeatUnderEnding = false;
            }

            if (curMeasure.hasNavigation(Navigation.Segno)) {
                segnoMeasure = curMeasure;
            }

            if (alCoda && curMeasure.hasNavigation(Navigation.toCoda)) {
                // Played to coda mark, jump to designated coda section.
                while (curMeasure && !curMeasure.hasNavigation(Navigation.Coda)) {
                    curMeasure = curMeasure.getNextMeasure();
                }
            }
            else if (alFine && curMeasure.hasNavigation(Navigation.Fine)) {
                // Reached Fine.
                curMeasure = undefined;
            }
            else if (curMeasure.hasNavigation(Navigation.DC_al_Coda)) {
                alCoda = true;
                curMeasure = this.doc.getFirstMeasure();
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasNavigation(Navigation.DC_al_Fine)) {
                alFine = true;
                curMeasure = this.doc.getFirstMeasure();
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasNavigation(Navigation.DS_al_Coda)) {
                alCoda = true;
                curMeasure = segnoMeasure;
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasNavigation(Navigation.DS_al_Fine)) {
                alFine = true;
                curMeasure = segnoMeasure;
                doNotRepeatRepeats = true;
            }
            else if (curMeasure.hasNavigation(Navigation.EndRepeat) && (!doNotRepeatRepeats || isEndRepeatUnderEnding)) {
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
        // Reset player props
        this.playerColumnSequence.forEach(col => col.getPlayerProps().reset());

        if (!this.doc) {
            return;
        }

        let curSpeed = 1;
        let curVolume = getDefaultVolume();

        let speedMap = new UniMap<ObjRhythmColumn, number[]>();
        let volumeMap = new UniMap<ObjRhythmColumn, number[]>();

        const pushSpeed = (col: ObjRhythmColumn, speed: number) => speedMap.getOrCreate(col, []).push(speed);
        const pushVolume = (col: ObjRhythmColumn, volume: number) => volumeMap.getOrCreate(col, []).push(volume);

        this.playerColumnSequence.forEach((col, colId) => {
            if (!(col instanceof ObjRhythmColumn)) {
                return;
            }

            col.getAnchoredLayoutObjects().forEach(layoutObj => {
                const text = getTextContent(layoutObj.musicObj);

                let vol: number | undefined;

                if (text === TempoAnnotation.a_tempo) {
                    curSpeed = 1;
                }
                else if ((vol = getDynamicsVolume(text)) !== undefined) {
                    curVolume = vol;
                }
                else if (isTempoText(text) || isDynamicsText(text)) {
                    let extension = layoutObj.musicObj.getLink() instanceof Extension
                        ? layoutObj.musicObj.getLink() as Extension
                        : new Extension(layoutObj, col, Infinity, false, "solid", "bottom"); // Create dummy extension.

                    const range = extension.getRange();
                    const stopText = range.stopObject ? getTextContent(range.stopObject) : "";

                    let totalTicks = Utils.Math.sum(range.columnRange.map(c => c.getTicksToNextColumn()));

                    switch (text) {
                        case TempoAnnotation.accel: {
                            let startSpeed = curSpeed;
                            let endSpeed = startSpeed * AccelerandoSpeedMul;
                            let accuTicks = 0;
                            range.columnRange.forEach(c => {
                                accuTicks += c.getTicksToNextColumn();
                                pushSpeed(c, startSpeed + (endSpeed - startSpeed) * accuTicks / totalTicks);
                            });
                            break;
                        }
                        case TempoAnnotation.rit:
                        case TempoAnnotation.rall: {
                            let startSpeed = curSpeed;
                            let endSpeed = startSpeed / RitardandoSpeedDiv;
                            let accuTicks = 0;
                            range.columnRange.forEach(c => {
                                accuTicks += c.getTicksToNextColumn();
                                pushSpeed(c, startSpeed + (endSpeed - startSpeed) * accuTicks / totalTicks);
                            });
                            break;
                        }
                        case DynamicsAnnotation.cresc: {
                            let startVol = curVolume;
                            let endVol = startVol + CrescendoVolumeAdd;
                            if (range.stopObject && (vol = getDynamicsVolume(stopText)) !== undefined && vol > startVol) {
                                endVol = vol;
                            }
                            let accuTicks = 0;
                            range.columnRange.forEach(c => {
                                accuTicks += c.getTicksToNextColumn();
                                pushVolume(c, startVol + (endVol - startVol) * accuTicks / totalTicks);
                            });
                            break;
                        }
                        case DynamicsAnnotation.decresc:
                        case DynamicsAnnotation.dim: {
                            let startVol = curVolume;
                            let endVol = startVol - DiminuendoVolumeSub;
                            if (range.stopObject && (vol = getDynamicsVolume(stopText)) !== undefined && vol < startVol) {
                                endVol = vol;
                            }
                            let accuTicks = 0;
                            range.columnRange.forEach(c => {
                                accuTicks += c.getTicksToNextColumn();
                                pushVolume(c, startVol + (endVol - startVol) * accuTicks / totalTicks);
                            });
                            break;
                        }
                    }
                }
            });

            let speedArr = speedMap.getOrDefault(col, []);
            if (speedArr.length > 0) curSpeed = Utils.Math.avg(...speedArr);
            col.getPlayerProps().setSpeed(curSpeed);

            let volumeArr = volumeMap.getOrDefault(col, []);
            if (volumeArr.length > 0) curVolume = Utils.Math.avg(...volumeArr);
            col.getPlayerProps().setVolume(curVolume);
        });

    }

    private static resolveNextEnding(curEnding: ObjEnding, passage: number): ObjEnding | undefined {
        let m: ObjMeasure | undefined = curEnding.measure.getNextMeasure()
        while (m) {
            const ending = m.getEnding();

            if (ending && ending.hasPassage(passage))
                return ending;

            let next = m.getNextMeasure();

            if (
                !next ||
                m.hasEndSong() || m.hasEndSection() ||
                next.hasNavigation(Navigation.StartRepeat) && !next.hasNavigation(Navigation.Ending)
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

                    if (arpeggioDelayTicks > 0) {
                        let arpeggioDelay = getDuration(arpeggioDelayTicks, tempo);
                        _setTimeout(() => Audio.playNote(note.note, noteSeconds, volume), arpeggioDelay * 1000);
                    }
                    else {
                        Audio.playNote(note.note, noteSeconds, volume);
                    }
                }
            });

            timeoutSeconds = getDuration(col.getTicksToNextColumn() + fermataHoldTicks, tempo);
        }

        this.playTimer = _setTimeout(() => this.playStep(), timeoutSeconds * 1000);

        // Next pos
        this.playPos = this.getNextPlayPosition(this.playPos);

        this.notifyPlayStateChanged();
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
            return;
        }

        let { doc } = this;

        if (!doc) {
            return;
        }

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
        // To pause, only stop timer
        if (this.playTimer) {
            _clearTimeout(this.playTimer);
            this.playTimer = undefined;
        }

        this.notifyCursorPositionChanged();

        this.notifyPlayStateChanged();
    }

    stop() {
        // To stop playing, set playPos to undefined...
        this.playPos = undefined;

        // ...and stop timer
        if (this.playTimer) {
            _clearTimeout(this.playTimer);
            this.playTimer = undefined;
        }

        this.notifyCursorPositionChanged();

        this.notifyPlayStateChanged();
    }

    private getNextPlayPosition(curPlayPos: number | undefined): number | undefined {
        if (this.playPos !== undefined && ++this.playPos >= this.playerColumnSequence.length) {
            this.playPos = undefined;
        }

        return this.playPos;
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
