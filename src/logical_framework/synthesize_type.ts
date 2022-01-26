import { KindSort, Sort } from "./sort";
import { Application, Ast, Constant, Lambda, MetaVariable, Pi, TypeKind, Variable } from "../lambda_pi/ast";
import { beta_eta_equality } from "../lambda_pi/beta_eta_equality";
import { new_variable } from "../lambda_pi/new_variable";
import { substitute } from "../lambda_pi/substitute";
import { MapLookupKeyNotFound, RecursiveMap } from "../map/RecursiveMap";
import { Ctx } from "./ctx";
import { Env } from "./env";
import { Sig } from "./sig";
import { BadChildSort, FailedCheck, FailedCheckFamilyOrKind, FailedCheckObjectOrFamily, FailedCheckPi, is_sort_error, RedeclaredVariable, SortError, UndeclaredConstant, UndeclaredMetaVariable, UndeclaredVariable } from "./sort_errors";
import { BadEntry, FailedCtxCheck } from "./ctx_errors";
import { to_beta_normal_form } from "../lambda_pi/to_beta_normal_form";
import { is_ast } from "../lambda_pi/utilities";

const [type_k, kind_s] = [new TypeKind, new KindSort]
const mt_map = RecursiveMap.empty<Ast>()

function sorts_equal(s1: Sort, s2: Sort): boolean {
    return (s1 instanceof KindSort && s2 instanceof KindSort)
        || (!(s1 instanceof KindSort) && !(s2 instanceof KindSort) && beta_eta_equality(s1, s2))
}

function head_key_unique_in_map(map: RecursiveMap<Ast>): boolean {
    return map.tail().lookup(map.head()[0]) instanceof MapLookupKeyNotFound
}

function sort_is_family(env: Env, sort: Sort): boolean {
    const sort_sort = synthesize(env, sort)
    return !is_sort_error(sort_sort) && sorts_equal(sort_sort, new TypeKind)
}

// Checks to make sure the given signature is well-formed.
export function check_sig(sig: Sig): boolean {
    if (sig.is_empty())
        return true
    if (!head_key_unique_in_map(sig))
        return false
    const sort_sort = synthesize(new Env(sig.tail(), mt_map, mt_map), sig.head()[1])
    return !is_sort_error(sort_sort)
        && (sorts_equal(sort_sort, new TypeKind) || sorts_equal(sort_sort, kind_s))
        && check_sig(sig.tail())
}

// Checks to make sure the given context is well-formed assuming the given signature is well-formed.
export function check_ctx(sig: Sig, ctx: Ctx): boolean {
    if (ctx.is_empty())
        return true
    if (!head_key_unique_in_map(ctx))
        return false
    return sort_is_family(new Env(sig, ctx.tail(), mt_map), ctx.head()[1])
         && check_ctx(sig, ctx.tail())
}

export function check_ctx_and_report(sig: Sig, ctx: Ctx): [] | FailedCtxCheck {
    if (ctx.is_empty())
        return []
    if (!head_key_unique_in_map(ctx))
        return new RedeclaredVariable(ctx.head()[0])
    const env = new Env(sig, ctx.tail(), mt_map)
    const id = ctx.head()[0]
    const sort = ctx.head()[1]
    const sort_sort = synthesize(env, sort)
    if (is_sort_error(sort_sort))
        return new BadEntry(id, sort_sort)
    if (!sorts_equal(sort_sort, type_k))
        return new BadEntry(id, new FailedCheck(sort, type_k, sort_sort))
    return check_ctx_and_report(sig, ctx.tail())
}

export function check_meta_ctx(sig: Sig, ctx: Ctx, mctx: Ctx): boolean {
    if (mctx.is_empty()) return true
    if (!head_key_unique_in_map(mctx)) return false
    const sort_sort = synthesize(new Env(sig, ctx, mctx.tail()), mctx.head()[1])
    return !is_sort_error(sort_sort)
        && (sorts_equal(sort_sort, new TypeKind) || sorts_equal(sort_sort, kind_s))
        && check_meta_ctx(sig, ctx, mctx.tail())
}

// Checks to make sure thr given Env is well-formed.
export function check_env(env: Env): boolean {
    return check_sig(env.sig) && check_ctx(env.sig, env.ctx) && check_meta_ctx(env.sig, env.ctx, env.mctx)
}

export function check(env: Env, ast: Ast, sort: Sort): boolean {
    const synthed = synthesize(env, ast)
    return !is_sort_error(synthed) && sorts_equal(synthed, sort)
}

export function check_and_report(env: Env, ast: Ast, sort: Sort): true | SortError {
    const synthed = synthesize(env, ast)
    if (is_sort_error(synthed)) return synthed
    if (!sorts_equal(synthed, sort)) return new FailedCheck(ast, sort, synthed)
    return true
}

export function check_family_or_kind(env: Env, ast: Ast): Sort | SortError {
    const sort = synthesize(env, ast)
    if (is_sort_error(sort))
        return sort
    if (!sorts_equal(sort, type_k) && !sorts_equal(sort, kind_s))
        return new FailedCheckFamilyOrKind(ast, sort)
    return sort
}

