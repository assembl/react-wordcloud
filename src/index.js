/**
 * Powerful React + D3 word cloud component with rich features.
 * Based on the original word cloud generator: https://www.jasondavies.com/wordcloud/.
 *
 * @flow
 */

import * as React from 'react';
import * as d3Array from 'd3-array';
import cloud from 'd3-cloud';
import * as d3Scale from 'd3-scale';
import * as d3Selection from 'd3-selection';
import 'd3-transition';
import { event as currentEvent } from 'd3-selection';
import * as d3SelectionMulti from 'd3-selection-multi';
import invariant from 'invariant';
import uniqBy from 'lodash.uniqby';
import tinycolor from 'tinycolor2';

import Tooltip from './tooltip';

const d3 = {
  ...d3Array,
  ...d3Scale,
  ...d3Selection,
  ...d3SelectionMulti
};

// min values are required because the layout will take too long to compute
// recursively if small values are provided
const MIN_HEIGHT = 150;
const MIN_WIDTH = 200;

type TScale = 'sqrt' | 'log' | 'linear';
type TSpiral = 'archimedean' | 'rectangular';

type TProps = {
  /**
   * [REQUIRED] Simple array of objects.
   */
  words: Array<Object>,
  /**
   * [REQUIRED] A valid key in 'words' to render the count for the word cloud.
   */
  wordCountKey: string,
  /**
   * [REQUIRED] A valid key in 'words' to render the word for the word cloud.
   */
  wordKey: string,
  /**
   * Provide an array of color strings that the word cloud will randomnly use.
   */
  colors: Array<string>,
  /**
   * e.g.  'Impact' (default)', Times New Roman', 'Courier', etc
   */
  fontFamily: string,
  /**
   * Height of the word cloud.  If 'null' is provided, the component will
   * inherit from the parent height.
   */
  height: ?number,
  /**
   * Maximum angle orientation (accepts -90 to 90 degrees).
   */
  maxAngle: number,
  /**
   * Rendering words is expensive and distracting.  This provides a limit even
   * if 'words.length' is larger.
   */
  maxWords: number,
  /**
   * Minimum angle orientation (accepts -90 to 90 degrees).
   * This value must be <= maxAngle.
   */
  minAngle: number,
  /**
   * The number of orientations based on minAngle and maxAngle.
   */
  orientations: ?number,
  /**
   * Determines the scale used to space words.
   */
  scale: TScale,
  /**
   * Determines how words are placed (starting from the center).
   */
  spiral: TSpiral,
  /**
   * Enable/disable tooltips.
   */
  tooltipEnabled: boolean,
  /**
   * Controls the animation/transition duration.
   */
  transitionDuration: number,
  /**
   * Width of the word cloud.  If 'null' is provided, the component will
   * inherit from the parent width.
   */
  width: ?number,
  /**
   * Callback to render color based on 'data' or 'i'.  Overrides 'color' prop.
   */
  colorScale?: (d: Object, i: number) => string,
  /**
   * Callback to render color based on 'data' or 'i' when a word is active.
   */
  colorScaleActive?: (d: Object, i: number) => string,
  /**
   * Callback to control the display of words.  Overrides 'wordKey' prop.
   */
  onSetTooltip?: (d: Object) => React.Node,
  /**
   * Callback when word is clicked.
   */
  onWordClick?: (d: Object) => void,
  /**
   * Callback when mouse begins hovering word.
   */
  onMouseOverWord?: (d: Object) => void,
  /**
   * Callback when mouse ends hovering word.
   */
  onMouseOutWord?: (d: Object) => void,
  /**
   * Tooltip style
   */
  tooltipStyle?: Object
};

type TState = {
  tooltipContent: React.Node,
  tooltipEnabled: boolean,
  tooltipX: number,
  tooltipY: number,
  selectedWord: Object
};

class WordCloud extends React.Component<TProps, TState> {
  _chart: any;
  _container: any;
  _fontScale: Function;
  _height: number;
  _layout: any;
  _svg: any;
  _vis: any;
  _width: number;
  _words: any;

