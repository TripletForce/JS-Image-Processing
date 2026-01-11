import ShaderPipeline from './WebGL_Translation/ShaderPipline.js';

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");


let pipeline = new ShaderPipeline(gl, canvas.clientWidth, canvas.clientHeight)

pipeline.addDependency(`
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

pipeline
  .loadImage("./image.jpg")
  .executeProgram("edge_detection", {
    uWidth: 500,        // TODO: need to change this. How about if convolution is imported, so is uWidth and uHeight?
    uHeight: 700
  })
  .sendToCanvas();

pipeline.submit();