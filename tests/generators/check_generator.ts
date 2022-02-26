/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isEqual } from 'lodash'
import { defined } from '../../src/utilities'

export type CheckedGeneratorEntry<Y, R> =
    | { gen: Y, exp: Y }
    | { gen_missing: Y }
    | { exp_missing: Y }
    | { same: Y }
    | { gen_returned: R, exp_returned: R }
    | { gen_missing_returned: R }
    | { exp_missing_returned: R }
    | { returned: R }
    // Can only throw strings.
    | { exp_thrown: string, gen_thrown: string }
    | { gen_missing_thrown: string }
    | { exp_missing_thrown: string }
    | { thrown: string }
    | { gen_at_limit: Y }

export type GeneratorExpectationYield<Y, I> =
    | { yielded?: Y, continued_with?: I }

export type GeneratorExpectation<Y, R, I> = {
    yields: GeneratorExpectationYield<Y, I>[]
    returns?: R
    throws?: string
}

export type CheckFiniteGeneratorAgainstArrayTest<Y = any, R = any, I = any> = {
    description: string,
    gen: Generator,
    exp: GeneratorExpectation<Y, R, I>,
    limit?: number,
    output: CheckedGeneratorEntry<Y, R>[]
}

export interface GeneratorEquality<Y, R> {
    yields?: (y1: Y, y2: Y) => boolean
    returns?: (r1: R, r2: R) => boolean
}

// DO NOT pass an infinite generator into gen.
export const check_finite_generator_against_array = <Y, R, I>(gen: Generator<Y, R>, exp: GeneratorExpectation<Y, R, I>, limit?: number, equality?: GeneratorEquality<Y, R>): CheckedGeneratorEntry<Y, R>[] => {
    try {
        // the top line is the only one that can throw the caught exception.
        let it = gen.next()
        let index = 0
        let thrown: string | undefined = undefined
        const output: CheckedGeneratorEntry<Y, R>[] = []
        while (it.done === false) {
            if (defined(limit) && index >= limit) {
                output.push({ gen_at_limit: it.value })
                return output
            }
            // If exp finished first
            const current_yielded = exp.yields[index].yielded
            if (index >= exp.yields.length)
                output.push({ exp_missing: it.value })
            // if (!defined(current_yielded))
            //     it = gen.next(exp.yields[index].continued_with)
            else if (defined(current_yielded) && (equality?.yields ?? isEqual)(current_yielded, it.value))
                output.push({ same: it.value })
            else if (defined(current_yielded))
                output.push({ gen: it.value, exp: current_yielded })
            try {
                if (index < exp.yields.length) {
                    const input = exp.yields[index].continued_with
                    if (index < exp.yields.length && defined(input))
                        it = gen.next(input)
                    else
                        it = gen.next()
                } else
                    it = gen.next()
            } catch (error) {
                thrown = (error as Error).message
                // output.push({ exp_missing_thrown: (error as Error).message })
                break
            } finally {
                index++
            }
        }
        // If gen finished first
        if (index < exp.yields.length) {
            for (let remaining_index = index; remaining_index < exp.yields.length; remaining_index++) {
                const current_yielded = exp.yields[remaining_index].yielded
                if (defined(current_yielded))
                    output.push({ gen_missing: current_yielded })
            }
        }

        if (defined(exp.returns) && defined(it.value))
            if ((equality?.returns ?? isEqual)(exp.returns, it.value))
                output.push({ returned: it.value as R })
            else
                output.push({ exp_returned: exp.returns, gen_returned: it.value as R })
        else if (defined(exp.returns))
            output.push({ gen_missing_returned: exp.returns })
        else if (defined(it.value) && !defined(thrown) && !defined(exp.throws))
            output.push({ exp_missing_returned: it.value as R })
        else if (defined(exp.throws) && defined(thrown))
            if (isEqual(exp.throws, thrown))
                output.push({ thrown })
            else
                output.push({ exp_thrown: exp.throws, gen_thrown: thrown })
        else if (defined(exp.throws))
            output.push({ gen_missing_thrown: exp.throws })
        else if (defined(thrown))
            output.push({ exp_missing_thrown: thrown })
        
        return output
    } catch (error) {
        // Premises:
        // 1) The generator hasn't yielded anything.
        // 2) The generator hasn't returned anything.
        // 2) The generator has thrown.
        const thrown = (error as Error).message
        if (defined(exp.throws))
            if (isEqual(exp.throws, thrown))
                return [{ thrown }]
            else
                return [{ gen_thrown: thrown, exp_thrown: exp.throws }]
        const output: CheckedGeneratorEntry<Y, R>[] = []
        for (let remaining_index = 0; remaining_index < exp.yields.length; remaining_index++) {
            const current_yielded = exp.yields[remaining_index].yielded
            if (defined(current_yielded))
                output.push({ gen_missing: current_yielded })
        }
        output.push({ exp_missing_thrown: thrown })
        return output
    }
}

