import { create } from 'zustand';
import { ProfessionalProfile } from '../types';

const INITIAL_PROFILE: ProfessionalProfile = {
  id: 'profile-primary',
  name: 'Jhonne Federic Francisco',
  title: 'Senior QA Automation Engineer / QA Lead',
  yearsExperience: 14,
  automationExperience: 11,
  positioning: 'Senior QA Automation Engineer / QA Lead with 14+ years in quality engineering, leading end-to-end test automation strategies, architectural frameworks in Java & TypeScript, and cross-functional team leadership.',
  summary: 'Results-driven Senior QA Automation Engineer and QA Lead with over 14 years of total software quality engineering experience, including 11+ years specialized in architecting and scaling robust automation frameworks using Selenium WebDriver (Java) and Playwright (TypeScript/JavaScript). Proven track record leading distributed QA teams, establishing BDD Cucumber workflows, integrating automated regression suites into Jenkins CI/CD pipelines, and conducting rigorous database and API validation. Adept at mentoring junior engineers, eliminating flaky tests, and aligning QA with rapid Agile release cadences.',
  programmingLanguages: ['Java', 'TypeScript', 'JavaScript', 'SQL', 'Bash'],
  automationFrameworks: ['Selenium WebDriver', 'Playwright', 'Cucumber BDD', 'TestNG', 'JUnit', 'HP QTP/UFT'],
  testTools: ['Maven', 'Jenkins CI/CD', 'Postman', 'Git', 'Jira', 'YouTrack', 'HP ALM', 'Docker'],
  databases: ['MySQL', 'SQL Server', 'PostgreSQL'],
  testingTypes: [
    'Functional Testing',
    'Regression Testing',
    'Integration Testing',
    'End-to-End (E2E) Testing',
    'UI Automation',
    'Database Validation',
    'API Testing',
    'Cross-Browser Testing',
    'Defect Management',
    'Test Strategy & Planning',
    'CI/CD Pipeline Integration',
    'QA Leadership & Mentoring',
  ],
  employmentHistory: [
    {
      company: 'Freedom! Family Limited (via The Outsource People)',
      role: 'Lead QA Automation Engineer / QA Consultant',
      period: 'Until September 2026 (Completed at end of September)',
      highlights: [
        'Finished engagement at the end of September 2026 after delivering scalable automated testing frameworks and quality improvements.',
        'Architected modern Playwright + TypeScript end-to-end test framework, reducing regression execution time by 65%.',
        'Led and mentored QA engineers across web, API, and microservices validation, ensuring 0 defect leakage to production.',
      ],
    },
    {
      company: 'Global FinTech Solutions',
      role: 'Senior QA Automation Specialist',
      period: '2016 - 2021',
      highlights: [
        'Designed scalable Selenium WebDriver + Java + TestNG framework implementing Page Object Model (POM) and data-driven testing.',
        'Developed automated database reconciliation suites verifying financial transaction ledgers in MySQL with sub-second accuracy.',
        'Implemented BDD Cucumber test cases bridging communication between product owners, developers, and QA.',
      ],
    },
    {
      company: 'Software Systems Inc.',
      role: 'Automation Test Engineer & QA Analyst',
      period: '2012 - 2016',
      highlights: [
        'Automated core enterprise ERP modules using HP QTP/UFT and transitioned critical flows to Selenium WebDriver.',
        'Created modular, reusable automation utility libraries for dynamic table handling, explicit waits, and custom reporting.',
        'Authored comprehensive test plans, traceability matrices, and defect root-cause analysis reports.',
      ],
    },
  ],
  education: [
    'Bachelor of Science in Computer Science / Information Systems',
  ],
  certifications: [
    'ISTQB Certified Tester - Advanced Level (Test Automation Engineering)',
    'Certified ScrumMaster (CSM)',
    'Oracle Certified Associate Java Programmer',
  ],
  projects: [
    {
      name: 'Scalable Playwright TypeScript Framework',
      description: 'Zero-flake parallel test automation suite with automatic screenshot artifacts, video capture, and Slack alerting.',
      technologies: ['Playwright', 'TypeScript', 'Node.js', 'Docker', 'GitHub Actions'],
      outcomes: '99.4% test reliability with under 15-minute runtime across 450+ critical paths.',
    },
    {
      name: 'Enterprise Selenium-Java Test Engine',
      description: 'Hybrid Keyword and Data-Driven test automation framework for multi-tenant banking portal.',
      technologies: ['Selenium', 'Java', 'TestNG', 'Maven', 'MySQL', 'Jenkins'],
      outcomes: 'Expanded automation coverage from 35% to 88% over 18 months.',
    },
  ],
};

interface ProfileState {
  profile: ProfessionalProfile;
  isSaving: boolean;
  updateProfile: (updated: Partial<ProfessionalProfile>) => void;
  resetToDefault: () => void;
  getProfileSummaryForPrompt: () => string;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: INITIAL_PROFILE,
  isSaving: false,
  updateProfile: (updated) =>
    set((state) => ({
      profile: { ...state.profile, ...updated },
    })),
  resetToDefault: () => set({ profile: INITIAL_PROFILE }),
  getProfileSummaryForPrompt: () => {
    const p = get().profile;
    return `Role: ${p.title}
Experience: ${p.yearsExperience}+ years QA (${p.automationExperience}+ years Automation)
Positioning: ${p.positioning}
Primary Skills: ${p.programmingLanguages.join(', ')}
Frameworks: ${p.automationFrameworks.join(', ')}
Testing Types: ${p.testingTypes.join(', ')}
Tools: ${p.testTools.join(', ')}
Databases: ${p.databases.join(', ')}
Recent Role: ${p.employmentHistory[0]?.role} at ${p.employmentHistory[0]?.company}`;
  },
}));
