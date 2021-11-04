import { iv, pi, type_k } from "../../src/lambda_pi/shorthands";
import { next_indexed_variable_in_ctx } from "../../src/logical_framework/next_indexed_variable_in_ctx";
import { mk_map } from "../../src/map/RecursiveMap";

test('empty', () => expect(
    next_indexed_variable_in_ctx(mk_map())
).toEqual(
    iv(0)
))

test('non-empty, no indexed variables', () => expect(
    next_indexed_variable_in_ctx(mk_map(['a', type_k], ['b', type_k]))
).toEqual(
    iv(0)
))

test('non-empty, a few less than 0', () => expect(
    next_indexed_variable_in_ctx(mk_map(['a', type_k], ['$_-12', type_k], ['$_-2', type_k], ['d', type_k]))
).toEqual(
    iv(0)
))

test('non-empty, a few equal to than or equal to 0', () => expect(
    next_indexed_variable_in_ctx(mk_map(['a', type_k], ['$_13', type_k], ['$_2', type_k], ['d', type_k]))
).toEqual(
    iv(14)
))

test('non-empty, a few greater than or equal to 0', () => expect(
    next_indexed_variable_in_ctx(mk_map(['$_0', type_k], ['b', type_k], ['$_-2', type_k], ['d', type_k]))
).toEqual(
    iv(1)
))

test('non-empty, indexed variables in sorts', () => expect(
    next_indexed_variable_in_ctx(mk_map(['$_0', type_k], ['b', pi(iv(2), type_k, type_k)], ['$_-2', type_k], ['d', type_k]))
).toEqual(
    iv(3)
))