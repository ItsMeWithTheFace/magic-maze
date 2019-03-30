import React, { Component } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      now: new Date(),
      doTick: props.doTick,
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
    const { doTick } = this.state;
    if (doTick) {
      this.setState({
        now: new Date(),
      });
    }
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
        {/* game lost modal */}
        <Modal isOpen={minutes <= 0 && seconds <= 0} size={'lg'}>
          <ModalHeader>
            <span role="img" aria-label="siren">🚨</span> 
            YOU LOST! 
            <span role="img" aria-label="siren">🚨</span>
          </ModalHeader>
          <ModalBody>
            The boys failed to escape in time and got caught by the authorities...
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={() => this.props.history.push('/')}>Exit</Button>{' '}
          </ModalFooter>
        </Modal>
        <div className="timer">
          { minutes }
          :
          { (seconds < 10) ? '0' + seconds : seconds }
        </div>
      </div>
    );
  }
}

Timer.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
};

export default Timer;
