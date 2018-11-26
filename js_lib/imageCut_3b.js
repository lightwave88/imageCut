(function(global) {
    if (typeof global['ImageCut'] === 'function') {
        throw new Error('have double ImageCut');
    } else {
        global.ImageCut = ImageCut;
    }
    //--------------------------------------------------------------------------
    // 只有 size
    function DomData_1() {
        this.dom = null;
        this.height = null;
        this.width = null;
    }
    //----------------------------
    // 有 size, 座標
    function DomData_2() {
        this.dom = null;
        this.height = null;
        this.width = null;
        this.top = null;
        this.left = null;
    }
    //----------------------------
    // 周圍座標(虛擬座標)
    function AreaData() {
        this.top = 0;
        this.left = 0;
        this.bottom = 0;
        this.right = 0;
        this.width = 0;
        this.height = 0;

        this.__constructor();
    }

    (function() {
        this.__constructor = function() {
            for (var k in this) {
                if (this.hasOwnProperty(k) && typeof this[k] !== 'function') {
                    this.defineReactive(this, k, this[k]);
                }
            }
        };
        //======================================================================
        this.$$update = function(k, v) {
            let t = this;

            if (/top|left|bottom|right/i.test(k)) {
                // console.log('key => %s', k);
                if (typeof(t['right']) === 'number' && typeof(t['left']) === 'number') {
                    t['width'] = t['right'] - t['left'];
                }
                if (typeof(t['bottom']) === 'number' && typeof(t['top']) === 'number') {
                    t['height'] = t['bottom'] - t['top'];
                }
            }
        };
        //======================================================================
        this.clone = function() {
            let data = new AreaData();

            for (let k in this) {
                if (/top|left|bottom|right/i.test(k)) {
                    data[k] = this[k];
                }
            }
            return data;
        };
        //======================================================================
        this.toJSON = function() {
            let self = this;
            return {
                top: self.top,
                left: self.left,
                right: self.right,
                bottom: self.bottom,
                width: self.width,
                height: self.height
            }
        };
        //======================================================================
        this.defineReactive = function(obj, key, value) {
            var property = Object.getOwnPropertyDescriptor(obj, key);

            if (property && property.configurable === false) {
                return
            }

            Object.defineProperty(obj, key, {
                enumerable: true,
                configurable: true,
                get: function reactiveGetter() {
                    return value;
                },
                set: function reactiveSetter(newVal) {
                    // console.log('----------------------');
                    // console.log('k(%s) => (%s)', key, newVal);

                    if (newVal === value) {
                        return
                    }
                    value = newVal;
                    obj.$$update(key, value);
                }
            });
        };
    }).call(AreaData.prototype);

    ////////////////////////////////////////////////////////////////////////////////
    //
    // options => {src:圖片位置, el: root, width: 視窗寬 ,heigth: 視窗高, parent: parentNode}
    //
    ////////////////////////////////////////////////////////////////////////////////

    function ImageCut(options) {
        options = options || {};

        this.imageObj;
        //----------------------------
        this.root_data = new DomData_1(); // 基底座標
        this.canvas_data = new DomData_1();
        this.image_data = new DomData_1();
        //----------------------------
        this.selectMark_data = new DomData_2();
        this.operateArea_data = new DomData_2(); // 操作座標

        this.doms = {};
        //----------------------------
        this.fixPoint = 0.5; // 修正用數值
        this.fixPoint_1 = 1;
        this.bg_padding = {
            h: 60,
            v: 60
        };

        this.prevCoordinate = {
            x: undefined,
            y: undefined
        };

        this.cursor = {
            left: null,
            top: null
        };
        //----------------------------
        this.imageRatio; // (w/h)
        //----------------------------
        this.point = {
            0: new DomData_2(),
            1: new DomData_2(),
            2: new DomData_2(),
            3: new DomData_2(),
            4: new DomData_2(),
            5: new DomData_2(),
            6: new DomData_2(),
            7: new DomData_2(),
        };
        this.bg = {
            top: new DomData_2(),
            left: new DomData_2(),
            bottom: new DomData_2(),
            right: new DomData_2()
        };

        this.chooseArea = new AreaData();
        this.safeArea = new AreaData();
        //----------------------------
        this.clickBoxName;

        this.dragData = {
            left: undefined,
            top: undefined
        };

        this.options = {
            src: null,
            root: null,
            width: null,
            height: null,
            parent: null
        };


        //----------------------------
        this.__constructor(options);
    }
    ////////////////////////////////////////////////////////////////////////////
    (function() {
        this.__constructor = function(options) {
            let self = this;

            Object.defineProperty(this, 'sizeData', {
                enumerable: true,
                configurable: true,
                get: function() {
                    debugger;
                    let data = {
                        top: "",
                        left: "",
                        right: "",
                        bottom: ""
                    };
                    if (typeof self.chooseArea.top === 'number') {
                        data['top'] = (self.chooseArea.top - self.image_data.dom.offsetTop);
                    }
                    if (typeof self.chooseArea.left === 'number') {
                        data['left'] = (self.chooseArea.left - self.image_data.dom.offsetLeft);
                    }
                    if (typeof self.chooseArea.right === 'number') {
                        data['right'] = (self.chooseArea.right - self.image_data.dom.offsetLeft);
                    }
                    if (typeof self.chooseArea.bottom === 'number') {
                        data['bottom'] = (self.chooseArea.bottom - self.image_data.dom.offsetTop);
                    }

                    return data;
                }
            });
        };
        //======================================================================
        this.initialize = function() {
            debugger;

            this._getDoms();

            this._check_1();

            // 非同步
            let p = this._getImageSize();
            let self = this;

            p.then(function(data) {

                self._setImageData(data);

                self._initialize_1();

            }, function(error) {
                throw new Error(error);
            });
        };
        //======================================================================

        this._initialize_1 = function() {

            this._basicCssSetting();

            this._checkGeometry();

            // return;
            this._init_getChooseArea();

            // 開始移動個個操作點
            this._updateSelectArea();

            this._moveAllControlPoint();

            this._updateBgSize();

            this._unbindEvent();

            this._bindEvent();

            this._triggerEvent();

        };
        //======================================================================
        this.winResize = function() {
            console.log('winResize');

            // 更新(image_data)的座標
            // 更新(safeArea)的座標
            //
            this._getChooseArea();

            this._triggerEvent();

            // console.dir(this.safeArea);
        };

        //======================================================================
        this.setImage = function(src) {
            this.options.src = src;
        };
        //======================================================================
        this.setElement = function(rootDom) {

            if (typeof rootDom === 'string') {
                let domList = document.querySelectorAll(rootDom);

                if (domList.length > 1) {
                    throw new Error('have multy dom select');
                }
                rootDom = domList[0];
            }

            this.options.root = rootDom;
            this.root_data.dom = rootDom;

            this.initialize();
        };
        //======================================================================
        this.create = function(parentDom) {

            if (typeof parentDom === 'string') {
                let domList = document.querySelectorAll(parentDom);

                if (domList.length > 1) {
                    throw new Error('have multy dom select');
                }
                parentDom = domList[0];
            }
            this.options.parent = parentDom;

            this._createDom();

            this.initialize();

        };
        //======================================================================
        this.remove = function() {

        };
        //======================================================================
        this.show = function() {

        };
        //======================================================================
        this.hide = function(detach) {
            if (detach) {

            } else {

            }
        };
        //======================================================================
        this.setSize = function(options) {
            options = options || {};
            if (options.width != null) {
                this.options.width = options.width;
            }

            if (options.height != null) {
                this.options.height = options.height;
            }
        };
        //======================================================================
        this.resetSelectArea = function() {

        };
        //======================================================================


    }).call(ImageCut.prototype);

    //==========================================================================
    (function() {
        // 創造需要的 dom
        this._createDom = function() {

        };
        //======================================================================
        this._getDoms = function() {
            debugger;

            let imageDom = this.image_data.dom = this.root_data.dom.querySelector('.ct_imageBackground');
            //----------------------------
            this.canvas_data.dom = this.root_data.dom.querySelector('.ct_canvas');
            this.operateArea_data.dom = imageDom.querySelector('.ct_operateArea');
            //----------------------------
            this.point[0].dom = imageDom.querySelector('div[position="0"]');
            this.point[1].dom = imageDom.querySelector('div[position="1"]');
            this.point[2].dom = imageDom.querySelector('div[position="2"]');
            this.point[3].dom = imageDom.querySelector('div[position="3"]');
            this.point[4].dom = imageDom.querySelector('div[position="4"]');
            this.point[5].dom = imageDom.querySelector('div[position="5"]');
            this.point[6].dom = imageDom.querySelector('div[position="6"]');
            this.point[7].dom = imageDom.querySelector('div[position="7"]');
            //----------------------------
            this.bg.right.dom = imageDom.querySelector('.ct_bg-right');
            this.bg.left.dom = imageDom.querySelector('.ct_bg-left');
            this.bg.top.dom = imageDom.querySelector('.ct_bg-top');
            this.bg.bottom.dom = imageDom.querySelector('.ct_bg-bottom');
            //----------------------------
            this.selectMark_data.dom = imageDom.querySelector('.ct_selectArea');
        };
        //======================================================================
        this._setImageData = function(data) {
            // console.log(JSON.stringify(data));

            this.image_data.width = data.w;
            this.image_data.height = data.h;

            let url = 'url(' + this.imageObj.src + ')'
            $(this.image_data.dom).css({
                'background-image': url,
                opacity: 1
            });

            this.imageObj = undefined;
        };
        //======================================================================
        this._basicCssSetting = function() {
            debugger;
            //----------------------------
            // image容器的(大小, 偏移位置)設定
            let cssSetting_1 = {
                width: this.image_data.width,
                height: this.image_data.height
            };

            $(this.image_data.dom).css(cssSetting_1);
            //----------------------------
            // root 的設定

            $(this.root_data.dom).css({
                overflow: 'auto'
            });

            //----------------------------
            // canvas
            let h_needFix = true;
            let v_needFix = true;
            while (h_needFix || v_needFix) {
                // 若 root.size 的 size 比 image 小
                // 需要調整

                this.canvas_data.width = $(this.canvas_data.dom).outerWidth();
                this.canvas_data.height = $(this.canvas_data.dom).outerHeight();

                if (this.canvas_data.width < (this.image_data.width + this.bg_padding.h)) {
                    this.canvas_data.width = (this.image_data.width + this.bg_padding.h);

                    $(this.canvas_data.dom).css({
                        width: this.canvas_data.width
                    });

                    h_needFix = true;
                } else {
                    h_needFix = false;
                }
                //----------------------------
                if (this.canvas_data.height < (this.image_data.height + this.bg_padding.v)) {
                    this.canvas_data.height = (this.image_data.height + this.bg_padding.v);

                    $(this.canvas_data.dom).css({
                        height: this.canvas_data.height
                    });

                    v_needFix = true;
                } else {
                    v_needFix = false;
                }
            }
        };
        //======================================================================
        this._checkGeometry = function() {
            debugger;

            // 取得(operateArea)位置資訊
            let pData = this._getDomRootCoodinate(this.operateArea_data.dom);
            this.operateArea_data.left = pData.left;
            this.operateArea_data.top = pData.top;

            this.operateArea_data.width = $(this.operateArea_data.dom).outerWidth();
            this.operateArea_data.height = $(this.operateArea_data.dom).outerHeight();

            // console.dir(this.operateArea_data);
            //----------------------------
            for (let k in this.point) {
                let data = this.point[k];
                let dom = data.dom;
                data.width = $(dom).outerWidth();
                data.height = $(dom).outerHeight();
            }

        };
        //======================================================================
        // 是否在 box 裏
        // 等比例改變需要
        // 游標座標沒有小數點
        this._isInBox = function(moveData, l, t) {

            // console.log('l(%s), right(%s), left(%s)', l, chooseArea.right, chooseArea.left);

            if (l <= (moveData.right + this.fixPoint_1) && l >= (moveData.left - this.fixPoint_1)) {
                if (t >= (moveData.top - this.fixPoint_1) && t <= (moveData.bottom + this.fixPoint_1)) {
                    console.log('inbox');
                    return true;
                }
            }
            console.log('outbox');
            return false;
        };
        //======================================================================

        this._triggerEvent = function() {
            let data = '';
            data += '<p> choose: ' + JSON.stringify(this.chooseArea) + '</p>';
            data += '<p> safe: '+JSON.stringify(this.safeArea) + '</p>';
            data += '<p> size: '+JSON.stringify(this.sizeData)+'</p>';
            $(this.root_data.dom).trigger('area', data);
        };
        //======================================================================
        this._updateBgSize = function() {
            debugger;

            let bg, width, height;
            let left = this.selectMark_data.dom.offsetLeft;
            let top = this.selectMark_data.dom.offsetTop;
            let right = left + $(this.selectMark_data.dom).outerWidth();
            let bottom = top + $(this.selectMark_data.dom).outerHeight();

            bg = this.bg.top;

            height = top;
            $(bg.dom).css({
                height: height
            });
            //----------------------------
            bg = this.bg.left;

            height = $(this.selectMark_data.dom).outerHeight();
            $(bg.dom).css({
                height: height,
                width: left
            });
            //----------------------------
            bg = this.bg.right;

            width = $(this.image_data.dom).outerWidth() - right;
            $(bg.dom).css({
                height: height,
                width: width
            });
            //----------------------------
            bg = this.bg.bottom;

            height = $(this.image_data.dom).outerHeight() - bottom;
            $(bg.dom).css({
                height: height
            });

        };
        //======================================================================

        this._unbindEvent = function() {
            $('.ct_controlePoint', this.canvas_data.dom).off('click');
            $(this.canvas_data.dom).off('click').off('mousemove');
            $(this.selectMark_data.dom).off('mousedown').off('mouseup');
        };
        //======================================================================
        // 綁定所有事件
        this._bindEvent = function() {

            //------------------------------------------------------------------

            $('.ct_controlePoint', this.canvas_data.dom).on('click', (function(e) {

                //----------------------------
                if (this.clickBoxName != null) {
                    // alert('have assign job before:' + this.clickBoxName);
                    return;
                }
                this._updatePrevCoordinate(e);
                //----------------------------
                // 更新 chooseArea 的座標
                this._updateChooseAreaSizeBySmallBox();
                //----------------------------
                // methodName
                this.clickBoxName = $(e.target).attr('position');

                if (typeof this._caculateMethod[this.clickBoxName] === 'undefined') {
                    throw new Error("no assign click box's name");
                }
                //----------------------------
                // 紀錄 ratio

                if (Number(this.clickBoxName) % 2 === 1) {
                    let selectAreaDom = this.selectMark_data.dom;
                    this.imageRatio = ($(selectAreaDom).outerWidth() / $(selectAreaDom).outerHeight());

                } else {
                    this.imageRatio = undefined;
                }
                //----------------------------
                // 綁定 mouseover
                $(this.canvas_data.dom).on('mousemove', (function(e) {
                    // console.log('%s, %s', e.offsetX, e.offsetY);
                    this._updateByControlPoint(e);
                }).bind(this));
                //----------------------------
                setTimeout((function() {
                    // 不這樣做，會造成一點下馬上就往下執行
                    $(this.canvas_data.dom).on('click', (function(e) {
                        // alert('reset');
                        this.clickBoxName = undefined;
                        $(this.canvas_data.dom).off('mousemove')
                        $(this.canvas_data.dom).off('click');
                    }).bind(this));
                }).bind(this), 0);


            }).bind(this));
            //------------------------------------------------------------------
            $(this.selectMark_data.dom).on('mousedown', (function(e) {

                if (this.clickBoxName) {
                    return;
                }
                //----------------------------

                let l = e.offsetX;
                let t = e.offsetY;
                this.dragData.left = l;
                this.dragData.top = t;

                // 更新 chooseArea 的座標
                this._updateChooseAreaSizeBySmallBox();
                //----------------------------
                $(this.canvas_data.dom).on('mousemove', (function(e) {
                    if (this.clickBoxName) {
                        return;
                    }
                    this._updateBySelectArea(e);
                }).bind(this));

            }).bind(this));
            //------------------------------------------------------------------
            $(this.selectMark_data.dom).on('mouseup', (function(e) {

                if (this.clickBoxName) {
                    return;
                }
                //----------------------------

                $(this.canvas_data.dom).off('mousemove');
            }).bind(this));

        };


    }).call(ImageCut.prototype);
    ////////////////////////////////////////////////////////////////////////////////
    (function() {

        //==========================================================================
        // 更新 ChooseArea
        this._updateChooseAreaSizeBySmallBox = function() {
            // debugger;
            let box;

            box = this.point[0];
            this.chooseArea.top = box.dom.offsetTop + box.height;
            this.chooseArea.top = this._v_ImageCoodinate2rootCoordinate(this.chooseArea.top);

            box = this.point[2];
            this.chooseArea.right = box.dom.offsetLeft;
            this.chooseArea.right = this._h_ImageCoodinate2rootCoordinate(this.chooseArea.right);

            box = this.point[4];
            this.chooseArea.bottom = box.dom.offsetTop;
            this.chooseArea.bottom = this._v_ImageCoodinate2rootCoordinate(this.chooseArea.bottom);

            box = this.point[6];
            this.chooseArea.left = box.dom.offsetLeft + box.width;
            this.chooseArea.left = this._h_ImageCoodinate2rootCoordinate(this.chooseArea.left);
        };
        //==========================================================================
        // 更新 ChooseArea
        this._updateChooseAreaSizeBySelectArea = function() {

            let selectArea = this.selectMark_data;

            let left = selectArea.dom.offsetLeft;
            let top = selectArea.dom.offsetTop;

            console.log('left(%s), top(%s)', left, top);

            left = this._h_ImageCoodinate2rootCoordinate(left);
            top = this._v_ImageCoodinate2rootCoordinate(top);

            this.chooseArea.left = left;
            this.chooseArea.top = top;

            this.chooseArea.right = this.chooseArea.left + $(selectArea.dom).outerWidth();
            this.chooseArea.bottom = this.chooseArea.top + $(selectArea.dom).outerHeight();
        };
        //======================================================================
        this._init_getChooseArea = function() {
            debugger;

            let d = this._getDomRootCoodinate(this.operateArea_data.dom);

            // chooseArea.set
            this.chooseArea.left = d.left;
            this.chooseArea.top = d.top;
            this.chooseArea.right = (this.image_data.width + this.chooseArea.left);
            this.chooseArea.bottom = (this.image_data.height + this.chooseArea.top);

            this.safeArea.left = this.chooseArea.left;
            this.safeArea.top = this.chooseArea.top;
            this.safeArea.right = this.chooseArea.right;
            this.safeArea.bottom = this.chooseArea.bottom;
        };

        this._getChooseArea = function() {
            console.log('_getChooseArea');
            let d = this._getDomRootCoodinate(this.operateArea_data.dom);

            this.safeArea.left = d.left;
            this.safeArea.top = d.top;
            this.safeArea.right = (this.safeArea.left + $(this.image_data.dom).outerWidth());
            this.safeArea.bottom = (this.safeArea.top + $(this.image_data.dom).outerHeight());

            d = this._getDomRootCoodinate(this.selectMark_data.dom);

            this.chooseArea.left = d.left;
            this.chooseArea.top = d.top;

            this.chooseArea.right = (this.chooseArea.left + $(this.selectMark_data.dom).outerWidth());
            this.chooseArea.bottom = (this.chooseArea.top + $(this.selectMark_data.dom).outerHeight());
        };
        //======================================================================

        // 更新 selectArea.dom 外型
        this._updateSelectArea = function() {
            // debugger;

            let pData = this._rootCoordinate2ImageCoordinate({
                left: this.chooseArea.left,
                top: this.chooseArea.top
            });

            this.selectMark_data.left = pData.left;
            this.selectMark_data.top = pData.top;

            this.selectMark_data.width = this.chooseArea.width;
            this.selectMark_data.height = this.chooseArea.height;

            let selectArea = this.selectMark_data;

            $(selectArea.dom).css({
                height: selectArea.height,
                width: selectArea.width,
                left: selectArea.left,
                top: selectArea.top
            });

        };
        //==========================================================================
        // 由移動 selectArea 的拖動
        // 來移動 controlPoint
        this._moveAllControlPoint = function() {
            let box;

            // top.point
            box = this.point[0];
            box.left = (this.chooseArea.left + this.chooseArea.right - box.width) / 2;
            box.top = this.chooseArea.top - box.height;

            box = this.point[1];
            box.left = this.chooseArea.right;
            box.top = this.chooseArea.top - box.height;

            // right.point
            box = this.point[2];
            box.left = this.chooseArea.right;
            box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;


            box = this.point[3];
            box.left = this.chooseArea.right;
            box.top = this.chooseArea.bottom;
            // bottom.point
            box = this.point[4];
            box.left = (this.chooseArea.left + this.chooseArea.right - box.width) / 2;
            box.top = this.chooseArea.bottom;

            box = this.point[5];
            box.left = this.chooseArea.left - box.width;
            box.top = this.chooseArea.bottom;

            // left.point
            box = this.point[6];
            box.left = this.chooseArea.left - box.width;
            box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

            box = this.point[7];
            box.left = this.chooseArea.left - box.width;
            box.top = this.chooseArea.top - box.height;

            //----------------------------

            for (let k in this.point) {
                let point = this.point[k];

                // 轉換世界座標為物件座標
                point.left = this._h_rootCoordinate2ImageCoordinate(point.left);
                point.top = this._v_rootCoordinate2ImageCoordinate(point.top);

                $(point.dom).css({
                    left: point.left,
                    top: point.top
                });
            }
        };
        //======================================================================
        // 取得 dom 的底座標
        this._getDomRootCoodinate = function(dom) {

            if (!this.canvas_data.dom.contains(dom)) {
                throw new Error("not root's child");
            }

            let left = 0,
                top = 0;

            // canvas_data.dom 為基底座標
            while (this.canvas_data.dom !== dom) {
                left += dom.offsetLeft;
                top += dom.offsetTop;

                dom = dom.parentNode;
            }

            return {
                left: left,
                top: top
            }
        };
        //==========================================================================
        // 將游標轉換成 root 的座標系
        this._getCousorRootCoodinate = function(e) {

            // console.log('*************************');

            let currentTarget = e.currentTarget;
            let target = e.target;

            //----------------------------
            let left = e.offsetX;
            let top = e.offsetY;

            // console.log('l(%s), t(%s)', left, top);

            // canvas_data.dom 為基底座標
            while (this.canvas_data.dom !== target) {
                left += target.offsetLeft;
                top += target.offsetTop;

                // console.log('offsetLeft(%s), offsetTop(%s)', target.offsetLeft, target.offsetTop);
                target = target.parentNode;
            }

            // console.log('l(%s), t(%s)', left, top);
            // console.log('*************************');
            return {
                left: left,
                top: top
            };
        };
        //==========================================================================
        // 將 bg 座標轉為 image 座標
        this._rootCoordinate2ImageCoordinate = function(data) {
            let pData = this._getDomRootCoodinate(this.operateArea_data.dom);
            this.operateArea_data.left = pData.left;
            this.operateArea_data.top = pData.top;

            let l = data.left - this.operateArea_data.left;
            let t = data.top - this.operateArea_data.top;

            return {
                left: l,
                top: t
            }
        };

        this._h_rootCoordinate2ImageCoordinate = function(value) {
            let pData = this._getDomRootCoodinate(this.operateArea_data.dom);
            this.operateArea_data.left = pData.left;
            this.operateArea_data.top = pData.top;

            return (value - this.operateArea_data.left);
        };

        this._v_rootCoordinate2ImageCoordinate = function(value) {
            let pData = this._getDomRootCoodinate(this.operateArea_data.dom);
            this.operateArea_data.left = pData.left;
            this.operateArea_data.top = pData.top;
            return (value - this.operateArea_data.top);
        };

        this._h_ImageCoodinate2rootCoordinate = function(value) {
            let pData = this._getDomRootCoodinate(this.operateArea_data.dom);
            this.operateArea_data.left = pData.left;
            this.operateArea_data.top = pData.top;
            return (value + this.operateArea_data.left);
        };

        this._v_ImageCoodinate2rootCoordinate = function(value) {
            let pData = this._getDomRootCoodinate(this.operateArea_data.dom);
            this.operateArea_data.left = pData.left;
            this.operateArea_data.top = pData.top;
            return (value + this.operateArea_data.top);
        };
        //======================================================================
        // 執行運動計畫
        this._updateChooseAreaByPlainData = function(moveData) {
            this.chooseArea.top = moveData.top;
            this.chooseArea.left = moveData.left;
            this.chooseArea.right = moveData.right;
            this.chooseArea.bottom = moveData.bottom;
        };
        //======================================================================

        // 要等比例移動會經過此判別
        this._maintainRatio_caculate = function(moveData, point, distance, callback) {
            console.log('-----------s------------');
            let method;

            let h = point.h;
            let v = point.v;

            let h_distance = distance.h;
            let v_distance = distance.v;

            let h_callback = callback.h;
            let v_callback = callback.v;

            let _h = h - this.prevCoordinate.x;
            let _v = v - this.prevCoordinate.y;

            // 是否是往內縮的運動
            if (h_distance >= v_distance) {
                method = 'v';
            } else {
                method = 'h';
            }
            let judge_1 = this._isInBox(moveData, h, v);
            //============================
            // 之前的運作方式
            // _h, _v 不盡完善
            function test() {

                console.log('h(%s), v(%s)', _h, _v);
                if (judge_1) {

                    console.log('decrise');

                    // 以最短改變距離為主
                    if (h_distance >= v_distance) {
                        method = 'v';
                    } else {
                        method = 'h';
                    }
                } else {

                    console.log('incrise');
                    //
                    // _h,_v 判別必須看是哪一腳而定.....這邊是錯的
                    // 不同角有不同的修正方式
                    if (_h < 0) {
                        //
                        // alert('p');
                        console.log('ggg   >>>>>>>>>>>>>>>>>>>>>>>>>>(%s)', _h);
                        method = 'v';
                    } else if (_v < 0) {
                        // alert('p');
                        console.log('ggg    >>>>>>>>>>>>>>>>>>>>>>>>>>(%s)', _v);
                        method = 'h';
                    } else {
                        // 以最短改變距離為主
                        // 但若向量值是0，改以另一向量為基準

                        if (h_distance >= v_distance) {
                            // v 為主
                            // console.log('<<t>>');
                            method = 'v';
                        } else {
                            // h 為主
                            // console.log('<<l>>');
                            method = 'h';
                        }
                    }
                }
            }
            //============================
            let fixCount = 0;
            let fix;
            do {
                // fix 步驟
                // increase 的算法仍不夠完善
                // 用這補足
                if (fixCount) {
                    console.log('<<< fix >>>');
                }

                if (/v/i.test(method)) {
                    v_callback.call(this, h, v, moveData)
                    method = 'h';
                } else {
                    h_callback.call(this, h, v, moveData);
                    method = 'v';
                }

                // 若算出的座標，游標不在其上
                // 必須換另一個
                fix = this._isInBox(moveData, h, v);
            } while (fixCount++ < 1 && !fix && !judge_1);

            console.log('method: %s', method);
            console.log('-----------e------------');
        };
        //======================================================================
        // 可能不需要
        this._updatePrevCoordinate = function(e) {
            let positionData = this._getCousorRootCoodinate(e);

            this.prevCoordinate.x = positionData.left;
            this.prevCoordinate.y = positionData.top;
        };
    }).call(ImageCut.prototype);

    ////////////////////////////////////////////////////////////////////////////////
    (function() {
        // 主要在移動虛擬座標 chooseArea
        // 每個 controlPoint 有不同的移動策略
        this._caculateMethod = {
            // top
            0: function(h, v) {
                let moveData = this.chooseArea.clone();
                moveData.top = v;
                return moveData;
            },
            //============================
            // top-right
            1: function(h, v) {
                let moveData = this.chooseArea.clone();

                // 與之前座標的距離差
                let h_distance = Math.abs(moveData.right - h);
                let v_distance = Math.abs(moveData.top - v);

                //----------------------------
                function h_callback(h, v, moveData) {

                    moveData.right = h;
                    moveData.top = moveData.bottom - (moveData.width / this.imageRatio);
                }

                function v_callback(h, v, moveData) {
                    moveData.top = v;
                    moveData.right = moveData.left + (moveData.height * this.imageRatio);
                }
                //----------------------------
                this._maintainRatio_caculate(moveData, {
                    h: h,
                    v: v
                }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                });

                return moveData;
            },
            //============================
            // right
            2: function(h, v) {
                let moveData = this.chooseArea.clone();
                moveData.right = h;
                return moveData;
            },
            //============================
            // right-bottom
            3: function(h, v) {
                let moveData = this.chooseArea.clone();
                //--
                // 與之前座標的距離差
                let h_distance = Math.abs(moveData.right - h);
                let v_distance = Math.abs(moveData.bottom - v);
                //------------------------------------------------------
                function h_callback(h, v, moveData) {
                    moveData.right = h;
                    moveData.bottom = moveData.top + (moveData.width / this.imageRatio);
                }

                function v_callback(h, v, moveData) {
                    moveData.bottom = v;
                    moveData.right = moveData.left + (moveData.height * this.imageRatio);
                    moveData.right = Math.round(moveData.right);
                }
                //----------------------------
                this._maintainRatio_caculate(moveData, {
                    h: h,
                    v: v
                }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                });

                return moveData;
            },

            //============================
            // bottom
            4: function(h, v) {
                let moveData = this.chooseArea.clone();
                moveData.bottom = v;
                return moveData;
            },
            //============================
            // left-bottom
            5: function(h, v) {
                let moveData = this.chooseArea.clone();

                // 與之前座標的距離差
                let h_distance = Math.abs(moveData.left - h);
                let v_distance = Math.abs(moveData.bottom - v);
                //----------------------------
                function h_callback(h, v, moveData) {
                    moveData.left = h;
                    moveData.bottom = moveData.top + (moveData.width / this.imageRatio);
                    moveData.bottom = Math.round(moveData.bottom);
                }

                function v_callback(h, v, moveData) {
                    moveData.bottom = v;

                    moveData.left = moveData.right - (moveData.height * this.imageRatio);
                    moveData.left = Math.round(moveData.left);
                }
                //----------------------------
                this._maintainRatio_caculate(moveData, {
                    h: h,
                    v: v
                }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                });

                return moveData;
            },

            //============================
            // left
            6: function(h, v) {
                let moveData = this.chooseArea.clone();
                moveData.left = h;
                return moveData;
            },
            //============================
            // top-left
            7: function(h, v) {
                let moveData = this.chooseArea.clone();

                // 與之前座標的距離差
                let h_distance = Math.abs(moveData.left - h);
                let v_distance = Math.abs(v - moveData.top);
                //----------------------------
                function h_callback(h, v, moveData) {

                    // 優先改變
                    moveData.left = h;

                    moveData.top = moveData.bottom - (moveData.width / this.imageRatio);
                    moveData.top = Math.round(moveData.top);
                }

                function v_callback(h, v, moveData) {
                    moveData.top = v;

                    moveData.left = moveData.right - (moveData.height * this.imageRatio);
                    moveData.left = Math.round(moveData.left);
                }
                //----------------------------
                this._maintainRatio_caculate(moveData, {
                    h: h,
                    v: v
                }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                });

                return moveData;
            },
        };

    }).call(ImageCut.prototype);
    ////////////////////////////////////////////////////////////////////////////////
    (function() {
        this._check_1 = function() {
            let error = [];
            if (!this.root_data.dom) {
                error.push('no set rootDom');
            }

            if (!this.canvas_data.dom) {
                error.push('no set dom.ct_canvas');
            }

            if (!this.image_data.dom) {
                error.push('no set dom.ct_imageBackground');
            }

            if (!this.selectMark_data.dom) {
                error.push('no set dom.ct_selectArea');
            }

            if (!this.operateArea_data.dom) {
                error.push('no set dom.ct_operateArea');
            }

            for (let k in this.point) {
                if (!this.point[k].dom) {
                    error.push('no set control point(' + k + ')');
                }
            }

            for (let k in this.bg) {
                if (!this.bg[k].dom) {
                    error.push('no set background(' + k + ')');
                }
            }

            if (error.length) {
                throw new Error(error.join(' | '));
            }
        };
        //======================================================================
        this.checkCursorPosition = function(coursorData) {
            if (coursorData.left > this.safeArea.right || coursorData.left < this.safeArea.left) {
                return false
            }
            if (coursorData.top > this.safeArea.bottom || coursorData.top < this.safeArea.top) {
                return false
            }
            return true;
        };
        //======================================================================
        // 檢查計算
        this._checkCaculate = function(moveData) {
            let error = [];

            if (moveData.left > moveData.right) {
                error.push('left > right');
            }

            if (moveData.top > moveData.bottom) {
                error.push('top < bottom');
            }
            //----------------------------
            // 注意瀏覽器讀位置時有時會採 4/5
            // chooseArea 由 controlPoint 位置決定有時會採 4/5
            // 高度寬度不會用 4/5
            if (moveData.right > this.safeArea.right) {
                error.push('right out range');
            }

            if (moveData.left < this.safeArea.left) {
                error.push('left out range');
            }

            if (moveData.top < this.safeArea.top) {
                error.push('top out range');
            }
            // 注意瀏覽器讀位置時有時會採 4/5
            // chooseArea 由 controlPoint 位置決定有時會採 4/5
            // 高度寬度不會用 4/5
            if (moveData.bottom > this.safeArea.bottom) {
                error.push('bottom out range');
            }

            let ratio = Math.abs(moveData.right - moveData.left) / Math.abs(moveData.bottom - moveData.top);
            if (this.imageRatio) {
                if (Math.abs(ratio - this.imageRatio) > 0.5) {
                    // error.push('ratio change');
                }
            }
            //----------------------------
            if (error.length) {
                let e = error.join('|');
                console.log('------------------');
                console.log('outRange(%s)', error.join('|'));
                console.log('safeArea(%s)', JSON.stringify(this.safeArea));
                console.log('plain(%s)', JSON.stringify(moveData));
                console.log('------------------');
                return false;
            }
            return true;
        };
        //======================================================================
        this._check_selectArea_left = function(left) {

            if (left < this.safeArea.left) {
                console.log('out left');
                return false;
            }

            if ((left + this.chooseArea.width) > this.safeArea.right) {
                console.log('out right');
                return false;
            }

            return true;
        };
        //==========================================================================
        this._check_selectArea_top = function(top) {

            if (top < this.safeArea.top) {
                console.log('out top');
                return false;
            }

            if ((top + this.chooseArea.height) > this.safeArea.bottom) {
                console.log('out bottom');
                return false;
            }
            return true;
        };
        //======================================================================
        // 取得圖片 size
        // 非同步
        this._getImageSize = function() {
            let p = Promise.resolve();
            let def = $.Deferred();

            // def 轉 promise
            p = p.then(function() {
                return def.promise();
            });
            //----------------------------
            let _img = this.imageObj = new Image();
            _img.src = this.options.src;

            if (_img.complete) {
                def.resolve({
                    w: _img.width,
                    h: _img.height
                });
            } else {
                let checkHandle = setTimeout(function() {
                    def.reject("cutImage can't load image");
                }, 1000);

                _img.onload = function() {
                    clearTimeout(checkHandle);

                    def.resolve({
                        w: _img.width,
                        h: _img.height
                    });
                }
            }
            //----------------------------
            return p;
        };
        //======================================================================
        // 由事件推動
        // 當移動 contolPoint 會進入這
        this._updateByControlPoint = function(e) {

            console.log('move');

            let clickBoxName = this.clickBoxName;

            // 更新 chooseArea 的座標
            // firefox 會累積 4捨五入的誤差
            // this._updateChooseAreaSizeBySmallBox();
            // console.log('update chooseArea: %s', JSON.stringify(this.chooseArea));

            // return;
            //----------------------------

            let currentTarget = e.currentTarget;
            let target = e.target;

            let l = e.offsetX;
            let t = e.offsetY;

            this.cursor.left = l;
            this.cursor.top = t;

            // 跟座標
            let positionData = this._getCousorRootCoodinate(e);
            console.log('cursor(%s)', JSON.stringify(positionData));

            // 游標超過安全範圍
            if (!this.checkCursorPosition(positionData)) {
                // console.log('out................');
                this._updatePrevCoordinate(e);
                return;
            }
            //----------------------------
            // 計算 smallbox 的移動座標
            // 更新 chooseArea 的座標

            // 計畫移動距離
            let moveData = {};
            if (clickBoxName in this._caculateMethod) {
                // 計算計畫移動距離

                let caculate_fn = this._caculateMethod[clickBoxName];
                moveData = caculate_fn.call(this, positionData.left, positionData.top);
            } else {
                throw new Error('no assign caculate=>' + clickBoxName);
            }

            // 審核(計畫移動距離)是否超過安全範圍
            if (!this._checkCaculate(moveData)) {
                this._updatePrevCoordinate(e);
                return;
            }

            // 執行運動計畫
            this._updateChooseAreaByPlainData(moveData);

            // return;
            //----------------------------
            this._moveAllControlPoint();

            this._updateSelectArea();

            this._updateBgSize();
            //----------------------------
            this._updatePrevCoordinate(e);

            this._triggerEvent();
        };

        //==========================================================================
        // 當移動選取區會驅動此
        this._updateBySelectArea = function(e) {
            //----------------------------
            let currentTarget = e.currentTarget;
            let target = e.target;

            let l = e.offsetX;
            let t = e.offsetY;
            //----------------------------

            let positionData = this._getCousorRootCoodinate(e);

            let left = positionData.left - this.dragData.left;
            let top = positionData.top - this.dragData.top;
            //----------------------------
            let count = 0;
            if (this._check_selectArea_left(left)) {
                let l = this._h_rootCoordinate2ImageCoordinate(left);

                $(this.selectMark_data.dom).css({
                    left: l
                });
            } else {
                count++;
            }

            if (this._check_selectArea_top(top)) {
                let t = this._v_rootCoordinate2ImageCoordinate(top);

                $(this.selectMark_data.dom).css({
                    top: t
                });
            } else {
                count++
            }

            if (count >= 2) {
                return;
            }
            //----------------------------
            // console.log('count(%d)', count);

            this._updateChooseAreaSizeBySelectArea();

            this._moveAllControlPoint();

            this._updateBgSize();

            this._triggerEvent();
        };
        //======================================================================
        this.toJSON = function() {
            let data = {};
            data['cursor'] = this.cursor;
            data['area'] = this.chooseArea;

            return data;
        };
    }).call(ImageCut.prototype);
    ////////////////////////////////////////////////////////////////////////////

    (function(self) {

        // detach 的 dom 放在這
        self.$$$memory = {};
        self.timeHandle;

        // 實例化 的 cutImage 放在這
        self.$$$imageCut_map = {};
        //======================================================================
        self.bindEvent = function() {
            window.onresize = self.debounce(self.$$$winOnResize, 100, self);
        };

        self.$$$winOnResize = function() {
            for (let k in self.$$$imageCut_map) {
                let imgObj = self.$$$imageCut_map[k];

                imgObj.winResize();
            }
        };
        //======================================================================
        self.debounce = function(callback, time, context) {
            context = context || null;

            return function() {
                let args = arguments;
                clearTimeout(self.timeHandle);

                self.timeHandle = setTimeout(function() {
                    callback.apply(context, args);
                }, time);
            };
        };

        self.create = function(k, options) {

        };
        //======================================================================
        self.setElement = function(k, options) {
            options = options || {};

            let cut = this.$$$imageCut_map[k] = new ImageCut();


            if (options.src != null) {
                cut.setImage(options.src);
            }

            if (options.width != null && options.height != null) {
                cut.setSize(options);
            }

            cut.setElement(options.root);

        };

        //======================================================================
        self.updateImage = function(k, src) {
            let cut = this.$$$imageCut_map[k];

            if (cut == null) {
                throw new Error("cutImage no instance(" + k + ")");
            }

            cut.setImage(src);

            cut.initialize();
        };
        //======================================================================
        self.hide = function(k, detach) {

        };

        self.show = function() {

        };
        // 重設選取區塊
        self.resetSelectArea = function(k) {

        };

    })(ImageCut);

    ImageCut.bindEvent();
})(this);
