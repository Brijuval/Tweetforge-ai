export function toggle(arr, v) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
