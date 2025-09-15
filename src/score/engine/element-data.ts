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

export enum DynamicsAnnotationText {
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

export enum TempoAnnotationText {
    accel = "accel.",
    rit = "rit.",
    a_tempo = "a tempo"
}

export function getKnownAnnotation(text: string): Annotation | undefined {
    if (Utils.Is.isEnumValue(text, DynamicsAnnotationText)) {
        return Annotation.Dynamics;
    }
    else if (Utils.Is.isEnumValue(text, TempoAnnotationText)) {
        return Annotation.Tempo;
    }
    else {
        return undefined;
    }
}

export function isDynamicsText(text: string): boolean {
    return ["ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff", "cresc.", "decresc.", "dim."].indexOf(text) >= 0;
}

export function isDynamicsLevelText(text: string): boolean {
    return ["ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff"].indexOf(text) >= 0;
}

export function isTempoText(text: string): boolean {
    return ["accel.", "rit.", "a tempo"].indexOf(text) >= 0;
}
