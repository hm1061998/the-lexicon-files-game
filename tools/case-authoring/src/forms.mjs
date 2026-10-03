/** Short forms of the dialogue YAML: `do` effects and `needs` conditions. */

export class FormError extends Error {
  /** @param {string} message @param {number} [index] position of the bad item in its list */
  constructor(message, index = 0) {
    super(message);
    this.name = 'FormError';
    this.index = index;
  }
}

const DO_VERBS = {
  set: (key) => ({ type: 'setFlag', key, value: true }),
  clear: (key) => ({ type: 'setFlag', key, value: false }),
  give: (evidenceId) => ({ type: 'addEvidence', evidenceId }),
  unlock: (factId) => ({ type: 'unlockFact', factId }),
  activate: (objectiveId) => ({ type: 'activateObjective', objectiveId }),
  complete: (objectiveId) => ({ type: 'completeObjective', objectiveId }),
};

function splitItem(item, index) {
  if (typeof item !== 'string') throw new FormError(`"${String(item)}" phải là một chuỗi`, index);
  const match = /^(\S+)\s+(\S.*?)\s*$/.exec(item.trim());
  if (!match) throw new FormError(`"${item}" thiếu tham số (dạng: <động từ> <id>)`, index);
  return [match[1], match[2]];
}

/** @param {unknown} items list of `verb id` strings @returns {object[]} engine effects, in order */
export function parseDo(items) {
  if (!Array.isArray(items)) throw new FormError('do phải là một danh sách', 0);
  return items.map((item, index) => {
    const [verb, arg] = splitItem(item, index);
    const make = DO_VERBS[verb];
    if (!make)
      throw new FormError(
        `động từ "${verb}" không có trong do (dùng: ${Object.keys(DO_VERBS).join(', ')})`,
        index,
      );
    return make(arg);
  });
}

/** @param {object[]} effects @returns {string[]} */
export function formatDo(effects) {
  return effects.map((e) => {
    switch (e.type) {
      case 'setFlag':
        return `${e.value ? 'set' : 'clear'} ${e.key}`;
      case 'addEvidence':
        return `give ${e.evidenceId}`;
      case 'unlockFact':
        return `unlock ${e.factId}`;
      case 'activateObjective':
        return `activate ${e.objectiveId}`;
      case 'completeObjective':
        return `complete ${e.objectiveId}`;
      default:
        throw new FormError(`effect "${e.type}" không có dạng rút gọn`);
    }
  });
}

const LEAF_VERBS = {
  evidence: (id) => ({ type: 'hasEvidence', evidenceId: id }),
  fact: (id) => ({ type: 'hasFact', factId: id }),
  objective: (id) => ({ type: 'objectiveCompleted', objectiveId: id }),
  flag: (key) => ({ type: 'flag', key, value: true }),
  'no-flag': (key) => ({ type: 'flag', key, value: false }),
};

const isGroupObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function parseItem(item, index) {
  if (typeof item === 'string') {
    const [verb, arg] = splitItem(item, index);
    const make = LEAF_VERBS[verb];
    if (!make)
      throw new FormError(
        `điều kiện "${verb}" không có trong needs (dùng: ${Object.keys(LEAF_VERBS).join(', ')})`,
        index,
      );
    return make(arg);
  }
  if (isGroupObject(item)) return parseGroup(item, index);
  throw new FormError('mục needs phải là chuỗi hoặc nhóm all/any', index);
}

function parseGroup(group, index) {
  const keys = Object.keys(group);
  const key = keys[0];
  if (keys.length !== 1 || (key !== 'all' && key !== 'any'))
    throw new FormError('nhóm needs chỉ có một khóa: all hoặc any', index);
  const children = group[key];
  if (!Array.isArray(children)) throw new FormError(`${key} phải là một danh sách`, index);
  return { type: key, conditions: children.map((child, i) => parseItem(child, i)) };
}

/** @param {unknown} spec list of items, or an explicit `{ all: [...] }` / `{ any: [...] }` @returns {object} */
export function parseNeeds(spec) {
  if (Array.isArray(spec)) {
    if (spec.length === 0) throw new FormError('needs không được rỗng', 0);
    if (spec.length === 1) return parseItem(spec[0], 0);
    return { type: 'all', conditions: spec.map((item, i) => parseItem(item, i)) };
  }
  if (isGroupObject(spec)) return parseGroup(spec, 0);
  throw new FormError('needs phải là danh sách hoặc nhóm all/any', 0);
}

function formatItem(c) {
  switch (c.type) {
    case 'flag':
      return `${c.value ? 'flag' : 'no-flag'} ${c.key}`;
    case 'hasEvidence':
      return `evidence ${c.evidenceId}`;
    case 'hasFact':
      return `fact ${c.factId}`;
    case 'objectiveCompleted':
      return `objective ${c.objectiveId}`;
    case 'all':
    case 'any':
      return { [c.type]: c.conditions.map(formatItem) };
    default:
      throw new FormError(`điều kiện "${c.type}" không có dạng rút gọn`);
  }
}

/** @param {object} condition @returns {unknown} the canonical `needs` value */
export function formatNeeds(condition) {
  if (condition.type === 'all' && condition.conditions.length >= 2)
    return condition.conditions.map(formatItem);
  if (condition.type === 'all' || condition.type === 'any') return formatItem(condition);
  return [formatItem(condition)];
}
