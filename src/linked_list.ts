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

describe('deduped_linked_list', () => {
    test('empty', () => expect(dedupe_linked_list()(linked_list())).toEqual(linked_list()))
    test('5 elements no dupes', () => expect(dedupe_linked_list()(linked_list(1, 2, 3, 4, 5))).toEqual(linked_list(1, 2, 3, 4, 5)))
    test('5 elements 3 dupes', () => expect(dedupe_linked_list()(linked_list(3, 2, 3, 3, 5))).toEqual(linked_list(3, 2, 5)))
    test('10 elements all dupes', () => expect(dedupe_linked_list()(linked_list(1, 1, 1, 1, 1, 1, 1, 1, 1, 1))).toEqual(linked_list(1)))
})

export const union_linked_lists = <Element>(equality: Eq<Element> = dequality) => (l1: LinkedList<Element>, l2: LinkedList<Element>): LinkedList<Element> =>
    dedupe_linked_list(equality)(concat_linked_lists(l1, l2))