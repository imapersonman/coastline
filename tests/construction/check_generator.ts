import { isEqual } from "lodash"
import { defined } from "../../src/utilities"

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
    | { yielded: Y, continued_with?: I }

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

// DO NOT pass an infinite generator into gen.
export const check_finite_generator_against_array = <Y, R, I>(gen: Generator<Y, R>, exp: GeneratorExpectation<Y, R, I>, limit?: number): CheckedGeneratorEntry<Y, R>[] => {
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
            if (index >= exp.yields.length)
                output.push({ exp_missing: it.value })
            else if (isEqual(exp.yields[index].yielded, it.value))
                output.push({ same: it.value })
            else
                output.push({ gen: it.value, exp: exp.yields[index].yielded })
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
            for (let remaining_index = index; remaining_index < exp.yields.length; remaining_index++)
                output.push({ gen_missing: exp.yields[remaining_index].yielded })
        }

        if (defined(exp.returns) && defined(it.value))
            if (isEqual(exp.returns, it.value))
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
        for (let remaining_index = 0; remaining_index < exp.yields.length; remaining_index++)
            output.push({ gen_missing: exp.yields[remaining_index].yielded })
        throw error
        // output.push({ exp_missing_thrown: thrown })
        return output
    }
}

export const partially_check_generator= <Y, R, I>(gen: Generator<Y, R>, exp: GeneratorExpectation<Y, R, I>): CheckedGeneratorEntry<Y, R>[] => {
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
            else if (isEqual(exp.yields[index].yielded, it.value))
                output.push({ same: it.value })
            else
                output.push({ gen: it.value, exp: exp.yields[index].yielded })
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
            for (let remaining_index = index; remaining_index < exp.yields.length; remaining_index++)
                output.push({ gen_missing: exp.yields[remaining_index].yielded })
        }

        if (defined(exp.returns) && defined(it.value))
            if (isEqual(exp.returns, it.value))
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
        for (let remaining_index = 0; remaining_index < exp.yields.length; remaining_index++)
            output.push({ gen_missing: exp.yields[remaining_index].yielded })
        output.push({ exp_missing_thrown: thrown })
        return output
    }
}

export const test_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, I, R>, expectation: GeneratorExpectation<T, I, R>) => {
    const actual = check_finite_generator_against_array(generator, expectation, 1000)
    const expected = [...expectation.yields.map(({ yielded }) => ({ same: yielded })), ...(defined(expectation.returns) ? [{ returned: expectation.returns }] : []), ...(defined(expectation.throws) ? [{ thrown: expectation.throws }] : [])]
    test(`${name}`, () => expect(actual).toEqual(expected)
    )
}

export const test_partial_generator_expectation = <T = any, I = any, R = any>(name: string, generator: Generator<T, I, R>, expectation: GeneratorExpectation<T, I, R>) => {
    const actual = partially_check_generator(generator, expectation)
    const expected = [...expectation.yields.map(({ yielded }) => ({ same: yielded })), ...(defined(expectation.returns) ? [{ returned: expectation.returns }] : []), ...(defined(expectation.throws) ? [{ thrown: expectation.throws }] : [])]
    test(`${name}`, () => expect(actual).toEqual(expected)
    )
}