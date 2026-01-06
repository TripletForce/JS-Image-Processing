
// loads image.png in base directory and displays it.


import { loadImage, Program, Buffer } from "./WebGL_Translation/core.js";
import DependencyForge from "./WebGL_Translation/dependencyforge.js";

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

(async () => {
    // Load image
    const image = await loadImage(gl, "./image.png");

    // Assemble shader
    const df = new DependencyForge();
    df.registerShaderDependency(`
export vec4 red(){
    return texture2D(uTexture, vUV);
}
    `);

    const code = df.build("red");

    // Create program
    const program = new Program(gl, code);

    // Render image → canvas
    program.execute(
        image,                      // src (texture)
        null,                       // dest (canvas)
        canvas.clientWidth,
        canvas.clientHeight
    );
})();