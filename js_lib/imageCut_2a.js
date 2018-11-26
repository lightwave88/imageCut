function DomData() {
    this.dom = null;
    this.height = null;
    this.width = null;
    this.height = null;
    this.top = null;
    this.left = null;
    this.src = null;
}

////////////////////////////////////////////////////////////////////////////////
//
// options => {src:圖片位置, el: root, width: 視窗寬 ,heigth: 視窗高, parent: parentNode}
//
////////////////////////////////////////////////////////////////////////////////

function ImageCut(options) {
    options = options || {};

    this.parent;
    this.root = new DomData();
    this.image = new DomData();
    this.selectArea = new DomData();
    this.operateContainer = new DomData();
    //----------------------------
    this.maintainRatio = false;
    this.ratio;
    //----------------------------
    this.box = {
        top: new DomData(),
        left: new DomData(),
        bottom: new DomData(),
        right: new DomData()
    };
    this.bg = {
        top: new DomData(),
        left: new DomData(),
        bottom: new DomData(),
        right: new DomData()
    };

    this.chooseArea = {
        top: null,
        left: null,
        bottom: null,
        right: null
    };
    //----------------------------
    this.clickBoxName = '';

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
            this.root.dom = document.querySelector(options.el);
        } else {
            this.root.dom = options.el;
        }

        if (!this.root.dom) {
            throw new Error('no assign rootDom');
        }
        //----------------------------
        this._createDom();

        this._getDoms();

        this._checkSize();

        this._updateSelectArea();

        this._moveAllSamllBox();

        this._updateBg();

        this._bindEvent();

        $(this.root.dom).trigger('area', JSON.stringify(this.chooseArea));
    };
    //==========================================================================
    // 創造需要的 dom
    this._createDom = function () {

    };
    //==========================================================================
    this._getDoms = function () {


        let imageDom = this.image.dom = this.root.dom.querySelector('div.image');
        //----------------------------
        this.operateContainer.dom = imageDom.querySelector('div.operate_container');
        //----------------------------
        this.box.right.dom = imageDom.querySelector('div.box-right');
        this.box.left.dom = imageDom.querySelector('div.box-left');
        this.box.top.dom = imageDom.querySelector('div.box-top');
        this.box.bottom.dom = imageDom.querySelector('div.box-bottom');
        //----------------------------
        this.bg.right.dom = imageDom.querySelector('div.bg-right');
        this.bg.left.dom = imageDom.querySelector('div.bg-left');
        this.bg.top.dom = imageDom.querySelector('div.bg-top');
        this.bg.bottom.dom = imageDom.querySelector('div.bg-bottom');
        //----------------------------
        this.selectArea.dom = imageDom.querySelector('div.selectArea');
    };
    //==========================================================================
    this._checkSize = function () {
        debugger;

        this.root.width = $(this.root.dom).outerWidth();
        this.root.height = $(this.root.dom).outerHeight();
        //----------------------------
        this.image.width = $(this.image.dom).outerWidth();
        this.image.height = $(this.image.dom).outerHeight();

        this.operateContainer.width = $(this.operateContainer.dom).outerWidth();
        this.operateContainer.height = $(this.operateContainer.dom).outerHeight();

        this._getOperateContainerPosition();


        console.log('child: left(%s), top(%s)', this.operateContainer.left, this.operateContainer.top);
        //----------------------------
        this.chooseArea.left = 0;
        this.chooseArea.top = 0;
        this.chooseArea.right = this.image.width;
        this.chooseArea.bottom = this.image.height;
        //----------------------------
        for (let k in this.box) {
            let data = this.box[k];
            let dom = data.dom;
            data.width = $(dom).outerWidth();
            data.height = $(dom).outerHeight();
        }

    };
    //==========================================================================

    this._updateBg = function () {
        debugger;

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
        width = this.image.width - this.chooseArea.right;
        $(bg.dom).css({
            height: height,
            width: width
        });
        //----------------------------
        bg = this.bg.bottom;

        height = this.image.height - this.chooseArea.bottom;

        $(bg.dom).css({
            height: height
        });

    };
    //==========================================================================
    this._bindEvent = function () {

        $(this.root.dom).on('mousemove', _.bind(function (e) {


            if (this.clickBoxName.length) {
                this._updateByBox(e);
            }

            if (typeof this.dragData.left !== 'undefined' &&
                typeof this.dragData.top !== 'undefined') {
                this._updateBySelectArea(e);
            }
        }, this));
        //============================
        $('div.smallbox', this.root.dom).on('click', _.bind(function (e) {
            e.stopPropagation();

            //----------------------------
            if (this.clickBoxName.length) {

                this.clickBoxName = '';
                $(this.root.dom).off('click');
                return;
            }
            //----------------------------
            let clickDom = e.target;
            let selectAreaDom = this.selectArea.dom;
            this.clickBoxName = $(clickDom).attr('position');

            if (!this.clickBoxName) {
                throw new Error("no assign click box's name");
            }

            this.ratio = ($(selectAreaDom).outerWidth() / $(selectAreaDom).outerHeight());
            // console.log('ratio: %s', this.ratio);
            //----------------------------
            $(this.root.dom).on('click', _.bind(function (e) {
                this.clickBoxName = '';
                $(this.root.dom).off('click');
            }, this));
        }, this));
        //============================
        $(this.selectArea.dom).on('mousedown', _.bind(function (e) {
            let l = e.offsetX;
            let t = e.offsetY;
            this.dragData.left = l;
            this.dragData.top = t;

        }, this));
        //============================
        $(this.selectArea.dom).on('mouseup', _.bind(function (e) {
            this.dragSelectArea = false;
            this.dragData.left = undefined;
            this.dragData.top = undefined;
        }, this));
        //============================
        $('.selectArea input[type="checkbox"]').on('click', _.bind(function (e) {
            // debugger;

            e.stopPropagation();

            let target = e.target;
            this.maintainRatio = $(target).prop('checked');
        }, this));
    };


}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function () {

    //==========================================================================
    // 根據 mousemove 更新 chooseArea
    this._updateChooseSizeBySmallBox = function () {
        // debugger;
        let box;

        box = this.box.left;
        this.chooseArea.left = box.dom.offsetLeft + box.width;

        box = this.box.top;
        this.chooseArea.top = box.dom.offsetTop + box.height;

        box = this.box.right;
        this.chooseArea.right = box.dom.offsetLeft;

        box = this.box.bottom;
        this.chooseArea.bottom = box.dom.offsetTop;
    };
    //==========================================================================
    this._updateChooseSizeBySelectArea = function () {

        let selectArea = this.selectArea;

        this.chooseArea.left = selectArea.dom.offsetLeft;
        this.chooseArea.top = selectArea.dom.offsetTop;

        this.chooseArea.right = selectArea.dom.offsetLeft + $(selectArea.dom).outerWidth();
        this.chooseArea.bottom = selectArea.dom.offsetTop + $(selectArea.dom).outerHeight();


    };
    //==========================================================================
    this._updateSelectArea = function () {
        this.selectArea.left = this.chooseArea.left;
        this.selectArea.top = this.chooseArea.top;
        this.selectArea.width = this.chooseArea.right - this.chooseArea.left;
        this.selectArea.height = this.chooseArea.bottom - this.chooseArea.top;

        let selectArea = this.selectArea;

        $(selectArea.dom).css({
            height: selectArea.height,
            width: selectArea.width,
            left: selectArea.left,
            top: selectArea.top
        });

    };

    //==========================================================================
    // 由移動 selectArea 來驅動
    this._moveAllSamllBox = function () {
        let box;
        // left.box
        box = this.box.left;
        box.left = this.chooseArea.left - box.width;
        box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

        // right.box
        box = this.box.right;
        box.left = this.chooseArea.right;
        box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

        // top.box
        box = this.box.top;
        box.left = (this.chooseArea.left + this.chooseArea.right - box.width) / 2;
        box.top = this.chooseArea.top - box.height;

        // bottom.box
        box = this.box.bottom;
        box.left = (this.chooseArea.left + this.chooseArea.right - box.width) / 2;
        box.top = this.chooseArea.bottom;
        //----------------------------

        for (let k in this.box) {
            let d = this.box[k];

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

        while (!this.root.dom.isEqualNode(dom)) {

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

        while (!this.root.dom.isEqualNode(target)) {
            left += target.offsetLeft;
            top += target.offsetTop;
            target = target.parentNode;
        }

        return {
            left: left,
            top: top
        };
    };
}).call(ImageCut.prototype);

////////////////////////////////////////////////////////////////////////////////
(function () {
    this._caculateMethod = {
        // right
        right: function (l, t) {
            let box = this.box.right;

            l = l - this.operateContainer.left;

            this.chooseArea.right = l;
            //----------------------------
            if (this.maintainRatio) {
                let width = this.chooseArea.right - this.chooseArea.left;
                let height = width / this.ratio;
                this.chooseArea.bottom = this.chooseArea.top + height;
            }
        },
        //----------------------------
        // left
        left: function (l, t) {
            let box = this.box.right;

            l = l - this.operateContainer.left;
            //----------------------------
            this.chooseArea.left = l;
            if (this.maintainRatio) {
                let width = this.chooseArea.right - this.chooseArea.left;
                let height = width / this.ratio;
                this.chooseArea.bottom = this.chooseArea.top + height;
            }
        },
        //----------------------------
        // top
        top: function (l, t) {
            let box = this.box.top;
            t = t - this.operateContainer.top;
            //----------------------------
            this.chooseArea.top = t;
            if (this.maintainRatio) {
                let height = this.chooseArea.bottom - this.chooseArea.top;
                let width = height * this.ratio;
                this.chooseArea.right = this.chooseArea.left + width;
            }

        },
        //----------------------------
        // bottom
        bottom: function (l, t) {
            let box = this.box.bottom;
            t = t - this.operateContainer.top;
            //----------------------------
            this.chooseArea.bottom = t;
            if (this.maintainRatio) {
                let height = this.chooseArea.bottom - this.chooseArea.top;
                let width = height * this.ratio;
                this.chooseArea.right = this.chooseArea.left + width;
            }
            console.log('bottom = %s, right = %s', this.chooseArea.bottom, this.chooseArea.right);
        }
    };

}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function () {
    this._moveMethod = {
        // left
        left: function () {

            if (this.maintainRatio) {
                this._moveAllSamllBox();
                return;
            }
            //----------------------------
            let box = this.box.left;

            box.left = this.chooseArea.left - box.width;

            $(box.dom).css({
                left: box.left
            });
            //----------------------------
            box = this.box.top;

            box.left = (this.chooseArea.right + this.chooseArea.left - box.width) / 2;

            $(box.dom).css({
                left: box.left
            });
            //----------------------------
            box = this.box.bottom;

            box.left = (this.chooseArea.right + this.chooseArea.left - box.width) / 2;

            $(box.dom).css({
                left: box.left
            });
        },
        // right
        right: function () {

            if (this.maintainRatio) {
                this._moveAllSamllBox();
                return;
            }
            //----------------------------
            let box;
            box = this.box.right;

            box.left = this.chooseArea.right;

            $(box.dom).css({
                left: box.left
            });
            //----------------------------
            box = this.box.bottom;

            box.left = (this.chooseArea.right + this.chooseArea.left - box.width) / 2;

            $(box.dom).css({
                left: box.left
            });

            //----------------------------
            box = this.box.top;

            box.left = (this.chooseArea.right + this.chooseArea.left - box.width) / 2;

            $(box.dom).css({
                left: box.left
            });
        },
        // top
        top: function () {
            if (this.maintainRatio) {
                this._moveAllSamllBox();
                return;
            }
            //----------------------------
            let box = this.box.top;

            box.top = this.chooseArea.top - box.height;

            $(box.dom).css({
                top: box.top
            });
            //----------------------------
            box = this.box.left;

            box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

            $(box.dom).css({
                top: box.top
            });
            //----------------------------
            box = this.box.right;

            box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

            $(box.dom).css({
                top: box.top
            });
        },
        // bottom
        bottom: function () {
            if (this.maintainRatio) {
                this._moveAllSamllBox();
                return;
            }
            //----------------------------
            let box = this.box.bottom;

            box.top = this.chooseArea.bottom;

            $(this.box.bottom.dom).css({
                top: box.top
            });
            //----------------------------
            box = this.box.left;

            box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

            $(box.dom).css({
                top: box.top
            });
            //----------------------------
            box = this.box.right;

            box.top = (this.chooseArea.top + this.chooseArea.bottom - box.height) / 2;

            $(box.dom).css({
                top: box.top
            });
        }
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

        if (this.chooseArea.right > this.image.width) {
            error.push('right out range');
        }

        if (this.chooseArea.left < 0) {
            error.push('left out range');
        }

        if (this.chooseArea.top < 0) {
            error.push('top out range');
        }

        if (this.chooseArea.bottom > this.image.height) {
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

        let selectArea_width = $(this.selectArea.dom).outerWidth();
        if (left > (this.image.width - selectArea_width)) {
            return false;
        }

        return true;
    };
    //==========================================================================
    this._check_selectArea_top = function (top) {
        if (top < 0) {
            return false;
        }

        let selectArea_height = $(this.selectArea.dom).outerHeight();
        if (top > (this.image.height - selectArea_height)) {
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
        //----------------------------
        // 計算 smallbox 的移動座標
        // 更新 chooseArea 的座標

        if(!this._caculateMethod.hasOwnProperty(this.clickBoxName)){
          return;
        }
        // 計算移動距離
        let caculate_fn = this._caculateMethod[this.clickBoxName];
        caculate_fn.call(this, positionData.left, positionData.top);

        // 檢查座標
        if (!this._check_1()) {
            return;
        }
        //----------------------------
        let move_fn;

        if(!this._moveMethod.hasOwnProperty(this.clickBoxName)){
          return;
        }
        // 移動 smallbox
        move_fn = this._moveMethod[this.clickBoxName];
        move_fn.call(this);
        //----------------------------
        // 更新 chooseArea 的座標
        this._updateChooseSizeBySmallBox();

        this._updateSelectArea();

        this._updateBg();

        $(this.root.dom).trigger('area', JSON.stringify(this.chooseArea));

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
            $(this.selectArea.dom).css({
                left: left
            });
        }

        if (this._check_selectArea_top(top)) {
            $(this.selectArea.dom).css({
                top: top
            });
        }
        //----------------------------
        this._updateChooseSizeBySelectArea();

        this._moveAllSamllBox();

        this._updateBg();

        $(this.root.dom).trigger('area', JSON.stringify(this.chooseArea));
    };
    //==========================================================================
}).call(ImageCut.prototype);
