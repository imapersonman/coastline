import { AnyCoastlineError, display_coastline_error, is_coastline_error } from "./error"
import { AnyCoastlineObject, display_coastline_object, is_coastline_object } from "./object"
import { display_operator_application, is_operator_app, OperatorApplication } from "./operator"
import { display_options_tree, is_options_tree, OptionsTree } from "./options_tree"
import { AnyCoastlineRequest, display_coastline_request, is_coastline_request } from "./request"

export type CoastlineControl = AnyCoastlineObject | OperatorApplication | OptionsTree | AnyCoastlineRequest | AnyCoastlineError

export const display_coastline_control = (c: CoastlineControl) => {
    if (is_coastline_object(c))
        return { control_type: 'Object', control: display_coastline_object(c) }
    if (is_operator_app(c))
        return { control_type: 'OperatorApplication', control: display_operator_application(c) }
    if (is_options_tree(c))
        return { control_type: 'OptionsTree', control: display_options_tree(c) }
    if (is_coastline_request(c))
        return { control_type: 'Request', control: display_coastline_request(c) }
    if (is_coastline_error(c))
        return { control_type: 'Error', control: display_coastline_error(c) }
    return { control_type: 'UnknownControl', json: JSON.stringify(c) }
}

