import { Program, Buffer } from "./WebGL_Translation/core.js";
import DependencyForge from "./WebGL_Translation/dependencyforge.js";

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

// Assemble the program
const df = new DependencyForge();

df.registerShaderDependency(`
import random
export float random_pixels(){
    return random(vUV) > 0.5 ? 1.0 : 0.0;
}    
`);

const code = df.build("random_pixels");


// Render the program
const program = new Program(gl, code, true);
program.execute(null, null, canvas.clientWidth, canvas.clientHeight);