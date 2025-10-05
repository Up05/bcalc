package main

import "core:fmt"
import "core:strings"

Token :: byte

OperatorKind :: enum {
    AND, OR, XOR,
    IMPLIES, EQU,
    ARROW, LINE,
}

operators : [OperatorKind] Token = {
    .AND     = '&', 
    .OR      = 'v', 
    .XOR     = 'o',
    .IMPLIES = '>', 
    .EQU     = '=',
    .ARROW   = '^', 
    .LINE    = '|',
}

is_operator :: proc(r: Token) -> bool {// {{{
    for operator in operators {
        if r == operator do return true
    }
    return false
}// }}}

is_any :: proc(r: Token, values: ..Token) -> bool {// {{{
    for value in values {
        if r == value do return true
    }
    return false
}// }}}

Node :: struct {
    val : Token,

    lhs: ^Node,
    rhs: ^Node,
}

parse :: proc(expr: ^string) -> ^Node {
    if len(expr^) == 0 do return nil
    token := expr^[0] 
    expr^ = expr^[1:]

    if is_operator(token) do return parse_operator(expr)

    if token == '[' {
        node := parse_operator(expr)

        close := expr^[0]; expr^ = expr^[1:]
        assert(close == ']')

        not := new(Node)
        not.val = token
        not.lhs = node
        return not
    }

    if token == '(' {
        node := parse_operator(expr)
        close := expr^[0]; expr^ = expr^[1:]
        assert(close == ')')
        return node
    }

    node := new(Node)
    node.val = token
    
    return node
}

parse_operator :: proc(expr: ^string, min_prec := -1) -> ^Node {
    lhs := parse(expr)
    if lhs == nil do return nil

    for len(expr) > 0 {
        node := parse_inc_prec(expr, lhs, min_prec)
        if node == lhs do break
        lhs = node
    }

    return lhs
}

parse_inc_prec :: proc(expr: ^string, lhs: ^Node, min_prec: int) -> ^Node {
    node := new(Node)

    operator := expr[0] if len(expr^) > 0 else 0

    if !is_operator(operator) do return lhs

    prec := 2 if operator == operators[.AND] else 1
    if min_prec >= prec do return lhs

    expr^ = expr^[1:]

    node.lhs = lhs
    node.val = operator
    node.rhs = parse_operator(expr, prec)
    assert(node.rhs != nil)

    return node
}

print_ast :: proc(node: ^Node, level := 0) {
    b: strings.Builder
    for i in 0..<level {
        strings.write_string(&b, "  ")
    }
    strings.write_string(&b, "- ")

    strings.write_byte(&b, node.val) 

    fmt.println(strings.to_string(b))
    if node.lhs != nil {
        print_ast(node.lhs, level + 1)
    }
    if node.rhs != nil {
        print_ast(node.rhs, level + 1)
    }
}

print_inline :: proc(node: ^Node) {
    if node.val == '[' do fmt.print("[ ")
    if node.lhs != nil do print_inline(node.lhs)
    if node.val != '[' do fmt.print(rune(node.val), "")
    if node.rhs != nil do print_inline(node.rhs)
    if node.val == '[' do fmt.print("] ")
}

variables :: proc(text: string) -> [4] int {
    count: [4] int
    for r in text {
        switch r {
        case 'x': count[0] = 1
        case 'y': count[1] = 1
        case 'z': count[2] = 1
        case 'w': count[3] = 1
        }
    }
    return count
}

interpret :: proc(node: ^Node, vars: [] bool, print_heading := false) -> (out: bool) {
    defer if !is_any(node.val, 'x', 'y', 'z', 'w') {
        if print_heading {
            print_inline(node) 
            fmt.print("| ")
        } else {
            fmt.print(int(out), "| ")
        }
    }

    switch node.val {
    case '[': out = !interpret(node.lhs, vars, print_heading)

    case '&': out =  and(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
    case 'v': out =   or(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
    case 'o': out =  xor(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
    case '>': out =  imp(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
    case '=': out =  equ(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
    case '^': out =  nor(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
    case '|': out = nand(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))

    case '0': out = false
    case '1': out = true

    case 'x': out = vars[0]
    case 'y': out = vars[1]
    case 'z': out = vars[2]
    case 'w': out = vars[3]

    case: panic("invalid value")
    }

    return out
}

and :: proc(a, b: bool) -> bool { return a && b }
or  :: proc(a, b: bool) -> bool { return a || b }

xor :: proc(a, b: bool) -> bool { return (a || b) && !(a && b) }
imp :: proc(a, b: bool) -> bool { return !a || (a && b) }
equ :: proc(a, b: bool) -> bool { return a == b }

nor  :: proc(a, b: bool) -> bool { return !(a || b) }
nand :: proc(a, b: bool) -> bool { return !(a && b) }
