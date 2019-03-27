import React, { Component } from 'react';

// TODO: pull this value from props
// const timer = new Date(now.getTime() + 3 * 60000);
// const delta = new Date(timer.getTime() - now.getTime());

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      now: new Date(),
    };
  }

  componentDidMount() {
    this.intervalID = setInterval(
      () => this.tick(),
      1000,
    );
  }

  componentWillUnmount() {
    clearInterval(this.intervalID);
  }

  tick = () => {
    this.setState({
      now: new Date(),
    });
  };

  render() {
    const { endTime } = this.props;
    const delta = new Date(endTime - this.state.now.getTime());
    const seconds = delta.getSeconds();
    return (
      <div>
        <div className="timer">
          { delta.getMinutes() }
          :
          { (seconds < 10) ? '0' + seconds : seconds }
        </div>
      </div>
    );
  }
}

export default Timer;
