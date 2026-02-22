export interface KeywordRule {
  id: string;
  enabled: boolean;
  targetType: 'user' | 'group';
  targetId: string;
  targetName: string;
  keywords: string[];
  useRegex: boolean;
  replies: string[];
  randomReply: boolean;
  delayMin: number;
  delayMax: number;
  notifyAfterReply: boolean;
}

export interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export interface AIConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
}

export interface AutoReadRule {
  id: string;
  enabled: boolean;
  targetType: 'user' | 'group';
  targetId: string;
  targetName: string;
}

export interface MuteSchedule {
  id: string;
  enabled: boolean;
  targetType: 'user' | 'group';
  targetId: string;
  targetName: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

export interface MessageStat {
  targetId: string;
  targetName: string;
  targetType: 'user' | 'group';
  messageCount: number;
  lastMessageTime: number;
  firstMessageTime: number;
}

export interface PluginConfig {
  keywordRules: KeywordRule[];
  replyTemplates: ReplyTemplate[];
  aiConfig: AIConfig;
  autoReadRules: AutoReadRule[];
  muteSchedules: MuteSchedule[];
  messageStats: Record<string, MessageStat>;
  globalEnabled: boolean;
}
