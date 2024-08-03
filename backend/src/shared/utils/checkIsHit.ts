export const checkIsHit = (list: number[][], target: any): boolean => {
  for (const pair of list) {
    if (pair[0].toString() === target.x.toString() && pair[1].toString() === target.y.toString()) {
      return true;
    }
  }

  return false;
};
