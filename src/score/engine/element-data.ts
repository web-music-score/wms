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
        default: return navigation;
    }
}

export enum KnownText {
    accel = "accel.",
    rit = "rit.",
    a_tempo = "a tempo",
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
    fff = "fff",
}

export function getKnownAnnotation(text: string): Annotation | undefined {
    switch (text) {
        case "accel.": return Annotation.Tempo;
        case "rit.": return Annotation.Tempo;
        case "a tempo": return Annotation.Tempo;
        case "cresc.": return Annotation.Dynamics;
        case "decresc.": return Annotation.Dynamics;
        case "dim.": return Annotation.Dynamics;
        case "ppp": return Annotation.Dynamics;
        case "pp": return Annotation.Dynamics;
        case "p": return Annotation.Dynamics;
        case "mp": return Annotation.Dynamics;
        case "m": return Annotation.Dynamics;
        case "mf": return Annotation.Dynamics;
        case "f": return Annotation.Dynamics;
        case "ff": return Annotation.Dynamics;
        case "fff": return Annotation.Dynamics;
        default: return undefined;
    }
}

export function isDynamicsText(text: string) {
    return ["ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff", "cresc.", "decresc.", "dim."].indexOf(text) >= 0;
}

export function isDynamicsLevelText(text: string) {
    return ["ppp", "pp", "p", "mp", "m", "mf", "f", "ff", "fff"].indexOf(text) >= 0;
}

export function isTempoText(text: string) {
    return ["accel.", "rit.", "a tempo"].indexOf(text) >= 0;
}
