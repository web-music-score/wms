import { DrawSymbol, View } from "./view";
import { MusicObject } from "./music-object";
import { ObjText } from "./obj-text";
import { AnnotationGroup, AnnotationKind, MAnnotation } from "../pub";
import { Rect } from "@tspro/ts-utils-lib";
import { ObjSpecialText } from "./obj-special-text";
import { ObjSymbol } from "./obj-symbol";
import { getAnnotationKindTextReplacement, getNavigationString } from "./annotation-utils";
import { SpanProps } from "./span-props";

export class ObjAnnotation extends MusicObject {
    public static toCoda = "𝄌 toCoda";
    public static Coda = "Coda 𝄌";
    public static Segno = "𝄋";

    private component: ObjText | ObjSpecialText | ObjSymbol;

    private spanProps?: SpanProps;

    readonly mi: MAnnotation;

    constructor(parent: MusicObject, readonly kind: string, readonly group: AnnotationGroup, readonly anchorX: number, readonly anchorY: number, readonly flipX: boolean, readonly flipY: boolean, readonly color = "black") {
        super(parent);

        if (group === AnnotationGroup.Navigation) {
            const text = getNavigationString(kind);
            switch (kind) {
                case AnnotationKind.Coda:
                case AnnotationKind.toCoda:
                case AnnotationKind.Segno:
                    this.component = new ObjSpecialText(this, text, color);
                    break;
                default:
                    this.component = new ObjText(this, { text, color }, 0.5, 1);
                    break;
            }

        }
        else if (group === AnnotationGroup.Temporal) {
            switch (kind) {
                case AnnotationKind.fermata:
                    this.component = new ObjSymbol(this, DrawSymbol.Fermata, false, flipY, color);
                    break;
                default:
                    this.component = new ObjText(this, { text: kind, color }, 0.5, 1);
                    break;
            }

        }
        else {
            const text = getAnnotationKindTextReplacement(kind, group);
            this.component = new ObjText(this, { text, color }, 0.5, 1);
        }

        this.mi = new MAnnotation(this);
    }

    getMusicInterface(): MAnnotation {
        return this.mi;
    }

    setSpanProps(spanProps: SpanProps) {
        this.spanProps = spanProps;
    }

    getSpanProps(): SpanProps |undefined {
        return this.spanProps;
    }

    hasSpan(): boolean {
        return !!this.spanProps;
    }

    pick(x: number, y: number): MusicObject[] {
        return this.rect.contains(x, y) ? [this] : [];
    }

    layout(view: View) {
        this.component.layout(view);

        this.rect = this.component.getRect().clone();

        this.rect.anchorX = this.rect.left + this.rect.width * this.anchorX;
        this.rect.anchorY = this.rect.top + this.rect.height * this.anchorY;
    }

    offset(dx: number, dy: number) {
        this.component.offset(dx, dy);
        this.rect.offsetInPlace(dx, dy);
    }

    draw(view: View, clipRect?: Rect) {
        if (!this.intersects(clipRect))
            return;

        view.drawDebugRect(this.rect);

        this.component.draw(view, clipRect);
    }
}
