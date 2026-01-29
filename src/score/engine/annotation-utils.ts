import { Guard, Utils } from "@tspro/ts-utils-lib";
import { Navigation, Annotation, DynamicsAnnotation, TempoAnnotation, ArticulationAnnotation, ExpressionAnnotation, TechniqueAnnotation, OrnamentAnnotation, MiscAnnotation, TemporalAnnotation, LabelAnnotation } from "../pub";
import { ObjSpecialText } from "./obj-special-text";

export function getNavigationString(navigation: Navigation): string {
    switch (navigation) {
        case Navigation.DC_al_Coda: return "D.C. al Coda";
        case Navigation.DC_al_Fine: return "D.C. al Fine";
        case Navigation.DS_al_Coda: return "D.S. al Coda";
        case Navigation.DS_al_Fine: return "D.S. al Fine";
        case Navigation.Fine: return "Fine";
        case Navigation.Segno: return ObjSpecialText.Segno;
        case Navigation.Coda: return ObjSpecialText.Coda;
        case Navigation.toCoda: return ObjSpecialText.toCoda;
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

export function getAnnotation(text: string): Annotation | undefined {
    if (Guard.isEnumValue(text, Navigation)) {
        return Annotation.Navigation;
    }
    else if (Guard.isEnumValue(text, DynamicsAnnotation)) {
        return Annotation.Dynamics;
    }
    else if (Guard.isEnumValue(text, TempoAnnotation)) {
        return Annotation.Tempo;
    }
    else if (Guard.isEnumValue(text, TemporalAnnotation)) {
        // Have this before ArticulationAnnotation (fermata is deprecated there).
        return Annotation.Temporal;
    }
    else if (Guard.isEnumValue(text, ArticulationAnnotation)) {
        return Annotation.Articulation;
    }
    else if (Guard.isEnumValue(text, ExpressionAnnotation)) {
        return Annotation.Expression;
    }
    else if (Guard.isEnumValue(text, TechniqueAnnotation)) {
        return Annotation.Technique;
    }
    else if (Guard.isEnumValue(text, OrnamentAnnotation)) {
        return Annotation.Ornament;
    }
    else if (Guard.isEnumValue(text, LabelAnnotation)) {
        return Annotation.Label;
    }
    else if (Guard.isEnumValue(text, MiscAnnotation)) {
        return Annotation.Misc;
    }
    else {
        return undefined;
    }
}
