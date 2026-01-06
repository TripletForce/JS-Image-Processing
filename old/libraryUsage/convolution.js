import { loadImage, Program, Buffer } from "./WebGL_Translation/Core.js";
import DependencyForge from "./WebGL_Translation/DependencyForge.js";

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");
const df = new DependencyForge();

df.registerShaderDependency(`
import convolution

uniform float uWidth;
uniform float uHeight;

export vec4 edge_detection() {
    vec2 texel = vec2(1.0 / uWidth, 1.0 / uHeight);

    float weights[9]; 
    weights[0] = 1.0; 
    weights[1] = 1.0; 
    weights[2] = 1.0; 
    weights[3] = 1.0; 
    weights[4] = -8.0; 
    weights[5] = 1.0; 
    weights[6] = 1.0; 
    weights[7] = 1.0; 
    weights[8] = 1.0;

    return convolution(texel, weights);
}
`);

(async () => {
    // Load image
    const image = await loadImage(gl, "./lego.png");

    // Run program
    const grayScale = new Program(gl, df.build("gray_scale"));
    const edgeDetect = new Program(gl, df.build("edge_detection"), true);

    let buffer = new Buffer(gl, image.width, image.height);

    grayScale.execute(
        image,
        buffer,
        image.width,
        image.height
    );

    edgeDetect.execute(
        buffer,
        null,
        canvas.clientWidth,
        canvas.clientHeight,
        {
            uWidth: image.width,
            uHeight: image.height
        }
    );
})();