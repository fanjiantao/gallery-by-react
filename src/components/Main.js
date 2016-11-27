require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';

// 获取图片相关的数据
var imageDatas = require('../data/imageData.json');

// 利用自执行函数， 将图片名信息转成图片的URL路径信息
function getImageURL(imageDatasArr) {
  for (var i = 0; i < imageDatasArr.length; i++) {
    var singleImageData = imageDatasArr[i];
    singleImageData.imageURL = require('../images/' + singleImageData.fileName);
    imageDatasArr[i] = singleImageData;
  }
  return imageDatasArr;
}

/*
 * 获取区间内的一个随机值
 */
function getRangeRandom(low, high) {
  return Math.ceil(Math.random() * (high - low) + low);
}

function get30DegRandom(){
  return ((Math.random() > 0.5 ? '' : '-') + Math.ceil(Math.random() * 30));
}

imageDatas = getImageURL(imageDatas);

class ImgFigure extends React.Component {

  /*
   * ImgFigure的点击处理函数
   */
  handleClick() {
    return () => {
      if(this.props.arrange.isCenter) {
        this.props.inverse();
      } else {
        this.props.center();
      }

    }
  }

  render() {

    var styleObj = {};

    // 如果props属性中指定了图片的位置，则使用
    if (this.props.arrange.pos) {
      styleObj = this.props.arrange.pos;
    }

    // 如果图片的旋转角度有值且不为0
    if (this.props.arrange.rotate) {
      var prefixArr = ['MozTransform', 'msTransform', 'WebkitTransform', 'transform'];
      prefixArr.forEach(function(value) {
        styleObj[value] = 'rotate(' + this.props.arrange.rotate + 'deg)';
      }.bind(this));
    }
    if (this.props.arrange.isCenter) {
      styleObj.zIndex = 1;
    }
    var imgFigureClassName = 'img-figure';
        imgFigureClassName += this.props.arrange.isInverse ? ' is-inverse' : '';
    return (
      <figure className={imgFigureClassName} style={styleObj} onClick={this.handleClick()}>
        <img src={this.props.data.imageURL} alt={this.props.data.title}/>
        <figcaption>
          <div className="img-title">{this.props.data.title}</div>
          <div className="img-back" onClick={null}>
            <p>{this.props.data.desc}</p>
          </div>
        </figcaption>
      </figure>
    );
  }
}

// 控制组件
class ControllerUnits extends React.Component {

  handleClick() {
    return () => {
      // 如果点击的是当前正在选中态的按钮，正翻转图片,否则将对应的图片居中
      if (this.props.arrange.isCenter) {
        this.props.inverse();
      } else {
        this.props.center();
      }
    };
  }

  render() {
    var controllerUnitsClassName = 'controller-units';

    // 如果对应的是剧中的图片，显示控制按钮的居中态
    if (this.props.arrange.isCenter) {
      controllerUnitsClassName += ' is-center';

      // 如果同时对应的是翻转图片，显示控制按钮的翻转态
      if (this.props.arrange.isInverse) {
        controllerUnitsClassName += ' is-inverse';
      }
    }

    return(
      <span className={controllerUnitsClassName} onClick={this.handleClick()}></span>
    );
  }
}


class AppComponent extends React.Component {

