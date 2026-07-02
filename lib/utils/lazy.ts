export const lazy = <T>(fn: () => T) => {
  let _value: T;
  return () => {
    if (_value) {
      return _value;
    }
    _value = fn();
    return _value;
  };
};
