
(function (global) {
    if (typeof global['ImageCut'] === 'function') {
        throw new Error('have double ImageCut');
    } else {
        global.ImageCut = ImageCut;
    }

    console.dir({});
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
    // 周圍座標
    function AreaData() {
        this.top;
        this.left;
        this.bottom;
        this.right;
        this.width;
        this.height;
        //----------------------------
        this.self = new Proxy(this, {
            set: function (t, k, v) {
                t[k] = v;
                if (/top|left|bottom|right/i.test(k)) {

                    if (typeof (t['right']) === 'number' && typeof (t['left']) === 'number') {
                        t['width'] = t['right'] - t['left'];
                    }
                    if (typeof (t['bottom']) === 'number' && typeof (t['top']) === 'number') {
                        t['height'] = t['bottom'] - t['top'];
                    }
                }
                //----------------------------
                if (/width|height/i.test(k)) {
                    if (typeof (t['width']) === 'number' && typeof (t['left']) === 'number') {
                        t['right'] = t['left'] + t['right'];
                    }
                    if (typeof (t['height']) === 'number' && typeof (t['top']) === 'number') {
                        t['bottom'] = t['top'] + t['height'];
                    }
                }
            }
        });

        return this.self;
    }


    AreaData.prototype.toJSON = function () {
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

    ////////////////////////////////////////////////////////////////////////////////
    //
    // options => {src:圖片位置, el: root, width: 視窗寬 ,heigth: 視窗高, parent: parentNode}
    //
    ////////////////////////////////////////////////////////////////////////////////

    function ImageCut(options) {
        options = options || {};

        this.parent;
        this.root_data = new DomData_1(); // 基底座標
        this.image_data = new DomData_1();
        //----------------------------
        this.selectMark_data = new DomData_2();
        this.operateContainer = new DomData_2(); // 操作座標
        //----------------------------
        this.fixPoint = 1; // 修正用數值
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
        //----------------------------
        this.clickBoxName = '';

        this.prevCoordinate = {
            x: undefined,
            y: undefined
        }

        this.dragData = {
            left: undefined,
            top: undefined
        };
        //----------------------------
        this._init(options);
    }
    ////////////////////////////////////////////////////////////////////////////////
    (function () {
        this._init = function (options) {

            if (typeof options.el === 'string') {
                this.root_data.dom = document.querySelector(options.el);
            } else {
                this.root_data.dom = options.el;
            }

            if (!this.root_data.dom) {
                throw new Error('no assign rootDom');
            }
            //----------------------------
            this._createDom();

            this._getDoms();

            this._checkSize();

            this._updateSelectArea();

            this._moveAllSmallBox();

            this._updateBg();

            this._bindEvent();

            $(this.root_data.dom).trigger('area', JSON.stringify(this.chooseArea));
        };
        //======================================================================
        // 創造需要的 dom
        this._createDom = function () {

        };
        //======================================================================
        this._getDoms = function () {
            debugger;

            let imageDom = this.image_data.dom = this.root_data.dom.querySelector('div.image');
            //----------------------------
            this.operateContainer.dom = imageDom.querySelector('div.operate_container');
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
            this.bg.right.dom = imageDom.querySelector('div.bg-right');
            this.bg.left.dom = imageDom.querySelector('div.bg-left');
            this.bg.top.dom = imageDom.querySelector('div.bg-top');
            this.bg.bottom.dom = imageDom.querySelector('div.bg-bottom');
            //----------------------------
            this.selectMark_data.dom = imageDom.querySelector('div.selectArea');
        };
        //======================================================================
        this._checkSize = function () {
            debugger;

            this.root_data.width = $(this.root_data.dom).outerWidth();
            this.root_data.height = $(this.root_data.dom).outerHeight();
            //----------------------------
            this.image_data.width = $(this.image_data.dom).outerWidth();
            this.image_data.height = $(this.image_data.dom).outerHeight();

            this.operateContainer.width = $(this.operateContainer.dom).outerWidth();
            this.operateContainer.height = $(this.operateContainer.dom).outerHeight();

            this._getOperateContainerPosition();


            // console.log('child: left(%s), top(%s)', this.operateContainer.left, this.operateContainer.top);
            //----------------------------
            this.chooseArea.left = 0;
            this.chooseArea.top = 0;
            this.chooseArea.right = this.image_data.width;
            this.chooseArea.bottom = this.image_data.height;
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
        this._isInBox = function (l, t) {

            let chooseArea = this.chooseArea;

            // console.log('l(%s), right(%s), left(%s)', l, chooseArea.right, chooseArea.left);

            if (l <= (chooseArea.right + this.fixPoint) && l >= (chooseArea.left - this.fixPoint)) {
                if (t >= (chooseArea.top - this.fixPoint) && t <= (chooseArea.bottom + this.fixPoint)) {
                    return true;
                }
            }
            return false;
        };

        this._updateBg = function () {
            // debugger;

            let bg, width, height;

            bg = this.bg.top;

            height = this.chooseArea.top
            $(bg.dom).css({
                height: height
            });
            //----------------------------
            bg = this.bg.left;

            height = this.chooseArea.bottom - this.chooseArea.top;
            width = this.chooseArea.left;

            $(bg.dom).css({
                height: height,
                width: width
            });
            //----------------------------
            bg = this.bg.right;
            width = this.image_data.width - this.chooseArea.right;
            $(bg.dom).css({
                height: height,
                width: width
            });
            //----------------------------
            bg = this.bg.bottom;

            height = this.image_data.height - this.chooseArea.bottom;

            $(bg.dom).css({
                height: height
            });

        };
        //======================================================================
        this._updatePrevCoordinate = function (e) {
            let positionData = this._getRootPosition(e);
            positionData = this._transformCoordinate(positionData);

            this.prevCoordinate.x = positionData.left;
            this.prevCoordinate.y = positionData.top;
        };
        //======================================================================
        this._bindEvent = function () {
            let updateByBox = _.throttle(_.bind(function (e) {
                this._updateByBox(e);
            }, this), 50);

            updateByBox = _.bind(function (e) {
                this._updateByBox(e);
            }, this);


            $(this.root_data.dom).on('mousemove', _.bind(function (e) {

                if (this.clickBoxName.length) {
                    // this._updateByBox(e);
                    updateByBox(e);
                }

                if (typeof this.dragData.left !== 'undefined' &&
                        typeof this.dragData.top !== 'undefined') {
                    this._updateBySelectArea(e);
                }
            }, this));
            //============================
            $('div.smallbox', this.root_data.dom).on('click', _.bind(function (e) {
                e.stopPropagation();

                //----------------------------
                if (this.clickBoxName.length) {
                    // 之前已經啟動過
                    // 取修之前的啟動
                    this.clickBoxName = '';
                    return;
                }
                //----------------------------
                // 更新 prevCoordinate
                this._updatePrevCoordinate(e);

                //----------------------------
                // methodName
                this.clickBoxName = $(e.target).attr('position');

                if (!this.clickBoxName) {
                    throw new Error("no assign click box's name");
                }
                //----------------------------
                // 紀錄 ratio
                let selectAreaDom = this.selectMark_data.dom;
                this.imageRatio = ($(selectAreaDom).outerWidth() / $(selectAreaDom).outerHeight());

                //----------------------------

            }, this));
            //============================
            $(this.root_data.dom).on('click', this.root_data.dom, _.bind(function (e) {


                this.clickBoxName = '';
                // $(this.root_data.dom).off('click');
            }, this));
            //============================
            $(this.selectMark_data.dom).on('mousedown', _.bind(function (e) {
                let l = e.offsetX;
                let t = e.offsetY;
                this.dragData.left = l;
                this.dragData.top = t;

            }, this));
            //============================
            $(this.selectMark_data.dom).on('mouseup', _.bind(function (e) {
                this.dragSelectArea = false;
                this.dragData.left = undefined;
                this.dragData.top = undefined;
            }, this));
            //============================
        };


    }).call(ImageCut.prototype);
    ////////////////////////////////////////////////////////////////////////////////
    (function () {

        //==========================================================================
        // 根據 mousemove 更新 chooseArea
        this._updateChooseSizeBySmallBox = function () {
            // debugger;
            let box;

            box = this.point[0];
            this.chooseArea.top = box.dom.offsetTop + box.height;

            box = this.point[2];
            this.chooseArea.right = box.dom.offsetLeft;

            box = this.point[4];
            this.chooseArea.bottom = box.dom.offsetTop;

            box = this.point[6];
            this.chooseArea.left = box.dom.offsetLeft + box.width;
        };
        //==========================================================================
        this._updateChooseSizeBySelectArea = function () {

            let selectArea = this.selectMark_data;

            this.chooseArea.left = selectArea.dom.offsetLeft;
            this.chooseArea.top = selectArea.dom.offsetTop;

            this.chooseArea.right = selectArea.dom.offsetLeft + $(selectArea.dom).outerWidth();
            this.chooseArea.bottom = selectArea.dom.offsetTop + $(selectArea.dom).outerHeight();


        };
        //==========================================================================
        this._updateSelectArea = function () {
            console.log('2.right(%s)', this.chooseArea.right);
            this.selectMark_data.left = this.chooseArea.left;
            this.selectMark_data.top = this.chooseArea.top;
            this.selectMark_data.width = this.chooseArea.right - this.chooseArea.left;
            this.selectMark_data.height = this.chooseArea.bottom - this.chooseArea.top;

            let selectArea = this.selectMark_data;

            $(selectArea.dom).css({
                height: selectArea.height,
                width: selectArea.width,
                left: selectArea.left,
                top: selectArea.top
            });

        };

        //==========================================================================
        // 由移動 selectArea 來驅動
        this._moveAllSmallBox = function () {
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
                let d = this.point[k];

                $(d.dom).css({
                    left: d.left,
                    top: d.top
                });
            }
        };
        //==========================================================================
        this._getOperateContainerPosition = function () {

            let dom = this.operateContainer.dom;

            let left = 0,
                    top = 0;

            while (this.root_data.dom !== dom) {

                d = $(dom).offset()

                left += dom.offsetLeft;
                top += dom.offsetTop;

                dom = dom.parentNode;
            }


            this.operateContainer.left = left;
            this.operateContainer.top = top;
        };
        //==========================================================================
        // 轉換成 root 的座標系
        this._getRootPosition = function (e) {
            let currentTarget = e.currentTarget;
            let target = e.target;

            //----------------------------
            let left = e.offsetX;
            let top = e.offsetY;

            // console.log('----------------------');

            while (this.root_data.dom !== target) {
                left += target.offsetLeft;
                top += target.offsetTop;
                target = target.parentNode;
            }

            return {
                left: left,
                top: top
            };
        };
        //==========================================================================
        this._transformCoordinate = function (data) {
            let l = data.left - this.operateContainer.left;
            let t = data.top - this.operateContainer.top;

            return {
                left: l,
                top: t
            }
        };

        //==========================================================================

        this._maintainRatio_caculate = function (point, distance, callback) {
            let method;

            let h = point.h;
            let v = point.v;


            let h_distance = distance.h;
            let v_distance = distance.v;

            let h_callback = callback.h;
            let v_callback = callback.v;

            let chooseArea = this.chooseArea;

            let judge_1 = this._isInBox(h, v);
            if (judge_1) {
                // 以最短改變距離為主
                if (h_distance >= v_distance) {
                    method = 'v';
                } else {
                    method = 'h';
                }
            } else {
                //
                // 這邊可能仍有問題
                //
                //

                // 移動向量
                let _h = h - this.prevCoordinate.x;
                let _v = v - this.prevCoordinate.y;


                if (_h < 0) {
                    //
                    method = 'v';
                } else if (_v < 0) {
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
            //--------------------------------------

            let fixCount = 0;
            let fix;
            do {
                console.log('<<< fix >>>');
                if (/v/i.test(method)) {
                    v_callback.call(this, h, v)
                    method = 'h';
                } else {
                    h_callback.call(this, h, v);
                    method = 'v';
                }

                // 若算出的座標，游標不在其上
                // 必須換另一個
                fix = this._isInBox(h, v);
            } while (++fixCount < 2 && !fix && !judge_1);
        };
    }).call(ImageCut.prototype);

    ////////////////////////////////////////////////////////////////////////////////
    (function () {
        // 主要在移動虛擬座標 chooseArea
        this._caculateMethod = {
            // top
            0: function (h, v) {
                this.chooseArea.top = v;
            },
            //----------------------------
            // top-right
            1: function (h, v) {
                let chooseArea = this.chooseArea;

                // 與之前座標的距離差
                let h_distance = Math.abs(chooseArea.right - h);
                let v_distance = Math.abs(chooseArea.top - v);

                function h_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.right = h;
                    chooseArea.top = chooseArea.bottom - (chooseArea.width / this.imageRatio);
                    chooseArea.top = Math.round(chooseArea.top);
                }

                function v_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.top = v;
                    chooseArea.right = chooseArea.left + (chooseArea.height * this.imageRatio);
                    chooseArea.right = Math.round(chooseArea.right);
                }
                //----------------------------
                this._maintainRatio_caculate(
                        {
                            h: h,
                            v: v
                        }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                }
                );
            },
            //----------------------------
            // right
            2: function (h, v) {
                this.chooseArea.right = h;

                // console.log('1.right(%s)', this.chooseArea.right);
            },
            //----------------------------
            // right-bottom
            3: function (h, v) {
                let chooseArea = this.chooseArea;

                // console.log('-----------------------');

                // 1.必須參考 inBox
                // 2.必須參考向量
                // 3.必須參考與之前座標的距離改變差
                //
                // 1.2.3需要通盤考量 以 3 為主

                // 與之前座標的距離差
                let h_distance = Math.abs(chooseArea.right - h);
                let v_distance = Math.abs(chooseArea.bottom - v);


                function h_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.right = h;
                    chooseArea.bottom = chooseArea.top + (chooseArea.width / this.imageRatio);
                    chooseArea.bottom = Math.round(chooseArea.bottom);
                }

                function v_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.bottom = v;
                    chooseArea.right = chooseArea.left + (chooseArea.height * this.imageRatio);
                    chooseArea.right = Math.round(chooseArea.right);
                }
                //----------------------------
                this._maintainRatio_caculate(
                        {
                            h: h,
                            v: v
                        }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                }
                );

            },

            //----------------------------
            // bottom
            4: function (h, v) {
                this.chooseArea.bottom = v;
            },
            //----------------------------
            // left-bottom
            5: function (h, v) {
                let chooseArea = this.chooseArea;

                // 與之前座標的距離差
                let h_distance = Math.abs(chooseArea.left - h);
                let v_distance = Math.abs(chooseArea.bottom - v);

                function h_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.left = h;

                    chooseArea.bottom = chooseArea.top + (chooseArea.width / this.imageRatio);
                    chooseArea.bottom = Math.round(chooseArea.bottom);
                }

                function v_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.bottom = v;

                    chooseArea.left = chooseArea.right - (chooseArea.height * this.imageRatio);
                    chooseArea.left = Math.round(chooseArea.left);
                }
                //----------------------------
                this._maintainRatio_caculate(
                        {
                            h: h,
                            v: v
                        }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                }
                );
            },

            //----------------------------
            // left
            6: function (h, v) {
                this.chooseArea.left = h;
            },
            //----------------------------
            // top-left
            7: function (h, v) {
                let chooseArea = this.chooseArea;

                // 與之前座標的距離差
                let h_distance = Math.abs(chooseArea.left - h);
                let v_distance = Math.abs(v - chooseArea.top);

                function h_callback(h, v) {
                    let chooseArea = this.chooseArea;

                    // 優先改變
                    chooseArea.left = h;

                    chooseArea.top = chooseArea.bottom - (chooseArea.width / this.imageRatio);
                    chooseArea.top = Math.round(chooseArea.top);
                }

                function v_callback(h, v) {
                    let chooseArea = this.chooseArea;
                    chooseArea.top = v;

                    chooseArea.left = chooseArea.right - (chooseArea.height * this.imageRatio);
                    chooseArea.left = Math.round(chooseArea.left);
                }
                //----------------------------
                this._maintainRatio_caculate(
                        {
                            h: h,
                            v: v
                        }, {
                    h: h_distance,
                    v: v_distance

                }, {
                    h: h_callback,
                    v: v_callback
                }
                );
            },
        };

    }).call(ImageCut.prototype);
    ////////////////////////////////////////////////////////////////////////////////
    (function () {
        this._check_1 = function () {
            let error = [];

            if (this.chooseArea.left > this.chooseArea.right) {
                error.push('left > right');
            }

            if (this.chooseArea.top > this.chooseArea.bottom) {
                error.push('top < bottom');
            }

            if (this.chooseArea.right > this.image_data.width) {
                error.push('right out range');
            }

            if (this.chooseArea.left < 0) {
                error.push('left out range');
            }

            if (this.chooseArea.top < 0) {
                error.push('top out range');
            }

            if (this.chooseArea.bottom > this.image_data.height) {
                error.push('bottom out range');
            }
            //----------------------------
            if (error.length) {
                return false;
            }
            return true;
        };
        //==========================================================================
        this._check_selectArea_left = function (left) {

            if (left < 0) {
                return false;
            }

            let selectArea_width = $(this.selectMark_data.dom).outerWidth();
            if (left > (this.image_data.width - selectArea_width)) {
                return false;
            }

            return true;
        };
        //==========================================================================
        this._check_selectArea_top = function (top) {
            if (top < 0) {
                return false;
            }

            let selectArea_height = $(this.selectMark_data.dom).outerHeight();
            if (top > (this.image_data.height - selectArea_height)) {
                return false;
            }
            return true;
        };
        //==========================================================================
        // 由事件推動
        this._updateByBox = function (e) {
            // 更新 chooseArea 的座標
            this._updateChooseSizeBySmallBox();
            //----------------------------

            let currentTarget = e.currentTarget;
            let target = e.target;

            let l = e.offsetX;
            let t = e.offsetY;

            let positionData = this._getRootPosition(e);
            positionData = this._transformCoordinate(positionData);
            //----------------------------
            // 計算 smallbox 的移動座標
            // 更新 chooseArea 的座標

            if (this._caculateMethod.hasOwnProperty(this.clickBoxName)) {
                // 計算移動距離
                let caculate_fn = this._caculateMethod[this.clickBoxName];
                caculate_fn.call(this, positionData.left, positionData.top);
            } else {
                // 保持 ratio 的計算
                // this._maintainRatio(positionData);
                throw new Error('no assign caculate');
            }


            // 檢查座標
            if (!this._check_1()) {
                return;
            }
            //----------------------------
            let move_fn;

            this._moveAllSmallBox();

            function x() {
                if (this._moveMethod.hasOwnProperty(this.clickBoxName)) {
                    // 移動 smallbox

                    move_fn = this._moveMethod[this.clickBoxName];
                    move_fn.call(this);
                }
            }
            //----------------------------
            this._updateSelectArea();

            this._updateBg();

            this._updatePrevCoordinate(e);
            $(this.root_data.dom).trigger('area', JSON.stringify(this.chooseArea));

        };

        //==========================================================================
        this._updateBySelectArea = function (e) {
            // 更新 chooseArea 的座標
            this._updateChooseSizeBySmallBox();
            //----------------------------
            let currentTarget = e.currentTarget;
            let target = e.target;

            let l = e.offsetX;
            let t = e.offsetY;
            //----------------------------

            let positionData = this._getRootPosition(e);

            let left, top;

            // 相對座標
            left = positionData.left - this.operateContainer.left;
            top = positionData.top - this.operateContainer.top;

            left = left - this.dragData.left;
            top = top - this.dragData.top;
            //----------------------------
            if (this._check_selectArea_left(left)) {
                $(this.selectMark_data.dom).css({
                    left: left
                });
            }

            if (this._check_selectArea_top(top)) {
                $(this.selectMark_data.dom).css({
                    top: top
                });
            }
            //----------------------------
            this._updateChooseSizeBySelectArea();

            this._moveAllSmallBox();

            this._updateBg();

            $(this.root_data.dom).trigger('area', JSON.stringify(this.chooseArea));
        };
        //==========================================================================
    }).call(ImageCut.prototype);
})(this);
