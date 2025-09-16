import { Utils } from "@tspro/ts-utils-lib";
import { Navigation, Annotation } from "../pub";
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

export enum DynamicsAnnotations {
    cresc = "cresc.",
    decresc = "decresc.",
    dim = "dim.",
    ppp = "ppp",
    pp = "pp",
    p = "p",
    mp = "mp",
    m = "m",
    mf = "mf",
    f = "f",
    ff = "ff",
    fff = "fff"
}

export enum TempoAnnotations {
    accel = "accel.",
    rit = "rit.",
    a_tempo = "a tempo"
}

export type AnnotationsType = `${DynamicsAnnotations}` | `${TempoAnnotations}`;

export function isDynamicsText(text: string): text is `${DynamicsAnnotations}` {
    return Utils.Is.isEnumValue(text, DynamicsAnnotations);
}

export function isDynamicsLevelText(text: string): text is `${DynamicsAnnotations}` {
    return /^(p+|f+|m|mp|mf)$/.test(text);
}

export function isTempoText(text: string): text is `${TempoAnnotations}` {
    return Utils.Is.isEnumValue(text, TempoAnnotations);
}

export function getAnnotation(text: string): Annotation | undefined {
    if (Utils.Is.isEnumValue(text, DynamicsAnnotations)) {
        return Annotation.Dynamics;
    }
    else if (Utils.Is.isEnumValue(text, TempoAnnotations)) {
        return Annotation.Tempo;
    }
    else {
        return undefined;
    }
}
