package main

import "core:fmt"
import rl "vendor:raylib"

Vector :: rl.Vector2

main :: proc() {
    
    // rl.SetConfigFlags({ .WINDOW_RESIZABLE })
    // rl.InitWindow(1280, 720, "bcalc")
    // rl.SetTargetFPS(60)

    // for !rl.WindowShouldClose() {
    //     rl.BeginDrawing()
    //     defer rl.EndDrawing()
    //     rl.ClearBackground({ 0, 0, 0, 255 })
    // 
    // 
    // 
    // }

    text := "xvy&[zow]&x"
    text_copy := text
    root := parse_operator(&text_copy)

    print_ast(root)

    interpret(root, { false, false, false, false }, true)
    fmt.println()

    vars := variables(text)
    for x in 0..=vars[0] {
        for y in 0..=vars[1] {
            for z in 0..=vars[2] {
                for w in 0..=vars[3] {
                    fmt.print(x, y, z, w, "| ")
                    answer := interpret(root, { bool(x), bool(y), bool(z), bool(w) })

                    fmt.println(int(answer))
                }
            }
        }
    }

}

// use bcalc-bad? idk HTML version
// and then just add Canvas for input
// and use all the extra fun crap otherwise
// maybe tables can be tables with more canvas-es?


// + savidualumas su rodyklytėmis // maybe make it look like a lever? small lime light?
// + monotoniškos funkcijos
// - tiesinės visiškai kitaip...
