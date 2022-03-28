import { add_unique_to_linked_list as add_unique_to_end_of_linked_list, add_unique_to_linked_list, concat_linked_lists, dedupe_linked_list, empty_linked_list, filter_linked_list, find_in_linked_list, is_non_empty_linked_list, LinkedList, linked_list, linked_list_contains, map_linked_list, non_empty_linked_list, reduce_linked_list_right, remove_from_linked_list, reverse_linked_list, union_linked_lists } from '../src/linked_list'

describe('linked_list', () => {
    test('make empty', () => expect(
        linked_list()
    ).toEqual(
        empty_linked_list
    ))
    test('make with single element', () => expect(
        linked_list('a')
    ).toEqual(
        non_empty_linked_list('a', empty_linked_list)
    ))
    test('make with 5 elements', () => expect(
        linked_list('a', 'b', 'c', 'd', 'e')
    ).toEqual(
        non_empty_linked_list('a', non_empty_linked_list('b', non_empty_linked_list('c', non_empty_linked_list('d', non_empty_linked_list('e', empty_linked_list)))))
    ))
})

describe('reverse_linked_list', () => {
    test('empty', () => expect(
        reverse_linked_list(linked_list())
    ).toEqual(
        linked_list()
    ))
    test('with 1 element', () => expect(
        reverse_linked_list(linked_list('a'))
    ).toEqual(
        linked_list('a')
    ))
    test('with 2 elements', () => expect(
        reverse_linked_list(linked_list('a', 'b'))
    ).toEqual(
        linked_list('b', 'a')
    ))
    test('with 5 elements', () => expect(
        reverse_linked_list(linked_list('a', 'b', 'c', 'd', 'e'))
    ).toEqual(
        linked_list('e', 'd', 'c', 'b', 'a')
    ))
})

describe('reduce_linked_list', () => {
    const sum = (total: number, n: number) => total + n
    const mul = (total: number, n: number) => total * n
    test('empty sum', () => expect(
        reduce_linked_list_right(linked_list(), sum, 0)
    ).toEqual(
        0
    ))
    test('empty sum starting at -2', () => expect(
        reduce_linked_list_right(linked_list(), sum, -2)
    ).toEqual(
        -2
    ))
    test('1 element sum starting at 5', () => expect(
        reduce_linked_list_right(linked_list(2), sum, 5)
    ).toEqual(
        7
    ))
    test('1 element mul with 1 as identity', () => expect(
        reduce_linked_list_right(linked_list(2), mul, 1)
    ).toEqual(
        2
    ))
    test('1 element mul with 3 as identity', () => expect(
        reduce_linked_list_right(linked_list(2), mul, 3)
    ).toEqual(
        6
    ))
    test('5 element sum with 0 as identity', () => expect(
        reduce_linked_list_right(linked_list(9, 8, 7, 6, 5), sum, 0)
    ).toEqual(
        35
    ))
    test('5 element mul with 1 as identity', () => expect(
        reduce_linked_list_right(linked_list(21, 22, 23, 24, 25), mul, 1)
    ).toEqual(
        6375600
    ))
})

describe('map_linked_list', () => {
    test('empty +1', () => expect(
        map_linked_list(linked_list(), (n: number) => n + 1)
    ).toEqual(
        linked_list()
    ))
    test('1 element +1', () => expect(
        map_linked_list(linked_list(1), (n) => n + 1)
    ).toEqual(
        linked_list(2)
    ))
    test('1 element +2', () => expect(
        map_linked_list(linked_list(1), (n) => n + 2)
    ).toEqual(
        linked_list(3)
    ))
    test('5 element +1', () => expect(
        map_linked_list(linked_list(9, 8, 7, 6, 5), (n) => n + 1)
    ).toEqual(
        linked_list(10, 9, 8, 7, 6)
    ))
    test('5 element +2', () => expect(
        map_linked_list(linked_list(21, 22, 23, 24, 25), (n) => n + 2)
    ).toEqual(
        linked_list(23, 24, 25, 26, 27)
    ))
})

describe('concat_linked_lists', () => {
    test('empties', () => expect(
        concat_linked_lists(linked_list(), linked_list())
    ).toEqual(
        linked_list()
    ))
    test('left empty, right 3 elements', () => expect(
        concat_linked_lists(linked_list(), linked_list(4, 5, 6))
    ).toEqual(
        linked_list(4, 5, 6)
    ))
    test('left 3 elements, right empty', () => expect(
        concat_linked_lists(linked_list(1, 2, 3), linked_list())
    ).toEqual(
        linked_list(1, 2, 3)
    ))
    test('left 3 elements, right 3 elements', () => expect(
        concat_linked_lists(linked_list(1, 2, 3), linked_list(4, 5, 6))
    ).toEqual(
        linked_list(1, 2, 3, 4, 5, 6)
    ))
    test('with shared elements', () => expect(
        concat_linked_lists(linked_list(1, 2, 3), linked_list(3, 2, 1))
    ).toEqual(
        linked_list(1, 2, 3, 3, 2, 1)
    ))
})

