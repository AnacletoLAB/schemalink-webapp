import {
  doubleClick,
  endDrag,
  leftClick,
  mouseDown,
  mouseMove,
  mouseUp,
  rightClick,
  wheel,
} from '../actions/mouse';
import { Point, Vector } from '@neo4j-arrows/model';
import { isMac } from './Keybindings';

export default class MouseHandler {
  constructor(canvas) {
    this.canvas = canvas;

    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener(
      'mouseleave',
      this.handleMouseLeave.bind(this)
    );
    this.canvas.addEventListener(
      'contextmenu',
      this.handleRightClick.bind(this)
    );
    this.canvas.addEventListener('click', this.handleLeftClick.bind(this));
  }

  setDispatch(dispatch) {
    this.dispatch = dispatch;
  }

  handleWheel(evt) {
    this.dispatch(
      wheel(
        this.canvasPosition(evt),
        new Vector(evt.deltaX, evt.deltaY),
        evt.ctrlKey
      )
    );
    evt.preventDefault();
  }

  handleRightClick(evt) {
    this.dispatch(rightClick(this.canvasPosition(evt)));
    evt.preventDefault();
  }

  handleLeftClick(evt) {
    this.dispatch(leftClick(this.canvasPosition(evt)));
  }

  handleDoubleClick(evt) {
    this.dispatch(doubleClick(this.canvasPosition(evt)));
    evt.preventDefault();
  }

  handleMouseMove(evt) {
    if (evt.button !== 0) {
      return;
    }
    this.dispatch(mouseMove(this.canvasPosition(evt)));
    evt.preventDefault();
  }

  handleMouseDown(evt) {
    if (evt.button !== 0) {
      return;
    }

    this.dispatch(
      mouseDown(this.canvasPosition(evt), isMac ? evt.metaKey : evt.ctrlKey)
    );
    evt.preventDefault();
  }

  handleMouseUp(evt) {
    if (evt.button !== 0) {
      return;
    }

    this.dispatch(mouseUp(this.canvasPosition(evt)));
    evt.preventDefault();
  }

  handleMouseLeave(evt) {
    this.dispatch(endDrag());
    evt.preventDefault();
  }

  canvasPosition(event) {
    let rect = this.canvas.getBoundingClientRect();
    // TODO Origin of right / bottom ISSUE ???
    return new Point(event.clientX - rect.left, event.clientY - rect.top);
  }
}
