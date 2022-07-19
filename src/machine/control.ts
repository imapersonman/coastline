import { AnyCoastlineError, display_coastline_error, is_coastline_error, ErrorValueMap, CoastlineSystemError } from "./error"
import { AnyCoastlineObject, display_coastline_object, is_coastline_object, ObjectValueMap } from "./object"
import { display_operator_application, is_operator_app, OperatorApplication } from "./operator"
import { display_options_tree, is_options_tree, OptionsTree } from "./options_tree"
import { AnyCoastlineRequest2, is_coastline_request2 } from "./request"
// import { AnyCoastlineRequest, display_coastline_request, is_coastline_request } from "./request"

export type CoastlineControl<OVM extends ObjectValueMap, EVM extends ErrorValueMap> =
    | AnyCoastlineObject<OVM>
    | OperatorApplication<OVM, EVM>
    | OptionsTree<OVM, EVM>
    | AnyCoastlineRequest2<OVM>
    | AnyCoastlineError<EVM>
    | CoastlineSystemError<OVM>

export const display_coastline_control = <OVM extends ObjectValueMap, EVM extends ErrorValueMap>(c: CoastlineControl<OVM, EVM>, display_object: (o: AnyCoastlineObject<OVM>) => any = JSON.stringify) => {
    if (is_coastline_object<OVM>(c))
        return { control_type: 'Object', control: display_coastline_object(c, display_object) }
    if (is_operator_app<OVM, EVM>(c))
        return { control_type: 'OperatorApplication', control: display_operator_application(c) }
    if (is_options_tree<OVM, EVM>(c))
        return { control_type: 'OptionsTree', control: display_options_tree(c) }
    if (is_coastline_request2(c))
        return { control_type: 'Request', object_types: c.object_types }
    if (is_coastline_error<EVM>(c))
        return { control_type: 'Error', control: display_coastline_error(c) }
    return { control_type: 'UnknownControl', json: JSON.stringify(c) }
}