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

    const mat3 verticalWeights = mat3(
        1.0,  1.0,  1.0,
        0.0,  0.0,  0.0,
        -1.0, -1.0, -1.0
    );

    const mat3 horizontalWeights = mat3(
        1.0,  0.0,  -1.0,
        1.0,  0.0,  -1.0,
        1.0,  0.0,  -1.0
    );

    vec4 verticlalEdges = convolution(texel, verticalWeights);
    vec4 horizontalEdges = convolution(texel, horizontalWeights);
    return abs(verticlalEdges) + abs(horizontalEdges);
}
`);

(async () => {
    // Load image
    const image = await loadImage(gl, "./lego.png");

    // Run program
    const edgeDetect = new Program(gl, df.build("edge_detection"), true);

    edgeDetect.execute(
        image,
        null,
        canvas.clientWidth,
        canvas.clientHeight,
        {
            uWidth: image.width,
            uHeight: image.height
        }
    );
})();