import { create } from 'zustand';
import { CodingSolution } from '../types';

interface CodeTab {
  id: string;
  title: string;
  language: string;
  code: string;
}

const DEFAULT_JAVA_CODE = `package com.interview.automation;

import java.util.*;

/**
 * Technical Assessment: Find Duplicate Elements in Array
 * Time Complexity: O(n) | Space Complexity: O(n)
 */
public class DuplicateFinder {

    public static List<Integer> findDuplicates(int[] nums) {
        List<Integer> duplicates = new ArrayList<>();
        Set<Integer> seen = new HashSet<>();

        if (nums == null || nums.length == 0) {
            return duplicates;
        }

        for (int num : nums) {
            // Set.add returns false if the item was already present
            if (!seen.add(num)) {
                if (!duplicates.contains(num)) {
                    duplicates.add(num);
                }
            }
        }
        return duplicates;
    }

    public static void main(String[] args) {
        int[] testArray = {4, 3, 2, 7, 8, 2, 3, 1};
        System.out.println("Input: " + Arrays.toString(testArray));
        System.out.println("Duplicates found: " + findDuplicates(testArray));
    }
}
`;

interface CodeState {
  tabs: CodeTab[];
  activeTabId: string;
  currentSolution: CodingSolution | null;
  isSolving: boolean;
  isExecuting: boolean;
  executionOutput: string | null;
  executionErrors: string | null;
  executionTimeMs: number;
  
  // Actions
  setActiveTabId: (id: string) => void;
  updateTabCode: (id: string, code: string) => void;
  updateTabLanguage: (id: string, lang: string) => void;
  addTab: (title: string, language: string, code: string) => void;
  closeTab: (id: string) => void;
  setCurrentSolution: (solution: CodingSolution | null) => void;
  setIsSolving: (solving: boolean) => void;
  setIsExecuting: (executing: boolean) => void;
  setExecutionResult: (output: string | null, errors: string | null, timeMs: number) => void;
}

export const useCodeStore = create<CodeState>((set, get) => ({
  tabs: [
    {
      id: 'tab-1',
      title: 'DuplicateFinder.java',
      language: 'java',
      code: DEFAULT_JAVA_CODE,
    },
    {
      id: 'tab-2',
      title: 'playwright.spec.ts',
      language: 'typescript',
      code: `import { test, expect } from '@playwright/test';

test.describe('Automated Authentication Suite', () => {
  test('Verify login with explicit dynamic wait', async ({ page }) => {
    await page.goto('https://app.example.com/login');
    
    // Fill credentials
    await page.fill('[data-testid="input-username"]', 'qa_lead_user');
    await page.fill('[data-testid="input-password"]', 'SecureP@ssw0rd!');
    await page.click('button[type="submit"]');

    // Smart explicit assertion with automatic polling
    const dashboardHeader = page.locator('h1.dashboard-welcome');
    await expect(dashboardHeader).toBeVisible({ timeout: 10000 });
    await expect(dashboardHeader).toHaveText('Welcome back, QA Lead');
  });
});
`,
    },
  ],
  activeTabId: 'tab-1',
  currentSolution: null,
  isSolving: false,
  isExecuting: false,
  executionOutput: null,
  executionErrors: null,
  executionTimeMs: 0,

  setActiveTabId: (id) => set({ activeTabId: id }),
  updateTabCode: (id, code) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, code } : tab)),
    })),
  updateTabLanguage: (id, language) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, language } : tab)),
    })),
  addTab: (title, language, code) => {
    const newId = 'tab-' + Date.now();
    set((state) => ({
      tabs: [...state.tabs, { id: newId, title, language, code }],
      activeTabId: newId,
    }));
  },
  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return; // Keep at least one tab
    const nextTabs = tabs.filter((t) => t.id !== id);
    const nextActive = activeTabId === id ? nextTabs[0].id : activeTabId;
    set({ tabs: nextTabs, activeTabId: nextActive });
  },
  setCurrentSolution: (solution) => set({ currentSolution: solution }),
  setIsSolving: (solving) => set({ isSolving: solving }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setExecutionResult: (output, errors, timeMs) =>
    set({ executionOutput: output, executionErrors: errors, executionTimeMs: timeMs }),
}));
