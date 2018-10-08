attribute vec3 aPosition;

uniform mat4 projViewModelMatrix;

#include <fbo_picking_vert>

void main() {
    gl_Position = projViewModelMatrix * vec4(aPosition, 1);

    fbo_picking_setData(gl_Position.w);
}