export function check_object_or_family(env: Env, ast: Ast): Sort | SortError {
    const sort = synthesize(env, ast)
    if (is_sort_error(sort))
        return sort
    if (sorts_equal(sort, kind_s))
        return new BadChildSort(ast, new FailedCheckObjectOrFamily(ast, sort))
    return sort
}

// Synthesizes the given Asts sort assuming the given signature and context are well-formed.
export function synthesize(env: Env, ast: Ast): Sort | SortError {
    // simplest case - TypeKind with mt sig, ctx
    const synth_from_type_kind = (env: Env, ast: Ast) => ast instanceof TypeKind ? kind_s : undefined
    const synth_from_constant = (env: Env, ast: Ast) => {
        if (!(ast instanceof Constant)) return undefined
        const sort = env.sig.lookup(ast.id)
        if (sort instanceof MapLookupKeyNotFound) return new UndeclaredConstant(ast)
        return sort
    }
    const synth_from_variable = (env: Env, ast: Ast) => {
        if (!(ast instanceof Variable)) return undefined
        const sort = env.ctx.lookup(ast.id)
        if (sort instanceof MapLookupKeyNotFound) return new UndeclaredVariable(ast)
        return sort
    }
    const synth_from_meta_variable = (env: Env, ast: Ast) => {
        if (!(ast instanceof MetaVariable)) return undefined
        const sort = env.mctx.lookup(ast.id)
        if (sort instanceof MapLookupKeyNotFound) return new UndeclaredMetaVariable(ast)
        return sort
    }
    const synth_from_pi = (env: Env, ast: Ast) => {
        const { sig, ctx, mctx } = env
        if (!(ast instanceof Pi)) return undefined
        if (!(ctx.lookup(ast.bound.id) instanceof MapLookupKeyNotFound))
            return new BadChildSort(ast, new RedeclaredVariable(ast.bound))
        const type_sort = synthesize(env, ast.type)
        if (is_sort_error(type_sort))
            return new BadChildSort(ast, type_sort)
        if (!sorts_equal(type_sort, type_k))
            return new BadChildSort(ast, new FailedCheck(ast.type, type_k, type_sort))
        const checked_scope_sort = check_family_or_kind(new Env(sig, ctx.add(ast.bound.id, ast.type), mctx), ast.scope)
        if (is_sort_error(checked_scope_sort))
            return new BadChildSort(ast, checked_scope_sort)
        return checked_scope_sort
    }
    const synth_from_lambda = (env: Env, ast: Ast) => {
        const { sig, ctx, mctx } = env
        if (!(ast instanceof Lambda)) return undefined
        if (!(ctx.lookup(ast.bound.id) instanceof MapLookupKeyNotFound))
            return new BadChildSort(ast, new RedeclaredVariable(ast.bound))
        const type_sort = synthesize(env, ast.type)
        if (is_sort_error(type_sort))
            return new BadChildSort(ast, type_sort) 
        if (!sorts_equal(type_sort, type_k))
            return new BadChildSort(ast, new FailedCheck(ast.type, type_k, type_sort))
        const checked_scope_sort = check_object_or_family(new Env(sig, ctx.add(ast.bound.id, ast.type), mctx), ast.scope)
        if (is_sort_error(checked_scope_sort))
            return new BadChildSort(ast, checked_scope_sort)
        const variables_to_avoid = ctx.domain()
        const new_bound = new_variable(variables_to_avoid, ast.bound)
        const new_scope = substitute(ast.bound, new_bound, checked_scope_sort)
        return new Pi(new_bound, ast.type, new_scope)
    }
    const synth_from_application = (env: Env, ast: Ast) => {
        if (!(ast instanceof Application)) return undefined
        const major_sort = synthesize(env, ast.head)
        if (is_sort_error(major_sort))
            return new BadChildSort(ast, major_sort)
        if (!(major_sort instanceof Pi))
            return new BadChildSort(ast, new FailedCheckPi(ast.head, major_sort))
        const minor_sort = synthesize(env, ast.arg)
        if (is_sort_error(minor_sort))
            return new BadChildSort(ast, minor_sort)
        if (!sorts_equal(minor_sort, major_sort.type))
            return new BadChildSort(ast, new FailedCheck(ast.arg, major_sort.type, minor_sort))
        return substitute(major_sort.bound, ast.arg, major_sort.scope)
    }
    const result = pass_synth_or_fail(env, ast,
        synth_from_type_kind,
        synth_from_constant,
        synth_from_variable,
        synth_from_meta_variable,
        synth_from_pi,
        synth_from_lambda,
        synth_from_application)
    if (!is_ast(result))
        return result
    return to_beta_normal_form(result)
}

function pass_synth_or_fail(env: Env, ast: Ast,
                            ...synthesizers: ((env: Env, ast: Ast) => Sort | SortError | undefined)[]): Sort | SortError {
    for (const synth of synthesizers) {
        const synthed = synth(env, ast)
        if (synthed !== undefined)
            return synthed
    }
    throw new Error(`Can't synthesize sort of unrecognized Ast:\n${ast}`)
}