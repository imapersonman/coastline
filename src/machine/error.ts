import { defined } from "../utilities"
import { AnyCoastlineObject, CoastlineObject, CoastlineObjectValueMap, display_coastline_object, Term } from "./object"

export type CoastlineErrorValueMap = {
    'InputNotEqualTo'                   : number
    'InputNotGreaterThanOrEqualTo'      : number
    'ObjectNotOfType'                   : { object: AnyCoastlineObject, expected: keyof CoastlineObjectValueMap }
    'ObjectNotOfAnyType'                : { expected: (keyof CoastlineObjectValueMap)[], actual: keyof CoastlineObjectValueMap }
    'TermsAreNotEqual'                  : { term1: CoastlineObject<Term>, term2: CoastlineObject<Term> }
    'TermsAreEqual'                     : { term1: CoastlineObject<Term>, term2: CoastlineObject<Term> }
    'OneListIsNotEmpty'                 : { list1: CoastlineObject<'TermList'>,      list2: CoastlineObject<'TermList'> }
    'OneListIsEmpty'                    : { list1: CoastlineObject<'TermList'>,      list2: CoastlineObject<'TermList'> }
    'ListIsEmpty'                       : CoastlineObject<'TermList'>
    'ListIsNotEmpty'                    : CoastlineObject<'TermList'>
    'IncorrectArity'                    : { expected: number, actual: number }
    'ListsHaveDifferentLengths'         : { list1: CoastlineObject<'TermList'>, list2: CoastlineObject<'TermList'> }
    'CannotSwapError'                   : undefined
    'UnificationProblemIsNotEmpty'      : undefined
    'UnificationProblemIsEmpty'         : undefined
    'VariableDoesNotOccurInTerm'        : { variable: CoastlineObject<'TermVariable'>, term: CoastlineObject<Term> }
    'VariableOccursInTerm'              : { variable: CoastlineObject<'TermVariable'>, term: CoastlineObject<Term> }
    'SubstitutionVariablesAppearInTerm' : undefined
    'WithMessage'                       : string
}

export const cte = <CT extends keyof CoastlineErrorValueMap>(ct: CT, r: AnyCoastlineError): r is CoastlineError<CT> => defined(r) && r.type === ct
export type BareCoastlineError<K extends keyof CoastlineErrorValueMap> = { [Key in keyof CoastlineErrorValueMap]: { type: Key, value: CoastlineErrorValueMap[Key] } }[K]
export type AnyBareCoastlineError = BareCoastlineError<keyof CoastlineErrorValueMap>
export class CoastlineError<CT extends keyof CoastlineErrorValueMap> { constructor(readonly type: CT, readonly value: CoastlineErrorValueMap[CT]) {} }
export type AnyCoastlineError = CoastlineError<keyof CoastlineErrorValueMap>
export const err = <CT extends keyof CoastlineErrorValueMap>(type: CT, value: CoastlineErrorValueMap[CT]): CoastlineError<CT> => new CoastlineError(type, value)
export const is_coastline_error = <CT extends keyof CoastlineErrorValueMap>(e: unknown): e is CoastlineError<CT> => e instanceof CoastlineError

export const display_coastline_error = (e: AnyCoastlineError) => {
    const display_coastline_error_value = (e: AnyCoastlineError) => {
        if (cte('ObjectNotOfType', e))
            return { object: display_coastline_object(e.value.object), expected: e.value.expected }
        if (cte('TermsAreEqual', e))
            return { term1: display_coastline_object(e.value.term1), term2: display_coastline_object(e.value.term2) }
        if (cte('TermsAreNotEqual', e))
            return { term1: display_coastline_object(e.value.term1), term2: display_coastline_object(e.value.term2) }
        if (cte('OneListIsNotEmpty', e))
            return { list1: display_coastline_object(e.value.list1), list2: display_coastline_object(e.value.list2) }
        if (cte('OneListIsEmpty', e))
            return { list1: display_coastline_object(e.value.list1), list2: display_coastline_object(e.value.list2) }
        if (cte('ListIsEmpty', e))
            return display_coastline_object(e.value)
        if (cte('ListIsNotEmpty', e))
            return display_coastline_object(e.value)
        if (cte('ListsHaveDifferentLengths', e))
            return { list1: display_coastline_object(e.value.list1), list2: display_coastline_object(e.value.list2) }
        return e.value
    }

    return { type: e.type, value: display_coastline_error_value(e) }
}