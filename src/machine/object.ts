import { defined } from "../utilities"

export type CoastlineObjectValueMap = {
    Confirmation: undefined
    GenericList:    AnyCoastlineObject[]
    Boolean:        boolean
    String:         string
    Natural_Number: number
    TermAtom:       string
    TermVariable:   string
    TermList:       CoastlineObject<'TermAtom' | 'TermVariable' | 'TermList'>[]
    EmptySub:       []
    NonEmptySub:    {
        variable: CoastlineObject<'TermVariable'>,
        term: CoastlineObject<'TermAtom' | 'TermVariable' | 'TermList'>,
        rest: CoastlineObject<'EmptySub' | 'NonEmptySub'>
    }
    UnificationEquation: { left: CoastlineObject<Term>, right: CoastlineObject<Term> },
    UnificationProblem: CoastlineObject<'UnificationEquation'>[]
    UnificationError: undefined
    EmptyBinTree: { num: CoastlineObject<'Natural_Number'> }
    NonEmptyBinTree: { num: CoastlineObject<'Natural_Number'>, left: CoastlineObject<BinaryTree>, right: CoastlineObject<BinaryTree> }
    NaturalList: CoastlineObject<'Natural_Number'>[]
    Integer: number
    NegativeExpression: { expression: CoastlineObject<ArithmeticExpression> }
    PlusExpression: { left: CoastlineObject<ArithmeticExpression>, right: CoastlineObject<ArithmeticExpression> },
    MinusExpression: { left: CoastlineObject<ArithmeticExpression>, right: CoastlineObject<ArithmeticExpression> },
    TimesExpression: { left: CoastlineObject<ArithmeticExpression>, right: CoastlineObject<ArithmeticExpression> }
    PierceTerm:
        | 'true'
        | 'false'
        | { if: CoastlineObject<'PierceTerm'>, then: CoastlineObject<'PierceTerm'>, else: CoastlineObject<'PierceTerm'> }
        | '0'
        | { succ: CoastlineObject<'PierceTerm'> }
        | { pred: CoastlineObject<'PierceTerm'> }
        | { iszero: CoastlineObject<'PierceTerm'> },
    PierceTermSet: CoastlineObject<'PierceTerm'>[]
    ECCProp: undefined
    ECCType: number
    ECCVariable: string
    ECCApplication: { head: CoastlineObject<ECCTerm>, arg: CoastlineObject<ECCTerm> }
    ECCArrow: { input: CoastlineObject<ECCTerm>, output: CoastlineObject<ECCTerm> }
    ECCProduct: { left: CoastlineObject<ECCTerm>, right: CoastlineObject<ECCTerm> }
    ECCPi: { bound: CoastlineObject<'ECCVariable'>, bound_type: CoastlineObject<ECCTerm>, scope: CoastlineObject<ECCTerm> }
    ECCLambda: { bound: CoastlineObject<'ECCVariable'>, bound_type: CoastlineObject<ECCTerm>, scope: CoastlineObject<ECCTerm> }
    ECCSigma: { bound: CoastlineObject<'ECCVariable'>, bound_type: CoastlineObject<ECCTerm>, scope: CoastlineObject<ECCTerm> }
    ECCPair: { pair_type: CoastlineObject<ECCTerm>, left: CoastlineObject<ECCTerm>, right: CoastlineObject<ECCTerm> }
    ECCProject: { project: 'left' | 'right', pair: CoastlineObject<ECCTerm> }
    ECCTermSet: CoastlineObject<ECCTerm>[]
}

export type ECCTerm =
    | 'ECCProp'
    | 'ECCType'
    | 'ECCVariable'
    | 'ECCApplication'
    | 'ECCArrow'
    | 'ECCProduct'
    | 'ECCPi'
    | 'ECCLambda'
    | 'ECCSigma'
    | 'ECCPair'
    | 'ECCProject'

export type ECCBinder =
    | 'ECCLambda'
    | 'ECCPi'
    | 'ECCSigma'

