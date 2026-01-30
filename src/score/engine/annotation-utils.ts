import { Guard, UniMap, Utils } from "@tspro/ts-utils-lib";
import { Annotation, NavigationAnnotation, DynamicsAnnotation, TempoAnnotation, ArticulationAnnotation, ExpressionAnnotation, TechniqueAnnotation, OrnamentAnnotation, MiscAnnotation, TemporalAnnotation, LabelAnnotation, ColorKey } from "../pub";
import { ObjSpecialText } from "./obj-special-text";
import { LayoutGroupId, VerticalPos } from "./layout-object";
import { ObjNotationLine, ObjTab } from "./obj-staff-and-tab";
import { isEnumValueLoose } from "./enum-utils";

export function getNavigationString(navigation: NavigationAnnotation): string {
    switch (navigation) {
        case NavigationAnnotation.DC_al_Coda: return "D.C. al Coda";
        case NavigationAnnotation.DC_al_Fine: return "D.C. al Fine";
        case NavigationAnnotation.DS_al_Coda: return "D.S. al Coda";
        case NavigationAnnotation.DS_al_Fine: return "D.S. al Fine";
        case NavigationAnnotation.Fine: return "Fine";
        case NavigationAnnotation.Segno: return ObjSpecialText.Segno;
        case NavigationAnnotation.Coda: return ObjSpecialText.Coda;
        case NavigationAnnotation.toCoda: return ObjSpecialText.toCoda;
        default:
            return navigation[0].toUpperCase() + navigation.substring(1);
    }
}

export function getAnnotationTextReplacement(text: string): string {
    switch (text) {
        case ArticulationAnnotation.tenuto: return "—";     // TODO: Maybe should draw better symbol instead.
        case ArticulationAnnotation.accent: return ">";     // TODO: Maybe should draw better symbol instead.
        case ArticulationAnnotation.marcato: return "^";    // TODO: Maybe should draw better symbol instead.
    }
    return text;
}

export function getAnnotationLayoutGroupId(annotation: Annotation, annotationText: string): LayoutGroupId {
    switch (annotation) {
        case Annotation.Dynamics:
            return LayoutGroupId.Annotation_Dynamics;
        case Annotation.Tempo:
            return LayoutGroupId.Annotation_Tempo;
        case Annotation.Navigation:
            if (annotationText === NavigationAnnotation.Ending)
                return LayoutGroupId.Annotation_Ending;
            return LayoutGroupId.Annotation_Navigation;
        case Annotation.Label:
            if (annotationText === LabelAnnotation.ChordLabel)
                return LayoutGroupId.Annotation_ChordLabel;
            if (annotationText === LabelAnnotation.PitchLabel)
                return LayoutGroupId.Annotation_PitchLabel;
            break;
        case Annotation.Temporal:
            if (annotationText === TemporalAnnotation.fermata || annotationText === TemporalAnnotation.measureEndFermata)
                return LayoutGroupId.Annotation_Fermata;
            break;
    }

    return LayoutGroupId.Annotation_Misc
}

export function getAnnotationDefaultVerticalPos(annotation: Annotation, annotationText: string): VerticalPos {
    if (annotationText === LabelAnnotation.PitchLabel)
        return VerticalPos.Below;

    return VerticalPos.Above;
}

function fromStaffColor(line: ObjNotationLine, staffColor: ColorKey): string {
    return line instanceof ObjTab ? ("tab" + staffColor.substring("staff".length)) : staffColor;
}

export function getAnnotationColor(line: ObjNotationLine, annotation: Annotation, annotationText: string): string {
    if (annotation === Annotation.Navigation)
        return fromStaffColor(line, "staff.element.navigation");

    if (annotation === Annotation.Label)
        return fromStaffColor(line, "staff.element.label");

    if (annotationText === TemporalAnnotation.fermata || annotationText === TemporalAnnotation.measureEndFermata)
        return fromStaffColor(line, "staff.element.fermata");

    return fromStaffColor(line, "staff.element.annotation");
}

export function isDynamicsText(text: string): text is `${DynamicsAnnotation}` {
    return Guard.isEnumValue(text, DynamicsAnnotation);
}

export function getDynamicsVolume(text: string): number | undefined {
    if (/^(p+|f+|m|mp|mf)$/.test(text)) {
        let volume = 0.5 - Utils.Str.charCount(text, "p") * 0.1 + Utils.Str.charCount(text, "f") * 0.1;
        return Utils.Math.clamp(volume, 0, 1);
    }
    else {
        return undefined;
    }
}

export function isTempoText(text: string): text is `${TempoAnnotation}` {
    return Guard.isEnumValue(text, TempoAnnotation);
}

function resolveAnnotationFromText(annotationText: string): Annotation | undefined {
    if (isEnumValueLoose(annotationText, NavigationAnnotation)) {
        return Annotation.Navigation;
    }
    else if (isEnumValueLoose(annotationText, DynamicsAnnotation)) {
        return Annotation.Dynamics;
    }
    else if (isEnumValueLoose(annotationText, TempoAnnotation)) {
        return Annotation.Tempo;
    }
    else if (isEnumValueLoose(annotationText, TemporalAnnotation)) {
        // Have this before ArticulationAnnotation (fermata is deprecated there).
        return Annotation.Temporal;
    }
    else if (isEnumValueLoose(annotationText, ArticulationAnnotation)) {
        return Annotation.Articulation;
    }
    else if (isEnumValueLoose(annotationText, ExpressionAnnotation)) {
        return Annotation.Expression;
    }
    else if (isEnumValueLoose(annotationText, TechniqueAnnotation)) {
        return Annotation.Technique;
    }
    else if (isEnumValueLoose(annotationText, OrnamentAnnotation)) {
        return Annotation.Ornament;
    }
    else if (isEnumValueLoose(annotationText, LabelAnnotation)) {
        return Annotation.Label;
    }
    else if (isEnumValueLoose(annotationText, MiscAnnotation)) {
        return Annotation.Misc;
    }
    else {
        return undefined;
    }
}

// Cache annotations.
const annotationMap = new UniMap<string, Annotation | undefined>();

export function resolveAnnotation(text: string): Annotation | undefined {
    return annotationMap.getOrCreate(text, () => resolveAnnotationFromText(text));
}
