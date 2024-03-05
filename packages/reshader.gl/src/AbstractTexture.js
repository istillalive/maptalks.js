import { isFunction, hasOwn, getTextureByteWidth, getTextureChannels, isArray, isPowerOfTwo, resizeToPowerOfTwo } from './common/Util.js';
import Eventable from './common/Eventable.js';
import { KEY_DISPOSED } from './common/Constants.js';

export const REF_COUNT_KEY = '_reshader_refCount';
/**
 * Abstract Texture
 * Common methods for Texture2D and TextureCube
 * @abstract
 */
class AbstractTexture {

    constructor(config, resLoader) {
        //TODO add video support
        if (isFunction(config)) {
            //an out-of-box regl texture
            this._texture = config;
            config = this.config = {};
            for (const p in this._texture) {
                if (hasOwn(this._texture, p)) {
                    //parse texture config values from regl texture
                    if (!isFunction(this._texture[p])) {
                        config[p] = this._texture[p];
                    }
                }
            }
        } else {
            this.config = config || {};
            this.resLoader = resLoader;
            if ((config.url || config.promise) && !config.data) {
                this._loading = true;
                const self = this;
                let promise;
                if (config.promise) {
                    promise = config.promise;
                } else {
                    let loadFn;
                    if (config.arrayBuffer) {
                        loadFn = resLoader.getArrayBuffer;
                    } else {
                        loadFn = resLoader.get;
                    }
                    promise = loadFn.call(resLoader, config.url);
                }
                config.data = resLoader.getDefaultTexture(config.url);
                this.promise = promise;
                promise.then(data => {
                    delete this.promise;
                    self._loading = false;
                    if (!self.config) {
                        //disposed
                        return data;
                    }
                    if ((data.data instanceof Image) && this._needPowerOf2()) {
                        data.data = resizeToPowerOfTwo(data.data);
                    }
                    self.onLoad(data);
                    if (!Array.isArray(data)) {
                        data = [data];
                    }
                    self.fire('complete', { target: this, resources: data });
                    return data;
                }).catch(err => {
                    console.error('error when loading texture image.', err);
                    self.fire('error', { target: this, error: err });
                });
            } else if (config.data && this._needPowerOf2()) {
                if ((config.data instanceof Image)) {
                    config.data = resizeToPowerOfTwo(config.data);
                } else if (!config.hdr && isArray(config.data) && (!isPowerOfTwo(config.width) || !isPowerOfTwo(config.height))) {
                    config.data = resizeToPowerOfTwo(config.data, config.width, config.height);
                }
            }
        }

    }

    isReady() {
        return !this._loading;
    }

    set(k, v) {
        this.config[k] = v;
        this.dirty = true;
        return this;
    }

    get(k) {
        return this.config[k];
    }

    getREGLTexture(regl) {
        if (!this._texture) {
            this._texture = this.createREGLTexture(regl);
            if (!this.config.persistent) {
                // delete persistent data to save memories
                if (this.config.data) {
                    // imageBitmap
                    if (!(this.config.data instanceof ImageBitmap)) {
                        this.config.data = [];
                        // this.config.data.close();
                    }

                }
                if (this.config.faces) {
                    this.config.faces = [];
                }
                if (this.config.image) {
                    this.config.image.array = [];
                }
                if (this.config.mipmap) {
                    delete this.config.mipmap;
                }
            }
        }
        if (this.dirty) {
            this._updateREGL();
        }
        return this._texture;
    }

    getMemorySize() {
        if (!this.config) {
            return 0;
        }
        const { width, height, type, format } = this.config;
        const byteWidth = getTextureByteWidth(type || 'uint8');
        const channels = getTextureChannels(format || 'rgba');
        if (this.config.faces) {
            // texture cube
            return width * height * byteWidth * channels * 6;
        } else {
            return width * height * byteWidth * channels;
        }
    }

    _updateREGL() {
        if (this._texture && !this._texture[KEY_DISPOSED]) {
            this._texture(this.config);
        }
        this.dirty = false;
    }

    dispose() {
        if (this.config && this.config.url) {
            URL.revokeObjectURL(this.config.url);
            this.resLoader.disposeRes(this.config.url);
        }
        if (this.config && (this.config.data instanceof ImageBitmap)) {
            this.config.data.close()
            this.config.data = [];
        }
        if (this._texture && !this._texture[KEY_DISPOSED]) {
            if (this._texture[REF_COUNT_KEY]) {
                this._texture[REF_COUNT_KEY]--;
            }
            if (!this._texture[REF_COUNT_KEY]) {
                this._texture.destroy();
                this._texture[KEY_DISPOSED] = true;
                delete this._texture;
            }
        }
        delete this.resLoader;
        const url = this.config && this.config.url;
        delete this.config;
        if (url) {
            this.fire('disposed', { target: this, url });
        }
    }

    _needPowerOf2() {
        const config = this.config;
        const isRepeat = config.wrap && config.wrap !== 'clamp' || config.wrapS && config.wrapS !== 'clamp' ||
            config.wrapT && config.wrapT !== 'clamp';
        return isRepeat || config.min && config.min !== 'nearest' && config.min !== 'linear';
    }
}

export default Eventable(AbstractTexture);

