import { AbstractSyntaxTree, Application, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "./ast"
import { free_variables } from "./free_variables"
import { is_atom } from "./is_atom"
import { new_variable } from "./new_variable"
import { substitute } from "./substitute"
import { syntactic_equality } from "./syntactic_equality"
import { to_weak_head_normal_form } from "./to_weak_head_normal_form"

type Ast = AbstractSyntaxTree

export function beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return whnf_beta_eta_equality(
        to_weak_head_normal_form(ast1),
        to_weak_head_normal_form(ast2))
}

function whnf_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return atom_beta_eta_equality(ast1, ast2)
        || app_beta_eta_equality(ast1, ast2)
        || pi_beta_eta_equality(ast1, ast2)
        || lambda_beta_eta_equality(ast1, ast2)
        || lambda_left_beta_eta_equality(ast1, ast2)
        || lambda_right_beta_eta_equality(ast1, ast2)
}

function atom_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return is_atom(ast1) && is_atom(ast2)
         && syntactic_equality(ast1, ast2)
}

function app_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    const is_canonical = (ast: Ast) => ast instanceof Pi || ast instanceof Lambda
    return ast1 instanceof Application && ast2 instanceof Application
        && !is_canonical(ast1.head) && !is_canonical(ast2.head)
        && whnf_beta_eta_equality(ast1.head, ast2.head)
        && beta_eta_equality(ast1.arg, ast2.arg)
}

function replace_variable(to_replace: Variable, with_v: Variable, in_ast: Ast, fvs: Variable[]): Ast {
    return substitute(to_replace, with_v, substitute(with_v, new_variable(fvs, with_v), in_ast))
}

function canonical_bodies_beta_eta_equality(ast1: Pi | Lambda, ast2: Pi | Lambda): boolean {
    return beta_eta_equality(ast1.scope,
        replace_variable(ast2.bound, ast1.bound, ast2.scope, free_variables([], ast2)))
}

function pi_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return ast1 instanceof Pi && ast2 instanceof Pi
        && beta_eta_equality(ast1.type, ast2.type)
        && canonical_bodies_beta_eta_equality(ast1, ast2)
}

function is_pi(ast1: Ast): boolean { return ast1 instanceof Pi }

function lambda_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return ast1 instanceof Lambda && ast2 instanceof Lambda
        && canonical_bodies_beta_eta_equality(ast1, ast2)
}

function lambda_left_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return (ast1 instanceof Lambda)
        && !(ast2 instanceof Lambda)
        && beta_eta_equality(ast1.scope, new Application(ast2, ast1.bound))
}

function lambda_right_beta_eta_equality(ast1: Ast, ast2: Ast): boolean {
    return lambda_left_beta_eta_equality(ast2, ast1)
}