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

// Ping pong buffers
let buff1 = new Buffer(gl, canvas.width, canvas.height);
let buff2 = new Buffer(gl, canvas.width, canvas.height);

// Shaders
const background_program = new Program(gl, df.build("random_pixels"));
const game_program = new Program(gl, df.build("game_of_life"));
const pass_program = new Program(gl, df.build("pass"));

// Rendering functions
function render(a, b){
    game_program.execute(a, b, canvas.width, canvas.height, { uTexelSize: [1/canvas.width, 1/canvas.height] });
    pass_program.execute(b, null, canvas.width, canvas.height);
}

function a(){
    render(buff1, buff2);
    requestAnimationFrame(b);
}

function b(){
    render(buff2, buff1);
    requestAnimationFrame(a);
}

// Start rendering
background_program.execute(null, buff1, canvas.width, canvas.height);
requestAnimationFrame(a);