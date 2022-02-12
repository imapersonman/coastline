import { use_newest_variables } from '../../src/construction/use_newest_variables'
import { type_k } from '../../src/lambda_pi/shorthands'
import { mk_map } from '../../src/map/RecursiveMap'

describe('use_newest_variable', () => {
    test('empty ctx, type_k', () => expect(
        use_newest_variables(mk_map(), type_k, () => true)
    ).toEqual(
        type_k
    ))
    test('non-empty ctx, type_k', () => expect(
        use_newest_variables(mk_map(['a', type_k]), type_k, () => true)
    ).toEqual(
        type_k
    ))
    // NEED MORE
})