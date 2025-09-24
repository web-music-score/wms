import { Utils } from "@tspro/ts-utils-lib";
import { Navigation, Annotation, DynamicsAnnotation, TempoAnnotation } from "../pub";
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

export function isDynamicsText(text: string): text is `${DynamicsAnnotation}` {
    return Utils.Is.isEnumValue(text, DynamicsAnnotation);
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
    return Utils.Is.isEnumValue(text, TempoAnnotation);
}

export function getAnnotation(text: string): Annotation | undefined {
    if (Utils.Is.isEnumValue(text, DynamicsAnnotation)) {
        return Annotation.Dynamics;
    }
    else if (Utils.Is.isEnumValue(text, TempoAnnotation)) {
        return Annotation.Tempo;
    }
    else {
        return undefined;
    }
}
