import { Program, Buffer } from "./WebGL_Translation/core.js";
import DependencyForge from "./WebGL_Translation/dependencyforge.js";

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

// Assemble the program
const df = new DependencyForge();

df.registerShaderDependency(`
@export hash

float hash(vec2 p) {
    // a classic sin(dot()) hash
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
`);

df.registerShaderDependency(`
@export rand

 rand(){

}
`);

df.registerShaderDependency(`
@export red

vec4 red(){
    return vec4(1.0, 0.0, 0.0, 1.0);
}
`);

const code = df.build("red");

// Render the program
const program = new Program(gl, code);
program.execute(null, null, canvas.clientWidth, canvas.clientHeight);