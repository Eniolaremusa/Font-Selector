import {
  NAME_RESOLVE_CHARSET,
  NAME_RESOLVE_CYCLES_PER_CHAR,
  PAIRS_HOVER_CYCLES,
} from "@/lib/motionConstants";

export function buildNameResolveSequence(
  fromChar: string,
  toChar: string,
): string[] {
  if (fromChar === toChar) {
    return [toChar];
  }

  const fromIndex = Math.max(0, NAME_RESOLVE_CHARSET.indexOf(fromChar));
  const toIndex = Math.max(0, NAME_RESOLVE_CHARSET.indexOf(toChar));
  const sequence: string[] = [];

  for (let step = 0; step <= NAME_RESOLVE_CYCLES_PER_CHAR; step += 1) {
    const progress = step / NAME_RESOLVE_CYCLES_PER_CHAR;
    const index = Math.round(fromIndex + (toIndex - fromIndex) * progress);
    sequence.push(NAME_RESOLVE_CHARSET[index] ?? toChar);
  }

  sequence[sequence.length - 1] = toChar;
  return sequence;
}

export function buildHoverPeekSequence(char: string): string[] {
  const charIndex = Math.max(0, NAME_RESOLVE_CHARSET.indexOf(char));
  const sequence = [char];

  for (let step = 1; step <= PAIRS_HOVER_CYCLES; step += 1) {
    const offset = step * 7;
    sequence.push(
      NAME_RESOLVE_CHARSET[
        (charIndex + offset) % NAME_RESOLVE_CHARSET.length
      ] ?? char,
    );
  }

  sequence.push(char);
  return sequence;
}
