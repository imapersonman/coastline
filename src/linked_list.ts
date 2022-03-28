import { first, is_empty, rest } from "./utilities"

export class EmptyLinkedList {}
export const empty_linked_list = new EmptyLinkedList
export const is_empty_linked_list = (l: unknown): l is EmptyLinkedList => l instanceof EmptyLinkedList

export class NonEmptyLinkedList<Element> { constructor(readonly head: Element, readonly rest: LinkedList<Element>) {} }
export const non_empty_linked_list = <Element>(head: Element, rest: LinkedList<Element>): NonEmptyLinkedList<Element> => new NonEmptyLinkedList(head, rest)
export const is_non_empty_linked_list = <Element>(l: unknown): l is NonEmptyLinkedList<Element> => l instanceof NonEmptyLinkedList

export type LinkedList<Element> =
    | EmptyLinkedList
    | NonEmptyLinkedList<Element>

export const is_linked_list = <Element>(l: unknown): l is LinkedList<Element> => is_empty_linked_list(l) || is_non_empty_linked_list(l)

export const linked_list_as_array = <Element>(l: LinkedList<Element>): Element[] =>
    reduce_linked_list_right(l, (acc, e) => [e, ...acc], [] as Element[])

export const linked_list_iterator = function* <Element>(l: LinkedList<Element>) {
    let current = l
    while (is_non_empty_linked_list(current)) {
        yield current.head
        current = current.rest
    }
}

// linked_list(e1, e2, ..., en) = non_empty_linked_list(e1, non_empty_linked_list(e2, ..., non_empty_linked_list(en, empty_linked_list)...))
export const linked_list = <Element>(...elements: Element[]): LinkedList<Element> => {
    if (is_empty(elements))
        return empty_linked_list
    return non_empty_linked_list(first(elements), linked_list(...rest(elements)))
}

export const split_linked_list_iterator = function* <Element>(l: LinkedList<Element>) {
    let current = l
    while (is_non_empty_linked_list(current)) {
        yield [current.head, current.rest]
        current = current.rest
    }
}

export const reverse_linked_list = <Element>(l: LinkedList<Element>): LinkedList<Element> => {
    const reverse_linked_list_acc = (acc: LinkedList<Element>, l: LinkedList<Element>): LinkedList<Element> => {
        if (is_non_empty_linked_list(l))
            return reverse_linked_list_acc(non_empty_linked_list(l.head, acc), l.rest)
        return acc
    }
    return reverse_linked_list_acc(empty_linked_list, l)
}

// l = 1, 2, 3, 4, 5
// acc = identity
// e = 1
//
// l = 2, 3, 4, 5
// acc = 1
// e = 2
//
// l = 
export const reduce_linked_list_right = <Element, Reduced>(l: LinkedList<Element>, reducer: (acc: Reduced, e: Element) => Reduced, identity: Reduced): Reduced => {
    if (is_non_empty_linked_list(l))
        return reducer(reduce_linked_list_right(l.rest, reducer, identity), l.head)
        // return reducer(reduce_linked_list(l.rest, reducer, identity), l.head)
    return identity
}

export const map_linked_list = <Element, Mapped>(l: LinkedList<Element>, mapper: (e: Element) => Mapped): LinkedList<Mapped> =>
    reduce_linked_list_right(l, (acc, e) => non_empty_linked_list(mapper(e), acc), empty_linked_list)

export const concat_linked_lists = <Element>(l1: LinkedList<Element>, l2: LinkedList<Element>): LinkedList<Element> =>
    reduce_linked_list_right(l1, (acc, e) => non_empty_linked_list(e, acc), l2)

type Eq<E> = (e1: E, e2: E) => boolean
const dequality = (e1: unknown, e2: unknown) => e1 === e2

export const linked_list_contains = <Element>(equality: Eq<Element> = dequality) => (l: LinkedList<Element>, e: Element): boolean => {
    if (is_non_empty_linked_list(l))
        return equality(e, l.head) || linked_list_contains(equality)(l.rest, e)
    return false
}

export const remove_from_linked_list = <Element>(equality: Eq<Element> = dequality) => (l: LinkedList<Element>, e: Element) => {
    if (is_non_empty_linked_list(l)) {
        const mod_rest = remove_from_linked_list(equality)(l.rest, e)
        if (equality(e, l.head))
            return mod_rest
        return non_empty_linked_list(l.head, mod_rest)
    }
    return l
}

export const dedupe_linked_list = <Element>(equality: Eq<Element> = dequality) => (l: LinkedList<Element>) => {
    if (is_non_empty_linked_list(l))
        return non_empty_linked_list(l.head, remove_from_linked_list(equality)(dedupe_linked_list(equality)(l.rest), l.head))
    return l
}

export const union_linked_lists = <Element>(equality: Eq<Element> = dequality) => (l1: LinkedList<Element>, l2: LinkedList<Element>): LinkedList<Element> =>
    dedupe_linked_list(equality)(concat_linked_lists(l1, l2))

// Adds to the end of the list.
export const add_unique_to_linked_list = <Element>(equality: Eq<Element> = dequality) => (l: LinkedList<Element>, e: Element): LinkedList<Element> => {
    if (is_non_empty_linked_list(l))
        if (equality(l.head, e))
            return l
        else
            return non_empty_linked_list(l.head, add_unique_to_linked_list(equality)(l.rest, e))
    return non_empty_linked_list(e, empty_linked_list)
}

export const filter_linked_list = <Element>(l: LinkedList<Element>, should_keep: (e: Element) => boolean): LinkedList<Element> =>
    reduce_linked_list_right(l, (acc, e) => should_keep(e) ? non_empty_linked_list(e, acc) : acc, empty_linked_list)

export const add_to_end_of_linked_list = <Element>(l: LinkedList<Element>, e: Element): LinkedList<Element> =>
    reduce_linked_list_right(l, (acc, head) => non_empty_linked_list(head, acc), non_empty_linked_list(e, empty_linked_list))

export const find_in_linked_list = <Element>(l: LinkedList<Element>, predicate: (e: Element) => boolean): Element | undefined => {
    if (!is_non_empty_linked_list(l))
        return undefined
    if (predicate(l.head))
        return l.head
    return find_in_linked_list(l.rest, predicate)
}