import { Application, Ast, MetaVariable } from "../lambda_pi/ast"
import { beta_eta_equality } from "../lambda_pi/beta_eta_equality"
import _ from "lodash"
import { substitute } from "../lambda_pi/substitute"
import { meta_substitute } from "../lambda_pi/meta_substitute"
import { syntactic_equality } from "../lambda_pi/syntactic_equality"
import { contains } from "../lambda_pi/contains"
import { is_object } from "../utilities"
import { is_ast } from "../lambda_pi/utilities"

export type Substitution = { readonly [key: string]: Ast }
export const is_substitution = (s: any): s is Substitution => is_object(s) && Object.values(s).every(is_ast)
type UnificationEquation = [Ast, Ast]
type UnificationProblem = [Substitution, [Ast, Ast][]]

const get_left = (ue: UnificationEquation): Ast => ue[0]
const get_right = (ue: UnificationEquation): Ast => ue[1]
const get_sub = (up: UnificationProblem): Substitution => up[0]
const get_ues = (up: UnificationProblem): UnificationEquation[] => up[1]
const mk_up = (sub: Substitution, ues: UnificationEquation[]): UnificationProblem => [sub, ues]

const number_of_equations = (up: UnificationProblem) => get_ues(up).length

type RU<R> = R | undefined

export abstract class UnificationError { constructor(readonly up: UnificationProblem) {} }
export class ConflictingEquations extends UnificationError { constructor(readonly up: UnificationProblem, readonly equations: UnificationEquation[]) { super(up) } }
export class RightContainsLeftVariable extends UnificationError { constructor(readonly up: UnificationProblem, readonly l: Ast, readonly r: Ast) { super(up) } }
export class BadSubstitution extends UnificationError { constructor(readonly up: UnificationProblem, readonly child_error: AddConflictingSubstitutionEntry) { super(up) } }
export const is_unification_error = (e: any): e is UnificationError => e instanceof UnificationError

export function unify(up: UnificationProblem): Substitution | UnificationError {
    let mod_up: UnificationProblem | UnificationError = up
    const ues_modifiers = [decompose, delete_ues, swap]
    while (number_of_equations(mod_up) !== 0) {
        const conflicts = get_conflicts(mod_up)
        if (conflicts.length !== 0)
            return new ConflictingEquations(up, conflicts)
        mod_up = eliminate([get_sub(mod_up), run_composed(get_ues(mod_up), ...ues_modifiers)])
        if (mod_up instanceof RightContainsLeftVariable) return new RightContainsLeftVariable(up, mod_up.l, mod_up.r)
        if (mod_up instanceof BadSubstitution) return new BadSubstitution(up, mod_up.child_error)
        if (mod_up instanceof UnificationError) return mod_up
    }
    return get_sub(mod_up)
}

function run_composed<R>(r: R, ...fs: ((r: R) => R)[]): R {
    if (fs.length === 0)
        return r
    return run_composed(fs[0](r), ...fs.slice(1))
}

function swap(ues: UnificationEquation[]): UnificationEquation[] {
    function swap_ue(ue: UnificationEquation): UnificationEquation {
        if (get_left(ue) instanceof MetaVariable)
            return ue
        if (get_right(ue) instanceof MetaVariable)
            return [get_right(ue), get_left(ue)]
        return ue
    }
    const swap_all = (ues: UnificationEquation[]) => ues.map(ue => swap_ue(ue))
    return swap_all(ues)
}

const no_conflict = (l: Ast, r: Ast): boolean =>
        l instanceof MetaVariable || r instanceof MetaVariable
        || (l instanceof Application && r instanceof Application)
        || beta_eta_equality(l, r)

function get_conflicts(up: UnificationProblem): UnificationEquation[] {
    return get_ues(up).filter((ue) => !no_conflict(get_left(ue), get_right(ue)))
}

