import * as React from "react";
import { MDocument, MPlaybackButtons } from "web-music-score/score";

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

    private buttonClass: string;
    private buttonGroupClass: string;

    constructor(props: PlaybackButtonsProps) {
        super(props);

        this.state = {
            controller: new MPlaybackButtons().setDocument(props.doc)
        }

        switch (detectStyleSystem()) {
            case "bootstrap":
                this.buttonClass = "btn btn-primary";
                this.buttonGroupClass = "btn-group";
                break;
            case "infima":
                this.buttonClass = "button button--primary";
                this.buttonGroupClass = "ifm-button-group";
                break;
            default:
                this.buttonClass = "wms-button";
                this.buttonGroupClass = "wms-button-group";
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
        const { buttonClass, buttonGroupClass } = this;

        playLabel ??= "Play";
        pauseLabel ??= "Pause";
        stopLabel ??= "Stop";

        if (singlePlayStop) {
            return (
                <button className={buttonClass} ref={btn => { if (btn) controller.setPlayStopButton(btn, playLabel, stopLabel); }} />
            );
        }
        else if (playStop) {
            return (
                <div className={buttonGroupClass}>
                    <button className={buttonClass} ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                    <button className={buttonClass} ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                </div>
            );
        }
        else { // if(playPauseStop) {
            // Default is playPauseStop
            return (
                <div className={buttonGroupClass}>
                    <button className={buttonClass} ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                    <button className={buttonClass} ref={btn => { if (btn) controller.setPauseButton(btn, pauseLabel); }} />
                    <button className={buttonClass} ref={btn => { if (btn) controller.setStopButton(btn, stopLabel); }} />
                </div>
            );
        }
    }
}
