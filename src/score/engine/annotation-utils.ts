import { UniMap, Utils } from "@tspro/ts-utils-lib";
import { AnnotationGroup, Navigation, ColorKey, AnnotationKind } from "../pub";
import { ObjSpecialText } from "./obj-special-text";
import { LayoutGroupId, VerticalPos } from "./layout-object";
import { ObjNotationLine, ObjTab } from "./obj-staff-and-tab";
import { DrawSymbol } from "./view";

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

export function getAnnotationKindTextReplacement(text: string): string {
    switch (text) {
        case AnnotationKind.trill: return "tr";
    }
    return text;
}

export function getAnnotationLayoutGroupId(annotationGroup: AnnotationGroup, annotationKind: string): LayoutGroupId {
    switch (annotationGroup) {
        case AnnotationGroup.Dynamics:
            return LayoutGroupId.Annotation_Dynamic;
        case AnnotationGroup.Tempo:
            return LayoutGroupId.Annotation_Tempo;
        case AnnotationGroup.Navigation:
            if (annotationKind === Navigation.Ending)
                return LayoutGroupId.Annotation_Ending;
            return LayoutGroupId.Annotation_Navigation;
        case AnnotationGroup.Label:
            if (annotationKind === AnnotationKind.ChordLabel)
                return LayoutGroupId.Annotation_ChordLabel;
            if (annotationKind === AnnotationKind.PitchLabel)
                return LayoutGroupId.Annotation_PitchLabel;
            break;
        case AnnotationGroup.Temporal:
            if (annotationKind === AnnotationKind.fermata || annotationKind === AnnotationKind.measureEndFermata)
                return LayoutGroupId.Annotation_Fermata;
            break;
    }

    return LayoutGroupId.Annotation_Misc
}

export function getAnnotationDefaultVerticalPos(annotationGroup: AnnotationGroup, annotationKind: string): VerticalPos {
    if (annotationKind === AnnotationKind.PitchLabel)
        return VerticalPos.Below;

    return VerticalPos.Above;
}

export function getAnnotationColorKey(line: ObjNotationLine, annotationGroup: AnnotationGroup, annotationKind: string): ColorKey {
    const fromStaffColor = (staffColor: ColorKey): ColorKey => line instanceof ObjTab ? ("tab" + staffColor.substring("staff".length)) as ColorKey : staffColor;

    switch (annotationGroup) {
        case AnnotationGroup.Navigation:
            return fromStaffColor("staff.annotation.navigation");
        case AnnotationGroup.Dynamics:
            return fromStaffColor("staff.annotation.dynamics");
        case AnnotationGroup.Tempo:
            return fromStaffColor("staff.annotation.tempo");
        case AnnotationGroup.Articulation:
            return fromStaffColor("staff.annotation.articulation");
        case AnnotationGroup.Expression:
            return fromStaffColor("staff.annotation.expression");
        case AnnotationGroup.Technique:
            return fromStaffColor("staff.annotation.technique");
        case AnnotationGroup.Temporal:
            return fromStaffColor("staff.annotation.temporal");
        case AnnotationGroup.Label:
            return fromStaffColor("staff.annotation.label");
        case AnnotationGroup.Ornament:
            return fromStaffColor("staff.annotation.ornament");
        case AnnotationGroup.Misc:
        default:
            return fromStaffColor("staff.annotation.misc");
    }
}

export function isDynamicsText(annotationKind: string): boolean {
    return resolveAnnotationGroup(annotationKind as AnnotationKind) === AnnotationGroup.Dynamics;
}

export function getDynamicsVolume(annotationKind: string): number | undefined {
    if (/^(p+|f+|m|mp|mf)$/.test(annotationKind)) {
        let volume = 0.5 - Utils.Str.charCount(annotationKind, "p") * 0.1 + Utils.Str.charCount(annotationKind, "f") * 0.1;
        return Utils.Math.clamp(volume, 0, 1);
    }
    else {
        return undefined;
    }
}

export function isTempoText(annotationKind: string): boolean {
    return resolveAnnotationGroup(annotationKind as AnnotationKind) === AnnotationGroup.Tempo;
}

