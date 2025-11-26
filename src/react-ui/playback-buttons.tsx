import * as React from "react";
import { MDocument, MPlaybackButtons } from "web-music-score/score";

// TODO: Add to ts-utils-lib?
function injectCss(styleId: string, styleCss: string) {
    if (styleId === "" || styleCss === "") return; // Nothing to inject
    if (typeof document === "undefined") return;   // SSR safe
    if (document.getElementById(styleId)) return;  // Already injected
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = styleCss;
    document.head.appendChild(style);
}

const btnGroupUnknownCss = `
.wms-btn-group {
    display: inline-flex;
    align-items: stretch;
}
.wms-btn-group>button,
.wms-btn-group>.button {
    border-radius: 0;
    margin: 0;
}
.wms-btn-group>button:first-child,
.wms-btn-group>.button:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}
.wms-btn-group>button:last-child,
.wms-btn-group>.button:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
}
`;

const btnGroupInfimaCss = `
.wms-btn-group {
    display: inline-flex;
    align-items: stretch;
}
.wms-btn-group>.button {
    border-radius: 0;
    margin: 0;
}
.wms-btn-group>.button:first-child {
    border-top-left-radius: var(--ifm-button-border-radius);
    border-bottom-left-radius: var(--ifm-button-border-radius);
}
.wms-btn-group>.button:last-child {
    border-top-right-radius: var(--ifm-button-border-radius);
    border-bottom-right-radius: var(--ifm-button-border-radius);
}
`;

function detectStyleSystem(): "bootstrap" | "infima" | "unknown" {
    // SSR safe
    if (typeof window === "undefined") return "unknown";

    // --- Detect Bootstrap ---
    const test = document.createElement("button");
    test.className = "btn btn-primary";
    document.body.appendChild(test);

    const style = getComputedStyle(test);
    const padding = style.padding; // "6px 12px" in Bootstrap default

    document.body.removeChild(test);

    const isBootstrap = padding.includes("6px") && padding.includes("12px");
    if (isBootstrap) return "bootstrap";

    // --- Detect Infima (Docusaurus) ---
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue("--ifm-color-primary").trim();

    if (primary !== "") return "infima";

    return "unknown";
}

let styleSystem: "bootstrap" | "infima" | "unknown" | undefined;

function getStyleSystem(): "bootstrap" | "infima" | "unknown" {
    if (!styleSystem)
        styleSystem = detectStyleSystem();

    return styleSystem;
}


export interface PlaybackButtonsProps {
    doc: MDocument;
    singlePlayStop?: boolean;
    playStop?: boolean;
    playPauseStop?: boolean;
    playLabel?: string;
    pauseLabel?: string;
    stopLabel?: string;
}

export interface PlaybackButtonsState {
    controller: MPlaybackButtons;
}

/**
 * Usage:
 * ```ts
 *   // Using with React TSX/JSX
 *   import * as Score from "web-music-score/score";
 *   import * as ScoreUI from "web-music-score/react-ui";
 * 
 *   // Create document.
 *   const doc = new Score.DocumentBuilder()
 *       // Build document...
 *       .getDocument();
 * 
 *   // Create default playback buttons (play, pause and stop buttons).
 *   <ScoreUI.PlaybackButtons doc={doc} />
 *
 *   // Create playback buttons with single play/stop button.
 *   <ScoreUI.PlaybackButtons doc={doc} singlePlayStop />
 * 
 *   // Create playback buttons with play and stop buttons.
 *   <ScoreUI.PlaybackButtons doc={doc} playStop />
 * 
 *   // Create playback buttons with play, pause and stop buttons.
 *   <ScoreUI.PlaybackButtons doc={doc} playPauseStop />
 * 
 *   // You can also set custom play, pause and stop button labels.
 *   <ScoreUI.PlaybackButtons doc={doc} playLabel="⏵" pauseLabel="⏸" stopLabel="⏹" />
 * ```
 */
export class PlaybackButtons extends React.Component<PlaybackButtonsProps, PlaybackButtonsState> {

    state: PlaybackButtonsState;

    constructor(props: PlaybackButtonsProps) {
        super(props);

        this.state = {
            controller: new MPlaybackButtons().setDocument(props.doc)
        }
    }

    componentDidUpdate(prevProps: Readonly<PlaybackButtonsProps>): void {
        if (this.props.doc !== prevProps.doc) {
            this.state.controller.setDocument(this.props.doc);
        }
    }

    render() {
        let { singlePlayStop, playStop, playLabel, pauseLabel, stopLabel } = this.props;
        let { controller } = this.state;

        playLabel ??= "Play";
        pauseLabel ??= "Pause";
        stopLabel ??= "Stop";

        const ss = getStyleSystem();

        switch (ss) {
            case "infima":
                injectCss("wms-btn-group-style", btnGroupInfimaCss);
                break;
            case "unknown":
                injectCss("wms-btn-group-style", btnGroupUnknownCss);
                break;
        }

        const btnPrimaryClass = ss === "bootstrap" ? "btn btn-primary" : ss === "infima" ? "button button--primary" : "button";
        const btnGroupClass = ss === "bootstrap" ? "btn-group" : "wms-btn-group";

        if (singlePlayStop) {
            return (
                <button className={btnPrimaryClass} ref={btn => { if (btn) controller.setPlayStopButton(btn, playLabel, stopLabel); }} />
            );
        }
        else if (playStop) {
            return (
                <div className={btnGroupClass}>
                    <button className={btnPrimaryClass} ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                    <button className={btnPrimaryClass} ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                </div>
            );
        }
        else { // if(playPauseStop) {
            // Default is playPauseStop
            return (
                <div className={btnGroupClass}>
                    <button className={btnPrimaryClass} ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                    <button className={btnPrimaryClass} ref={btn => { if (btn) controller.setPauseButton(btn, pauseLabel); }} />
                    <button className={btnPrimaryClass} ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                </div>
            );
        }
    }
}
