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
`
];