// Cache annotations.
const AnnotationKindToGroupMap = new UniMap<AnnotationKind, AnnotationGroup>([
    // Navigation annotations
    [AnnotationKind.DC_al_Fine, AnnotationGroup.Navigation],
    [AnnotationKind.DC_al_Coda, AnnotationGroup.Navigation],
    [AnnotationKind.DS_al_Fine, AnnotationGroup.Navigation],
    [AnnotationKind.DS_al_Coda, AnnotationGroup.Navigation],
    [AnnotationKind.Coda, AnnotationGroup.Navigation],
    [AnnotationKind.toCoda, AnnotationGroup.Navigation],
    [AnnotationKind.Segno, AnnotationGroup.Navigation],
    [AnnotationKind.Fine, AnnotationGroup.Navigation],
    [AnnotationKind.StartRepeat, AnnotationGroup.Navigation],
    [AnnotationKind.EndRepeat, AnnotationGroup.Navigation],
    [AnnotationKind.Ending, AnnotationGroup.Navigation],

    // Dynamic annotations
    [AnnotationKind.ppp, AnnotationGroup.Dynamics],
    [AnnotationKind.pp, AnnotationGroup.Dynamics],
    [AnnotationKind.p, AnnotationGroup.Dynamics],
    [AnnotationKind.mp, AnnotationGroup.Dynamics],
    [AnnotationKind.m, AnnotationGroup.Dynamics],
    [AnnotationKind.mf, AnnotationGroup.Dynamics],
    [AnnotationKind.f, AnnotationGroup.Dynamics],
    [AnnotationKind.ff, AnnotationGroup.Dynamics],
    [AnnotationKind.fff, AnnotationGroup.Dynamics],
    [AnnotationKind.cresc, AnnotationGroup.Dynamics],
    [AnnotationKind.decresc, AnnotationGroup.Dynamics],
    [AnnotationKind.dim, AnnotationGroup.Dynamics],
    [AnnotationKind.fp, AnnotationGroup.Dynamics],
    [AnnotationKind.sf, AnnotationGroup.Dynamics],
    [AnnotationKind.sfz, AnnotationGroup.Dynamics],
    [AnnotationKind.sforzando, AnnotationGroup.Dynamics],

    // Tempo annotations
    [AnnotationKind.accel, AnnotationGroup.Tempo],
    [AnnotationKind.rit, AnnotationGroup.Tempo],
    [AnnotationKind.rall, AnnotationGroup.Tempo],
    [AnnotationKind.a_tempo, AnnotationGroup.Tempo],
    [AnnotationKind.rubato, AnnotationGroup.Tempo],
    [AnnotationKind.Largo, AnnotationGroup.Tempo],
    [AnnotationKind.Adagio, AnnotationGroup.Tempo],
    [AnnotationKind.Andante, AnnotationGroup.Tempo],
    [AnnotationKind.Moderato, AnnotationGroup.Tempo],
    [AnnotationKind.Allegro, AnnotationGroup.Tempo],
    [AnnotationKind.Vivace, AnnotationGroup.Tempo],
    [AnnotationKind.Presto, AnnotationGroup.Tempo],
    [AnnotationKind.Prestissimo, AnnotationGroup.Tempo],

    // Articulation annotations
    [AnnotationKind.staccato, AnnotationGroup.Articulation],
    [AnnotationKind.staccatissimo, AnnotationGroup.Articulation],
    [AnnotationKind.spiccato, AnnotationGroup.Articulation],
    [AnnotationKind.tenuto, AnnotationGroup.Articulation],
    [AnnotationKind.accent, AnnotationGroup.Articulation],
    [AnnotationKind.marcato, AnnotationGroup.Articulation],
    [AnnotationKind.legato, AnnotationGroup.Articulation],
    [AnnotationKind.portato, AnnotationGroup.Articulation],

    // Expression annotations
    [AnnotationKind.dolce, AnnotationGroup.Expression],
    [AnnotationKind.cantabile, AnnotationGroup.Expression],
    [AnnotationKind.espressivo, AnnotationGroup.Expression],
    [AnnotationKind.espr, AnnotationGroup.Expression],
    [AnnotationKind.leggiero, AnnotationGroup.Expression],
    [AnnotationKind.pesante, AnnotationGroup.Expression],
    [AnnotationKind.con_brio, AnnotationGroup.Expression],
    [AnnotationKind.con_fuoco, AnnotationGroup.Expression],
    [AnnotationKind.giocoso, AnnotationGroup.Expression],
    [AnnotationKind.maestoso, AnnotationGroup.Expression],
    [AnnotationKind.misterioso, AnnotationGroup.Expression],
    [AnnotationKind.tranquillo, AnnotationGroup.Expression],

    // Technique annotations
    // Strings
    [AnnotationKind.pizz, AnnotationGroup.Technique],
    [AnnotationKind.arco, AnnotationGroup.Technique],
    [AnnotationKind.col_legno, AnnotationGroup.Technique],
    [AnnotationKind.sul_ponticello, AnnotationGroup.Technique],
    [AnnotationKind.sul_tasto, AnnotationGroup.Technique],
    [AnnotationKind.vibrato, AnnotationGroup.Technique],
    [AnnotationKind.senza_vibrato, AnnotationGroup.Technique],
    // Keyboard
    [AnnotationKind.legato_pedal, AnnotationGroup.Technique],
    [AnnotationKind.staccato_pedal, AnnotationGroup.Technique],
    [AnnotationKind.una_corda, AnnotationGroup.Technique],
    [AnnotationKind.tre_corde, AnnotationGroup.Technique],

    // Ornament annotations
    [AnnotationKind.trill, AnnotationGroup.Ornament],
    [AnnotationKind.tr, AnnotationGroup.Ornament],
    [AnnotationKind.mordent, AnnotationGroup.Ornament],
    [AnnotationKind.grace_note, AnnotationGroup.Ornament],
    [AnnotationKind.turn, AnnotationGroup.Ornament],
    [AnnotationKind.appoggiatura, AnnotationGroup.Ornament],
    [AnnotationKind.acciaccatura, AnnotationGroup.Ornament],

    // Temporal effect annotations
    [AnnotationKind.fermata, AnnotationGroup.Temporal],
    [AnnotationKind.measureEndFermata, AnnotationGroup.Temporal],

    // Label annotations
    [AnnotationKind.PitchLabel, AnnotationGroup.Label],
    [AnnotationKind.ChordLabel, AnnotationGroup.Label],

    // Misc annotations
    [AnnotationKind._8va, AnnotationGroup.Misc],
    [AnnotationKind._8vb, AnnotationGroup.Misc],
    [AnnotationKind.tacet, AnnotationGroup.Misc],
    [AnnotationKind.sim, AnnotationGroup.Misc],
    [AnnotationKind.div, AnnotationGroup.Misc],
    [AnnotationKind.unis, AnnotationGroup.Misc],
    [AnnotationKind.cue_notes, AnnotationGroup.Misc],
]);

