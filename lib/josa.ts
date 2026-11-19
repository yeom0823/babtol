/** 받침이 있으면 a, 없으면 b를 붙인다. 예: josa("귤", "을", "를") → "귤을". */
export function josa(word: string, a: string, b: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? a : b);
}
