import * as React from "react";
import { MDocument, MRenderContext, Paint, ScoreEventListener } from "web-music-score/score";

export interface MusicScoreViewProps {
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
 *          <ScoreUI.MusicScoreView doc={doc} />
 *       </>;
 *   }
 * ```
 */
export class MusicScoreView extends React.Component<MusicScoreViewProps, {}> {

    private readonly rc: MRenderContext;

    constructor(props: MusicScoreViewProps) {
        super(props);

        this.rc = new MRenderContext();

        if (props.paint !== undefined)
            this.rc.setPaint(props.paint);

        if (props.zoom !== undefined)
            this.rc.setZoom(+props.zoom);

        if (props.staffSize !== undefined)
            this.rc.setStaffSize(props.staffSize);

        this.rc.setDocument(props.doc);

        if (props.onScoreEvent) {
            this.rc.setScoreEventListener(props.onScoreEvent);
        }
    }

    componentDidUpdate(prevProps: Readonly<MusicScoreViewProps>, prevState: Readonly<{}>): void {
        if (prevProps.doc !== this.props.doc) {
            this.rc.setDocument(this.props.doc);
            this.rc.draw();
        }
        if (this.props.zoom !== undefined && prevProps.zoom !== this.props.zoom) {
            this.rc.setZoom(+this.props.zoom);
            this.rc.draw();
        }
        if (this.props.staffSize !== undefined && prevProps.staffSize !== this.props.staffSize) {
            this.rc.setStaffSize(this.props.staffSize);
            this.rc.draw();
        }
    }

    render() {
        const setCanvas = (canvas: HTMLCanvasElement | null) => {
            if (canvas) {
                this.rc.setCanvas(canvas);
                this.rc.draw();
            }
        }

        return (
            <canvas style={{ position: "relative" }} ref={setCanvas}>
                Your browser does not support the HTML canvas tag.
            </canvas>
        );
    }
}
