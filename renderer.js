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

function render_expression(expression, canvas_size, font_size, canvas) {
    expression = expression.replaceAll(" ", "")
    if(!canvas) {
        canvas = document.createElement('canvas');
        canvas.width  = canvas_size.x
        canvas.height = canvas_size.y
    }

    const ctx = canvas.getContext('2d');

    font_size = font_size || 24;
    const y = canvas_size.y - font_size - (font_size < 24 ? 3 : 10);
    const spacing = 2;
    ctx.font = `${font_size}pt monospace`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';

    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const regions = find_overline_regions(expression);

    const char_positions = [];
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

        if(i == expr_cursor - 1) {
            ctx.fillStyle = '#ffffff22'
            ctx.fillRect(x, y+2, text_size.width, -text_size.alphabeticBaseline);
        }
        console.log(negation_mode, i, negation_begin)
        if( negation_mode && 
            i-1 >= Math.min(negation_begin, expr_cursor-1) && 
            i   <= Math.max(negation_begin, expr_cursor-1)
        ) {
            ctx.fillStyle = '#00ff0033'
            ctx.fillRect(x, y+2, text_size.width, -text_size.alphabeticBaseline);
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

        const overline_y = y - 2 - (5 * (max_level - 1)); 
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
    return count * 12
}

