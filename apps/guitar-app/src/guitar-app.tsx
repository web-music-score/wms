import * as React from "react";
import { createRoot } from "react-dom/client";
import { CAGEDScales, ChooseScale, ChooseScaleCircle, ChooseTuning, DiatonicChords, FrontPage, GuitarScales, Intervals, PlayNotes, WhatChord } from "./pages";
import { Cookies, Rect, Utils } from "@tspro/ts-utils-lib";
import * as Audio from "web-music-score/audio";
import { ClassicalGuitar } from "web-music-score/audio-cg";
import * as Theory from "web-music-score/theory";
import * as Score from "web-music-score/score";
import * as ScoreUI from "web-music-score/react-ui";

const AppCookies = {
    PitchNotation: "pitchNotation",
    GuitarNoteLabel: "guitarNoteLabel",
    Handedness: "handedness",
    TuningName: "tuningName",
    ScaleType: "scaleType",
    ScaleTonic: "scaleTonic",
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
    windowRect: Rect;
    currentPage: string;
    instrument: string;
    guitarCtx: ScoreUI.GuitarContext;
}

export class GuitarApp extends React.Component<{}, GuitarAppState> {

    state: GuitarAppState;

    private _isMounted = false;

    constructor(props: {}) {
        super(props);

        Audio.addInstrument(ClassicalGuitar);

        Cookies.setExpireDays(30);

        let currentPage = getPageFromLocationHash();
        if (currentPage !== Page.FrontPage) {
            window.location.hash = "#";
            currentPage = Page.FrontPage;
        }

        let pitchNotation: Theory.PitchNotation;
        let guitarNoteLabel: Theory.GuitarNoteLabel;
        let handedness: Theory.Handedness;
        let tuningName: string;
        let scale: Theory.Scale;
        let instrument: string;

        try {
            pitchNotation = Theory.validatePitchNotation(Cookies.readInt(AppCookies.PitchNotation, Theory.DefaultPitchNotation));
        }
        catch (err) {
            pitchNotation = Theory.DefaultPitchNotation;
        }

        try {
            guitarNoteLabel = Theory.validateGuitarNoteLabel(Cookies.read(AppCookies.GuitarNoteLabel, Theory.DefaultGuitarNoteLabel));
        }
        catch (err) {
            guitarNoteLabel = Theory.DefaultGuitarNoteLabel;
        }

        try {
            handedness = Theory.validateHandedness(Cookies.readInt(AppCookies.Handedness, Theory.DefaultHandedness));
        }
        catch (err) {
            handedness = Theory.DefaultHandedness;
        }

        try {
            tuningName = Theory.validateTuningName(Cookies.read(AppCookies.TuningName, Theory.DefaultTuningName));
        }
        catch (err) {
            tuningName = Theory.DefaultTuningName;
        }

        try {
            let scaleTonic = Cookies.read(AppCookies.ScaleTonic, "");
            let scaleType = Theory.validateScaleType(Cookies.read(AppCookies.ScaleType, ""));
            scale = Theory.getScale(scaleTonic, scaleType);
        }
        catch (err) {
            scale = Theory.getDefaultScale();
        }

        try {
            instrument = Cookies.read(AppCookies.Instrument, Audio.getCurrentInstrument());
        }
        catch (err) {
            instrument = Audio.getCurrentInstrument();
        }

        Audio.useInstrument(instrument);

        let windowRect = new Rect();

        let guitarCtx = new ScoreUI.GuitarContext(tuningName, scale, handedness, pitchNotation, guitarNoteLabel);

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
        let windowRect = new Rect(0, 0, Utils.Dom.getWidth(window), Utils.Dom.getHeight(window));
        if (this._isMounted && !windowRect.equals(this.state.windowRect)) {
            this.setState({ windowRect });
        }
    }

    setPitchNotation(pitchNotation: Theory.PitchNotation) {
        let guitarCtx = this.state.guitarCtx.alterPitchNotation(pitchNotation);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.PitchNotation, pitchNotation);
        }
    }

    setGuitarNoteLabel(guitarNoteLabel: Theory.GuitarNoteLabel) {
        let guitarCtx = this.state.guitarCtx.alterGuitarNoteLabel(guitarNoteLabel);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.GuitarNoteLabel, guitarNoteLabel);
        }
    }

    setHandedness(handedness: Theory.Handedness) {
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

    setScale(scale: Theory.Scale) {
        let guitarCtx = this.state.guitarCtx.alterScale(scale);
        if (guitarCtx !== this.state.guitarCtx) {
            this.setState({ guitarCtx });
            Cookies.save(AppCookies.ScaleType, scale.scaleType);
            Cookies.save(AppCookies.ScaleTonic, scale.tonic);
        }
        GuitarApp.back();
    }

    useInstrument(instrument: string) {
        if (instrument !== this.state.instrument) {
            this.setState({ instrument });
            Cookies.save(AppCookies.Instrument, instrument);
            Audio.useInstrument(instrument);
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

