import { mk_stack } from "../src/stack"
import { operation, step_results_simplification, FrameMap } from "./frame_machine"

const b_id_1 = ([r]: boolean[]) => r
const b_not_1 = ([r]: boolean[]) => !r
const b_and_n = (rs: boolean[]) => rs.every((r) => r)

describe('step_results_simplification', () => {
    test('ops: empty, res: empty', () => expect(step_results_simplification(mk_stack(), mk_stack())).toEqual(undefined))
    test('ops: empty, res: [true, true]', () => expect(step_results_simplification(mk_stack(), mk_stack(true, true))).toEqual(undefined))
    test('ops: [(id1), (and2)], res: [false]', () => expect(
        step_results_simplification(mk_stack(operation(1, b_id_1), operation(2, b_and_n)), mk_stack(false))
    ).toEqual(
        [mk_stack(operation(2, b_and_n)), mk_stack(false)]
    ))
    test('ops: [(not1), (and2)], res: [false, true]', () => expect(
        step_results_simplification(mk_stack(operation(1, b_not_1), operation(2, b_and_n)), mk_stack(false, true))
    ).toEqual(
        [mk_stack(operation(2, b_and_n)), mk_stack(true, true)]
    ))
    test('ops: [(and2), (not1)], res: [false, true]', () => expect(
        step_results_simplification(mk_stack(operation(2, b_and_n), operation(1, b_not_1)), mk_stack(false, true))
    ).toEqual(
        [mk_stack(operation(1, b_not_1)), mk_stack(false)]
    ))
})