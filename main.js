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

let negation_mode = false
let negation_begin = -1

function handle_keypad(key) {
    if(key == "▲") { 
        expr_cursor = 0 

    } else if(key == "◀") { 
        expr_cursor -= expr_cursor > 0 ? 1 : 0 

    } else if(key == "▶") { 
        expr_cursor += expr.length > expr_cursor ? 1 : 0 

    } else if(key == "▼") { 
        expr_cursor = expr.length 

    } else if(key == "‾") {
        const offset = expr_cursor != 0 ? 1 : 0
        if(!negation_mode) {
            negation_begin = expr_cursor - offset
            // expr = expr.slice(0, expr_cursor - offset) + '[' + expr.slice(expr_cursor - offset)
            // expr_cursor += 1
        } else {
            if(expr_cursor == negation_begin) {
                negation_mode = false
                negation_begin = -1
                render_expression(expr, { x: 600, y: 50 }, 24, main_canvas, true)
                return
            }
            if(expr_cursor < negation_begin) {
                if(!is_operator(expr[expr_cursor+1])) expr_cursor --;
                expr = expr.slice(0, negation_begin+1) + ']' + expr.slice(negation_begin+1)
                expr = expr.slice(0, expr_cursor) + '[' + expr.slice(expr_cursor)
                expr_cursor ++
            } else {
                expr = expr.slice(0, negation_begin) + '[' + expr.slice(negation_begin)
                if(expr_cursor == expr.length) expr_cursor ++ 
                expr = expr.slice(0, expr_cursor+1) + ']' + expr.slice(expr_cursor+1)
                expr_cursor ++
            }
            negation_begin = -1
        }
        negation_mode = !negation_mode
        if(negation_mode)  by_id("not-button").classList += "green"
        if(!negation_mode) by_id("not-button").classList = []
    } else if(key == "⌫") {
        if(expr_cursor == 0) return

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

    render_expression(expr, { x: 600, y: 50 }, 24, main_canvas, true)

    { // !!! PLEASE DON'T FUCKING CLEAR the_table RIGHT AFTER THIS!!! PLEASEEEEEE
        let html_table = make_table(expr)
        try { by_id("table").replaceChildren() } catch(e) {}

        if(html_table != null) {
            by_id("table").appendChild(html_table)
        }
    }

    {
        try { by_id("dual").replaceChildren() } catch(e) {}

        let html_table = make_table(make_dual_func(expr))
        if(html_table != null) {
            by_id("dual").appendChild(html_table)
        }
    }

    {
        try { by_id("mono").replaceChildren() } catch(e) {}

        let diagram = render_monotone_func(the_table)
        if(diagram != null) {
            by_id("mono").appendChild(diagram)
        }
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

