import { Sequent } from "../construction/sequent"
import { Ast } from "../lambda_pi/ast"
import { syntactic_equality } from "../lambda_pi/syntactic_equality"
import { defined, replace_at_index } from "../utilities"
import { Ctx } from "./ctx"

type SearchEntry<V> = { n_assumptions: number, assumptions_map: { [id: string]: Ast }, sequent: Sequent, value: V }

export class SequentMap<V> {
    readonly entries: [Sequent, V][]
    private readonly search_list: SearchEntry<V>[]

    constructor(...entries: [Sequent, V][]) {
        const search_entry_from_entry = ([s, v]: [Sequent, V]): SearchEntry<V> => ({
            n_assumptions: s.assumptions.entries().length,
            assumptions_map: s.assumptions.entries().reduce<{ [id: string]: Ast }>((acc, [id, type]) => ({ ...acc, [id]: type }), {}),
            sequent: s,
            value: v
        })
        const entry_from_search_list = ({ sequent, value }: SearchEntry<V>): [Sequent, V] => [sequent, value]
        this.search_list = entries.map(search_entry_from_entry).reduce<SearchEntry<V>[]>((acc, se) => defined(acc.find((prev_se) => this.search_entry_equals_sequent(prev_se, se.sequent))) ? acc : [...acc, se], [])
        this.entries = this.search_list.map(entry_from_search_list)
    }

    contains(s: Sequent): boolean {
        return defined(this.get(s))
    }

    get(s: Sequent): V | undefined {
        return this.search_list.find((se) => this.search_entry_equals_sequent(se, s))?.value
    }

    private search_entry_equals_sequent(se: SearchEntry<V>, s: Sequent) {
        const assumptions_equal_assumptions_map = (assumptions: Ctx, assumptions_map_length: number, assumptions_map: { [id: string]: Ast }): boolean =>
            assumptions_map_length === assumptions.entries().length
            && assumptions.entries().every(([id, type]) => defined(assumptions_map[id]) && syntactic_equality(assumptions_map[id], type))
        return assumptions_equal_assumptions_map(s.assumptions, se.n_assumptions, se.assumptions_map) && syntactic_equality(s.conclusion, se.sequent.conclusion)
    }

    set(seq: Sequent, value: V): SequentMap<V> {
        const found_seq_index = this.search_list.findIndex((se) => this.search_entry_equals_sequent(se, seq))
        if (found_seq_index === -1)
            return new SequentMap<V>(...this.entries, [seq, value])
        return new SequentMap(...replace_at_index<[Sequent, V]>(this.entries, found_seq_index, [this.entries[found_seq_index][0], value]))
    }

    merge(other: SequentMap<V>): SequentMap<V> {
        return new SequentMap(...this.entries, ...other.entries)
    }
}