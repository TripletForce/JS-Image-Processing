import { Program, Buffer } from "./WebGL_Translation/core.js";
import DependencyForge from "./WebGL_Translation/dependencyforge.js";

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

// Assemble the program
const df = new DependencyForge();

df.registerShaderDependency(`
import random
export vec4 random_pixels(){
    float r = random(vUV) > 0.5 ? 1.0 : 0.0;
    return vec4(r,r,r,1.0);
}    
`);

df.registerShaderDependency(`
uniform vec2 uTexelSize;

float cell(vec2 offset) {
    return texture2D(uTexture, vUV + (uTexelSize * offset)).x > 0.5 ? 1.0 : 0.0;
}

export float game_of_life() {
    float neighbors = 0.0;

    neighbors += cell(vec2( 1.0,  0.0));
    neighbors += cell(vec2( 1.0,  1.0));
    neighbors += cell(vec2( 0.0,  1.0));
    neighbors += cell(vec2(-1.0,  0.0));
    neighbors += cell(vec2(-1.0, -1.0));
    neighbors += cell(vec2( 0.0, -1.0));
    neighbors += cell(vec2( 1.0, -1.0));
    neighbors += cell(vec2(-1.0,  1.0));

    float current = cell(vec2(0.0));

    // Death
    if (current > 0.5 && (neighbors < 2.0 || neighbors > 3.0)) {
        return 0.0;
    }

    // Birth
    if (current < 0.5 && neighbors == 3.0) {
        return 1.0;
    }

    return current;
}
`);

df.registerShaderDependency(`
export vec4 red(){
    return vec4(1.0, 0.0, 0.0, 1.0);
}
`);

let buffer = new Buffer(gl, canvas.clientWidth, canvas.clientHeight);



const red_program = new Program(gl, df.build("red"), true);
const pass_program = new Program(gl, df.build("pass"), true);

red_program.execute(null, buffer, canvas.width, canvas.height);
pass_program.execute(buffer, null, canvas.width, canvas.height);