export function resolveAnnotationGroup(annotationKind: AnnotationKind): AnnotationGroup | undefined {
    return AnnotationKindToGroupMap.get(annotationKind);
}

function normaliseAnnotationKind(annotationKind: string): string {
    return String(annotationKind).trim().toLowerCase().replace(/[.]/g, "").replace(/[-]/g, " ");
}

// Create normalised annotation kind map.
const NormalisedAnnotationKindMap = new UniMap<string, AnnotationKind>();
// And fill it.
for (const [kind] of AnnotationKindToGroupMap)
    NormalisedAnnotationKindMap.set(normaliseAnnotationKind(kind), kind)

export function resolveAnnotationKind(annotationKind: string): AnnotationKind | undefined {
    return NormalisedAnnotationKindMap.get(normaliseAnnotationKind(annotationKind));
}

const NoteArticulationOrder = [
    AnnotationKind.staccato,
    AnnotationKind.staccatissimo,
    AnnotationKind.spiccato,
    AnnotationKind.portato,
    AnnotationKind.tenuto,
    AnnotationKind.accent,
    AnnotationKind.marcato,
];

export function isNoteArticulation(kind: AnnotationKind) {
    return NoteArticulationOrder.includes(kind);
}

export function sortNoteArticulations(articulations: { kind: AnnotationKind, color?: string }[]): { kind: AnnotationKind, color?: string }[] {
    return articulations.slice().sort((a, b) => {
        let ao = NoteArticulationOrder.indexOf(a.kind); if (ao < 0) ao = Infinity;
        let bo = NoteArticulationOrder.indexOf(b.kind); if (bo < 0) bo = Infinity;
        return ao - bo;
    });
}

export function getNoteArticulationDrawSymbol(kind: AnnotationKind): DrawSymbol {
    switch (kind) {
        case AnnotationKind.staccato: return DrawSymbol.Staccato;
        case AnnotationKind.staccatissimo: return DrawSymbol.Staccatissimo;
        case AnnotationKind.spiccato: return DrawSymbol.Staccatissimo;
        case AnnotationKind.accent: return DrawSymbol.Accent;
        case AnnotationKind.marcato: return DrawSymbol.Marcato;
        case AnnotationKind.tenuto: return DrawSymbol.Tenuto;
        case AnnotationKind.portato: return DrawSymbol.Portato;
        default: return DrawSymbol.Unknown;
    }
}
