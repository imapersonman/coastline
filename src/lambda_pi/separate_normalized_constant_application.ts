import { Application, Ast, Constant, Variable } from "./ast"
import { ast_to_string, is_application, is_constant, is_variable } from "./utilities"

export const separate_normalized_application = (app: Application): { head: Variable | Constant, args: Ast[] } => {
    if (is_constant(app.head) || is_variable(app.head))
        return { head: app.head, args: [app.arg] }
    if (!is_application(app.head))
        throw new Error(`Given Application head is neither an Application nor a Constant.  Did you forget to normalize the argument?\n${ast_to_string(app.head)}`)
    const { head, args } = separate_normalized_application(app.head)
    return { head, args: [...args, app.arg] }
}