export const partially_check_generator= <Y, R, I>(gen: Generator<Y, R, I>, exp: GeneratorExpectation<Y, R, I>, equality?: GeneratorEquality<Y, R>): CheckedGeneratorEntry<Y, R>[] => {
    try {
        // the top line is the only one that can throw the caught exception.
        let it = gen.next()
        let index = 0
        let thrown: string | undefined = undefined
        const output: CheckedGeneratorEntry<Y, R>[] = []
        while (it.done === false) {
            // If exp finished first
            if (index >= exp.yields.length)
                return output
                // output.push({ exp_missing: it.value })
            const current_yielded = exp.yields[index].yielded
            if ((equality?.yields ?? isEqual)(exp.yields[index].yielded, it.value))
                output.push({ same: it.value })
            else if (defined(current_yielded))
                output.push({ gen: it.value, exp: current_yielded })
            try {
                if (index < exp.yields.length) {
                    const input = exp.yields[index].continued_with
                    if (index < exp.yields.length && defined(input))
                        it = gen.next(input)
                    else
                        it = gen.next()
                } else
                    it = gen.next()
            } catch (error) {
                thrown = (error as Error).message
                if (!defined(exp.throws))
                    throw error
                // output.push({ exp_missing_thrown: (error as Error).message })
                break
            } finally {
                index++
            }
        }
        // If gen finished first
        if (index < exp.yields.length) {
            for (let remaining_index = index; remaining_index < exp.yields.length; remaining_index++) {
                const current_yielded = exp.yields[remaining_index].yielded
                if (current_yielded)
                output.push({ gen_missing: current_yielded })
            }
        }

        if (defined(exp.returns) && defined(it.value))
            if ((equality?.returns ?? isEqual)(exp.returns, it.value))
                output.push({ returned: it.value as R })
            else
                output.push({ exp_returned: exp.returns, gen_returned: it.value as R })
        else if (defined(exp.returns))
            output.push({ gen_missing_returned: exp.returns })
        // It shouldn't matter if a partial generator expectation is missing a return value
        // else if (defined(it.value) && !defined(thrown) && !defined(exp.throws))
        //     output.push({ exp_missing_returned: it.value as R })
        else if (defined(exp.throws) && defined(thrown))
            if (isEqual(exp.throws, thrown))
                output.push({ thrown })
            else
                output.push({ exp_thrown: exp.throws, gen_thrown: thrown })
        else if (defined(exp.throws))
            output.push({ gen_missing_thrown: exp.throws })
        else if (defined(thrown))
            output.push({ exp_missing_thrown: thrown })
        
        return output
    } catch (error) {
        // Premises:
        // 1) The generator hasn't yielded anything.
        // 2) The generator hasn't returned anything.
        // 2) The generator has thrown.
        const thrown = (error as Error).message
        if (defined(exp.throws))
            if (isEqual(exp.throws, thrown))
                return [{ thrown }]
            else
                return [{ gen_thrown: thrown, exp_thrown: exp.throws }]
        throw error
        /*
        const output: CheckedGeneratorEntry<Y, R>[] = []
        for (let remaining_index = 0; remaining_index < exp.yields.length; remaining_index++) {
            const current_yielded = exp.yields[remaining_index].yielded
            if (defined(current_yielded))
                output.push({ gen_missing: current_yielded })
        }
        output.push({ exp_missing_thrown: thrown })
        return output
        */
    }
}

