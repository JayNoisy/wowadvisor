// Reads a talent loadout export code (the string you paste into the in-game Import box).
//
// Layout (bits are read least-significant first within each base64 character):
//   8 bits   serialization version
//   16 bits  specialization id
//   128 bits tree hash
//   then, for every node of the class's trait tree in ascending node-id order:
//     1 bit  selected
//     1 bit  purchased            (only when selected; unset = granted for free)
//     1 bit  partially ranked     (only when purchased)   + 6 bits rank
//     1 bit  choice node          (only when purchased)   + 2 bits chosen entry

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function decodeLoadoutCode(code, nodeOrder) {
  const vals = [];
  for (const ch of String(code || "").trim()) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return { ok: false, error: `Unexpected character "${ch}"` };
    vals.push(v);
  }
  const totalBits = vals.length * 6;
  let pos = 0;
  let overrun = false;
  const read = (n) => {
    let out = 0;
    for (let i = 0; i < n; i++) {
      if (pos >= totalBits) { overrun = true; return out; }
      const bit = (vals[Math.floor(pos / 6)] >> (pos % 6)) & 1;
      out |= bit << i;
      pos++;
    }
    return out;
  };

  const version = read(8);
  const specId = read(16);
  pos += 128; // tree hash, not needed
  if (pos > totalBits) return { ok: false, error: "Code is too short" };

  const nodes = new Map(); // nodeId -> { purchased, rank (null = full), choice (null = not a choice) }
  for (const nodeId of nodeOrder) {
    if (!read(1)) continue;
    const purchased = Boolean(read(1));
    let rank = null;
    let choice = null;
    if (purchased) {
      if (read(1)) rank = read(6);
      if (read(1)) choice = read(2);
    }
    nodes.set(nodeId, { purchased, rank, choice });
  }
  // Whatever is left must be zero padding.
  let trailing = 0;
  while (pos < totalBits) trailing |= read(1);

  return { ok: !overrun && trailing === 0, version, specId, nodes, overrun, trailingBitsSet: trailing === 1 };
}
