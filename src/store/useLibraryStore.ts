import { create } from 'zustand';
import { SavedQuestion, QuestionCategory } from '../types';

const INITIAL_QUESTIONS: SavedQuestion[] = [
  {
    id: 'lib-1',
    title: 'Page Object Model Architecture in Playwright vs Selenium',
    category: 'automation',
    technology: 'Playwright / Selenium',
    difficulty: 'Senior',
    tags: ['POM', 'Architecture', 'TypeScript', 'Java'],
    isFavorite: true,
    question: 'How do you design an enterprise-grade Page Object Model, and how does Playwright differ from Selenium in handling page instances and locators?',
    answer: 'In Page Object Model, page classes encapsulate UI locators and user action methods, exposing clean business APIs to test cases. In Selenium (Java), locators are often defined via @FindBy or By locators with PageFactory or custom wrappers, requiring explicit WebDriverWait (ExpectedConditions) to guard against StaleElementReferenceException. In contrast, Playwright decouples locators as lazy evaluators (page.locator(selector)) with built-in auto-waiting for actionability (visible, stable, enabled), and utilizes BrowserContext isolation per test for lightning-fast parallel execution without browser restart overhead.',
    notes: 'Highlight auto-waiting and browser context isolation when speaking to modern tech stacks.',
  },
  {
    id: 'lib-2',
    title: 'Handling Synchronization and Flaky Tests in CI/CD',
    category: 'automation',
    technology: 'Selenium / CI/CD',
    difficulty: 'Senior',
    tags: ['Flakiness', 'Waits', 'Jenkins', 'Stability'],
    isFavorite: true,
    question: 'What are the most common root causes of flaky tests in CI/CD pipelines, and what deterministic synchronization strategies do you implement to eliminate them?',
    answer: 'The primary root causes of flakiness are: 1) Hardcoded sleep timeouts (Thread.sleep) that fail under heavy CPU load, 2) Asynchronous DOM updates/AJAX renders where elements exist before they are interactive, 3) Shared state across parallel tests, and 4) Network latency variations. I eliminate flakiness by strictly prohibiting static sleeps, implementing customized explicit waits for specific conditions (visibility, clickability, DOM attribute change), isolating test data per execution thread, using API-based preconditions for test state setup rather than slow UI steps, and configuring retries with video/trace capture for deterministic root-cause diagnosis.',
  },
  {
    id: 'lib-3',
    title: 'Finding Duplicate Records and Verifying Data Integrity in SQL',
    category: 'database',
    technology: 'MySQL / SQL',
    difficulty: 'Medium',
    tags: ['SQL', 'GROUP BY', 'HAVING', 'Validation'],
    isFavorite: false,
    question: 'Write a SQL query to identify duplicate customer email records, and explain how you validate database transactions during automated end-to-end testing.',
    answer: 'To identify duplicates: SELECT email, COUNT(*) AS duplicate_count FROM customers GROUP BY email HAVING COUNT(*) > 1 ORDER BY duplicate_count DESC. In automated testing, I validate database transactions by querying the test database directly in an @AfterMethod or step definition using JDBC/Connection pools. I verify that status fields transitioned correctly (e.g. status = "COMPLETED"), foreign keys are intact, and timestamps updated, while rolling back or pruning test artifacts to ensure test idempotency.',
  },
  {
    id: 'lib-4',
    title: 'REST API Authentication and Automated Contract Validation',
    category: 'api_testing',
    technology: 'REST / Postman / TypeScript',
    difficulty: 'Senior',
    tags: ['REST', 'OAuth2', 'JWT', 'Assertions'],
    isFavorite: true,
    question: 'How do you structure an automated API testing suite covering JWT authentication, status code verification, and JSON schema contract validation?',
    answer: 'I structure API automation suites with an HTTP client client wrapper (e.g., Playwright request context, RestAssured, or Axios) that manages authentication tokens dynamically. An initial auth fixture executes the token exchange (OAuth2/JWT) and stores the Bearer token in the request header interceptor. Test cases assert: 1) Correct HTTP status code (200, 201, 400, 401, 404), 2) Header headers (Content-Type: application/json), 3) JSON schema conformance (using Ajv in TypeScript or JsonSchemaValidator in Java), and 4) Payload business invariants.',
  },
  {
    id: 'lib-5',
    title: 'Resolving Release Conflicts Between Developers and QA',
    category: 'behavioral',
    technology: 'Agile / Leadership',
    difficulty: 'Lead / Architect',
    tags: ['STAR', 'Leadership', 'Defect Management', 'Risk'],
    isFavorite: true,
    question: 'Tell me about a time a developer strongly pushed back on a critical defect you flagged right before a major production release. How did you handle it?',
    answer: 'Situation: Three days before our quarterly FinTech release, our automated regression flagged a race condition where high-concurrency transactions intermittently dropped ledger records. The lead developer argued it was an unrealistic edge case caused by automation load and pushed to release on schedule. Task: As QA Lead, my duty was to protect production integrity without creating adversarial tension. Action: Rather than debating opinions, I provided deterministic reproduction logs, network traces, and a minimal reproducible script demonstrating that 3 out of 100 concurrent requests triggered data corruption. I scheduled a 15-minute sync with the developer and engineering director, framing the issue objectively around business risk and financial compliance. Result: The developer acknowledged the synchronization vulnerability and deployed a patch within 6 hours. We verified it overnight, released on schedule without incident, and established a new concurrency unit testing standard.',
  },
  {
    id: 'lib-6',
    title: 'Java Collections: HashMap vs ConcurrentHashMap in Automation Frameworks',
    category: 'programming',
    technology: 'Java',
    difficulty: 'Senior',
    tags: ['Java', 'Multithreading', 'Collections', 'ThreadSafety'],
    isFavorite: false,
    question: 'Explain the internal working of HashMap versus ConcurrentHashMap and why thread safety is critical in parallel test execution.',
    answer: 'A standard HashMap uses an array of buckets (Node<K,V>) with hash code indexing and linked lists/red-black trees for collisions. It is NOT thread-safe; concurrent writes during parallel test runs can corrupt the bucket structure or cause infinite loops during re-hashing. In contrast, ConcurrentHashMap achieves thread safety without locking the entire map by using segment-level CAS (Compare-And-Swap) operations and synchronized bucket heads. In parallel Selenium execution across multiple threads, shared state such as test configuration, environment URLs, or execution metrics must be stored in ConcurrentHashMap or ThreadLocal to prevent cross-test contamination.',
  },
];

interface LibraryState {
  questions: SavedQuestion[];
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
  setSelectedDifficulty: (diff: string) => void;
  toggleFavorite: (id: string) => void;
  addQuestion: (q: Omit<SavedQuestion, 'id'>) => void;
  updateQuestion: (id: string, q: Partial<SavedQuestion>) => void;
  deleteQuestion: (id: string) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  questions: INITIAL_QUESTIONS,
  searchQuery: '',
  selectedCategory: 'all',
  selectedDifficulty: 'all',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSelectedDifficulty: (diff) => set({ selectedDifficulty: diff }),
  toggleFavorite: (id) =>
    set((state) => ({
      questions: state.questions.map((q) => (q.id === id ? { ...q, isFavorite: !q.isFavorite } : q)),
    })),
  addQuestion: (q) => {
    const newQ: SavedQuestion = { ...q, id: 'lib-' + Date.now() };
    set((state) => ({ questions: [newQ, ...state.questions] }));
  },
  updateQuestion: (id, q) =>
    set((state) => ({
      questions: state.questions.map((item) => (item.id === id ? { ...item, ...q } : item)),
    })),
  deleteQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((item) => item.id !== id),
    })),
}));
