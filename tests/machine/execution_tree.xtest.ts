import { CoastlineControl } from "../../src/machine/control";
import { AnyCoastlineError  } from "../../src/machine/error";
import { fib_def, NatEVM, NatOVM } from "../../src/machine/examples";
import { choice, CoastlineScript } from "../../src/machine/machine";
import { AnyCoastlineObject, obj } from "../../src/machine/object";
import { operator_app } from "../../src/machine/operator";
import { mk_stack } from "../../src/stack";
import { ExecutionTree, run_execution_tree_stack_with_script } from "../../src/machine/execution_tree";

type ExampleOVM = {
    'Natural_Number': number
}

describe('run_execution_tree_stack_with_script', () => {
    const test_etree = (control: CoastlineControl<NatOVM, NatEVM>, script: CoastlineScript<ExampleOVM>, expected_result: AnyCoastlineObject<ExampleOVM> | AnyCoastlineError<NatEVM>) => {
        const etree = ExecutionTree.root_from_control(control)
        // console.log(JSON.stringify(display_execution_tree(etree), undefined, 2))
        const initial_stack = mk_stack(etree)
        run_execution_tree_stack_with_script(initial_stack, script)
        // console.log(JSON.stringify(display_execution_tree(etree), undefined, 2))
        expect(etree.get_result()).toEqual(expected_result)
    }

    test('fib(1)', () => test_etree(
        operator_app(fib_def, [obj('Natural_Number', 1)]),
        [choice('one')],
        obj('Natural_Number', 1)
    ))
    test.only('fib(2)', () => test_etree(
        operator_app(fib_def, [obj('Natural_Number', 2)]),
        [choice('ge_two'), choice('zero'), choice('one')],
        obj('Natural_Number', 2)
    ))
    test('fib(3)', () => test_etree(
        operator_app(fib_def, [obj('Natural_Number', 3)]),
        [choice('ge_two'), choice('one'), choice('ge_two'), choice('zero'), choice('one')],
        obj('Natural_Number', 2)
    ))
    test('fib(6)', () => test_etree(
        operator_app(fib_def, [obj('Natural_Number', 6)]),
        [choice('ge_two'), choice('ge_two'), choice('ge_two'), choice('zero'), choice('one'), choice('ge_two'), choice('one'), choice('ge_two'), choice('zero'), choice('one'), choice('ge_two'), choice('ge_two'), choice('one'), choice('ge_two'), choice('zero'), choice('one'), choice('ge_two'), choice('ge_two'), choice('zero'), choice('one'), choice('ge_two'), choice('one'), choice('ge_two'), choice('zero'), choice('one')],
        obj('Natural_Number', 8)
    ))
    // test.only('build_term()', () => test_etree(
    //     operator_app(build_term_def, []),
    //     [choice('atom'), response(obj('String', 'a'))],
    //     // obj('Term', obj('TermAtom', 'a'))
    //      obj('TermAtom', 'a')
    // ))
})