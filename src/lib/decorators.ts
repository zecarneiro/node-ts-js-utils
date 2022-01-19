export function EntityBaseName(target: any, name: any, descriptor: any) {
  const method = descriptor.value;
  descriptor.value = function() {
    const prevMethod = this.currentMethod;
    this.className = this.constructor.name;
    this.currentMethod = name;
    // eslint-disable-next-line prefer-rest-params
    const result = method.apply(this, arguments);
    this.currentMethod = prevMethod;
    return result;
  };
  return descriptor;
}
