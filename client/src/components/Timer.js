import React, { Component } from 'react';

const now = new Date();
const timer = new Date(now.getTime() + 3 * 60000);
const delta = new Date(timer.getTime() - now.getTime());

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: delta.getMinutes() * 60,
    };
    this.tick = this.tick.bind(this);
    this.timer = setInterval(this.tick, 1000);
  }

  tick() {
    const { time } = this.state;
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;

    if (time !== 0) {
      this.setState({
        time: time - 1,
        min: minutes,
        sec: seconds > 10 ? seconds : `0${seconds}`,
      });
    } else {
      clearInterval(this.timer);
    }
  }

  render() {
    const { min, sec } = this.state;
    return (
      <div>
        <div className="timer">
          { min }
          :
          { sec }
        </div>
      </div>
    );
  }
}

export default Timer;
