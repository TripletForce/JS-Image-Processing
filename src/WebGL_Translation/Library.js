export default [`
float base_random(vec2 st) {
    return fract(sin(dot(st,
        vec2(12.9898,78.233)))*
        43758.5453123);
}

export float random(float v){
    return base_random(vec2(v, v));
}

overload float random(vec2 v){
    return base_random(v);
}

overload float random(vec3 v){
    float r = base_random(vec2(v.x, v.y));
    return base_random(vec2(r, v.z));
}

overload float random(vec4 v){
    float r1 = base_random(vec2(v.x, v.y));
    float r2 = base_random(vec2(v.z, v.w));
    return base_random(vec2(r1, r2)); 
}
`,`
export vec4 pass(){
    return texture2D(uTexture, vUV);
}
`,
`
export float gray_scale(){
    float gray = 0.2126 * texture2D(uTexture, vUV).r + 0.7152 * texture2D(uTexture, vUV).g + 0.0722 * texture2D(uTexture, vUV).b;
    return gray;
}
`,
`
export vec4 convolution(mat3 weights) {
    vec4 r = vec4(0.0);
    r += texture2D(uTexture, vUV + uTexelSize * vec2(-1.0, -1.0)) * weights[0][0];
    r += texture2D(uTexture, vUV + uTexelSize * vec2( 0.0, -1.0)) * weights[0][1];
    r += texture2D(uTexture, vUV + uTexelSize * vec2( 1.0, -1.0)) * weights[0][2];
    r += texture2D(uTexture, vUV + uTexelSize * vec2(-1.0,  0.0)) * weights[1][0];
    r += texture2D(uTexture, vUV) * weights[1][1];
    r += texture2D(uTexture, vUV + uTexelSize * vec2( 1.0,  0.0)) * weights[1][2];
    r += texture2D(uTexture, vUV + uTexelSize * vec2(-1.0,  1.0)) * weights[2][0];
    r += texture2D(uTexture, vUV + uTexelSize * vec2( 0.0,  1.0)) * weights[2][1];
    r += texture2D(uTexture, vUV + uTexelSize * vec2( 1.0,  1.0)) * weights[2][2];
    return vec4(r.rgb, 1.0);
}
`
];