import * as React from "react";
import { warnDeprecated } from "shared-src";
import { WmsView as JsView, MDocument, Paint, ScoreEventListener } from "web-music-score/score";

export interface WmsViewProps {
    doc?: MDocument;
    paint?: Paint;
    zoom?: number | string;
    staffSize?: number | string;
    onScoreEvent?: ScoreEventListener;
}

/**
 * Music score view react component.
 * ```ts
 *   // Using with React TSX/JSX
 *   import * as Score from "web-music-score/score";
 *   import * as ScoreUI from "web-music-score/react-ui";
 *  
 *   // Render function of react component.
 *   render() {
 *       // Create document.
 *       const doc = new Score.DocumentBuilder()
 *           // Build document...
 *           .getDocument();
 * 
 *       return <>
 *          <ScoreUI.WmsView doc={doc} />
 *       </>;
 *   }
 * ```
 */
export class WmsView extends React.Component<WmsViewProps, {}> {

    private readonly view: JsView;

    constructor(props: WmsViewProps) {
        super(props);

        this.view = new JsView();

        if (props.paint !== undefined)
            this.view.setPaint(props.paint);

        if (props.zoom !== undefined)
            this.view.setZoom(+props.zoom);

        if (props.staffSize !== undefined)
            this.view.setStaffSize(props.staffSize);

        this.view.setDocument(props.doc);

        if (props.onScoreEvent) {
            this.view.setScoreEventListener(props.onScoreEvent);
        }
    }

    componentDidUpdate(prevProps: Readonly<WmsViewProps>, prevState: Readonly<{}>): void {
        if (prevProps.doc !== this.props.doc) {
            this.view.setDocument(this.props.doc);
            this.view.draw();
        }
        if (this.props.zoom !== undefined && prevProps.zoom !== this.props.zoom) {
            this.view.setZoom(+this.props.zoom);
            this.view.draw();
        }
        if (this.props.staffSize !== undefined && prevProps.staffSize !== this.props.staffSize) {
            this.view.setStaffSize(this.props.staffSize);
            this.view.draw();
        }
    }

    render() {
        const setCanvas = (canvas: HTMLCanvasElement | null) => {
            if (canvas) {
                this.view.setCanvas(canvas);
                this.view.draw();
            }
        }

        return (
            <canvas style={{ position: "relative" }} ref={setCanvas}>
                Your browser does not support the HTML canvas tag.
            </canvas>
        );
    }
}

/**
 * Deprecated stuff.
 * Will be removed on major update 7.0.0.
 * 
 * Renamed classes:
 *  - MusicScoreView => WmsView
 */

/**
 * @deprecated
 * @internal
 */
export interface MusicScoreViewProps extends WmsViewProps { }

/**
 * @deprecated - MusicScoreView is deprecated.  Will be romoved in 7.0.0. Use WmsView instead.
 * @internal
 */
export class MusicScoreView extends WmsView {
    constructor(props: MusicScoreViewProps) {
        super(props);
        warnDeprecated("MusicScoreView is deprecated.  Will be romoved in 7.0.0. Use WmsView instead.");
    }
}
