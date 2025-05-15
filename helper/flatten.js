function nestObject(flatObj) {
  const nested = {};
  for (const key in flatObj) {
    const keys = key.split('.');
    keys.reduce((acc, k, i) => {
      if (i === keys.length - 1) {
        acc[k] = flatObj[key];
      } else {
        acc[k] = acc[k] || {};
      }
      return acc[k];
    }, nested);
  }
  return nested;
}

module.exports = { nestObject };
