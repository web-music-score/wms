import * as React from "react";
import { MDocument, MRenderContext, ScoreEventListener } from "web-music-score/score";

export interface MusicScoreViewProps {
    doc: MDocument;
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

    private readonly ctx: MRenderContext;

    constructor(props: MusicScoreViewProps) {
        super(props);

        this.ctx = new MRenderContext();

        this.ctx.setDocument(props.doc);

        if (props.onScoreEvent) {
            this.ctx.setScoreEventListener(props.onScoreEvent);
        }
    }

    componentDidUpdate(prevProps: Readonly<MusicScoreViewProps>, prevState: Readonly<{}>): void {
        if (prevProps.doc !== this.props.doc) {
            this.ctx.setDocument(this.props.doc);
            this.ctx.draw();
        }
    }

    render() {
        const setCanvas = (canvas: HTMLCanvasElement | null) => {
            if (canvas) {
                this.ctx.setCanvas(canvas);
                this.ctx.draw();
            }
        }

        return (
            <canvas style={{ position: "relative" }} ref={setCanvas}>
                Your browser does not support the HTML canvas tag.
            </canvas>
        );
    }
}
