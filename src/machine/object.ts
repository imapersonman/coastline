import { defined } from "../utilities"

export type CoastlineObjectValueMap = {
    Boolean:        boolean
    Integer:        number
    String:         string
    Natural_Number: number
    TermAtom:       string
    TermVariable:   string
    TermList:       CoastlineObject<'Term'>[]
    Term:           CoastlineObject<'TermAtom' | 'TermVariable' | 'TermList'>
    EmptySub:       []
    NonEmptySub:    {
        variable: CoastlineObject<'TermVariable'>,
        term: CoastlineObject<'Term'>,
        rest: CoastlineObject<'Substitution'>
    }
    Substitution:   CoastlineObject<'EmptySub' | 'NonEmptySub'>
}

export const cta = <CT extends keyof CoastlineObjectValueMap>(ct: CT, ob: AnyCoastlineObject): ob is CoastlineObject<CT> => defined(ob) && ob.type === ct
export class CoastlineObject<CT extends keyof CoastlineObjectValueMap> { constructor(readonly type: CT, readonly value: CoastlineObjectValueMap[CT]) {} }
export type AnyCoastlineObject = CoastlineObject<keyof CoastlineObjectValueMap>
export const obj = <CT extends keyof CoastlineObjectValueMap>(type: CT, value: CoastlineObjectValueMap[CT]): CoastlineObject<CT> => new CoastlineObject(type, value)
export const is_coastline_object = <CT extends keyof CoastlineObjectValueMap>(o: unknown): o is CoastlineObject<CT> => o instanceof CoastlineObject

export const display_coastline_object = (o: CoastlineObject<keyof CoastlineObjectValueMap>) => {
    const display_term_atom_variable_or_list = (t: CoastlineObject<'TermAtom' | 'TermVariable' | 'TermList'>): string => {
        if (cta('TermAtom', t))
            return t.value
        if (cta('TermVariable', t))
            return `.${t.value}`
        if (cta('TermList', t))
            return `(${(t.value.map((t) => display_term_atom_variable_or_list(t.value)).join(' '))})`
        return 'UnknownTermSubType'
    }

    const display_term = (t: CoastlineObject<'Term'>) =>
        `term(${display_term_atom_variable_or_list(t.value) })`
    
    const display_raw_substitution = (s: CoastlineObject<'EmptySub' | 'NonEmptySub'>) =>
        `{${substitution_to_list(s).map(([v, t]) => `${display_term_atom_variable_or_list(v)} |-> ${display_term(t)}`).join(', ')}}`
    
    const substitution_to_list = (s: CoastlineObject<'Substitution' | 'EmptySub' | 'NonEmptySub'>): [CoastlineObject<'TermVariable'>, CoastlineObject<'Term'>][] => {
        const raw_sub = cta('Substitution', s) ? s.value : s
        if (cta('NonEmptySub', raw_sub))
            return [[raw_sub.value.variable, raw_sub.value.term], ...substitution_to_list(raw_sub.value.rest)]
        return []
    }
    
    const display_substitution = (s: CoastlineObject<'Substitution'>) =>
        ({ type: 'Substitution', value: display_raw_substitution(s.value) })
    
    if (cta('Term', o))
        return display_term(o)
    if (cta('TermAtom', o) || cta('TermVariable', o) || cta('TermList', o))
        return display_term_atom_variable_or_list(o)
    if (cta('Substitution', o))
        return display_substitution(o)
    if (cta('EmptySub', o) || cta('NonEmptySub', o))
        return display_raw_substitution(o)

    return o
}

export const object_constructor = <CT extends keyof CoastlineObjectValueMap>(ct: CT) => (value: CoastlineObjectValueMap[CT]): CoastlineObject<CT> => obj(ct, value)