import { is_integer, is_number, replace_at_index } from "../src/utilities"
import { FrameMap, RequestMap, FrameMachineState, TransitionFunction, Frame, transition_result, transition_input_request, result_of, transition_error } from './frame_machine'

type PDN = PositionalDecimalNumber
class PositionalDecimalNumber {
    readonly digits: number[]
    constructor(digits: number[]) {
        let stripped_index = digits.findIndex((d) => d !== 0)
        if (stripped_index === -1)
            this.digits = []
        else
            this.digits = digits.slice(stripped_index).map((d) => Math.abs(d % 10))
    }

    get_at(index: number): number {
        if (index >= this.digits.length)
            return 0
        return this.digits[this.digits.length - 1 - index]
    }

    set_at(index: number, to: number): PositionalDecimalNumber {
        if (0 <= index && index < this.digits.length)
            return new PositionalDecimalNumber(replace_at_index(this.digits, index, to))
        return new PositionalDecimalNumber([to, ...new Array(index - this.digits.length).fill(0), ...this.digits])
    }
}

describe('PositionalDecimalNumber', () => {
    test('empty construction', () => expect(
        new PositionalDecimalNumber([]).digits
    ).toEqual(
        []
    ))
    test('non-empty construction with leading zeroes', () => expect(
        new PositionalDecimalNumber([0, 0, 0, 1, 2, 0, 0, 0, 3, 4, 5]).digits
    ).toEqual(
        [1, 2, 0, 0, 0, 3, 4, 5]
    ))
    test('get_at starts from right get 0th', () => expect(
        new PositionalDecimalNumber([9, 3, 1, 5, 0]).get_at(0)
    ).toEqual(
        0
    ))
    test('get_at starts from right get 2nd', () => expect(
        new PositionalDecimalNumber([9, 3, 1, 5, 0]).get_at(2)
    ).toEqual(
        1
    ))
    test('get_at starts from right get 10th', () => expect(
        new PositionalDecimalNumber([9, 3, 1, 5, 0]).get_at(0)
    ).toEqual(
        0
    ))
    test('set_at replace', () => expect(
        new PositionalDecimalNumber([3, 5, 1, 6, 7, 3, 0, 0, 2]).set_at(4, 8)
    ).toEqual(
        new PositionalDecimalNumber([3, 5, 1, 6, 8, 3, 0, 0, 2])
    ))
    test('set_at extend', () => expect(
        new PositionalDecimalNumber([3, 5, 1, 6, 7, 3, 0, 0, 2]).set_at(15, 4)
    ).toEqual(
        new PositionalDecimalNumber([4, 0, 0, 0, 0, 0, 0, 3, 5, 1, 6, 7, 3, 0, 0, 2])
    ))
})

const pdn_from_nat = (nat: number): PDN =>
    new PositionalDecimalNumber(Math.abs(nat).toString().split('').map((n) => parseInt(n)))

class LongAdditionState {
    constructor(
        readonly digit_index : number,
        readonly carry       : PDN,
        readonly top         : PDN,
        readonly bottom      : PDN,
        readonly answer      : PDN
    ) {}
}
const long_addition_state = (di: number, c: PDN, t: PDN, b: PDN, a: PDN): LongAdditionState => new LongAdditionState(di, c, t, b, a)
const is_long_addition_state = (f: unknown): f is LongAdditionState => f instanceof LongAdditionState

type LAFrameMap = {
    'normal': { input: LongAdditionState, transition_ids: 'add' | 'shift' }
    'carry' : { input: LongAdditionState, transition_ids: 'should_carry' | 'should_not_carry' }
}

type LARequestMap = {
    'digit_answer': { payload: undefined, response: number  }
    'carry_flag'  : { payload: undefined, response: number }
}

type LAError =
    | { type: 'incorrect_digit_answer', expected: number, actual: number }

type LAFrame = Frame<LAFrameMap>

type CHECK = keyof LARequestMap

const cool: CHECK = 'digit_answer'

const long_addition_transition: TransitionFunction<LAFrameMap, LARequestMap, LAError, PDN> = (frame, transition_id) => {
    const { digit_index, carry, top, bottom, answer } = frame.value
    const digit_index_upper_bound = Math.max(...[carry, top, bottom, answer].map((n) => n.digits.length))
    if (digit_index >= digit_index_upper_bound)
        return transition_result(answer)
    if (frame.type === 'normal') {
        if (transition_id === 'add') {
            return transition_input_request('digit_answer', (response) => {
                if (!is_number(response) || !is_integer(response))
                    throw new Error(`Expected a number as a digt answer, instead got ${response}`)
                const expected_answer = top.get_at(digit_index) + bottom.get_at(digit_index)
                if (response !== expected_answer)
                    return transition_error({ type: 'incorrect_digit_answer', expected: expected_answer, actual: response })
                return result_of({
                    type: 'carry', value: long_addition_state(
                        digit_index,
                        carry,
                        top,
                        bottom,
                        answer.set_at(digit_index, response)
                    )
                })
            })
        } else if (transition_id === 'shift') {
            
        }
        throw new Error
    } else if (frame.type === 'carry') {
        if (transition_id === 'should_carry') {
        } else if (transition_id === 'should_not_carry') {
        }
        throw new Error
    }
    throw new Error
}
