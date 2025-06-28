import * as React from "react";
import { createRoot } from "react-dom/client";
import { CAGEDScales, ChooseScale, ChooseScaleCircle, ChooseTuning, DiatonicChords, FrontPage, GuitarScales, Intervals, PlayNotes, WhatChord } from "./pages";
import * as Score from "@tspro/web-music-score";
import { Cookies, Utils } from "@tspro/ts-utils-lib";

const AppCookies = {
    PitchNotation: "pitchNotation",
    GuitarNoteLabel: "guitarNoteLabel",
    Handedness: "handedness",
    TuningName: "tuningName",
    ScaleType: "scaleType",
    ScaleKeyNote: "scaleKeyNote",
    Instrument: "instrument"
}

function getLocationHash() {
    return window.location.hash.substring(1).replace(/\%20/g, " ");
}

function getPageFromLocationHash(): string {
    Score.MPlayer.stopAll();

    let loc = getLocationHash();
    return loc === "" ? Page.FrontPage : loc;
}

export enum Page {
    FrontPage = "Interactive Guitar App",
    ChooseTuning = "Choose Tuning",
    ChooseScale = "Choose Scale",
    CircleOfFifths = "Circle of Fifths",
    PlayNotes = "Play Notes",
    Intervals = "Intervals",
    DiatonicChords = "Diatonic Chords",
    GuitarScales = "Guitar Scales",
    CAGEDScales = "CAGED Scales",
    WhatChord = "What Chord",
}

interface GuitarAppState {
    windowRect: Score.DivRect;
    currentPage: string;
    instrument: Score.Audio.Instrument;
    guitarCtx: Score.GuitarContext;
}

export class GuitarApp extends React.Component<{}, GuitarAppState> {

    state: GuitarAppState;

    private _isMounted = false;

    constructor(props: {}) {
        super(props);

        Cookies.setExpireDays(30);

        let currentPage = getPageFromLocationHash();
        if (currentPage !== Page.FrontPage) {
            window.location.hash = "#";
            currentPage = Page.FrontPage;
        }

        let pitchNotation: Score.PitchNotation;
        let guitarNoteLabel: Score.GuitarNoteLabel;
        let handedness: Score.Handedness;
        let tuningName: string;
        let scale: Score.Scale;
        let instrument: Score.Audio.Instrument;

        try {
            pitchNotation = Score.validatePitchNotation(Cookies.read(AppCookies.PitchNotation, Score.DefaultPitchNotation));
        }
        catch (err) {
            pitchNotation = Score.DefaultPitchNotation;
        }

        try {
            guitarNoteLabel = Score.validateGuitarNoteLabel(Cookies.read(AppCookies.GuitarNoteLabel, Score.DefaultGuitarNoteLabel));
        }
        catch (err) {
            guitarNoteLabel = Score.DefaultGuitarNoteLabel;
        }

        try {
            handedness = Score.validateHandedness(Cookies.read(AppCookies.Handedness, Score.DefaultHandedness));
        }
        catch (err) {
            handedness = Score.DefaultHandedness;
        }

        try {
            tuningName = Score.validateTuningName(Cookies.read(AppCookies.TuningName, Score.DefaultTuningName));
        }
        catch (err) {
            tuningName = Score.DefaultTuningName;
        }

        try {
            let scaleType = Score.validateScaleType(Cookies.read(AppCookies.ScaleType, ""));
            let scaleKeyNote = Cookies.read(AppCookies.ScaleKeyNote, "");
            scale = Score.getScale(scaleKeyNote, scaleType);
        }
        catch (err) {
            scale = Score.getDefaultScale();
        }

        try {
            instrument = Score.Audio.validateInstrument(Cookies.readInt(AppCookies.Instrument, Score.Audio.Instrument.ClassicalGuitar));
        }
        catch (err) {
            instrument = Score.Audio.Instrument.ClassicalGuitar;
        }

        Score.Audio.setInstrument(instrument);

        let windowRect = new Score.DivRect();

        let guitarCtx = new Score.GuitarContext(tuningName, scale, handedness, pitchNotation, guitarNoteLabel);

        this.state = {
            windowRect,
            currentPage,
            instrument: instrument,
            guitarCtx
        }

        window.addEventListener("resize", () => this.updateWindowRect());

        // Handle navigation
        window.onhashchange = () => this.setState({ currentPage: getPageFromLocationHash() });
    }

