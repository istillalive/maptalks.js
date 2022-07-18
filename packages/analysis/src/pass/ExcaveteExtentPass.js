import { reshader, mat4 } from '@maptalks/gl';
import * as maptalks from 'maptalks';
import vert from './glsl/excavateExtent.vert';
import frag from './glsl/excavateExtent.frag';

export default class ExcavateExtentPass {
    constructor(renderer, viewport) {
        this.renderer = renderer;
        this._viewport = viewport;
        this._init();
    }

    _init() {
        this._fbo = this.renderer.regl.framebuffer({
            color: this.renderer.regl.texture({
                width: 1,
                height: 1,
                wrap: 'clamp',
                mag : 'linear',
                min : 'linear'
            }),
            depth: true
        });
        this._shader = new reshader.MeshShader({
            vert,
            frag,
            uniforms: [
                {
                    name: 'projViewModelMatrix',
                    type: 'function',
                    fn: (context, props) => {
                        return mat4.multiply([], props['projViewMatrix'], props['modelMatrix']);
                    }
                }
            ],
            extraCommandProps: {
                viewport: this._viewport,
            }
        });
        this._scene = new reshader.Scene();
    }

    render(meshes, projViewMatrix) {
        this._resize();
        this.renderer.clear({
            color : [0, 0, 0, 1],
            depth : 1,
            framebuffer : this._fbo
        });
        this._scene.setMeshes(meshes);
        const uniforms = {
            projViewMatrix
        };
        this.renderer.render(
            this._shader,
            uniforms,
            this._scene,
            this._fbo
        );
        return this._fbo;
    }

    _resize() {
        const width = maptalks.Util.isFunction(this._viewport.width.data) ? this._viewport.width.data() : this._viewport.width;
        const height = maptalks.Util.isFunction(this._viewport.height.data) ? this._viewport.height.data() : this._viewport.height;
        if (this._fbo && (this._fbo.width !== width || this._fbo.height !== height)) {
            this._fbo.resize(width, height);
        }
    }
}