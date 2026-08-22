/*

import ShaderPipeline from './WebGL_Translation/ShaderPipline.js';

const canvas = document.getElementById('display-canvas');
const gl = canvas.getContext("webgl");

let pipeline = new ShaderPipeline(gl, canvas.clientWidth, canvas.clientHeight);

pipeline.addDependency(`
    import random
    export vec4 random_pixels(){
        float r = random(vUV) > 0.5 ? 1.0 : 0.0;
        return vec4(r,r,r,1.0);
    }    
`);

pipeline.addDependency(`
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



pipeline.executeProgram("random_pixels")

pipeline.sendToCanvas()



function frame(){
    pipeline.executeProgram("game_of_life");
    
    pipeline.bufferSave('a');
    pipeline.executeProgram("edge_detection")
    pipeline.executeProgram("edge_detection")
    pipeline.sendToCanvas();
    pipeline.bufferLoad('a');

    requestAnimationFrame(frame);
}
frame();



// displays on element 					<canvas id="display-canvas" width="700" height="500"></canvas>

*/