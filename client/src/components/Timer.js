import React, { Component } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const minutes = delta > 0 ? delta.getMinutes() : 0;
    const seconds = delta > 0 ? delta.getSeconds() : 0;

    if (minutes === 1 && seconds === 0) {
      toast.error('⏳ 1 minute left to escape! gogogo', {
        position: 'bottom-right',
        autoClose: false,
      });
    } else if (minutes === 2 && seconds === 0) {
      toast.warn('⏳ 2 minutes left!', {
        position: 'bottom-right',
        autoClose: false,
      });
    } else if (minutes === 0 && seconds === 30) {
      toast.error('⏳ 30 SECONDS LEFT!!', {
        position: 'bottom-right',
        autoClose: false,
      });
    }
  
    return (
      <div>
        <div className="timer">
          { minutes }
          :
          { (seconds < 10) ? '0' + seconds : seconds }
        </div>
      </div>
    );
  }
}

export default Timer;
