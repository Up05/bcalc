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


document.body.appendChild(render_expression_to_canvas('[x]o[[[[yv[z]]]]]', { x: 600, y: 50 }))
