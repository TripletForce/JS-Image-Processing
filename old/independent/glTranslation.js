/* --- Vertex Shader (for both passes) --- */
const vShader = `
attribute vec4 aVertexPosition;
varying vec2 vUV;

void main() {
    gl_Position = aVertexPosition;
    vUV = (aVertexPosition.xy * 0.5) + 0.5;
}`;



/* --- Shader helpers --- */
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function getScreenQuad(gl){
    /* --- Setup fullscreen quad --- */
    const positions = new Float32Array([
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1,
    ]);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return positionBuffer;
}

function Program(gl, fSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error", gl.getProgramInfoLog(program));
    }

    const aVertexPosition = gl.getAttribLocation(program1, "aVertexPosition");
    const positionBuffer = getScreenQuad(gl);

    this.execute = (src, dest, width, height) => {
        // Setup
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest.fbo);            // fbo - output
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set up program
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(aVertexPosition);
        gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        
        // Bind input texture
        if(src){
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, src.texture); // input texture - TEXTURE0
            gl.uniform1i(uTexture2, 0);
        }

        // Add uniforms
        // TODO

        // perform draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

function Buffer(gl, width, height) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); // mip level 0

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer not complete!");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Back to default framebuffer

    this.fbo = fbo;
    this.texture = texture;
}

