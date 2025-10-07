// operator map (ASCII to meaning)
const operators = {
    '&': 'AND',
    'v': 'OR',
    'o': 'XOR',
    '>': 'IMPLIES',
    '=': 'EQUAL',
    '^': 'NAND',
    '|': 'NOR',
};

// check helpers
function is_operator(ch) {
    return Object.keys(operators).includes(ch);
}
function is_any(ch, ...values) {
    return values.includes(ch);
}

// AST Node
class Node {
    constructor(val, lhs = null, rhs = null) {
        this.val = val;
        this.lhs = lhs;
        this.rhs = rhs;
    }
}

// --- Parsing ---

function parse(expr_ref) {
    if (expr_ref.value.length === 0) return null;

    const token = expr_ref.value[0];
    expr_ref.value = expr_ref.value.slice(1);

    if (is_operator(token)) return parse_operator(expr_ref);

    if (token === '[') {
        const node = parse_operator(expr_ref);
        const close = expr_ref.value[0];
        expr_ref.value = expr_ref.value.slice(1);

        const not_node = new Node('[');
        not_node.lhs = node;
        return not_node;
    }

    if (token === '(') {
        const node = parse_operator(expr_ref);
        const close = expr_ref.value[0];
        expr_ref.value = expr_ref.value.slice(1);
        return node;
    }

    // literal or variable
    return new Node(token);
}

function parse_operator(expr_ref, min_prec = -1) {
    let lhs = parse(expr_ref);
    if (!lhs) return null;

    while (expr_ref.value.length > 0) {
        const node = parse_inc_prec(expr_ref, lhs, min_prec);
        if (node === lhs) break;
        lhs = node;
    }

    return lhs;
}

function parse_inc_prec(expr_ref, lhs, min_prec) {
    const operator = expr_ref.value[0];
    if (!is_operator(operator)) return lhs;

    const prec = operator === '&' ? 2 : 1;
    if (min_prec >= prec) return lhs;

    expr_ref.value = expr_ref.value.slice(1);

    const node = new Node(operator);
    node.lhs = lhs;
    node.rhs = parse_operator(expr_ref, prec);
    if(!node.rhs) return lhs;

    return node;
}

// --- Interpretation ---

let the_table = [ ]
let the_row   = [ ]
let the_cell  = ""

function print_inline(node) {
    if(node.val == '[')  the_cell += "[ "
    if(node.lhs != null) print_inline(node.lhs)
    if(node.val != '[')  the_cell += node.val + " "
    if(node.rhs != null) print_inline(node.rhs)
    if(node.val == '[')  the_cell += "] "
}

function interpret(node, vars, print_heading) {
    let out
    if(node == null) return null
    switch(node.val) {
        case '[': out = !interpret(node.lhs, vars, print_heading); break
        case '&': out =  and(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case 'v': out =   or(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case 'o': out =  xor(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case '>': out =  imp(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case '=': out =  equ(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case '^': out =  nor(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case '|': out = nand(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading)); break
        case '0': out = false;   break
        case '1': out = true;    break
        case 'x': out = vars[0]; break
        case 'y': out = vars[1]; break
        case 'z': out = vars[2]; break
        case 'w': out = vars[3]; break
        default:
            throw new Error(`invalid node value ${node.val}`);
    }

    if(!is_any(node.val, 'x', 'y', 'z', 'w')) {
        if(print_heading) {
            print_inline(node)
            the_row.push(the_cell)
            the_cell = ""
        } else {
            the_cell += ~~out
            the_row.push(the_cell)
            the_cell = ""
        }
    }

    return out
}

function and(a, b)  { return a && b }
function  or(a, b)  { return a || b }
function xor(a, b)  { return (a || b) && !(a && b) }
function imp(a, b)  { return !a || (a && b) }
function equ(a, b)  { return a == b }
function nor(a, b)  { return !(a || b) }
function nand(a, b) { return !(a && b) }

// --- Utility: gather variables present in expression ---
function variables(text) {
    const result = [0, 0, 0, 0];
    for (const ch of text) {
        if (ch === 'x') result[0] = 1;
        if (ch === 'y') result[1] = 1;
        if (ch === 'z') result[2] = 1;
        if (ch === 'w') result[3] = 1;
    }
    return result;
}

function make_table(text) {
    if(text.length == 0) return null

    the_table = []
    the_row = []
    the_cell = ""

    const root = parse_operator({ value: text });

    const vars_present = variables(text);
    if(vars_present[0]) the_cell += "x "
    if(vars_present[1]) the_cell += "y "
    if(vars_present[2]) the_cell += "z "
    if(vars_present[3]) the_cell += "w "

    the_row.push(the_cell.trim())
    the_cell = ""

    interpret(root, [false, false, false, false], true)
    the_table.push(the_row)
    the_row = [ ]

    for (let x = 0; x <= vars_present[0]; x++) {
        for (let y = 0; y <= vars_present[1]; y++) {
            for (let z = 0; z <= vars_present[2]; z++) {
                for (let w = 0; w <= vars_present[3]; w++) {
                    if(vars_present[0]) the_cell += x + ' '
                    if(vars_present[1]) the_cell += y + ' '
                    if(vars_present[2]) the_cell += z + ' '
                    if(vars_present[3]) the_cell += w + ' '

                    the_row.push(the_cell.trim())
                    the_cell = ""

                    interpret(root, [!!x, !!y, !!z, !!w]);
                    the_table.push(the_row)
                    the_row = [ ]
                }
            }
        }
    }

    const table = document.createElement('table');
    table.border = "1";

    let i = 0
    for(let row of the_table) {
        const tr = document.createElement('tr');

        for(let cell of row) {
            let td;
            if(i == 0) td = document.createElement('th');
            else       td = document.createElement('td');

            if (i == 0) {
                const canvas = render_expression(cell, { x: cell_size_heuristic(cell), y: 36 }, 12, null, false);
                td.appendChild(canvas);
            } else { td.textContent = cell; }

            tr.appendChild(td);
        }
        table.appendChild(tr);
        i ++
    }

    return table;
}



function make_dual_func(expr_ref) {
    expr_ref = expr_ref.replaceAll('x', "[x]")
    expr_ref = expr_ref.replaceAll('y', "[y]")
    expr_ref = expr_ref.replaceAll('z', "[z]")
    expr_ref = expr_ref.replaceAll('w', "[w]")
    expr_ref = '[' + expr_ref + ']'
    return expr_ref
}

