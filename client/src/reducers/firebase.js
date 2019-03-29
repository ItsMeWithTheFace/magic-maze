import Firebase from '../config/firebase';

const initialState = {
  firebaseInst: new Firebase(),
};

const firebaseReducer = (state = initialState) => state;

export default firebaseReducer;
