import React, { Component } from 'react';

const now = new Date();
// TODO: pull this value from props
const timer = new Date(now.getTime() + 3 * 60000);
const delta = new Date(timer.getTime() - now.getTime());

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: delta.getMinutes() * 60,
      min: '3',
      sec: '00',
    };
    this.tick = this.tick.bind(this);
    this.timer = setInterval(this.tick, 1000);
  }

  tick() {
    const { time } = this.state;
    // convert seconds to min:sec
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;

    if (time >= 0) {
      this.setState({
        // handle 0 rollover
        time: time !== 0 ? time - 1 : 0,
        min: minutes,
        // seconds formatting
        sec: seconds >= 10 ? seconds : `0${seconds}`,
      });
    } else {
      // kill the timer
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
