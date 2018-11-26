function DomData() {
    this.dom = null;
    this.left = null;
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
    this.maintainRatio = false;
    /*--------------------------*/
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

    this.clickDom;

    this.action = new Map();
    this.limit = new Map();
    this.move = new Map();

    this.actionFn;
    this.limitCheckFn;
    this.moveFn;
    /*--------------------------*/

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

        this._createDom();

        this._getDoms();

        this._assignJob();

        this._checkSize();

        this._fixPosition();

        this._bindEvent();
    };
    /*========================================================================*/
    // 由事件推動
    this._update = function (e) {
        let t2 = e.target;
        let l = e.offsetX;
        let t = e.offsetY;

        let position = this._getImagePosition(t2, l, t);
        /*--------------------------*/

        if (!this.limitCheckFn(position.left, position.top)) {
            return;
        }


        this.moveFn(position.left, position.top);

        // 更新 chooseArea 的座標
        this._updateChooseSize();

        $('#msg_1').text(JSON.stringify(this.chooseArea));
        /*--------------------------*/
        // 根據不同 box，給予相對的指令

        this.actionFn();

    };

}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function () {
    // 創造需要的 dom
    this._createDom = function () {

    };
    /*========================================================================*/
    this._getDoms = function () {
        this.image.dom = this.root.dom.querySelector('div.image');

        /*--------------------------*/
        this.box.right.dom = this.root.dom.querySelector('div.box-right');
        this.box.left.dom = this.root.dom.querySelector('div.box-left');
        this.box.top.dom = this.root.dom.querySelector('div.box-top');
        this.box.bottom.dom = this.root.dom.querySelector('div.box-bottom');
        /*--------------------------*/
        this.bg.right.dom = this.root.dom.querySelector('div.bg-right');
        this.bg.left.dom = this.root.dom.querySelector('div.bg-left');
        this.bg.top.dom = this.root.dom.querySelector('div.bg-top');
        this.bg.bottom.dom = this.root.dom.querySelector('div.bg-bottom');
    };
    /*========================================================================*/
    // 為4個點個別分派他的工作內容
    this._assignJob = function () {
        this.action.set(this.box.right.dom, this.action_right);
        this.limit.set(this.box.right.dom, this.limit_right);
        this.move.set(this.box.right.dom, this.move_right);


        this.action.set(this.box.left.dom, this.action_left);
        this.limit.set(this.box.left.dom, this.limit_left);
        this.move.set(this.box.left.dom, this.move_left);

        this.action.set(this.box.top.dom, this.action_top);
        this.limit.set(this.box.top.dom, this.limit_top);
        this.move.set(this.box.top.dom, this.move_top);

        this.action.set(this.box.bottom.dom, this.action_bottom);
        this.limit.set(this.box.bottom.dom, this.limit_bottom);
        this.move.set(this.box.bottom.dom, this.move_bottom);
    };
    /*========================================================================*/
    this._checkSize = function () {
        debugger;

        this.root.width = $(this.root.dom).outerWidth();
        this.root.height = $(this.root.dom).outerHeight();

        this.image.width = $(this.image.dom).outerWidth();
        this.image.height = $(this.image.dom).outerHeight();

        this.chooseArea.left = $(this.bg.left.dom).outerWidth();
        this.chooseArea.top = $(this.bg.top.dom).outerHeight();
        this.chooseArea.right = $(this.bg.right.dom).position().left;
        this.chooseArea.bottom = $(this.bg.bottom.dom).position().top;

        for (let k in this.box) {
            let domData = this.box[k];
            let dom = domData.dom;

            domData.width = $(dom).outerWidth();
            domData.height = $(dom).outerHeight();
        }
        /*--------------------------*/
        this.box.left.left = this.chooseArea.left - this.box.left.width;
        this.box.left.top = (this.chooseArea.top + this.chooseArea.bottom - this.box.left.height) / 2;

        this.box.right.left = this.chooseArea.right;
        this.box.right.top = (this.chooseArea.top + this.chooseArea.bottom - this.box.right.height) / 2;

        this.box.top.left = (this.chooseArea.left + this.chooseArea.right - this.box.top.width) / 2;
        this.box.top.top = this.chooseArea.top - this.box.top.height;

        this.box.bottom.left = (this.chooseArea.left + this.chooseArea.right - this.box.bottom.width) / 2;
        this.box.bottom.top = this.chooseArea.bottom;
        /*--------------------------*/
        for (let k in this.box) {
            let domData = this.box[k];
            let dom = domData.dom;

            $(dom).css({
                left: domData.left,
                top: domData.top
            });
        }
    };
    /*========================================================================*/
    this._fixPosition = function () {

        let top = (this.root.height - this.image.height) / 2;
        let left = (this.root.width - this.image.width) / 2;

        $(this.image.dom).css({
            top: top,
            left: left
        });

        let imagePosition = $(this.image.dom).position();
        this.image.top = imagePosition.top;
        this.image.left = imagePosition.left;
    };
    /*========================================================================*/
    this._bindEvent = function () {
        let self = this;

        // var updateFn = _.throttle(_.bind(this._update, this), 5);

        $('div.smallbox', this.root.dom).on('mousedown', function (e) {
            self.clickDom = e.target;

            self.limitCheckFn = self.limit.get(self.clickDom);
            self.actionFn = self.action.get(self.clickDom);
            self.moveFn = self.move.get(self.clickDom);

            $(self.root.dom).on('mousemove', function (e) {
                self._update(e);
            });
        });

        $(this.root.dom).on('dblclick', function (e) {
            self.clickDom = undefined;
            $(self.root.dom).off('mousemove');
        });
    };
}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function () {
    this._moveClickBox = function (l, t) {

    };
    // 根據 mousemove 更新 chooseArea
    this._updateChooseSize = function () {
        this.chooseArea.left = $(this.box.left.dom).position().left + this.box.left.width;
        this.chooseArea.top = $(this.box.top.dom).position().top + this.box.top.height;
        this.chooseArea.right = $(this.box.right.dom).position().left;
        this.chooseArea.bottom = $(this.box.bottom.dom).position().top;
    };
    /*========================================================================*/
    // 轉換成 image 的座標系
    this._getImagePosition = function (dom, left, top) {


        let rootPosition = this._getAbsolutePosition(dom, left, top);

        // console.log('o => {l:%s, t:%s}', rootPosition.left, rootPosition.top);
        // console.log('i => {l:%s, t:%s}', this.image.left, this.image.top);

        let _left, _top;

        _left = rootPosition.left - this.image.left;
        _top = rootPosition.top - this.image.top;

        return {
            left: _left,
            top: _top
        }
    };
    /*========================================================================*/
    // 相對於 root 的座標值
    this._getAbsolutePosition = function (dom, left, top) {

        while (!this.root.dom.isEqualNode(dom)) {
            let p = $(dom).position();
            left += p.left;
            top += p.top;
            dom = dom.parentNode;
        }

        return {
            left: left,
            top: top
        };
    };
}).call(ImageCut.prototype);
////////////////////////////////////////////////////////////////////////////////
(function () {

    this.action_right = function () {
        if (this.maintainRatio) {

        } else {
            let width = this.image.width - this.chooseArea.right;
            $(this.bg.right.dom).css({
                width: width
            });

            let left = (this.chooseArea.left + this.chooseArea.right - this.box.top.width) / 2;

            $(this.box.top.dom).css({
                left: left
            });

            $(this.box.bottom.dom).css({
                left: left
            });
        }
    };
    /*========================================================================*/
    this.action_left = function () {
        if (this.maintainRatio) {

        } else {
            $(this.bg.left.dom).css({
                width: this.chooseArea.left
            });

            let left = (this.chooseArea.left + this.chooseArea.right - this.box.top.width) / 2;

            $(this.box.top.dom).css({
                left: left
            });

            $(this.box.bottom.dom).css({
                left: left
            });
        }
    };
    /*========================================================================*/
    this.action_top = function () {
        if (this.maintainRatio) {

        } else {

        }
    };
    /*========================================================================*/
    this.action_bottom = function () {
        if (this.maintainRatio) {

        } else {

        }
    };
    /*========================================================================*/
    this.limit_right = function (l, t) {
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

    this.limit_left = function (l, t) {
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

    this.limit_top = function (l, t) {
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

    this.limit_bottom = function (l, t) {
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
    /*========================================================================*/
    this.move_right = function (l, t) {
        $(this.box.right.dom).css({
            left: l
        });
    };

    this.move_left = function (l, t) {
        $(this.box.left.dom).css({
            left: l
        });
    };

    this.move_top = function (l, t) {
        $(this.box.top.dom).css({
            top: t
        });
    };

    this.move_bottom = function (l, t) {
        $(this.box.bottom.dom).css({
            top: t
        });
    };
}).call(ImageCut.prototype);