describe('linked_list_contains', () => {
    test('empty', () => expect(
        linked_list_contains()(linked_list(), 1)
    ).toBeFalsy())
    test('1 element does not contain', () => expect(
        linked_list_contains()(linked_list(2), 1)
    ).toBeFalsy())
    test('1 element does contains', () => expect(
        linked_list_contains()(linked_list(2), 2)
    ).toBeTruthy())
    test('5 elements does not contain', () => expect(
        linked_list_contains()(linked_list(1, 2, 3, 4, 5), 6)
    ).toBeFalsy())
    test('5 elements contains', () => expect(
        linked_list_contains()(linked_list(1, 2, 3, 4, 5), 4)
    ).toBeTruthy())
})

describe('remove_from_linked_list', () => {
    test('empty', () => expect(remove_from_linked_list()(linked_list(), 1)).toEqual(linked_list()))
    test('1 element not contained', () => expect(remove_from_linked_list()(linked_list(2), 1)).toEqual(linked_list(2)))
    test('1 element contained', () => expect(remove_from_linked_list()(linked_list(2), 2)).toEqual(linked_list()))
    test('4 element not contained', () => expect(remove_from_linked_list()(linked_list(1, 2, 3, 4), 5)).toEqual(linked_list(1, 2, 3, 4)))
    test('5 element contained', () => expect(remove_from_linked_list()(linked_list(1, 2, 3, 4, 5), 4)).toEqual(linked_list(1, 2, 3, 5)))
    test('5 element contains twice', () => expect(remove_from_linked_list()(linked_list(1, 2, 3, 4, 5, 4), 4)).toEqual(linked_list(1, 2, 3, 5)))
})

describe('union_linked_lists', () => {
    test('empties', () => expect(
        union_linked_lists()(linked_list(), linked_list())
    ).toEqual(
        linked_list()
    ))
    test('left empty, right 3 elements', () => expect(
        union_linked_lists()(linked_list(), linked_list(4, 5, 6))
    ).toEqual(
        linked_list(4, 5, 6)
    ))
    test('left 3 elements, right empty', () => expect(
        union_linked_lists()(linked_list(1, 2, 3), linked_list())
    ).toEqual(
        linked_list(1, 2, 3)
    ))
    test('left 3 elements, right 3 elements', () => expect(
        union_linked_lists()(linked_list(1, 2, 3), linked_list(4, 5, 6))
    ).toEqual(
        linked_list(1, 2, 3, 4, 5, 6)
    ))
    test('with shared elements', () => expect(
        union_linked_lists()(linked_list(1, 2, 3), linked_list(3, 2, 1, 0))
    ).toEqual(
        linked_list(1, 2, 3, 0)
    ))
})

describe('deduped_linked_list', () => {
    test('empty', () => expect(dedupe_linked_list()(linked_list())).toEqual(linked_list()))
    test('5 elements no dupes', () => expect(dedupe_linked_list()(linked_list(1, 2, 3, 4, 5))).toEqual(linked_list(1, 2, 3, 4, 5)))
    test('5 elements 3 dupes', () => expect(dedupe_linked_list()(linked_list(3, 2, 3, 3, 5))).toEqual(linked_list(3, 2, 5)))
    test('10 elements all dupes', () => expect(dedupe_linked_list()(linked_list(1, 1, 1, 1, 1, 1, 1, 1, 1, 1))).toEqual(linked_list(1)))
})

describe('add_unique_to_end_of_linked_list', () => {
    test('empty', () => expect(
        add_unique_to_linked_list()(linked_list(), 1)
    ).toEqual(
        linked_list(1)
    ))
    test('1 element, not contained', () => expect(
        add_unique_to_linked_list()(linked_list(2), 1)
    ).toEqual(
        linked_list(2, 1)
    ))
    test('2 elements, contained', () => expect(
        add_unique_to_linked_list()(linked_list(1, 2), 1)
    ).toEqual(
        linked_list(1, 2)
    ))
})

describe('filter_linked_list', () => {
    const is_pos = (e: number) => e >= 0
    test('empty', () => expect(filter_linked_list(linked_list(), is_pos)).toEqual(linked_list()))
    test('1 element do keep', () => expect(filter_linked_list(linked_list(1), is_pos)).toEqual(linked_list(1)))
    test('1 element do not keep', () => expect(filter_linked_list(linked_list(-1), is_pos)).toEqual(linked_list()))
    test('3 elements keep 2', () => expect(filter_linked_list(linked_list(2, -3, 4), is_pos)).toEqual(linked_list(2, 4)))
})

describe('find_in_linked_list', () => {
    const is_pos = (e: number) => e >= 0
    test('empty', () => expect(find_in_linked_list(linked_list(), is_pos)).toBeUndefined())
    test('5 elements not found', () => expect(find_in_linked_list(linked_list(-1, -2, -3, -4, -5), is_pos)).toBeUndefined())
    test('5 elements found', () => expect(find_in_linked_list(linked_list(-1, 3, -4, -1, -5), is_pos)).toEqual(3))
    test('5 elements found multiple', () => expect(find_in_linked_list(linked_list(-1, 10, -4, 3, -5), is_pos)).toEqual(10))
})