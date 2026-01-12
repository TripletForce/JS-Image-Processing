/**
 * 2 Classes. Applies fragment shader accross screne
 * 
 * Program(gl, fSource)
 *  -> execute(src, dest, width, height, uniforms)
 * Buffer(gl, width height)
 * 
 * Very simply, use the program to execute a shader. 
 * gl - webgl context
 * fSource - webgl code
 * src - buffer or null for no input
 * dest - buffer or null for canvas
 * 
 * 
 * Fragment shader essentials:
 *  precision mediump float;                            // Presision
 *  varying vec2 vUV;                                   // (x, y) coordinate
 *  uniform sampler2D uTexture;                         // texture of previous image
 *
 *  void main() {                                       // what it executes
 *     gl_FragColor = texture2D(uTexture, vUV);         // sets the output to the input texture
 *  }
 * 
 * Use this pattern to generate fragment shaders. Good Luck (:
 */

/* --- Vertex Shader --- */
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

/* --- Setup fullscreen quad --- */
function getScreenQuad(gl){
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

export function Program(gl, fSource, debug=false) {
    if(debug === true){
        console.log(fSource.split('\n').map((l,i) => {
            const width = 5;
            return `${String(i+1).padStart(width, ' ')}: ${l}`
        }).join('\n'));
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vShader);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error", gl.getProgramInfoLog(program));
    }

    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const positionBuffer = getScreenQuad(gl);

    this.execute = (src, dest, width, height, uniforms={}) => {
        // Setup
        gl.bindFramebuffer(gl.FRAMEBUFFER, dest ? dest.fbo : null);            // fbo - output
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
            // Set the texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, src.texture); // input texture - TEXTURE0
            gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);

            // Set textel size
            const location = gl.getUniformLocation(program, "uTexelSize");
            console.log(src);
            if (location !== null) {
                gl.uniform2f(location, 1/src.width, 1/src.height);
            }
        }

        // Set uniforms. All uniforms must be set here.
        Object.keys(uniforms).forEach(key => {
            const loc = gl.getUniformLocation(program, key);
            const v = uniforms[key];
            
            if (typeof v === "number") {
                gl.uniform1f(loc, v);
            } else if (v.length === 2) {
                gl.uniform2f(loc, v[0], v[1]);
            } else if (v.length === 3) {
                gl.uniform3f(loc, v[0], v[1], v[2]);
            } else if (v.length === 4) {
                gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
            }
        });

        // perform draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

export function Buffer(gl, width, height) {
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    //The following is for pixels outside the canvas.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0); // mip level 0

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer not complete!");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Back to default framebuffer

    // Set the information for the class 
    this.fbo = fbo;
    this.texture = texture;
    this.width = width;
    this.height = height;
}

export function loadImage(gl, src, flipY = true) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "";

        img.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            if (flipY) {
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            }

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.bindTexture(gl.TEXTURE_2D, null);

            resolve({
                texture,
                width: img.width,
                height: img.height,
                image: img
            });
        };

        img.onerror = reject;
        img.src = src;
    });
}