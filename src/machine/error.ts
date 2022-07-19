import { defined } from "../utilities"
import { AnyCoastlineObject, CoastlineObject, display_coastline_object, ObjectValueMap, Term } from "./object"

export type ErrorValueMap = {
    [error_key: string]: unknown
}

/*
export type Deprecated_CoastlineErrorValueMap = {
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
*/

export class ObjectNotOfTypeError<OVM extends ObjectValueMap> { constructor(readonly object: AnyCoastlineObject<OVM>, readonly expected: keyof OVM) {} }
export const object_not_of_type_error = <OVM extends ObjectValueMap>(object: AnyCoastlineObject<OVM>, expected: keyof OVM): ObjectNotOfTypeError<OVM> => new ObjectNotOfTypeError(object, expected)
export const is_object_not_of_type_error = <OVM extends ObjectValueMap>(e: unknown): e is ObjectNotOfTypeError<OVM> => e instanceof ObjectNotOfTypeError

export class ObjectNotOfAnyTypeError<OVM extends ObjectValueMap> { constructor(readonly object: AnyCoastlineObject<OVM>, readonly expected: (keyof OVM)[], readonly actual: keyof OVM) {} }
export const object_not_of_any_type_error = <OVM extends ObjectValueMap>(object: AnyCoastlineObject<OVM>, expected: (keyof OVM)[], actual: keyof OVM): ObjectNotOfAnyTypeError<OVM> => new ObjectNotOfAnyTypeError(object, expected, actual)
export const is_object_not_of_any_type_error = <OVM extends ObjectValueMap>(e: unknown): e is ObjectNotOfAnyTypeError<OVM> => e instanceof ObjectNotOfAnyTypeError

export type CoastlineSystemError<OVM extends ObjectValueMap> =
    | ObjectNotOfTypeError<OVM>
    | ObjectNotOfAnyTypeError<OVM>

export const cte = <
    EVM extends ErrorValueMap,
    CT extends keyof EVM>(
    ct: CT,
    r: AnyCoastlineError<EVM>
): r is CoastlineError<EVM, CT> =>
    defined(r) && r.type === ct

// export type BareCoastlineError<
//     OVM extends ObjectValueMap,
//     EVM extends ErrorValueMap<OVM>,
//     K extends keyof EVM
// > = { [Key in keyof EVM]: { type: Key, value: EVM[Key] } }[K]

// export type AnyBareCoastlineError<
//     OVM extends ObjectValueMap,
//     EVM extends ErrorValueMap<OVM>
// > = BareCoastlineError<OVM, EVM, keyof EVM>

export class CoastlineError<
    EVM extends ErrorValueMap,
    CT extends keyof EVM
> { constructor(readonly type: CT, readonly value: EVM[CT]) {} }

export type AnyCoastlineError<
    EVM extends ErrorValueMap
> = CoastlineError<EVM, keyof EVM>

export const err = <
    EVM extends ErrorValueMap,
    CT extends keyof EVM>(
    type: CT,
    value: EVM[CT]
): CoastlineError<EVM, CT> =>
    new CoastlineError(type, value)

export const is_coastline_error = <
    EVM extends ErrorValueMap>(
    e: unknown
): e is AnyCoastlineError<EVM> => 
    e instanceof CoastlineError

export const display_coastline_error = <EVM extends ErrorValueMap>(e: AnyCoastlineError<EVM>, display_error: (e: AnyCoastlineError<EVM>) => any = JSON.stringify) => {
    // const display_coastline_error_value = (e: AnyCoastlineError<OVM, EVM>) => {
    //     if (cte('ObjectNotOfType', e))
    //         return { object: display_coastline_object(e.value.object), expected: e.value.expected }
    //     if (cte('TermsAreEqual', e))
    //         return { term1: display_coastline_object(e.value.term1), term2: display_coastline_object(e.value.term2) }
    //     if (cte('TermsAreNotEqual', e))
    //         return { term1: display_coastline_object(e.value.term1), term2: display_coastline_object(e.value.term2) }
    //     if (cte('OneListIsNotEmpty', e))
    //         return { list1: display_coastline_object(e.value.list1), list2: display_coastline_object(e.value.list2) }
    //     if (cte('OneListIsEmpty', e))
    //         return { list1: display_coastline_object(e.value.list1), list2: display_coastline_object(e.value.list2) }
    //     if (cte('ListIsEmpty', e))
    //         return display_coastline_object(e.value)
    //     if (cte('ListIsNotEmpty', e))
    //         return display_coastline_object(e.value)
    //     if (cte('ListsHaveDifferentLengths', e))
    //         return { list1: display_coastline_object(e.value.list1), list2: display_coastline_object(e.value.list2) }
    //     return e.value
    // }
    return { type: e.type, value: display_error(e) }
}

export const display_coastline_system_error = <OVM extends ObjectValueMap>(e: CoastlineSystemError<OVM>, display_object: (o: AnyCoastlineObject<OVM>) => any = JSON.stringify) => {
    if (is_object_not_of_type_error<OVM>(e))
        return { type: 'ObjectNotOfTypeError', object: display_coastline_object(e.object, display_object), expected: e.expected }
    return { type: 'ObjectNotOfAnyTypeError', object: display_coastline_object(e.object, display_object), expected: e.expected, actual: e.actual }
}