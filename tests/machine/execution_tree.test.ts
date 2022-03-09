import { CoastlineControl, display_coastline_control } from "../../src/machine/control";
import { AnyCoastlineError, is_coastline_error  } from "../../src/machine/error";
import { build_term_def, fib_def } from "../../src/machine/examples";
import { choice, CoastlineCommand, CoastlineScript, response } from "../../src/machine/machine";
import { AnyCoastlineObject, display_coastline_object, is_coastline_object, obj } from "../../src/machine/object";
import { OperatorApplication, operator_app } from "../../src/machine/operator";
import { is_options_tree, OptionsTree } from "../../src/machine/options_tree";
// import { AnyCoastlineRequest, is_coastline_request } from "../../src/machine/request";
import { concat_stacks, empty_stack, is_non_empty_stack, mk_stack, pop_entry, push_entry, Stack } from "../../src/stack";
import { defined, display_or_undefined, index_out_of_bounds } from "../../src/utilities";
import { display_coastline_error } from '../../src/machine/error'
import { display_execution_tree, ExecutionTree, run_execution_tree_stack_with_script } from "../../src/machine/execution_tree";

describe('run_execution_tree_stack_with_script', () => {
    const test_etree = (control: CoastlineControl, script: CoastlineScript, expected_result: AnyCoastlineObject | AnyCoastlineError) => {
        const etree = ExecutionTree.root_from_control(control)
        // console.log(JSON.stringify(display_execution_tree(etree), undefined, 2))
        const initial_stack = mk_stack(etree)
        run_execution_tree_stack_with_script(initial_stack, script)
        // console.log(JSON.stringify(display_execution_tree(etree), undefined, 2))
        expect(etree.get_result()).toEqual(expected_result)
    }

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
    test.only('build_term()', () => test_etree(
        operator_app(build_term_def, []),
        [choice('atom'), response(obj('String', 'a'))],
        // obj('Term', obj('TermAtom', 'a'))
         obj('TermAtom', 'a')
    ))
})