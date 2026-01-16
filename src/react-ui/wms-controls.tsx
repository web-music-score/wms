import * as React from "react";
import { MDocument, WmsControls as JsControls, Player } from "web-music-score/score";

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

export interface WmsControlsProps {
    doc?: MDocument;
    player?: Player;
    singlePlay?: boolean;
    singlePlayStop?: boolean;
    playStop?: boolean;
    playPauseStop?: boolean;
    playLabel?: string;
    pauseLabel?: string;
    stopLabel?: string;
}

export interface WmsControlsState {
    controls: JsControls;
}

/**
 * Usage:
 * ```ts
 *   // Using with React TSX/JSX
 *   import * as Score from "web-music-score/score";
 *   import * as ReactUI from "web-music-score/react-ui";
 * 
 *   // Create document.
 *   const doc = new Score.DocumentBuilder()
 *       // Build document...
 *       .getDocument();
 * 
 *   // Create default playback buttons (play, pause and stop buttons).
 *   <ReactUI.WmsControls doc={doc} />
 *
 *   // Create playback buttons with single play button.
 *   <ReactUI.WmsControls doc={doc} play />

*   // Create playback buttons with single play/stop button.
 *   <ReactUI.WmsControls doc={doc} singlePlayStop />
 * 
 *   // Create playback buttons with play and stop buttons.
 *   <ReactUI.WmsControls doc={doc} playStop />
 * 
 *   // Create playback buttons with play, pause and stop buttons.
 *   <ReactUI.WmsControls doc={doc} playPauseStop />
 * 
 *   // You can also set custom play, pause and stop button labels.
 *   <ReactUI.WmsControls doc={doc} playLabel="⏵" pauseLabel="⏸" stopLabel="⏹" />
 * ```
 */
export class WmsControls extends React.Component<WmsControlsProps, WmsControlsState> {

    state: WmsControlsState;

    private buttonClass: string;
    private buttonGroupClass: string;

    constructor(props: WmsControlsProps) {
        super(props);

        const controls = new JsControls();

        if (props.player) controls.setPlayer(props.player);
        else if (props.doc) controls.setDocument(props.doc);

        this.state = { controls }

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

    componentDidUpdate(prevProps: Readonly<WmsControlsProps>): void {
        if (this.props.doc !== prevProps.doc) {
            this.state.controls.setDocument(this.props.doc);
        }
    }

    render() {
        let { singlePlay, singlePlayStop, playStop, playLabel, pauseLabel, stopLabel } = this.props;
        let { controls: controller } = this.state;
        const { buttonClass, buttonGroupClass } = this;

        playLabel ??= "Play";
        pauseLabel ??= "Pause";
        stopLabel ??= "Stop";

        if (singlePlay) {
            return (
                <div className={buttonGroupClass}>
                    <button className={buttonClass} ref={btn => { if (btn) controller.setPlayButton(btn, playLabel); }} />
                </div>
            );
        }
        else if (singlePlayStop) {
            return (
                <div className={buttonGroupClass}>
                    <button className={buttonClass} ref={btn => { if (btn) controller.setPlayStopButton(btn, playLabel, stopLabel); }} />
                </div>
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