export type ArithmeticExpression = 'Integer' | 'NegativeExpression' | 'PlusExpression' | 'MinusExpression' | 'TimesExpression'

export type BinaryTree = 'EmptyBinTree' | 'NonEmptyBinTree'
export const bin_tree_type: BinaryTree[] = ['EmptyBinTree', 'NonEmptyBinTree']

export type Term = 'TermAtom' | 'TermVariable' | 'TermList'
export type Substitution = 'EmptySub' | 'NonEmptySub'

export const cta = <CT extends keyof CoastlineObjectValueMap>(ct: CT, ob: AnyCoastlineObject): ob is CoastlineObject<CT> => defined(ob) && ob.type === ct
export class CoastlineObject<CT extends keyof CoastlineObjectValueMap> { constructor(readonly type: CT, readonly value: CoastlineObjectValueMap[CT]) {} }
export type AnyCoastlineObject = CoastlineObject<keyof CoastlineObjectValueMap>
export const obj = <CT extends keyof CoastlineObjectValueMap>(type: CT, value: CoastlineObjectValueMap[CT]): CoastlineObject<CT> => new CoastlineObject(type, value)
export const is_coastline_object = <CT extends keyof CoastlineObjectValueMap>(o: unknown): o is CoastlineObject<CT> => o instanceof CoastlineObject

export const display_coastline_object = (o: CoastlineObject<keyof CoastlineObjectValueMap>) => {
    const display_term = (t: CoastlineObject<'TermAtom' | 'TermVariable' | 'TermList'>): string => {
        if (cta('TermAtom', t))
            return t.value
        if (cta('TermVariable', t))
            return `.${t.value}`
        if (cta('TermList', t))
            return `(${(t.value.map((t) => display_term(t)).join(' '))})`
        return JSON.stringify(t)
    }

    const display_substitution = (s: CoastlineObject<'EmptySub' | 'NonEmptySub'>) =>
        `{${substitution_to_list(s).map(([v, t]) => `${display_term(v)} ↦ ${display_term(t)}`).join(', ')}}`
    
    const substitution_to_list = (s: CoastlineObject<'EmptySub' | 'NonEmptySub'>): [CoastlineObject<'TermVariable'>, CoastlineObject<'TermAtom' | 'TermVariable' | 'TermList'>][] => {
        const raw_sub = /*cta('Substitution', s) ? s.value :*/ s
        if (cta('NonEmptySub', raw_sub))
            return [[raw_sub.value.variable, raw_sub.value.term], ...substitution_to_list(raw_sub.value.rest)]
        return []
    }

    const display_unification_equation = (ue: CoastlineObject<'UnificationEquation'>) =>
        `${display_coastline_object(ue.value.left)} =? ${display_coastline_object(ue.value.right)}`

    const display_unification_problem = (up: CoastlineObject<'UnificationProblem'>) =>  
        up.value.map(display_unification_equation)
    
    // const display_substitution = (s: CoastlineObject<'EmptySub' | 'NonEmptySub'>) =>
    //     ({ type: 'Substitution', value: display_substitution(s) })
    
    // if (cta('TermAtom', o))
    //     return display_term(o)
    if (cta('TermAtom', o) || cta('TermVariable', o) || cta('TermList', o))
        return display_term(o)
    // if (cta('EmptySub', o))
    //     return display_substitution(o)
    if (cta('EmptySub', o) || cta('NonEmptySub', o))
        return display_substitution(o)
    if (cta('UnificationEquation', o))
        return display_unification_equation(o)
    if (cta('UnificationProblem', o))
        return display_unification_problem(o)
    if (cta('UnificationError', o))
        return 'Terms Do Not Unify'

    return o
}

export const object_constructor = <CT extends keyof CoastlineObjectValueMap>(ct: CT) => (value: CoastlineObjectValueMap[CT]): CoastlineObject<CT> => obj(ct, value)