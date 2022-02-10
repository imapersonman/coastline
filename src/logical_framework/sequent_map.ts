import { Sequent } from "../construction/sequent"
import { Ast } from "../lambda_pi/ast"
import { beta_eta_equality } from "../lambda_pi/beta_eta_equality"
import { syntactic_equality } from "../lambda_pi/syntactic_equality"
import { ast_in, ast_to_string } from "../lambda_pi/utilities"
import { defined, is_empty, replace_at_index } from "../utilities"
import { Ctx } from "./ctx"

export class SequentMap<V> {
    readonly entries: { key: Sequent, value: V }[]
    constructor(...entries: [Sequent, V][]) {
        // THIS LINE IS HORRIBLE
        this.entries = entries.reduce<{ key: Sequent, value: V }[]>((old_entries, [key, value]) =>
            SequentMap.sequent_in_list(key, old_entries.map(({ key }) => key)) ? old_entries : [...old_entries, { key, value }], [])
    }

    contains(s: Sequent): boolean {
        return defined(this.get(s))
    }

    get(s: Sequent): V | undefined {
        return SequentMap.find_entry_in_list(s, this.entries)?.value
    }

    remove(s: Sequent): SequentMap<V> {
        if (is_empty(this.entries))
            return this
        return new SequentMap(...SequentMap.transform_entries_in_list(this.entries.filter(({ key }) => !SequentMap.sequent_equals_sequent(key, s))))
    }

    public static sequent_equals_sequent = (s1: Sequent, s2: Sequent): boolean => {
        const ast_set_equals_ast_set = (s1: Ast[], s2: Ast[]): boolean => s1.length === s2.length && s1.every((s1_ast) => ast_in(s1_ast, s2))
        const assumptions_equal = ast_set_equals_ast_set(s1.assumptions.entries().map(([,a]) => a), s2.assumptions.entries().map(([,a]) => a))
        const conclusions_equal = syntactic_equality(s1.conclusion, s2.conclusion)
        return assumptions_equal && conclusions_equal
    }

    private static find_entry_in_list<V>(s: Sequent, l: { key: Sequent, value: V }[]): { key: Sequent, value: V, index: number } | undefined {
        const found_entry_index = l.findIndex(({ key }) => SequentMap.sequent_equals_sequent(s, key))
        if (found_entry_index === -1)
            return undefined
        return { ...l[found_entry_index], index: found_entry_index }
    }

    private static transform_entries_in_list<V>(l: { key: Sequent, value: V }[]): [Sequent, V][] {
        return l.map<[Sequent, V]>(({ key, value }) => [key, value])
    }

    private static sequent_in_list = (s: Sequent, l: Sequent[]): boolean => l.some((other_s) => SequentMap.sequent_equals_sequent(s, other_s))

    set(seq: Sequent, value: V): SequentMap<V> {
        const found_seq = SequentMap.find_entry_in_list(seq, this.entries)
        const transformed_entries = this.entries.map<[Sequent, V]>(({ key, value }) => [key, value])
        if (!defined(found_seq))
            return new SequentMap<V>(...transformed_entries, [seq, value])
        return new SequentMap(...replace_at_index<[Sequent, V]>(transformed_entries, found_seq.index, [found_seq.key, value]))
    }

    merge(other: SequentMap<V>): SequentMap<V> {
        return new SequentMap(...SequentMap.transform_entries_in_list(this.entries), ...SequentMap.transform_entries_in_list(other.entries))
    }
}