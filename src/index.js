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

    float verticalWeights[9];
    verticalWeights[0] = 1.0;
    verticalWeights[1] = 1.0;
    verticalWeights[2] = 1.0;
    verticalWeights[3] = 0.0;
    verticalWeights[4] = 0.0;
    verticalWeights[5] = 0.0;
    verticalWeights[6] = -1.0;
    verticalWeights[7] = -1.0;
    verticalWeights[8] = -1.0;

    float horizontalWeights[9];
    horizontalWeights[0] = 1.0;
    horizontalWeights[1] = 0.0;
    horizontalWeights[2] = -1.0;
    horizontalWeights[3] = 1.0;
    horizontalWeights[4] = 0.0;
    horizontalWeights[5] = -1.0;
    horizontalWeights[6] = 1.0;
    horizontalWeights[7] = 0.0;
    horizontalWeights[8] = -1.0;

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