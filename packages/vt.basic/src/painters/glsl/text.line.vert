#define RAD 0.0174532925

attribute vec3 aPosition;
attribute vec2 aShape0;
attribute vec2 aTexCoord0;
attribute float aSize;
attribute float aOpacity;
attribute vec2 aOffset0;
attribute float aRotation0;
attribute vec2 aShape1;
attribute vec2 aTexCoord1;
attribute vec2 aOffset1;
attribute vec2 aOffset2;
attribute float aRotation1;
attribute float aRotation2;
// attribute float aNormal;//flip, vertical
attribute vec2 aNormal;

uniform float tileResolution;
uniform float resolution;
uniform float cameraToCenterDistance;
uniform mat4 projViewModelMatrix;
uniform float textPerspectiveRatio;

uniform vec2 texSize;
uniform vec2 canvasSize;
uniform float glyphSize;
uniform float tileRatio; //EXTENT / tileSize

varying vec2 vTexCoord;
varying float vGammaScale;
varying float vSize;

void main() {
    vec4 pos = projViewModelMatrix * vec4(aPosition, 1.0);
    float distance = pos.w;

    vGammaScale = distance / cameraToCenterDistance;

    float distanceRatio = (1.0 - cameraToCenterDistance / distance) * textPerspectiveRatio;
    //通过distance动态调整大小
    float perspectiveRatio = clamp(
        0.5 + 0.5 * (1.0 - distanceRatio),
        0.0, // Prevents oversized near-field symbols in pitched/overzoomed tiles
        4.0);

    float scale = tileResolution / resolution;
    //t is the interpolation
    float t, rotation0, rotation1;
    vec2 offset0, offset1;

    if (scale <= 1.0) {
        t = clamp((scale - 0.5) / 0.5, 0.0, 1.0);
        offset0 = aOffset0;
        offset1 = aOffset1;
        rotation0 = aRotation0;
        rotation1 = aRotation1;
    } else {
        t = clamp(scale - 1.0, 0.0, 1.0);
        offset0 = aOffset1;
        offset1 = aOffset2;
        rotation0 = aRotation1;
        rotation1 = aRotation2;
    }
    float textRotation = mix(rotation0, rotation1, t);
    // float flip = float(int(aNormal) / 2);
    // float vertical = mod(aNormal, 2.0);
    float flip = aNormal.x;
    float vertical = aNormal.y;
    textRotation += mix(0.0, 180.0, flip);
    textRotation += mix(0.0, -90.0, vertical);
    textRotation = textRotation * RAD;

    float angleSin = sin(textRotation);
    float angleCos = cos(textRotation);
    mat2 shapeMatrix = mat2(angleCos, -1.0 * angleSin, angleSin, angleCos);

    vec2 shape = shapeMatrix * mix(aShape0, aShape1, flip);

    vec2 offset = mix(offset0, offset1, t);
    vec2 texCoord = mix(aTexCoord0, aTexCoord1, flip);

    shape = shape / glyphSize * aSize;

    offset = (shape + offset) * vec2(1.0, -1.0);
    gl_Position = projViewModelMatrix * vec4(aPosition + vec3(offset, 0.0) * tileRatio / scale * vGammaScale * perspectiveRatio, 1.0);

    vTexCoord = texCoord / texSize;
    vSize = aSize;
}