  static propTypes = {//类的静态属性
    top: React.PropTypes.number,
    left: React.PropTypes.number,
    right: React.PropTypes.number,
    x: React.PropTypes.array,
    y: React.PropTypes.array,
    topY: React.PropTypes.array,
    leftSecX: React.PropTypes.array,
    rightSecX: React.PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      imgsArrangeArr: [
        {
          // pos: {
          //   left: 0,
          //   top: 0
          // },
          // rotate: 0, // 旋转角度
          // isInverse: false // 默认不翻转
        }
      ],
      constant: {
        centerPos: { //中心图片的取值范围
          left: 0,
          right: 0
        },
        hPosRange: { //水平方向的取值范围
          leftSecX: [0,0],
          rightSecX: [0,0],
          y: [0,0]
        },
        vPosRange: {
          x: [0,0],
          topY: [0,0]
        }
      }
    };
  }

  /*
   * 翻转图片
   * @param index 输入当前需要被执行inverse操作的图片的对应图片信息数组的index
   * @return {function} 这是一个闭包函数，其内返回一个待被执行的函数
   */
  inverse(index) {
    return function() {
      var imgsArrangeArr = this.state.imgsArrangeArr;
          imgsArrangeArr[index].isInverse = !imgsArrangeArr[index].isInverse;
          this.setState({
            imgsArrangeArr: imgsArrangeArr
          });
    }.bind(this);
  }

  /*
   * 剧中图片
   * @param index 输入当前需要被执行center操作的图片的对应图片信息数组的index
   * @return {function} 这是一个闭包函数，其内返回一个待被执行的函数
   */
  center(index) {
    return function() {
      this.rearrange(index);
    }.bind(this);
  }

  /*
   * 重新布局所有图片
   * @param centerIndex 指定布局那个图片
   */
  rearrange(centerIndex) {
    var imgsArrangeArr = this.state.imgsArrangeArr;
    var constant = this.state.constant;
    var centerPos = constant.centerPos;
    var hPosRange = constant.hPosRange;
    var vPosRange = constant.vPosRange;
    var hPosRangeLeftSecX = hPosRange.leftSecX;
    var hPosRangeRightSecX = hPosRange.rightSecX;
    var hPosRangeY = hPosRange.y;
    var vPosRangeTopY = vPosRange.topY;
    var vPosRangeX = vPosRange.x;

    var imgsArrangeTopArr = [];
    var topImgNum = Math.floor(Math.random() * 2); //取一个或不取

    var topImgSpliceIndex = 0;

    var imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex, 1);

    // 居中centerIndex的图片, 居中的centerIndex图片不需要旋转
    imgsArrangeCenterArr[0] = {
      pos: centerPos,
      rotate: 0,
      isCenter: true
    };

    // 取出要布局上侧的图片的状态信息
    topImgSpliceIndex = Math.ceil(Math.random() * (imgsArrangeArr.length - topImgNum));

    imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex, topImgNum);

    // 布局上侧的图片
    imgsArrangeTopArr.forEach(function(value, index) {
      imgsArrangeTopArr[index] = {
        pos: {
          top: getRangeRandom(vPosRangeTopY[0], vPosRangeTopY[1]),
          left: getRangeRandom(vPosRangeX[0], vPosRangeX[1])
        },
        rotate: get30DegRandom(),
        isCenter: false
      };
    });

    // 布局左右两侧图片
    for (var i = 0; i < imgsArrangeArr.length; i++) {
      var hPosRangeLORX = null;
      var k = imgsArrangeArr.length / 2;
      // 前半部分布局左边， 右半部分布局右边
      if (i < k) {
        hPosRangeLORX = hPosRangeLeftSecX;
      } else {
        hPosRangeLORX = hPosRangeRightSecX;
      }
      imgsArrangeArr[i] = {
        pos: {
          top: getRangeRandom(hPosRangeY[0], hPosRangeY[1]),
          left: getRangeRandom(hPosRangeLORX[0], hPosRangeLORX[1])
        },
        rotate: get30DegRandom(),
        isCenter: false
      };
    }
    if (imgsArrangeTopArr && imgsArrangeTopArr[0]) {
      imgsArrangeArr.splice(topImgSpliceIndex, 0, imgsArrangeTopArr[0]);
    }

    imgsArrangeArr.splice(centerIndex, 0, imgsArrangeCenterArr[0]);
    this.setState({
      constant: constant,
      imgsArrangeArr: imgsArrangeArr
    });
  }

  componentWillMount() {
  }

  // 组件加载以后，为每张图片计算其位置范围
  componentDidMount() {

    var constant = this.state.constant;
    // 首先，拿到舞台的大小
    var stageDom = ReactDOM.findDOMNode(this.refs.stage);
    var stageW = stageDom.scrollWidth;
    var stageH = stageDom.scrollHeight;

    var halfStageW = Math.ceil(stageW / 2);
    var halfStageH = Math.ceil(stageH / 2);

    //拿到一个imageFigure的大小
    var imageFigureDom = ReactDOM.findDOMNode(this.refs.imgFigure0);

    var imgW = imageFigureDom.scrollWidth;
    var imgH = imageFigureDom.scrollHeight;

    var halfImgW = Math.ceil(imgW / 2);
    var halfImgH = Math.ceil(imgH / 2);

    // 计算中心图片的位置
    constant.centerPos = {
      left: halfStageW - halfImgW,
      top: halfStageH - halfImgH
    };

    // 计算左侧、右侧区域图片位置的取值范围
    constant.hPosRange.leftSecX[0] = -halfImgW;
    constant.hPosRange.leftSecX[1] = halfStageW - halfImgW * 3;
    constant.hPosRange.rightSecX[0] = halfStageW + halfImgW;
    constant.hPosRange.rightSecX[1] = stageW - halfImgW;
    constant.hPosRange.y[0] = -halfImgH;
    constant.hPosRange.y[1] = stageH - halfImgH;

    // 计算上侧图片排布位置的取值范围
    constant.vPosRange.topY[0] = -halfImgH;
    constant.vPosRange.topY[1] = halfStageH - halfImgH * 3;
    constant.vPosRange.x[0] = halfStageW - imgW;
    constant.vPosRange.x[1] = halfStageW;

    this.setState({
      constant: constant
    });
    this.rearrange(0);
  }

  render() {
    var controllerUnits = [];
    var imgFigures = [];
    var imgsArrangeArrIndex = this.state.imgsArrangeArr;
    imageDatas.forEach(function(value, index) {
      if (!imgsArrangeArrIndex[index]) {
        imgsArrangeArrIndex[index] = {
          pos : {
            left: 0,
            top: 0
          },
          rotate: 0,
          isInverse: false,
          isCenter: false
        };
      }
      imgFigures.push(
        <ImgFigure key={index} ref={'imgFigure' + index} data={value} arrange={this.state.imgsArrangeArr[index]}
            inverse={this.inverse(index)} center={this.center(index)}/>);

      controllerUnits.push(
        <ControllerUnits key={index} arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}/>);
    }.bind(this));

    return (
      <section className="stage" ref="stage">
        <section className="img-sec">
          {imgFigures}
        </section>
        <nav className="controller-nav">
          {controllerUnits}
        </nav>
      </section>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
