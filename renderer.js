function lookup_token_char(token) {
    const token_char_map = {
        '&': '&', // AND
        'v': '∨', // OR
        'o': '⊕', // XOR
        '>': '⇒', // IMPLY
        '=': '⇔', // EQUAL
        '^': '|', // NAND
        '|': '↓', // NOR
    };

    return token_char_map[token] || token;
}

function find_overline_regions(expr) {
    const stack = [];
    const regions = [];
    for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '[') {
            stack.push(i);
        } else if (expr[i] === ']') {
            const start = stack.pop();
            if (start !== undefined) {
                regions.push([start, i]);
            }
        }
    }
    return regions;
}

function render_expression(expression, canvas_size, font_size, canvas, draw_cursor) {
    expression = expression.replaceAll(" ", "")
    console.log("the expr: ", expression)
    if(!canvas) {
        canvas = document.createElement('canvas');
        canvas.width  = canvas_size.x
        canvas.height = canvas_size.y
    }

    const ctx = canvas.getContext('2d');

    font_size = font_size || 24;
    const spacing = 2;
    ctx.font = `${font_size}pt Courier New`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const regions = find_overline_regions(expression);

    let the_overline = 0
    const char_positions = [];

    const y = canvas.height - ctx.measureText('y').actualBoundingBoxDescent;
    let x = 4;
    if(typeof expr_cursor === 'undefined' || !expr_cursor) {
        ctx.fillStyle = 'white'
        ctx.fillRect(x, y+2, 2, -ctx.measureText("I").alphabeticBaseline);
    }

    for(let i = 0; i < expression.length; i++) {
        const ch = expression[i];
        if(ch === '[' || ch === ']') {
            char_positions.push(x);
            continue;
        }

        const display_ch = lookup_token_char(ch);
        const text_size = ctx.measureText(display_ch)
        ctx.fillStyle = 'white';
        ctx.fillText(display_ch, x, y);
        char_positions.push(x);

        if(draw_cursor) {
            if(i == expr_cursor - 1) {
                ctx.fillStyle = '#ffffff22'
                ctx.fillRect(x, y+2, text_size.width, -text_size.alphabeticBaseline);
            }
            if( negation_mode && 
                i-1 >= Math.min(negation_begin, expr_cursor-1) - (negation_begin < expr_cursor ? 2 : 0) && 
                i   <= Math.max(negation_begin, expr_cursor-1) - (negation_begin < expr_cursor ? 1 : 0)
            ) {
                ctx.fillStyle = '#00ff0033'
                ctx.fillRect(x, y+2, text_size.width, -text_size.alphabeticBaseline);
            }
        }

        x += text_size.width + spacing;
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = font_size < 24 ? 1 : 2;
    for (const [start, end] of regions) {
        let left = start + 1;
        while (left < expression.length && expression[left] === '[') left++;
        let right = end - 1;
        while (right >= 0 && expression[right] === ']') right--;

        let level = 0
        let max_level = 0
        for(let j = start; j < end; j ++) {
            if(expression[j] == '[') level ++ 
            if(expression[j] == ']') level -- 
            if(level > max_level) max_level = level
        }

        const x1 = char_positions[left] ?? 4;
        const display_right = lookup_token_char(expression[right]);
        const x2 = (char_positions[right] ?? x1) + ctx.measureText(display_right).width;

        if(draw_cursor) {
            if(left == expr_cursor || right == expr_cursor - 2) {
                ctx.strokeStyle = "orange"
            } else {
                ctx.strokeStyle = "white"
            }
        }

        const overline_y = y - 2 - (3 * (max_level - 1)); 
        ctx.beginPath();
        ctx.moveTo(x1, overline_y);
        ctx.lineTo(x2, overline_y);
        ctx.stroke();

    }

    return canvas;
}

function cell_size_heuristic(text) {
    let count = 0
    for(let r of text) {
        if(is_any(r, ' ', '[', ']')) continue;
        count ++ 
    }
    return count * 12 + 2
}


function render_monotone_func(truth_table) {
    if(truth_table == null) return null

    canvas = document.createElement('canvas');
    canvas.width  = 600
    canvas.height = 400

    const ctx = canvas.getContext('2d');

    let font_size = 24;
    const spacing = 2;
    ctx.font = `${font_size}pt Courier New`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = "center";
    ctx.fillStyle = 'white';

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let shit = [
        [ [0, 0.5], [1, 0.5] ],
        [ [0, 0.5], [0.5, 0], [0.5, 1],  [1, 0.5] ],

        [   [0, 0.5],
            [0.33, 0], [0.33, 0.5], [0.33, 1],
            [0.66, 0], [0.66, 0.5], [0.66, 1],
            [1, 0.5],
        ]
    ]

    let connections = [
        [ [1], [] ],
        [ [ 1, 2 ], [3], [3], [] ],
        [
            [ 1, 2, 3 ],
            [ 4, 5 ], [ 4, 6 ], [ 5, 6 ],
            [ 7, 7, 7 ],
            [ 7, 7, 7 ],
            [ 7, 7, 7 ],
            []
        ]
    ]

    let help_me_god = variables(truth_table[0][0]).reduce((sum, n) => sum + n) - 1
    let locations   = shit[help_me_god]
    let connection  = connections[help_me_god]

    let metrics = ctx.measureText('0')
    let ox = metrics.width / 2

    for(let i in locations) {
        ctx.fillStyle = "#000000";
        let p = locations[i]
        let x = p[0] * ( canvas.width  * 0.8 ) + canvas.width*0.1 
        let y = p[1] * ( canvas.height * 0.8 ) + canvas.height*0.1 

        let row  = truth_table[(i - 0) + 1]
        let cell = row[row.length - 1]

        ctx.fillStyle = 'white';
        ctx.fillText(cell, x, y); // + 1 for the header row

        for(let j of connection[i]) {
            let p = locations[j]
            let x2 = p[0] * ( canvas.width  * 0.8 ) + canvas.width*0.1 
            let y2 = p[1] * ( canvas.height * 0.8 ) + canvas.height*0.1 

            let x1 = x + ox
                x2 -= ox

            ctx.beginPath();
            ctx.strokeStyle = 'white'
            ctx.moveTo(x1, y)
            ctx.lineTo(x2, y2)
            ctx.stroke();

            ctx.beginPath();
            ctx.arrow(x1, y, x2, y2, [0, 1, -10, 1, -10, 5]);
            ctx.fill();

            let row2  = truth_table[(j - 0) + 1]
            let cell2 = row2[row2.length - 1]

            if((cell-0) > (cell2-0)) {
                let mid_x = (x2 + x1) / 2
                let mid_y = (y2 + y) / 2

                ctx.beginPath();
                ctx.strokeStyle = 'white'
                ctx.moveTo(mid_x - 15, mid_y - 15)
                ctx.lineTo(mid_x + 15, mid_y + 15)
                ctx.stroke();

                ctx.beginPath();
                ctx.strokeStyle = 'white'
                ctx.moveTo(mid_x + 15, mid_y - 15)
                ctx.lineTo(mid_x - 15, mid_y + 15)
                ctx.stroke();

            }

        }
    }


    return canvas
}
