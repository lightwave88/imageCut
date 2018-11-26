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
    this.action = new Map();
    this.limit = new Map(); // 限制條件
    this.move = new Map(); // 移動 box
    //----------------------------
    this.actionFn;
    this.limitCheckFn;
    this.moveFn;
    //----------------------------
    this.clickDom;

    this.dragData = {
        left: undefined,
        top: undefined
    };
    //----------------------------
    this._init(options);
}
////////////////////////////////////////////////////////////////////////////////
(function() {
    this._init = function(options) {

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

        this._setJob();

        this._checkSize();

        this._updateSelectArea();

        this._updateSmallBox();

        this._updateBg();

        this._bindEvent();

        $(this.root.dom).trigger('area', JSON.stringify(this.chooseArea));
    };
    //==========================================================================
    // 創造需要的 dom
    this._createDom = function() {

    };
    //==========================================================================
    this._getDoms = function() {


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
    // 為4個點個別分派他的工作內容
    this._setJob = function() {
        // this.limit.set(this.box.right.dom, this.limit_right);
        this.action.set(this.box.right.dom, this.action_right);
        this.move.set(this.box.right.dom, this.move_right);


        // this.limit.set(this.box.left.dom, this.limit_left);
        this.action.set(this.box.left.dom, this.action_left);
        this.move.set(this.box.left.dom, this.move_left);

        // this.limit.set(this.box.top.dom, this.limit_top);
        this.action.set(this.box.top.dom, this.action_top);
        this.move.set(this.box.top.dom, this.move_top);

        // this.limit.set(this.box.bottom.dom, this.limit_bottom);
        this.action.set(this.box.bottom.dom, this.action_bottom);
        this.move.set(this.box.bottom.dom, this.move_bottom);
    };
    //==========================================================================
    this._checkSize = function() {
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
    this._updateBg = function() {
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
    this._bindEvent = function() {


        $(this.root.dom).on('mousemove', _.bind(function(e) {


            if (this.clickDom) {
                this._updateByBox(e);
            }

            if (typeof this.dragData.left !== 'undefined' &&
                typeof this.dragData.top !== 'undefined') {
                this._updateBySelectArea(e);
            }
        }, this));
        //----------------------------
        $('div.smallbox', this.root.dom).on('click', _.bind(function(e) {
            e.stopPropagation();

            // console.log('smalbox.click');

            let selectAreaDom = this.selectArea.dom;

            this.ratio = ($(selectAreaDom).outerWidth() / $(selectAreaDom).outerHeight());
            console.log('ratio: %s',this.ratio);

            if (this.clickDom) {
                this.clickDom = undefined;
                $(this.root.dom).off('click');
                return;
            }

            this.clickDom = e.target;
            //----------------------------
            // 根據不同 box，給予相對的指令
            this.actionFn = this.action.get(this.clickDom);
            this.moveFn = this.move.get(this.clickDom);
            //----------------------------
            $(this.root.dom).on('click', _.bind(function(e) {
                console.log('root.click');
                this.clickDom = undefined;
                $(this.root.dom).off('click');
            }, this));
        }, this));
        //----------------------------
        $(this.selectArea.dom).on('mousedown', _.bind(function(e) {
            let l = e.offsetX;
            let t = e.offsetY;
            this.dragData.left = l;
            this.dragData.top = t;

        }, this));
        //----------------------------
        $(this.selectArea.dom).on('mouseup', _.bind(function(e) {
            this.dragSelectArea = false;
            this.dragData.left = undefined;
            this.dragData.top = undefined;
        }, this));

        $('.selectArea input[type="checkbox"]').on('click', _.bind(function(e) {
            debugger;

            e.stopPropagation();

            let target = e.target;
            this.maintainRatio = $(target).prop('checked');
        }, this));
    };


}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function() {

    //==========================================================================
    // 根據 mousemove 更新 chooseArea
    this._updateChooseSizeBySmallBox = function() {
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
    this._updateChooseSizeBySelectArea = function() {

        let selectArea = this.selectArea;

        this.chooseArea.left = selectArea.dom.offsetLeft;
        this.chooseArea.top = selectArea.dom.offsetTop;

        this.chooseArea.right = selectArea.dom.offsetLeft + $(selectArea.dom).outerWidth();
        this.chooseArea.bottom = selectArea.dom.offsetTop + $(selectArea.dom).outerHeight();


    };
    //==========================================================================
    this._updateSelectArea = function() {
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
    this._updateSmallBox = function() {
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
                left: (d.left + 'px'),
                top: (d.top + 'px')
            });
        }
    };
    //==========================================================================
    this._getOperateContainerPosition = function() {

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
    this._getRootPosition = function(e) {
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

        // console.log('left(%s), top(%s)', left, top);

        return {
            left: left,
            top: top
        };
    };
}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function() {

    /*========================================================================*/
    // limit box 的移動限制
    this.limit_right = function(l, t) {
        let domData = this.box.right;

        console.log('limit_right');

        if (l > this.image.width) {

            return false;
        }

        if (l < 0) {
            return false;
        }

        if (t < 0) {
            return false;
        }

        if ((t + domData.height) > this.image.height) {
            return false;
        }
        return true;
    };
    //==========================================================================
    this.limit_left = function(l, t) {
        let domData = this.box.left;

        console.log('limit_left');

        if ((l + domData.width) > this.image.width) {
            return false;
        }

        if ((l + domData.width) < 0) {
            return false;
        }

        if (t < 0) {
            return false;
        }

        if ((t + domData.height) > this.image.height) {
            return false;
        }
        return true;
    };
    //==========================================================================
    this.limit_top = function(l, t) {
        let domData = this.box.top;

        console.log('limit_top: %s', t);

        if ((l + domData.width) > this.image.width) {
            return false;
        }

        if (l < 0) {
            return false;
        }

        if ((t + domData.height) < 0) {
            return false;
        }

        if ((t + domData.height) > this.image.height) {
            return false;
        }

        return true;
    };
    //==========================================================================
    this.limit_bottom = function(l, t) {
        let domData = this.box.bottom;

        console.log('limit_bottom');

        if ((l + domData.width) > this.image.width) {
            return false;
        }

        if (l < 0) {
            return false;
        }

        if (t < 0) {
            return false;
        }

        if (t > this.image.height) {
            return false;
        }
        return true;
    };
    //==========================================================================

}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////

(function() {
    this.action_right = function() {
        let box;

        console.log('action_right.maintainRatio(%b)', this.maintainRatio);

        if (this.maintainRatio) {

            console.log('====>%s',this.chooseArea.bottom);
            box = this.box.bottom;
            $(box.dom).css({
                top: this.chooseArea.bottom
            });
        }
        //----------------------------
        let right_bg_width = this.image.width - this.chooseArea.right;
        $(this.bg.right.dom).css({
            width: right_bg_width
        });
        //----------------------------

        let correctLeft = (this.chooseArea.left + this.chooseArea.right - this.box.top.width) / 2;

        // console.log('_left = %s', this.chooseArea.right);
        box = this.box.top;
        $(box.dom).css({
            left: correctLeft
        });

        box = this.box.bottom;
        $(box.dom).css({
            left: correctLeft
        });

    };
    /*========================================================================*/
    this.action_left = function() {
        if (this.maintainRatio) {

        } else {
            $(this.bg.left.dom).css({
                width: this.chooseArea.left
            });

            let correctLeft = (this.chooseArea.left + this.chooseArea.right - this.box.top.width) / 2;

            // console.log('_left = %s', this.chooseArea.right);

            $(this.box.top.dom).css({
                left: correctLeft
            });

            $(this.box.bottom.dom).css({
                left: correctLeft
            });
        }
    };
    /*========================================================================*/
    this.action_top = function() {
        if (this.maintainRatio) {

        } else {
            $(this.bg.top.dom).css({
                height: this.chooseArea.top
            });

            let correctHeight = (this.chooseArea.bottom - this.chooseArea.top);

            $(this.bg.left.dom).css({
                height: correctHeight
            });

            $(this.bg.right.dom).css({
                height: correctHeight
            });
            //----------------------------

            let correctTop = (this.chooseArea.top + this.chooseArea.bottom - this.box.top.width) / 2;

            $(this.box.left.dom).css({
                top: correctTop
            });

            $(this.box.right.dom).css({
                top: correctTop
            });
        }
    };
    /*========================================================================*/
    this.action_bottom = function() {
        if (this.maintainRatio) {

        } else {

            let height = this.image.height - this.chooseArea.bottom;
            $(this.bg.bottom.dom).css({
                height: height
            });

            let correctHeight = (this.chooseArea.bottom - this.chooseArea.top);

            $(this.bg.left.dom).css({
                height: correctHeight
            });

            $(this.bg.right.dom).css({
                height: correctHeight
            });
            //----------------------------

            let correctTop = (this.chooseArea.top + this.chooseArea.bottom - this.box.top.width) / 2;

            $(this.box.left.dom).css({
                top: correctTop
            });

            $(this.box.right.dom).css({
                top: correctTop
            });
        }
    };
}).call(ImageCut.prototype);

////////////////////////////////////////////////////////////////////////////////
(function() {

    // move: box 的 move 指令
    this.move_right = function(l, t) {
        let box = this.box.right;

        l = l - this.operateContainer.left;

        this.chooseArea.right = l;
        //----------------------------
        if (this.maintainRatio) {
            let width = this.chooseArea.right - this.chooseArea.left;
            let height = width / this.ratio;
            this.chooseArea.bottom = this.chooseArea.top + height;

            console.log('chooseArea.right = %s, chooseArea.left = %s, this.ratio = %s, height = $s',
            this.chooseArea.right, this.chooseArea.left, this.ratio, this.chooseArea.bottom);
        }
        this._check_1();
        //----------------------------
        $(this.box.right.dom).css({
            left: l
        });
    };
    //--------------------------------------------------------------------------
    this.move_left = function(l, t) {
        let box = this.box.left;

        l = l - this.operateContainer.left;

        this.chooseArea.left = l + box.width
        this._check_1();

        $(this.box.left.dom).css({
            left: l
        });
    };
    //--------------------------------------------------------------------------
    this.move_top = function(l, t) {
        let box = this.box.top;

        t = t - this.operateContainer.top;

        this.chooseArea.top = t + box.height;
        this._check_1();

        $(this.box.top.dom).css({
            top: t
        });
    };
    //--------------------------------------------------------------------------
    this.move_bottom = function(l, t) {
        let box = this.box.bottom;

        t = t - this.operateContainer.top;

        this.chooseArea.bottom = t;
        this._check_1();

        $(this.box.bottom.dom).css({
            top: t
        });
    };
}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function() {
    this._check_1 = function() {
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
            throw new Error(error.join(' | '));
        }
    };
    //==========================================================================
    this._check_selectArea_left = function(left) {

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
    this._check_selectArea_top = function(top) {
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
    this._updateByBox = function(e) {
        // 更新 chooseArea 的座標
        this._updateChooseSizeBySmallBox();
        //----------------------------
        let currentTarget = e.currentTarget;
        let target = e.target;

        if (!target.isEqualNode(currentTarget)) {
            // return;
        }

        let l = e.offsetX;
        let t = e.offsetY;

        // console.log('l = %s, t = %s', l, t);

        let positionData = this._getRootPosition(e);
        //----------------------------
        try {
            this.moveFn(positionData.left, positionData.top);
        } catch (error) {
            // alert(error);
            return;
        } finally {
            // 更新 chooseArea 的座標
            this._updateChooseSizeBySmallBox();
        }
        /*--------------------------*/
        this.actionFn();

        this._updateSelectArea();

        $(this.root.dom).trigger('area', JSON.stringify(this.chooseArea));

    };

    //==========================================================================
    this._updateBySelectArea = function(e) {
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

        this._updateSmallBox();

        this._updateBg();

        $(this.root.dom).trigger('area', JSON.stringify(this.chooseArea));
    };
    //==========================================================================
}).call(ImageCut.prototype);
