/**
 * Risk Classification System for CrewAI Agent Tasks
 *
 * Classifies tasks into risk levels (LOW, MEDIUM, HIGH) based on:
 * - Task category (research, writing, data, communication)
 * - External API requirements
 * - Data modification capabilities
 * - Sensitive information access
 * - Payment/financial implications
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CrewCategory = 'RESEARCH' | 'WRITING' | 'DATA' | 'COMMUNICATION';

export interface RiskFactors {
  /** The crew/task category */
  category: CrewCategory;
  /** Whether the task requires external API calls (beyond Gemini) */
  requiresExternalAPI?: boolean;
  /** Whether the task can modify user data (create/update docs, sheets, etc.) */
  modifiesUserData?: boolean;
  /** Whether the task involves payment or financial transactions */
  requiresPayment?: boolean;
  /** Whether the task accesses sensitive personal information */
  accessesSensitiveInfo?: boolean;
  /** Whether the task sends communications on user's behalf */
  sendsCommunications?: boolean;
}

/**
 * Base risk levels by category
 * Research and Writing are low risk (read-only or create drafts)
 * Data is medium risk (can modify spreadsheets)
 * Communication is high risk (sends emails on behalf of user)
 */
const CATEGORY_BASE_RISK: Record<CrewCategory, number> = {
  RESEARCH: 0,      // LOW - Read-only web research
  WRITING: 0,       // LOW - Creates drafts for review
  DATA: 1,          // MEDIUM - Can create/modify spreadsheets
  COMMUNICATION: 2, // HIGH - Sends emails/messages
};

/**
 * Risk score thresholds
 */
const RISK_THRESHOLDS = {
  LOW: 1,    // Score 0-1 = LOW
  MEDIUM: 3, // Score 2-3 = MEDIUM
  // Score 4+ = HIGH
};

/**
 * Calculates the risk level for a task based on various factors
 *
 * @param factors - The risk factors to evaluate
 * @returns The calculated risk level (LOW, MEDIUM, HIGH)
 *
 * @example
 * ```typescript
 * const risk = classifyTaskRisk({
 *   category: 'RESEARCH',
 *   requiresExternalAPI: true
 * });
 * // Returns: 'LOW'
 *
 * const risk = classifyTaskRisk({
 *   category: 'COMMUNICATION',
 *   sendsCommunications: true
 * });
 * // Returns: 'HIGH'
 * ```
 */
export function classifyTaskRisk(factors: RiskFactors): RiskLevel {
  let score = CATEGORY_BASE_RISK[factors.category] ?? 1;

  // Add risk factors
  if (factors.requiresExternalAPI) score += 1;
  if (factors.modifiesUserData) score += 1;
  if (factors.requiresPayment) score += 2;
  if (factors.accessesSensitiveInfo) score += 2;
  if (factors.sendsCommunications) score += 1;

  // Convert score to risk level
  if (score <= RISK_THRESHOLDS.LOW) return 'LOW';
  if (score <= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Gets the default risk level for a crew category
 *
 * @param category - The crew category
 * @returns The default risk level for that category
 */
export function getDefaultRiskLevel(category: CrewCategory): RiskLevel {
  return classifyTaskRisk({ category });
}

/**
 * Determines if a task requires user approval based on risk level and user settings
 *
 * @param taskRiskLevel - The risk level of the task
 * @param autoApproveUpTo - The maximum risk level to auto-approve
 * @returns True if the task requires manual approval
 *
 * @example
 * ```typescript
 * requiresApproval('HIGH', 'LOW');  // true - HIGH > LOW
 * requiresApproval('LOW', 'MEDIUM'); // false - LOW <= MEDIUM
 * requiresApproval('MEDIUM', 'LOW'); // true - MEDIUM > LOW
 * ```
 */
export function requiresApproval(
  taskRiskLevel: RiskLevel,
  autoApproveUpTo: RiskLevel
): boolean {
  const riskOrder: Record<RiskLevel, number> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
  };

  return riskOrder[taskRiskLevel] > riskOrder[autoApproveUpTo];
}

/**
 * Gets a human-readable description of a risk level
 *
 * @param level - The risk level
 * @returns A description of what the risk level means
 */
export function getRiskLevelDescription(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'Read-only operations or creates drafts for your review. Safe to run automatically.';
    case 'MEDIUM':
      return 'May create or modify files (documents, spreadsheets). Results can be reviewed and reverted.';
    case 'HIGH':
      return 'Performs actions on your behalf (sends emails, schedules meetings). Requires approval.';
  }
}

/**
 * Gets the risk factors for a specific crew category
 * Used to display what capabilities a crew has to users
 *
 * @param category - The crew category
 * @returns The default risk factors for that category
 */
export function getCrewRiskFactors(category: CrewCategory): RiskFactors {
  switch (category) {
    case 'RESEARCH':
      return {
        category,
        requiresExternalAPI: true, // Web search
        modifiesUserData: false,
        sendsCommunications: false,
      };
    case 'WRITING':
      return {
        category,
        requiresExternalAPI: true, // Google Docs API
        modifiesUserData: true, // Creates documents
        sendsCommunications: false,
      };
    case 'DATA':
      return {
        category,
        requiresExternalAPI: true, // Google Sheets API
        modifiesUserData: true, // Creates/modifies spreadsheets
        sendsCommunications: false,
      };
    case 'COMMUNICATION':
      return {
        category,
        requiresExternalAPI: true, // Gmail, Calendar APIs
        modifiesUserData: false,
        sendsCommunications: true, // Sends emails
        accessesSensitiveInfo: true, // Reads contacts, calendar
      };
  }
}

/**
 * Crew type definitions with their default configurations
 */
export const CREW_DEFINITIONS = {
  RESEARCH: {
    name: 'Research Crew',
    description: 'Web search, information gathering, and summarization',
    icon: '🔍',
    riskLevel: 'LOW' as RiskLevel,
    capabilities: [
      'Search the web for information',
      'Read and summarize articles',
      'Compile research reports',
      'Cite sources automatically',
    ],
  },
  WRITING: {
    name: 'Content Writer Crew',
    description: 'Draft blogs, emails, reports, and documents',
    icon: '✍️',
    riskLevel: 'LOW' as RiskLevel,
    capabilities: [
      'Draft blog posts and articles',
      'Write professional emails',
      'Create reports and summaries',
      'Save to Google Docs',
    ],
  },
  DATA: {
    name: 'Data Analysis Crew',
    description: 'Spreadsheet creation, data analysis, and visualization',
    icon: '📊',
    riskLevel: 'MEDIUM' as RiskLevel,
    capabilities: [
      'Analyze spreadsheet data',
      'Create charts and visualizations',
      'Generate insights and summaries',
      'Create new Google Sheets',
    ],
  },
  COMMUNICATION: {
    name: 'Communication Crew',
    description: 'Send emails, schedule meetings, update CRM',
    icon: '📧',
    riskLevel: 'HIGH' as RiskLevel,
    capabilities: [
      'Draft and send emails',
      'Schedule calendar events',
      'Send meeting invitations',
      'Update contact records',
    ],
  },
} as const;

export type CrewDefinition = (typeof CREW_DEFINITIONS)[CrewCategory];
