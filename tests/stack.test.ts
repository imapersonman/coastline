import { EmptyStack, mk_stack, NonEmptyStack, possibly_pop_n_entries, push_entries } from "../src/stack"

describe('mk_stack', () => {
    test('empty', () => expect(mk_stack()).toEqual(new EmptyStack))
    test('non-empty size 2', () => expect(mk_stack(2, 1)).toEqual(new NonEmptyStack(2, new NonEmptyStack(1, new EmptyStack))))
    test('non-empty size 5', () => expect(mk_stack(5, 4, 3, 2, 1)).toEqual(new NonEmptyStack(5, new NonEmptyStack(4, new NonEmptyStack(3, new NonEmptyStack(2, new NonEmptyStack(1, new EmptyStack)))))))
})

describe('push_entries', () => {
    test('empty, [] --> empty', () => expect(push_entries(mk_stack(), [])).toEqual(mk_stack()))
    test('[1, 2, 3], [] --> [1, 2, 3]', () => expect(push_entries(mk_stack(1, 2, 3), [])).toEqual(mk_stack(1, 2, 3)))
    test('[1, 2, 3], [4, 5] --> [4, 5, 1, 2, 3]', () => expect(push_entries(mk_stack(1, 2, 3), [4, 5])).toEqual(mk_stack(4, 5, 1, 2, 3)))
})

describe('possibly_pop_n_entries', () => {
    test('empty, 0 --> empty', () => expect(possibly_pop_n_entries(mk_stack(), 0)).toEqual([[], mk_stack()]))
    test('[1, 2, 3], 0 --> [1, 2, 3]', () => expect(possibly_pop_n_entries(mk_stack(1, 2, 3), 0)).toEqual([[], mk_stack(1, 2, 3)]))
    test('[1, 2, 3], 2 --> [3]', () => expect(possibly_pop_n_entries(mk_stack(1, 2, 3), 2)).toEqual([[1, 2], mk_stack(3)]))
    test('empty, 2 --> undefined', () => expect(possibly_pop_n_entries(mk_stack(), 2)).toEqual(undefined))
    test('[1, 2], 3 --> undefined', () => expect(possibly_pop_n_entries(mk_stack(1, 2), 3)).toEqual(undefined))
})