function decompose(ues: UnificationEquation[]): UnificationEquation[] {
    function decompose_ue(ue: UnificationEquation): UnificationEquation[] {
        const [l, r] = [get_left(ue), get_right(ue)]
        if (l instanceof Application && r instanceof Application)
            return decompose([[l.head, r.head], [l.arg, r.arg]])
        return [ue]
    }
    const empty_ues: UnificationEquation[] = []
    return ues.reduce((acc, ue) => [...acc, ...decompose_ue(ue)], empty_ues)
}

function delete_ues(ues: UnificationEquation[]): UnificationEquation[] {
    return ues.filter(ue => !beta_eta_equality(get_left(ue), get_right(ue)))
}

export class AddConflictingSubstitutionEntry {
    constructor(readonly sub: Substitution, readonly id: string, readonly old_ast: Ast, readonly conflicting_ast: Ast) {}
}

export function add_to_substitution(sub: Substitution, id: string, ast: Ast): Substitution | AddConflictingSubstitutionEntry {
    const mod_sub = _.mapValues(sub, (entry_value) => meta_substitute(new MetaVariable(id), ast, entry_value))
    return simply_add_to_substitution(mod_sub, id, ast)
}

export function simply_add_to_substitution(sub: Substitution, id: string, ast: Ast): Substitution | AddConflictingSubstitutionEntry {
    if (sub[id] === undefined)
        return Object.assign({ [id]: ast }, sub)
    if (beta_eta_equality(ast, sub[id]))
        return sub
    return new AddConflictingSubstitutionEntry(sub, id, sub[id], ast)

}

function pull_out<T>(arr: T[], predicate: (t: T) => boolean): [T | undefined, T[]] {
    let mod_arr: T[] = []
    const rest_after = (a: T[], idx: number) => idx < arr.length ? a.splice(idx + 1) : []
    for (const [idx, t] of arr.entries()) {
        if (predicate(t)) return [t, [...mod_arr, ...rest_after(arr, idx)]]
        else mod_arr.push(t)
    }
    return [undefined, mod_arr]
}

function substitute_ue(sub: Substitution, ue: UnificationEquation): UnificationEquation {
    return [apply_substitution_ast(sub, get_left(ue)), apply_substitution_ast(sub, get_right(ue))]
}

export function apply_substitution_ast(sub: Substitution, ast: Ast): Ast {
    let result = ast
    for (const id in sub)
        result = meta_substitute(new MetaVariable(id), sub[id], result)
    return result
}

function eliminate(up: UnificationProblem): UnificationProblem | UnificationError {
    function eliminate_ue(sub: Substitution, ue: UnificationEquation): UnificationProblem | UnificationError {
        let [l, r] = [get_left(ue), get_right(ue)]
        if (l instanceof MetaVariable) {
            if (contains(r, l))
                return new RightContainsLeftVariable(up, l, r)
            const mod_sub = add_to_substitution(sub, l.id, r)
            if (mod_sub instanceof AddConflictingSubstitutionEntry)
                return new BadSubstitution(up, mod_sub)
            return mk_up(mod_sub, [])
        }
        throw new Error("Shouldn't be reached in eliminate_ue")
    }

    // If eliminate is run after delete, then l and r aren't equal, so we can eliminate
    const can_eliminate_ue = (ue: UnificationEquation) =>
        get_left(ue) instanceof MetaVariable || get_right(ue) instanceof MetaVariable
    const [to_eliminate, rest_ues] = pull_out(get_ues(up), can_eliminate_ue)
    if (to_eliminate === undefined)
        return up
    const mod_up = eliminate_ue(get_sub(up), to_eliminate)
    if (mod_up instanceof UnificationError)
        return mod_up
    const subbed_ues = rest_ues.map(ue => substitute_ue(get_sub(mod_up), ue))
    return [get_sub(mod_up), subbed_ues]
}

export function mk_default_substitution(entries: [string, Ast][]): RU<Substitution> {
    if (entries.length === 0)
        return {}
    const sub = mk_default_substitution(entries.splice(1))
    if (sub === undefined)
        return undefined
    const new_sub = add_to_substitution(sub, entries[0][0], entries[0][1])
    if (new_sub instanceof AddConflictingSubstitutionEntry)
        return undefined
    return new_sub
}
