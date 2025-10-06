function by_id(id) {
    return document.getElementById(id)
}

for(let child of by_id("keypad").children) {
    child.onclick = function(event) {
        handle_keypad(event.target.innerText)
    }
}

let expr_cursor = 0
let expr = ""

let html_table = make_table(expr)

let negation_mode = false
let negation_begin = -1

function handle_keypad(key) {
         if(key == "▲") expr_cursor = 0
    else if(key == "◀") expr_cursor -= expr_cursor > 0 ? 1 : 0
    else if(key == "▶") expr_cursor += expr.length > expr_cursor ? 1 : 0
    else if(key == "▼") expr_cursor = expr.length
    else if(key == "‾") {
        const offset = expr_cursor != 0 ? 1 : 0
        if(!negation_mode) {
            negation_begin = expr_cursor - offset
            expr = expr.slice(0, expr_cursor - offset) + '[' + expr.slice(expr_cursor - offset)
            expr_cursor += 1
        } else {
            negation_begin = -1
            expr = expr.slice(0, expr_cursor) + ']' + expr.slice(expr_cursor)
            expr_cursor += 1
        }
        console.log(expr)
        negation_mode = !negation_mode
    } else if(key == "⌫") {
        if(expr[expr_cursor] == '[') {
            let level = 0
            for(let i = expr_cursor + 1; i < expr.length; i ++) {
                if(expr[i] == '[') level ++
                if(expr[i] == ']') level --

                if(level < 0) {
                    expr = expr.slice(0, i - 1) + expr.slice(i)
                    expr_cursor -= 1
                }
            }

        } else if(expr[expr_cursor] == ']') {
            let level = 0
            for(let i = expr.length - 1; i > expr_cursor; i --) {
                if(expr[i] == '[') level ++
                if(expr[i] == ']') level --

                if(level < 0) {
                    expr = expr.slice(0, i - 1) + expr.slice(i)
                    expr_cursor -= 1
                }
            }


        } 
        if(expr.length > 0) {
            expr = expr.slice(0, expr_cursor - 1) + expr.slice(expr_cursor)
            expr_cursor -= 1
        }
        
    } else {
        key = lookup_key(key)

        expr = expr.slice(0, expr_cursor) + key + expr.slice(expr_cursor)
        expr_cursor += 1
    }

    render_expression(expr, { x: 600, y: 50 }, 24, main_canvas)

    if(html_table != null) {
        try {
            document.body.removeChild(html_table)
        } catch(e) {}
    }

    html_table = make_table(expr)

    if(html_table != null) {
        document.body.appendChild(html_table)
    }
}

function lookup_key(key) {
    const key_map = {
        '&': '&', // AND
        '∨': 'v', // OR
        '⊕': 'o', // XOR
        '⇒': '>', // IMPLY
        '⇔': '=', // EQUAL
        '|': '^', // NAND
        '↓': '|', // NOR
    };

    return key_map[key] || key;

}

