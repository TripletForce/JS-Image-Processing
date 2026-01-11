import ShaderPipeline from './WebGL_Translation/ShaderPipline.js';

// Opengl Canvas
const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

// Assemble the pipeline
const pipeline = new ShaderPipeline(gl, canvas.clientWidth, canvas.clientHeight);

pipeline.addDependency(`
export vec4 red(){
    return vec4(1.0, 1.0, 0.0, 1.0);
}
`);

pipeline.executeProgram("red");
pipeline.sendToCanvas();