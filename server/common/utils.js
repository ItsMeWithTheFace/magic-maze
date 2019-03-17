const _ = require('lodash');

const shuffle = (array) => {
  let ctr = array.length;
  let temp;
  let index;

  // While there are elements in the array
  while (ctr > 0) {
    // Pick a random index
    index = Math.floor(Math.random() * ctr);
    // Decrease ctr by 1
    ctr -= 1;
    // And swap the last element with it
    temp = array[ctr];
    array[ctr] = array[index];
    array[index] = temp;
  }
  return array;
};

const rotateList = (array, steps) => (
  _.concat(_.drop(array, steps), _.take(array, array.length - steps))
);

module.exports = {
  shuffle,
  rotateList,
};
