import ShaderPipeline from './WebGL_Translation/ShaderPipline.js';

const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");




let pipeline = new ShaderPipeline(gl, canvas.clientWidth, canvas.clientHeight)

pipeline.addDependency(`
import convolution

export vec4 edge_detection() {
  
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

  vec4 verticlalEdges = convolution(verticalWeights);
  vec4 horizontalEdges = convolution(horizontalWeights);
  return abs(verticlalEdges) + abs(horizontalEdges);
}
`);
/*
pipeline
  .loadImage("./image.jpg")
  .executeProgram("edge_detection")
  .sendToCanvas()
  .submit();
*/


const drawCanvas = document.createElement("canvas");
const ctx = drawCanvas.getContext("2d")
ctx.beginPath();
ctx.arc(95, 50, 40, 0, 2 * Math.PI);
ctx.stroke();


pipeline
  .sendToBuffer(drawCanvas)
  .sendToCanvas()
  .submit();