'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Powerful React + D3 word cloud component with rich features.
                                                                                                                                                                                                                                                                   * Based on the original word cloud generator: https://www.jasondavies.com/wordcloud/.
                                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                                   * 
                                                                                                                                                                                                                                                                   */

var _react = require('react');

var React = _interopRequireWildcard(_react);

var _d3Array = require('d3-array');

var d3Array = _interopRequireWildcard(_d3Array);

var _d3Cloud = require('d3-cloud');

var _d3Cloud2 = _interopRequireDefault(_d3Cloud);

var _d3Scale = require('d3-scale');

var d3Scale = _interopRequireWildcard(_d3Scale);

var _d3Selection = require('d3-selection');

var d3Selection = _interopRequireWildcard(_d3Selection);

var _d3SelectionMulti = require('d3-selection-multi');

var d3SelectionMulti = _interopRequireWildcard(_d3SelectionMulti);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _lodash = require('lodash.uniqby');

var _lodash2 = _interopRequireDefault(_lodash);

var _tinycolor = require('tinycolor2');

var _tinycolor2 = _interopRequireDefault(_tinycolor);

var _tooltip = require('./tooltip');

var _tooltip2 = _interopRequireDefault(_tooltip);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var d3 = _extends({}, d3Array, d3Scale, d3Selection, d3SelectionMulti);

// min values are required because the layout will take too long to compute
// recursively if small values are provided
var MIN_HEIGHT = 150;
var MIN_WIDTH = 200;

