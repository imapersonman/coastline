import { iv, la, ov, ovlist } from "../../src/lambda_pi/shorthands"
import { introduce_ctx } from "../../src/logical_framework/introduce_ctx"
import { mk_map } from "../../src/map/RecursiveMap"

const [a, b, c] = ovlist('a', 'b', 'c')

describe('introduce_assumptions', () => {
    it('returns the given ast on empty (a)', () => expect(introduce_ctx(mk_map(), a)).toEqual(a))
    it('returns the given ast on empty (b)', () => expect(introduce_ctx(mk_map(), b)).toEqual(b))
    it('returns the given ast in a single-nested lambda with the correct type with one element', () => expect(
        introduce_ctx(mk_map(['a', b]), a)
    ).toEqual(
        la(a, b, a)
    ))
    it('remembers to parse generated variables', () => expect(
        introduce_ctx(mk_map(['$_0', b]), iv(0))
    ).toEqual(
        la(iv(0), b, iv(0))
    ))
    it('returns the given ast in a double-nested lambda with the correct type with two elements', () => expect(
        introduce_ctx(mk_map(['a', b], ['b', c]), a)
    ).toEqual(
        la(a, b, la(b, c, a))
    ))
})