// export const test_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, I, R>, expectation: GeneratorExpectation<T, I, R>) => {
//     const actual = check_finite_generator_against_array(generator, expectation, 1000)
//     const expected = [...expectation.yields.map(({ yielded }) => ({ same: yielded })), ...(defined(expectation.returns) ? [{ returned: expectation.returns }] : []), ...(defined(expectation.throws) ? [{ thrown: expectation.throws }] : [])]
//     test(`${name}`, () => expect(actual).toEqual(expected))
// }

/*
    | { gen: Y, exp: Y }
    | { gen_missing: Y }
    | { exp_missing: Y }
    | { same: Y }
    | { gen_returned: R, exp_returned: R }
    | { gen_missing_returned: R }
    | { exp_missing_returned: R }
    | { returned: R }
    // Can only throw strings.
    | { exp_thrown: string, gen_thrown: string }
    | { gen_missing_thrown: string }
    | { exp_missing_thrown: string }
    | { thrown: string }
    | { gen_at_limit: Y }
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const test_partial_or_finite_generator_expectation = <T = any, _I = any, R = any>(actual: CheckedGeneratorEntry<T, R>[], name: string, yts?: (y: T) => object, rts?: (r: R) => object) => {
    const ryts = defined(yts) ? yts : (a: unknown) => a
    const rrts = defined(rts) ? rts : (a: unknown) => a
    for (const [index, checked_entry] of actual.entries()) {
        if ('gen' in checked_entry && 'exp' in checked_entry)
            test(`${name} - ${index}: check expected and generated`, () => expect(ryts(checked_entry.gen)).toEqual(ryts(checked_entry.exp)))
        else if ('gen_missing' in checked_entry)
            test(`${name} - ${index}: generator has fewer values than expected`, () => expect(undefined).toEqual(ryts(checked_entry.gen_missing)))
        else if ('exp_missing' in checked_entry)
            test(`${name} - ${index}: generator has more values than expected`, () => expect(ryts(checked_entry.exp_missing)).toBeUndefined())
        else if ('same' in checked_entry)
            test(`${name} - ${index}: contains same`, () => expect(ryts(checked_entry.same)).toBeDefined())
        else if ('gen_returned' in checked_entry && 'exp_returned' in checked_entry)
            test(`${name} - ${index}: checked expected returned and generated returned`, () => expect(rrts(checked_entry.gen_returned)).toEqual(rrts(checked_entry.exp_returned)))
        else if ('returned' in checked_entry)
            test(`${name} - ${index}: contains returned`, () => expect(rrts(checked_entry.returned)).toBeDefined())
        else if ('exp_thrown' in checked_entry && 'gen_thrown' in checked_entry)
            test(`${name} - ${index}: generator threw something different than expected`, () => expect(checked_entry.gen_thrown).toEqual(checked_entry.exp_thrown))
        else if ('gen_missing_thrown' in checked_entry)
            test(`${name} - ${index}: generator expected to have thrown`, () => expect(undefined).toEqual(checked_entry.gen_missing_thrown))
        else if ('exp_missing_thrown' in checked_entry)
            test(`${name} - ${index}: did not expect generator to throw`, () => expect(checked_entry.exp_missing_thrown).toBeUndefined())
        else if ('thrown' in checked_entry)
            test(`${name} - ${index}: check expected and generated exception`, () => expect(checked_entry.thrown).toBeDefined())
        else
            test(`${name} - ${index}: case not handled!\n${JSON.stringify(checked_entry)}`, () => expect(true).toEqual(false))
    }
}

export const test_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, R, I>, expectation: GeneratorExpectation<T, R, I>, yts?: (y: T) => object, rts?: (r: R) => object, equality?: GeneratorEquality<T, R>) => {
    const actual = check_finite_generator_against_array(generator, expectation, 1000, equality)
    test_partial_or_finite_generator_expectation(actual, name, yts, rts)
}

export const test_partial_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, R, I>, expectation: GeneratorExpectation<T, R, I>, yts?: (y: T) => object, rts?: (r: R) => object, equality?: GeneratorEquality<T, R>) => {
    const actual = partially_check_generator(generator, expectation, equality)
    test_partial_or_finite_generator_expectation(actual, name, yts, rts)
}