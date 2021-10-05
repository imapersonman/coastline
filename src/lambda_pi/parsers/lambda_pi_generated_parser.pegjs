// $ pegjs src/lib/parsers/lambda_pi_generated_parser.pegjs
{
	function curry_list(head, first_arg, rest_args) {
    	if (rest_args.length === 0)
            return { type: "Application", head: head, arg: first_arg }
        const last = rest_args[rest_args.length - 1]
        const mod_rest_args = rest_args.slice(0, -1)
        return {
        	type: "Application",
        	head: curry_list(head, first_arg, mod_rest_args),
            arg: last
        }
    }
}

// Trim the whitespace surrounding the input.
Start = _? expr:Expression _? { return expr }
// An Expression is either an Abstraction, an Application, or a "Factor".
Expression = Abs / App / Factor
// An Identifier is a string starting with an alphabetic character or an underscore, followed by a
// possibly empty list of alphanumeric characters that may include underscores.
Id = head:[A-Za-z_$\-] tail:[A-Za-z0-9_$\-]* { return head + tail.join("") }
// A MetaVariable is an Identifier immediately followed by a "?"
MetaVar "MetaVariable" = id: Id "?" { return { type: "MetaVariable", id: id } }
Type "TypeKind" = "Type" { return { type: "TypeKind" } }
VarConst "VarConst" = id: Id { return { type: "VarConst", id: id } }
// A "Factor" is a TypeKind, a Variable, a Constant, or an Expression surrounded by Parentheses.
Factor = Type / MetaVar / VarConst / "(" _? expr:Expression _? ")" { return expr }
// An Application
App "Application" = head:Factor tail:(_ Factor)+ {
	const args = tail.map(f => f[1])
	return curry_list(head, args[0], args.slice(1))
}

Abs "Abstraction" = absId:("P" / "L") _? "(" _? b:Id _? ":" _? t:Expression _? ")" _? "." _? s:Expression {
	return { type: absId === "P" ? "Pi" : "Lambda", b: b, t: t, s: s }
}

_ "whitespace" = [ \t\n\r]*