    componentDidUpdate() {
        this.updateWindowRect();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    updateWindowRect() {
        let windowRect = new Score.DivRect(0, Utils.Dom.getWidth(window), 0, Utils.Dom.getHeight(window));
        if (this._isMounted && !windowRect.equalsFrame(this.state.windowRect)) {
            this.setState({ windowRect });
        }
    }

    setPitchNotation(pitchNotation: Score.PitchNotation) {
        let guitarCtx = this.state.guitarCtx.alterPitchNotation(pitchNotation);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.PitchNotation, pitchNotation);
        }
    }

    setGuitarNoteLabel(guitarNoteLabel: Score.GuitarNoteLabel) {
        let guitarCtx = this.state.guitarCtx.alterGuitarNoteLabel(guitarNoteLabel);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.GuitarNoteLabel, guitarNoteLabel);
        }
    }

    setHandedness(handedness: Score.Handedness) {
        let guitarCtx = this.state.guitarCtx.alterHandedness(handedness);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.Handedness, handedness);
        }
    }

    setTuning(tuningName: string) {
        let guitarCtx = this.state.guitarCtx.alterTuningName(tuningName);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.TuningName, tuningName);
        }
        GuitarApp.back();
    }

    setScale(scale: Score.Scale) {
        let guitarCtx = this.state.guitarCtx.alterScale(scale);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.ScaleType, scale.scaleType);
            Cookies.save(AppCookies.ScaleKeyNote, scale.keyNote);
        }
        GuitarApp.back();
    }

    setInstrument(instr: Score.Audio.Instrument) {
        if (instr !== this.state.instrument) {
            this.setState({ instrument: instr });
            Cookies.save(AppCookies.Instrument, instr);
            Score.Audio.setInstrument(instr);
        }
    }

    getInstrument() {
        return this.state.instrument;
    }

    getGuitarContext() {
        return this.state.guitarCtx;
    }

    static go(page: Page) {
        Score.MPlayer.stopAll();
        window.location.hash = page;
    }

    static back() {
        Score.MPlayer.stopAll();
        window.history.back();
    }

    render() {
        let { currentPage, windowRect } = this.state;

        switch (currentPage) {
            case Page.FrontPage:
            default:
                return <FrontPage app={this} currentPage={currentPage} />
            case Page.ChooseTuning:
                return <ChooseTuning app={this} onChangeTuning={tuning => this.setTuning(tuning)} />
            case Page.ChooseScale:
                return <ChooseScale app={this} onChangeScale={scale => this.setScale(scale)} />
            case Page.CircleOfFifths:
                return <ChooseScaleCircle app={this} onChangeScale={scale => this.setScale(scale)} />
            case Page.PlayNotes:
                return <PlayNotes app={this} windowRect={windowRect} />
            case Page.Intervals:
                return <Intervals app={this} />
            case Page.DiatonicChords:
                return <DiatonicChords app={this} />
            case Page.GuitarScales:
                return <GuitarScales app={this} windowRect={windowRect} />
            case Page.CAGEDScales:
                return <CAGEDScales app={this} windowRect={windowRect} />
            case Page.WhatChord:
                return <WhatChord app={this} windowRect={windowRect} />
        }
    }

    static start() {
        const rootElement = document.getElementById("root");
        if (!rootElement) {
            console.error("Missing <div id=\"root\"> in html document.");
            return;
        }

        const root = createRoot(rootElement);

        root.render(
            <React.StrictMode>
                <GuitarApp />
            </React.StrictMode>
        );
    }
}

