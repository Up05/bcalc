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

    // operator handled by parse_operator
    if (is_operator(token)) return parse_operator(expr_ref);

    // NOT: [expr]
    if (token === '[') {
        const node = parse_operator(expr_ref);
        const close = expr_ref.value[0];
        expr_ref.value = expr_ref.value.slice(1);
        if (close !== ']') throw new Error('expected ]');

        const not_node = new Node('[');
        not_node.lhs = node;
        return not_node;
    }

    // parentheses
    if (token === '(') {
        const node = parse_operator(expr_ref);
        const close = expr_ref.value[0];
        expr_ref.value = expr_ref.value.slice(1);
        if (close !== ')') throw new Error('expected )');
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
    if (!node.rhs) throw new Error('expected rhs');

    return node;
}

// --- Interpretation ---

function and(a, b)  { return a && b }
function  or(a, b)  { return a || b }
function xor(a, b)  { return (a || b) && !(a && b) }
function imp(a, b)  { return !a || (a && b) }
function equ(a, b)  { return a == b }
function nor(a, b)  { return !(a || b) }
function nand(a, b) { return !(a && b) }


// TODO: literally did not run
// print_heading is bogus, should have default value? I guess undefined == false???
// it does not do the headigns
// it is missing the first part? where the fuck?
// I don't know where the actual printing functions are...
// print_ast unnecesary
// TODO print_inline!!!
// 
function interpret(node, vars, print_heading) {
    let out
    switch(node.val) {
        case '[': out = !interpret(node.lhs, vars, print_heading)
        case '&': out =  and(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case 'v': out =   or(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case 'o': out =  xor(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case '>': out =  imp(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case '=': out =  equ(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case '^': out =  nor(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case '|': out = nand(interpret(node.lhs, vars, print_heading), interpret(node.rhs, vars, print_heading))
        case '0': out = false;
        case '1': out = true;
        case 'x': out = vars[0];
        case 'y': out = vars[1];
        case 'z': out = vars[2];
        case 'w': out = vars[3];
        default:
            throw new Error(`invalid node value ${node.val}`);
    }
}

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

// --- Example run (matches your Odin interface) ---
const text = "xvy&[zow]&x";
const expr_ref = { value: text };
const root = parse_operator(expr_ref);

const vars_present = variables(text);
console.log("vars:", vars_present);

// print truth table (4 vars)
for (let x = 0; x <= vars_present[0]; x++) {
    for (let y = 0; y <= vars_present[1]; y++) {
        for (let z = 0; z <= vars_present[2]; z++) {
            for (let w = 0; w <= vars_present[3]; w++) {
                const result = interpret(root, [!!x, !!y, !!z, !!w]);
                console.log(x, y, z, w, "=>", result ? 1 : 0);
            }
        }
    }
}

