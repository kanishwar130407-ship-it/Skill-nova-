import { ASSESSMENT_CATALOG_CLIENT } from '../src/data/seedCatalog.ts';

export interface ServerAnswerKey {
  questionId: string;
  type: 'mcq' | 'short-answer';
  correctOptionIndex?: number;
  correctOptionText?: string;
  explanation: string;
  maxPoints: number;
  rubricKeywords?: string[];
  rubricExpectation?: string;
}

// Strictly server-only answer keys; never transmitted in GET /api/assessments
export const SERVER_ANSWER_KEYS: Record<string, ServerAnswerKey> = {
  'q-base-1': {
    questionId: 'q-base-1',
    type: 'mcq',
    correctOptionIndex: 1,
    correctOptionText: '<button type="button">',
    explanation: 'Native <button> elements carry built-in keyboard activation (Enter/Space) and button semantics for assistive technology.',
    maxPoints: 20,
  },
  'q-base-2': {
    questionId: 'q-base-2',
    type: 'mcq',
    correctOptionIndex: 1,
    correctOptionText: '[10, 20]',
    explanation: 'Array.prototype.map transforms each string element into a Number and returns a new array [10, 20].',
    maxPoints: 20,
  },
  'q-base-3': {
    questionId: 'q-base-3',
    type: 'mcq',
    correctOptionIndex: 1,
    correctOptionText: 'Check `if (!response.ok)` and throw or handle the error explicitly',
    explanation: 'fetch() only rejects on network failures; HTTP 404/500 responses resolve with response.ok === false.',
    maxPoints: 20,
  },
  'q-base-4': {
    questionId: 'q-base-4',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'It prevents SQL injection by separating SQL structure from untrusted input data',
    explanation: 'Parameterized placeholders bind user values as data parameters so they cannot alter SQL syntax.',
    maxPoints: 20,
  },
  'q-base-5': {
    questionId: 'q-base-5',
    type: 'short-answer',
    explanation: 'API keys in browser code are visible in network tabs and client bundles; server proxy routes protect secrets and enforce request validation.',
    maxPoints: 20,
    rubricKeywords: ['server', 'secret', 'expose', 'browser', 'client', 'proxy', 'env', 'validate', 'bundle'],
    rubricExpectation: 'Explains keeping secrets out of browser bundles/network tabs and routing requests through a server endpoint.',
  },
  'q-hc-1': {
    questionId: 'q-hc-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'Use `<label for="goal">` (or `htmlFor="goal"` in JSX)',
    explanation: 'Programmatic <label> association ensures screen readers announce the field and clicking the label focuses the input.',
    maxPoints: 34,
  },
  'q-hc-2': {
    questionId: 'q-hc-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'flex-wrap: wrap',
    explanation: 'flex-wrap: wrap lets flex children flow onto subsequent lines on narrower screens instead of overflowing horizontally.',
    maxPoints: 33,
  },
  'q-hc-3': {
    questionId: 'q-hc-3',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'Pair status color with an explicit text label or icon',
    explanation: 'Dual-coding status with text/icons ensures color-vision-deficient users still understand every state.',
    maxPoints: 33,
  },
  'q-js-1': {
    questionId: 'q-js-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: '`"5" === 5` is `false` and `"5" == 5` is `true`',
    explanation: 'Strict equality (===) checks both type and value without implicit coercion.',
    maxPoints: 25,
  },
  'q-js-2': {
    questionId: 'q-js-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'Array.prototype.filter()',
    explanation: '.filter() returns a new array of matching items while leaving the original array untouched.',
    maxPoints: 25,
  },
  'q-js-3': {
    questionId: 'q-js-3',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'By default for bindings that will not be reassigned',
    explanation: 'Using const by default prevents accidental variable reassignment and signals intent clearly.',
    maxPoints: 25,
  },
  'q-js-4': {
    questionId: 'q-js-4',
    type: 'short-answer',
    explanation: 'Returning new arrays avoids mutating shared state in place, allowing React and state comparisons to detect changes reliably.',
    maxPoints: 25,
    rubricKeywords: ['new array', 'immutable', 'mutate', 'mutation', 'react', 'reference', 'render', 'predictable', 'copy'],
    rubricExpectation: 'Mentions returning a new array/reference without mutating original state, helping React detect updates and avoid side-effect bugs.',
  },
  'q-async-1': {
    questionId: 'q-async-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'A Promise',
    explanation: 'Every async function wraps its return value (or thrown error) in a Promise.',
    maxPoints: 34,
  },
  'q-async-2': {
    questionId: 'q-async-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'On network failures or aborted requests (not on HTTP 404 or 500)',
    explanation: 'HTTP error status codes still resolve the Promise with response.ok === false.',
    maxPoints: 33,
  },
  'q-async-3': {
    questionId: 'q-async-3',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'Promise.all([...])',
    explanation: 'Promise.all executes independent Promises concurrently and resolves with an array of their results.',
    maxPoints: 33,
  },
  'q-react-1': {
    questionId: 'q-react-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'React compares object references and may skip re-rendering if the reference did not change',
    explanation: 'Passing the mutated same array reference causes Object.is(prev, next) to return true, skipping updates.',
    maxPoints: 34,
  },
  'q-react-2': {
    questionId: 'q-react-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'A stable, unique ID on each module (e.g., `mod.id`)',
    explanation: 'Stable unique IDs let React reconcile list items accurately across filtering and reordering.',
    maxPoints: 33,
  },
  'q-react-3': {
    questionId: 'q-react-3',
    type: 'short-answer',
    explanation: 'Computing derived totals during render eliminates redundant re-renders and guarantees counts stay synchronized with modules.',
    maxPoints: 33,
    rubricKeywords: ['sync', 'stale', 'redundant', 'render', 'effect', 'duplicate', 'source of truth', 'derived'],
    rubricExpectation: 'Explains avoiding redundant renders, stale state synchronization bugs, and keeping a single source of truth.',
  },
  'q-node-1': {
    questionId: 'q-node-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: '400 Bad Request',
    explanation: '400 Bad Request communicates a client validation error accurately.',
    maxPoints: 34,
  },
  'q-node-2': {
    questionId: 'q-node-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'Exclusively inside server-side routes/modules via `process.env`',
    explanation: 'Server environment variables keep API keys off client bundles and browser storage.',
    maxPoints: 33,
  },
  'q-node-3': {
    questionId: 'q-node-3',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'As untrusted user data delimited clearly from system instructions, with structured output validation',
    explanation: 'Separating untrusted text from system instructions and validating outputs mitigates prompt injection.',
    maxPoints: 33,
  },
  'q-sql-1': {
    questionId: 'q-sql-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: '`db.query("UPDATE learners SET target_role = $1 WHERE id = $2", [roleId, learnerId])`',
    explanation: 'Parameterized placeholders ($1, $2) prevent user input from altering SQL command syntax.',
    maxPoints: 50,
  },
  'q-sql-2': {
    questionId: 'q-sql-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'So either all related changes commit together or none apply if an error occurs',
    explanation: 'Transactions provide atomicity so partial failures cannot leave roadmap versions and modules out of sync.',
    maxPoints: 50,
  },
  'q-pd-1': {
    questionId: 'q-pd-1',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: '`df.groupby("skill_id")["score"].mean()`',
    explanation: 'groupby().mean() computes per-group averages equivalent to SQL GROUP BY skill_id with AVG(score).',
    maxPoints: 50,
  },
  'q-pd-2': {
    questionId: 'q-pd-2',
    type: 'mcq',
    correctOptionIndex: 0,
    correctOptionText: 'Unknown / unassessed data is not evidence of zero knowledge and would bias the mean downward',
    explanation: 'Treating missing values as 0 conflates lack of measurement with zero skill and distorts summary metrics.',
    maxPoints: 50,
  },
};

export function getAssessmentDefinition(assessmentId: string) {
  return ASSESSMENT_CATALOG_CLIENT.find((a) => a.id === assessmentId) ?? null;
}