var WordCloud = function (_React$Component) {
  _inherits(WordCloud, _React$Component);

  function WordCloud() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, WordCloud);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = WordCloud.__proto__ || Object.getPrototypeOf(WordCloud)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      tooltipContent: React.createElement('div', null),
      tooltipEnabled: false,
      tooltipX: 0,
      tooltipY: 0,
      selectedWord: {}
    }, _this._setText = function (d) {
      return d[_this.props.wordKey];
    }, _this._colorScale = function (d, i) {
      var _this$props = _this.props,
          colorScale = _this$props.colorScale,
          colors = _this$props.colors;

      return colorScale ? colorScale(d, i) : _chooseRandom(colors || DEFAULT_COLORS);
    }, _this._onWordClick = function (d, i, nodes) {
      //callback
      var onWordClick = _this.props.onWordClick;

      if (onWordClick) onWordClick(d);
      //click effect
      var selectedWord = _this.state.selectedWord;

      var color = (0, _tinycolor2.default)(_this._colorScale(d, i));
      if (d === selectedWord) {
        _this.setState({ selectedWord: {} });
        d3.select(nodes[i]).attr('fill', color.toRgbString());
      } else {
        _this.setState({ selectedWord: d });
        d3.select(nodes[i]).attr('fill', color.complement().toRgbString());
      }
    }, _this._onMouseOver = function (d, i, nodes) {
      //tooltip
      var _this$props2 = _this.props,
          tooltipEnabled = _this$props2.tooltipEnabled,
          wordKey = _this$props2.wordKey,
          wordCountKey = _this$props2.wordCountKey,
          onSetTooltip = _this$props2.onSetTooltip,
          onMouseOverWord = _this$props2.onMouseOverWord;

      var tooltipContent = onSetTooltip ? onSetTooltip(d) : d[wordKey] + ' (' + d[wordCountKey] + ')';
      if (tooltipEnabled) {
        _this.setState({
          tooltipContent: tooltipContent,
          tooltipEnabled: true,
          tooltipX: _d3Selection.event.pageX,
          tooltipY: _d3Selection.event.pageY - 28
        });
      }
      //hover effect
      var color = (0, _tinycolor2.default)(_this._colorScale(d, i));
      d3.select(nodes[i]).attr('fill', color.complement().toRgbString());
      if (onMouseOverWord) onMouseOverWord(d);
    }, _this._onMouseOut = function (d, i, nodes) {
      var onMouseOutWord = _this.props.onMouseOutWord;
      //tooltip

      if (_this.props.tooltipEnabled) {
        _this.setState({
          tooltipEnabled: false
        });
      }
      //hover effect
      var selectedWord = _this.state.selectedWord;

      if (d !== selectedWord) {
        d3.select(nodes[i]).attr('fill', _this._colorScale(d, i));
      }
      if (onMouseOutWord) onMouseOutWord(d);
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(WordCloud, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._validateProps();
      this._init(this.props);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this._update(nextProps);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _state = this.state,
          tooltipContent = _state.tooltipContent,
          tooltipEnabled = _state.tooltipEnabled,
          tooltipX = _state.tooltipX,
          tooltipY = _state.tooltipY;
      var tooltipStyle = this.props.tooltipStyle;

      var tooltip = tooltipEnabled ? React.createElement(_tooltip2.default, {
        content: tooltipContent,
        isEnabled: tooltipEnabled,
        x: tooltipX,
        y: tooltipY,
        style: tooltipStyle
      }) : null;
      return React.createElement(
        'div',
        {
          ref: function ref(container) {
            _this2._container = container;
          } },
        React.createElement('div', {
          ref: function ref(chart) {
            _this2._chart = chart;
          }
        }),
        tooltip
      );
    }

    // read w/h from props, then from parent container, then from min values

  }, {
    key: '_setDimensions',
    value: function _setDimensions(height, width) {
      var _container$parentNode = this._container.parentNode,
          parentHeight = _container$parentNode.offsetHeight,
          parentWidth = _container$parentNode.offsetWidth;

      this._height = height || parentHeight;
      this._width = width || parentWidth;
      if (typeof this._height !== 'number' || this._height < MIN_HEIGHT) {
        console.warn('Invalid/small height provided, falling back to minimum value of ' + MIN_HEIGHT);
        this._height = MIN_HEIGHT;
      }
      if (typeof this._width !== 'number' || this._width < MIN_WIDTH) {
        console.warn('Invalid/small width provided, falling back to minimum value of ' + MIN_WIDTH);
        this._width = MIN_WIDTH;
      }
    }
  }, {
    key: '_init',
    value: function _init(props) {
      // cleanup
      d3.select(this._chart).selectAll('*').remove();

      // create svg and vis nodes
      var height = props.height,
          width = props.width;

      this._setDimensions(height, width);
      this._svg = d3.select(this._chart).append('svg');
      this._vis = this._svg.append('g');
      this._layout = (0, _d3Cloud2.default)();
      this._update(props);
    }
  }, {
    key: '_update',
    value: function _update(props) {
      var _this3 = this;

      var fontFamily = props.fontFamily,
          height = props.height,
          maxAngle = props.maxAngle,
          maxWords = props.maxWords,
          minAngle = props.minAngle,
          orientations = props.orientations,
          scale = props.scale,
          spiral = props.spiral,
          width = props.width,
          wordCountKey = props.wordCountKey,
          words = props.words;
      // update svg/vis nodes dimensions

      this._setDimensions(height, width);
      this._svg.attrs({
        height: this._height,
        width: this._width
      });
      this._vis.attr('transform', 'translate(' + this._width / 2 + ', ' + this._height / 2 + ')');

      // update fontScale by rescaling to min/max values of data
      // if min === max, we prefer the upper bound range value
      var d3Scale = _getScale(scale);
      var filteredWords = words.slice(0, maxWords);
      var range = {
        min: 16,
        max: 40
      };
      if (this._width >= 650) {
        range.min = 18;
        range.max = 70;
      } else {
        if (this._width >= 550) {
          range.max = 55;
        }
      }
      this._fontScale = (0, _lodash2.default)(filteredWords, wordCountKey).length > 1 ? d3Scale().range([range.min, range.max]) : d3Scale().range([range.max, range.max]);
      if (filteredWords.length) {
        this._fontScale.domain([d3.min(filteredWords, function (d) {
          return d[wordCountKey];
        }), d3.max(filteredWords, function (d) {
          return d[wordCountKey];
        })]);
      }

      // compute rotations based on orientations and angles
      if (typeof orientations === 'number' && orientations > 0) {
        var rotations = [];
        if (orientations === 1) {
          rotations = [minAngle];
        } else {
          rotations = [minAngle, maxAngle];
          var increment = (maxAngle - minAngle) / (orientations - 1);
          var rotation = minAngle + increment;
          while (rotation < maxAngle) {
            rotations.push(rotation);
            rotation += increment;
          }
        }
        this._layout.rotate(function () {
          return _chooseRandom(rotations);
        });
      }

      this._layout.size([this._width, this._height]).words(filteredWords).padding(4).text(this._setText).font(fontFamily).fontSize(function (d) {
        return _this3._fontScale(d[wordCountKey]);
      }).spiral(spiral).on('end', function (words) {
        return _this3._draw(words, props);
      }).start();
    }
  }, {
    key: '_draw',
    value: function _draw(words, props) {
      // d3.layout.cloud adds 'x', 'y', 'rotate', 'size' accessors to 'd' object
      var fontFamily = props.fontFamily,
          transitionDuration = props.transitionDuration;

      this._words = this._vis.selectAll('text').data(words);

      // enter transition
      this._words.enter().append('text').on('click', this._onWordClick).on('mouseover', this._onMouseOver).on('mouseout', this._onMouseOut).attrs({
        cursor: onWordClick ? 'pointer' : 'default',
        fill: this._colorScale,
        'font-family': fontFamily,
        'text-anchor': 'middle',
        transform: 'translate(0, 0) rotate(0)'
      }).transition().duration(transitionDuration).attrs({
        'font-size': function fontSize(d) {
          return d.size + 'px';
        },
        transform: this._transformText
      }).text(this._setText);

      // update transition
      this._words.transition().duration(transitionDuration).attrs({
        fill: this._colorScale,
        'font-family': fontFamily,
        'font-size': function fontSize(d) {
          return d.size + 'px';
        },
        transform: this._transformText
      }).text(this._setText);

      // exit transition
      this._words.exit().transition().duration(transitionDuration).attr('fill-opacity', 0).remove();
    }
  }, {
    key: '_transformText',
    value: function _transformText(d) {
      var translate = 'translate(' + d.x + ', ' + d.y + ')';
      var rotate = typeof d.rotate === 'number' ? 'rotate(' + d.rotate + ')' : '';
      return translate + rotate;
    }
  }, {
    key: '_validateProps',
    value: function _validateProps() {
      var _props = this.props,
          maxAngle = _props.maxAngle,
          minAngle = _props.minAngle,
          words = _props.words,
          wordCountKey = _props.wordCountKey,
          wordKey = _props.wordKey;

      (0, _invariant2.default)(Math.abs(minAngle) <= 90 && Math.abs(maxAngle) <= 90, 'Angles must have values between -90 to 90 degrees');
      (0, _invariant2.default)(minAngle <= maxAngle, 'minAngle must be <= maxAngle');
      if (words.length > 0) {
        var firstRow = words[0];
        (0, _invariant2.default)(wordKey in firstRow, 'Word key must be a valid key in the data');
        (0, _invariant2.default)(wordCountKey in firstRow, 'Word count key must be a valid key in the data');
      }
    }
  }]);

  return WordCloud;
}(React.Component);

