import { Sequent } from '../construction/sequent';
import { elaborate_sequent, unelaborate_sequent } from './elaborate';
import { parse_sequent, unparse_sequent } from './parser';
import { is_sequent_error } from './generic_sequent_error';

export const try_parse_then_elaborate_sequent = (assumptions_t: string, conclusion_t: string): Sequent => {
    const parsed = parse_sequent(assumptions_t, conclusion_t)
    if (is_sequent_error(parsed))
        throw new Error(`parser error: ${JSON.stringify(parsed)}`)
    const elaborated = elaborate_sequent(parsed[0], parsed[1])
    if (is_sequent_error(elaborated))
        throw new Error(`sequent error: ${JSON.stringify(elaborated)}`)
    return elaborated
}

export const unelaborate_then_unparse_sequent = (seq: Sequent): string => {
    const unelaborated = unelaborate_sequent(seq)
    return unparse_sequent(unelaborated[0], unelaborated[1])
}