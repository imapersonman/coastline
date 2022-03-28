import { map_lookup_key_not_found, mk_map, RecursiveMap } from "../map/RecursiveMap"
import { defined } from "../utilities"
import { AbstractSyntaxTree, Application, Lambda, Pi, Variable } from "./ast"
import { free_variables } from "./free_variables"
import { is_atom } from "./is_atom"
import { new_variable } from "./new_variable"
import { substitute } from "./substitute"
import { syntactic_equality } from "./syntactic_equality"
import { to_weak_head_normal_form } from "./to_weak_head_normal_form"
import { is_variable } from "./utilities"

// Adding suspensions shouldn't break this implementation as long as we assume two suspensions to be
// unequal to each other mod alpha-beta-eta conversion.
// - Koissi, 3/26/2022.

type Ast = AbstractSyntaxTree

export function beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return beta_eta_delta_equality(mk_map(), ast1, ast2)
}

// For this to work in it's current form, this function has to assume it is well-typed to avoid expanding bound variables.
// This is a bit strange given synthesize's correctness depends on the correctness of this function.
// - i think this is fine given how synthesize is currently implemented but I'd rather change this function (AND TEST IT WELL) just to be safe.
// I think I should start keeping track of bound variables.
// A simple option is to simply remove a lambda's bound variable from defs in the recursive call so that it isn't expanded.

export function beta_eta_delta_equality(defs: RecursiveMap<Ast>, ast1: Ast, ast2: Ast): boolean {
    function whnf_beta_eta_delta_equality(ast1: Ast, ast2: Ast): boolean {
        return atom_beta_eta_equality(ast1, ast2)
            || app_beta_eta_delta_equality(ast1, ast2)
            || pi_beta_eta_delta_equality(ast1, ast2)
            || lambda_beta_eta_delta_equality(ast1, ast2)
            || lambda_left_beta_eta_delta_equality(ast1, ast2)
            || lambda_right_beta_eta_equality(ast1, ast2)
            || expanded_variable_beta_eta_delta_equality(ast1, ast2)
    }

    function expand(ast: Variable): Ast | undefined {
        const found = defs.lookup(ast.id)
        return map_lookup_key_not_found(found) ? undefined : found
    }

    function expanded_variable_beta_eta_delta_equality(v1: Ast, v2: Ast): boolean {
        if (is_variable(v1) && is_variable(v2)) {
            const [ev1, ev2] = [expand(v1), expand(v2)]
            if (defined(ev1) && defined(ev2))
                return beta_eta_delta_equality(defs.remove(v1.id).remove(v2.id), ev1, ev2)
            if (defined(ev1))
                return beta_eta_delta_equality(defs.remove(v1.id), ev1, v2)
            return defined(ev2) && beta_eta_delta_equality(defs.remove(v2.id), v1, ev2)
        } else if (is_variable(v1)) {
            const ev1 = expand(v1)
            return defined(ev1) && beta_eta_delta_equality(defs.remove(v1.id), ev1, v2)
        } else if (is_variable(v2)) {
            const ev2 = expand(v2)
            return defined(ev2) && beta_eta_delta_equality(defs.remove(v2.id), v1, ev2)
        }
        return false


        // const expanded_v1 = expand(v1) 
        // const expanded_v2 = expand(v2)
        // if (is_variable(expanded_v1) && is_variable(expanded_v2))
        //     return syntactic_equality(expanded_v1, expanded_v2)
        // return beta_eta_delta_equality(defs, expanded_v1, expanded_v2)
    }

    function atom_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
        return is_atom(ast1) && is_atom(ast2) && syntactic_equality(ast1, ast2)
        // return (is_variable(ast1) && is_variable(ast2) && expanded_variable_beta_eta_delta_equality(ast1, ast2))
        //     || syntactic_equality(ast1, ast2)
    }

    function app_beta_eta_delta_equality(ast1: Ast, ast2: Ast): boolean {
        const is_canonical = (ast: Ast) => ast instanceof Pi || ast instanceof Lambda
        return ast1 instanceof Application && ast2 instanceof Application
            && !is_canonical(ast1.head) && !is_canonical(ast2.head)
            && whnf_beta_eta_delta_equality(ast1.head, ast2.head)
            && beta_eta_delta_equality(defs, ast1.arg, ast2.arg)
    }

    function replace_variable(to_replace: Variable, with_v: Variable, in_ast: Ast, fvs: Variable[]): Ast {
        return substitute(to_replace, with_v, substitute(with_v, new_variable(fvs, with_v), in_ast))
    }

    function canonical_bodies_beta_eta_delta_equality(ast1: Pi | Lambda, ast2: Pi | Lambda): boolean {
        // we're removing ast2.bound.id because it is the bound variable representing both bound variables
        // in both binders.
        return beta_eta_delta_equality(defs.remove(ast2.bound.id), ast1.scope,
            replace_variable(ast2.bound, ast1.bound, ast2.scope, free_variables([], ast2)))
    }

    function pi_beta_eta_delta_equality(ast1: Ast, ast2: Ast): boolean {
        return ast1 instanceof Pi && ast2 instanceof Pi
            && beta_eta_delta_equality(defs, ast1.type, ast2.type)
            && canonical_bodies_beta_eta_delta_equality(ast1, ast2)
    }

    function lambda_beta_eta_delta_equality(ast1: Ast, ast2: Ast): boolean {
        return ast1 instanceof Lambda && ast2 instanceof Lambda
            && canonical_bodies_beta_eta_delta_equality(ast1, ast2)
    }

    function lambda_left_beta_eta_delta_equality(ast1: Ast, ast2: Ast): boolean {
        return (ast1 instanceof Lambda)
            && !(ast2 instanceof Lambda)
            && beta_eta_delta_equality(defs.remove(ast1.bound.id), ast1.scope, new Application(ast2, ast1.bound))
    }

    function lambda_right_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
        return lambda_left_beta_eta_delta_equality(ast2, ast1)
    }

    return whnf_beta_eta_delta_equality(
        to_weak_head_normal_form(ast1),
        to_weak_head_normal_form(ast2))
}

