/**
 * warpped the WebGLRenderingContext
 * reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
 * 
 * 管理
 * -cache
 * 
 * reference https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmapRenderingContext/transferFromImageBitmap
 * 使用 OffscreenCanvas 创建不可见绘制canvas,后基于此canvas绘制图像，并保存成bitmap缓存帧
 * var htmlCanvas = document.getElementById("htmlCanvas").getContext("bitmaprenderer");
 * 预留一定的帧数后，使用bitmaprender绘制bitmap到前端canvas即可
 * htmlCanvas.transferFromImageBitmap(bitmap);
 * context相当于webglRender
 * 
 * @author yellow 2017/6/11
 * @modify yellow 2017/8/8
 * 
 * 
 */
const merge = require('./../utils/merge'),
    isFunction = require('./../utils/isFunction'),
    isNode = require('./../utils/isNode'),
    mapFunc = require('./../utils/mapFunc'),
    stamp = require('./../utils/stamp').stamp,
    Dispose = require('./../utils/Dispose'),
    GLConstants = require('./GLConstants'),
    Recorder = require('./../core/Recorder').Recorder,
    GLRecord = require('./../core/Recorder').GLRecord,
    //映射内置对象
    GLShader = require('./GLShader'),
    GLProgram = require('./GLProgram'),
    GLTexture = require('./GLTexture'),
    //
    GLExtension = require('./GLExtension'),
    GLLimits = require('./GLLimits'),
    //全部操作枚举
    ALL_ENUM = require('./../core/Handler').ALL_ENUM,
    //cache存储
    CACHE_GLLIMITS = {},
    CACHE_GLEXTENSION = {},
    //
    CACHE_GLSHADER = {},
    CACHE_GLPROGRAM = {},
    CACHE_GLTEXTURE = {};

/**
 * @class
 * 
 * GlContext类，包含 glProgram类
 * 根据glProgram类构建子程序
 * 
 */
class GLContext extends Dispose {
    /**
     * 
     * @param {String} canvasId 
     * @param {*} options 
     * @param {GLExtension} [options.glExtension] 
     * @param {GLLimits} [options.glLimits]
     */
    constructor(canvasId, options = {}) {
        super();
        /**
        * canvasId,用此id获取gl对象
        * @type {String}
        */
        this._canvasId = canvasId;
        /*
         * merge all options
         */
        this._options = merge({}, options);
        /**
         * record all gl operations
         */
        this._recoder = new Recorder();
        /**
         * @type {GLLimits}
         */
        this._glLimits = null;
        /**
         * @type {GLExtension}
         */
        this._glExtension = null;
        /**
         * initial internal object
         */
        this._init();
        /**
         * map glContext to Context
         */
        this._map();
    };
    /**
     * 初始化内部方法
     */
    _init(){
        const canvasId = this._canvasId;
        CACHE_GLLIMITS[canvasId] = CACHE_GLLIMITS[canvasId] ||new GLLimits(this);
        CACHE_GLEXTENSION[canvasId] = CACHE_GLEXTENSION[canvasId] || new GLExtension(this);
        this._glLimits = CACHE_GLLIMITS[canvasId];
        this._glExtension = CACHE_GLEXTENSION[canvasId];
    }
    /**
     * map相关属性与方法
     */
    _map() {
        //1.map internalTinyOperation
        for (const key in ALL_ENUM) {
            this[key] = (...rest) => {
                //gl[key].apply(gl, rest);
                tiny.push(key, ...rest);
            }
        }
        //2.map glContext
        for (const key in GLConstants) {
            if (!this.hasOwnProperty(key)) {
                const target = GLConstants[key];
                if (!this[key] && !!target)
                    this[key] = target;
            }
        }
    }
    /**
     * @return {WebGLRenderingContext}
     */
    get gl() {
        return this._gl;
    }
    /**
     * 获取canvas
     */
    get canvas() {
        const gl = this._gl;
        return gl.canvas;
    }
    /**
     * 获取drawingBuffer的width
     */
    get drawingBufferWidth() {
        const gl = this._gl;
        return gl.drawingBufferWidth;
    }
    /**
     * 获取drawingBuffer的height
     */
    get drawingBufferHeight() {
        const gl = this._gl;
        return gl.drawingBufferHeight;
    }
    /**
     * @return {WebGLProgram}
     */
    createProgram() {
        const gl = this._gl;
        //1.创建GLProgram
        const glProgram = new GLProgram(gl);
        //2.缓存program
        GLPROGRAMS[glProgram.id] = glProgram;
        //3.返回句柄
        return glProgram.handle;
    }
    /**
     * create shader
     * @param {number} type
     * @return {GLShader}
     */
    createShader(type) {
        if (type !== GLConstants.VERTEX_SHADER && type !== GLConstants.FRAGMENT_SHADER)
            throw new Error('createShader parameter error');
        const glContextId = this.id,
            glCanvasId = this._canvasId,
            glExtension = this._glExtension;
        return new GLShader(type, glContextId, glExtension);
    }
    /**
     * @return {WebGLTexture}
     */
    createTexture() {
        const gl = this._gl;
        const glTexture = new GLTexture(gl);
        GLTEXTURES[glTexture.id] = glTexture;
        return glTexture.handle;
    }
    /**
     * @return {WebGLBuffer}
     */
    createBuffer() {
        const gl = this._gl;
        return gl.createBuffer();
    }
    /**
     * @type {WebGLFramebuffer}
     */
    createFramebuffer() {
        const gl = this._gl;
        return gl.createFramebuffer();
    }
    /**
     * @type {WebGLRenderbuffer}
     */
    createRenderbuffer() {
        const gl = this._gl;
        return gl.createRenderbuffer();
    }
    /**
     * 注意在处理tiny的时候，需先useProgram
     * @param {WebGLProgram} program
     */
    useProgram(program) {
        const id = stamp(program),
            tiny = this._tiny,
            glProgram = GLPROGRAMS[id];
        tiny.switchPorgarm(glProgram);
    }
    /**
     * 获取extension
     */
    getExtension(name) {
        const glExtension = this._glExtension;
        return glExtension.getExtension(name);
    }
    /**
     * 
     * @param {WebGLProgram} program 
     * @param {WebGLShader} shader 
     */
    attachShader(program, shader) {
        const glProgram = GLPROGRAMS[stamp(program)];
        const glShader = GLSHADERS[stamp(shader)];
        glProgram.attachShader(glShader);
    }
    /**
     * 
     * @param {WebGLShader} shader 
     * @param {String} source 
     */
    shaderSource(shader, source) {
        const recorder = this._recoder,
            canvasId = this._canvasId,
            glContextId = this.id;
        //指定glsl版本 gl.shaderSource(shader, source);
        source = source.indexOf('precision') === -1 ? `precision mediump float;\n${source}` : source;
        //创建操作记录
        const record = new GLRecord('shaderSource',shader,source);
        //设置0号参数改为shaderId
        record.setPt(0,`${canvasId}-${glContextId}-${shader.id}`);
        //增加操作记录
        recorder.increase(record);
    }
    /**
     * no need to implement
     */
    compileShader(shader) {
        const gl = this._gl;
        gl.compileShader(shader);
    }
    /**
     * no needs to implement this function
     * @param {WebGLProgram} program 
     */
    linkProgram(program) {
        const gl = this._gl;
        gl.linkProgram(program);
    }


    //webgl2 
    createTransformFeedback() {
        const gl = this._gl;
        gl.createTransformFeedback.apply(gl, arguments);
    }

    clear() {

    }

    clearColor() {

    }

    clearDepth() {

    }

    clearStencil() {

    }

}

module.exports = GLContext;