WordCloud.defaultProps = {
  colors: DEFAULT_COLORS,
  fontFamily: 'impact',
  height: null,
  maxAngle: 0,
  maxWords: 300,
  minAngle: 0,
  orientations: 1,
  scale: 'sqrt',
  spiral: 'rectangular',
  tooltipEnabled: true,
  transitionDuration: 1000,
  width: null,
  onWordClick: function onWordClick(d) {
    return;
  },
  onMouseOverWord: function onMouseOverWord(d) {
    return;
  },
  onMouseOutWord: function onMouseOutWord(d) {
    return;
  },
  tooltipStyle: {
    background: '#000',
    border: '#aaa',
    borderRadius: 2,
    color: '#fff',
    fontFamily: 'arial',
    fontSize: 12,
    padding: '4px 8px',
    pointerEvents: 'none',
    position: 'fixed',
    textAlign: 'center'
  }
};


var DEFAULT_COLORS = d3.range(20).map(d3.scaleOrdinal(d3.schemeCategory10));

var _chooseRandom = function _chooseRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
};

var _getScale = function _getScale(scale) {
  switch (scale) {
    case 'linear':
      return d3.scaleLinear;
    case 'log':
      return d3.scaleLog;
    case 'sqrt':
    default:
      return d3.scaleSqrt;
  }
};

exports.default = WordCloud;