  static defaultProps = {
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
    onWordClick: (d: Object) => {
      return;
    },
    onMouseOverWord: (d: Object) => {
      return;
    },
    onMouseOutWord: (d: Object) => {
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

  state = {
    tooltipContent: <div />,
    tooltipEnabled: false,
    tooltipX: 0,
    tooltipY: 0,
    selectedWord: {
      d: {},
      i: -1,
      ref: -1
    }
  };

  componentDidMount(): void {
    this._validateProps();
    this._init(this.props);
  }

  componentWillReceiveProps(nextProps: TProps): void {
    this._update(nextProps);
  }

  render(): React.Element<any> {
    const { tooltipContent, tooltipEnabled, tooltipX, tooltipY } = this.state;
    const { tooltipStyle } = this.props;
    const tooltip = tooltipEnabled ? (
      <Tooltip
        content={tooltipContent}
        isEnabled={tooltipEnabled}
        x={tooltipX}
        y={tooltipY}
        style={tooltipStyle}
      />
    ) : null;
    return (
      <div
        ref={(container): void => {
          this._container = container;
        }}
      >
        <div
          ref={(chart): void => {
            this._chart = chart;
          }}
        />
        {tooltip}
      </div>
    );
  }

  // read w/h from props, then from parent container, then from min values
  _setDimensions(height: ?number, width: ?number): void {
    const {
      offsetHeight: parentHeight,
      offsetWidth: parentWidth
    } = this._container.parentNode;
    this._height = height || parentHeight;
    this._width = width || parentWidth;
    if (typeof this._height !== 'number' || this._height < MIN_HEIGHT) {
      console.warn(
        `Invalid/small height provided, falling back to minimum value of ${MIN_HEIGHT}`
      );
      this._height = MIN_HEIGHT;
    }
    if (typeof this._width !== 'number' || this._width < MIN_WIDTH) {
      console.warn(
        `Invalid/small width provided, falling back to minimum value of ${MIN_WIDTH}`
      );
      this._width = MIN_WIDTH;
    }
  }

  _init(props: TProps): void {
    // cleanup
    d3.select(this._chart)
      .selectAll('*')
      .remove();

    // create svg and vis nodes
    const { height, width } = props;
    this._setDimensions(height, width);
    this._svg = d3.select(this._chart).append('svg');
    this._vis = this._svg.append('g');
    this._layout = cloud();
    this._update(props);
  }

  _update(props: TProps): void {
    const {
      fontFamily,
      height,
      maxAngle,
      maxWords,
      minAngle,
      orientations,
      scale,
      spiral,
      width,
      wordCountKey,
      words
    } = props;
    // update svg/vis nodes dimensions
    this._setDimensions(height, width);
    this._svg.attrs({
      height: this._height,
      width: this._width
    });
    this._vis.attr(
      'transform',
      `translate(${this._width / 2}, ${this._height / 2})`
    );

    // update fontScale by rescaling to min/max values of data
    // if min === max, we prefer the upper bound range value
    const d3Scale = _getScale(scale);
    const filteredWords = words.slice(0, maxWords);
    let range = {
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
    this._fontScale =
      uniqBy(filteredWords, wordCountKey).length > 1
        ? d3Scale().range([range.min, range.max])
        : d3Scale().range([range.max, range.max]);
    if (filteredWords.length) {
      this._fontScale.domain([
        d3.min(filteredWords, (d: Object): number => d[wordCountKey]),
        d3.max(filteredWords, (d: Object): number => d[wordCountKey])
      ]);
    }

    // compute rotations based on orientations and angles
    if (typeof orientations === 'number' && orientations > 0) {
      let rotations = [];
      if (orientations === 1) {
        rotations = [minAngle];
      } else {
        rotations = [minAngle, maxAngle];
        const increment = (maxAngle - minAngle) / (orientations - 1);
        let rotation = minAngle + increment;
        while (rotation < maxAngle) {
          rotations.push(rotation);
          rotation += increment;
        }
      }
      this._layout.rotate((): number => _chooseRandom(rotations));
    }

    this._layout
      .size([this._width, this._height])
      .words(filteredWords)
      .padding(4)
      .text(this._setText)
      .font(fontFamily)
      .fontSize((d: Object): number => this._fontScale(d[wordCountKey]))
      .spiral(spiral)
      .on('end', (words: Array<Object>): void => this._draw(words, props))
      .start();
  }

  _draw(words: Array<Object>, props: TProps): void {
    // d3.layout.cloud adds 'x', 'y', 'rotate', 'size' accessors to 'd' object
    const { fontFamily, transitionDuration, onWordClick } = props;
    this._words = this._vis.selectAll('text').data(words);

    // enter transition
    this._words
      .enter()
      .append('text')
      .on('click', this._onWordClick)
      .on('mouseover', this._onMouseOver)
      .on('mouseout', this._onMouseOut)
      .attrs({
        cursor: onWordClick ? 'pointer' : 'default',
        fill: this._colorScale,
        'font-family': fontFamily,
        'text-anchor': 'middle',
        transform: 'translate(0, 0) rotate(0)'
      })
      // .transition()
      // .duration(transitionDuration)
      .attr('font-size', d => `${d.size}px`)
      .attr('transform', this._transformText)
      .text(this._setText);

    // update transition
    this._words
      .transition()
      .duration(transitionDuration)
      .attr('font-family', fontFamily)
      .attr('font-size', d => `${d.size}px`)
      .attr('transform', this._transformText)
      .text(this._setText);

    // exit transition
    this._words
      .exit()
      .transition()
      .duration(transitionDuration)
      .attr('fill-opacity', 0)
      .remove();
  }

  _transformText(d: Object): string {
    const translate = `translate(${d.x}, ${d.y})`;
    const rotate = typeof d.rotate === 'number' ? `rotate(${d.rotate})` : '';
    return translate + rotate;
  }

  _setText = (d: Object): string => {
    return d[this.props.wordKey];
  };

  _colorScale = (d: Object, i: number): string => {
    const { colorScale, colors } = this.props;
    return colorScale
      ? colorScale(d, i)
      : _chooseRandom(colors || DEFAULT_COLORS);
  };

  _onWordClick = (d: Object, i: number, nodes: any): void => {
    //callback
    const { colorScaleActive, onWordClick } = this.props;
    if (onWordClick) onWordClick(d);
    //click effect
    const { selectedWord } = this.state;
    const color = tinycolor(this._colorScale(d, i));
    const colorActive = colorScaleActive
      ? tinycolor(colorScaleActive(d, i))
      : tinycolor(this._colorScale(d, i)).complement();
    if (i === selectedWord.i) {
      this.setState({ selectedWord: { i: -1, ref: -1 } });
      d3.select(nodes[i]).attr('fill', color.toRgbString());
    } else {
      if (selectedWord.ref !== -1) {
        const oldColor = tinycolor(
          this._colorScale(selectedWord.d, selectedWord.i)
        );
        d3.select(selectedWord.ref).attr('fill', oldColor.toRgbString());
      }
      this.setState({ selectedWord: { d, i, ref: nodes[i] } });
      d3.select(nodes[i]).attr('fill', colorActive.toRgbString());
    }
  };

  _onMouseOver = (d: Object, i: number, nodes: any): void => {
    //tooltip
    const {
      colorScaleActive,
      tooltipEnabled,
      wordKey,
      wordCountKey,
      onSetTooltip,
      onMouseOverWord
    } = this.props;
    const tooltipContent = onSetTooltip
      ? onSetTooltip(d)
      : `${d[wordKey]} (${d[wordCountKey]})`;
    if (tooltipEnabled) {
      this.setState({
        tooltipContent,
        tooltipEnabled: true,
        tooltipX: currentEvent.pageX,
        tooltipY: currentEvent.pageY - 28
      });
    }
    //hover effect
    const colorActive = colorScaleActive
      ? tinycolor(colorScaleActive(d, i))
      : tinycolor(this._colorScale(d, i)).complement();
    d3.select(nodes[i]).attr('fill', colorActive.toRgbString());
    if (onMouseOverWord) onMouseOverWord(d);
  };

  _onMouseOut = (d: Object, i: number, nodes: any): void => {
    const { onMouseOutWord } = this.props;
    //tooltip
    if (this.props.tooltipEnabled) {
      this.setState({
        tooltipEnabled: false
      });
    }
    //hover effect
    const { selectedWord } = this.state;
    if (i !== selectedWord.i) {
      d3.select(nodes[i]).attr('fill', this._colorScale(d, i));
    }
    if (onMouseOutWord) onMouseOutWord(d);
  };

  _validateProps(): void {
    const { maxAngle, minAngle, words, wordCountKey, wordKey } = this.props;
    invariant(
      Math.abs(minAngle) <= 90 && Math.abs(maxAngle) <= 90,
      'Angles must have values between -90 to 90 degrees'
    );
    invariant(minAngle <= maxAngle, 'minAngle must be <= maxAngle');
    if (words.length > 0) {
      const firstRow = words[0];
      invariant(
        wordKey in firstRow,
        'Word key must be a valid key in the data'
      );
      invariant(
        wordCountKey in firstRow,
        'Word count key must be a valid key in the data'
      );
    }
  }
}

const DEFAULT_COLORS: Array<string> = d3
  .range(20)
  .map(d3.scaleOrdinal(d3.schemeCategory10));

const _chooseRandom = (array: Array<any>): any => {
  return array[Math.floor(Math.random() * array.length)];
};

const _getScale = (scale: TScale): Function => {
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

export default WordCloud;
