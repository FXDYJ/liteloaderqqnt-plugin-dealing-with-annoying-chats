import { ipcMain, BrowserWindow, Notification } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { PluginConfig, KeywordRule, MessageStat } from '@/types/config.d';

const SLUG = 'dealing-with-annoying-chats';
const NOTIFICATION_PREVIEW_LENGTH = 50;
const IPC = {
  GET_CONFIG: `${SLUG}.getConfig`,
  SET_CONFIG: `${SLUG}.setConfig`,
  CHECK_KEYWORD: `${SLUG}.checkKeyword`,
  AI_REQUEST: `${SLUG}.aiRequest`,
  NOTIFY: `${SLUG}.notify`,
  GET_STATS: `${SLUG}.getStats`,
  RESET_STATS: `${SLUG}.resetStats`,
  UPDATE_STAT: `${SLUG}.updateStat`,
} as const;

const DEFAULT_CONFIG: PluginConfig = {
  keywordRules: [],
  replyTemplates: [
    { id: 'tpl_1', name: '在忙', content: '不好意思，我现在有点忙，稍后回复你~', category: '通用' },
    { id: 'tpl_2', name: '收到', content: '好的，收到！', category: '通用' },
    { id: 'tpl_3', name: '稍等', content: '稍等一下哈，马上回你', category: '通用' },
    { id: 'tpl_4', name: '开会中', content: '在开会呢，结束后联系你', category: '工作' },
    { id: 'tpl_5', name: '嗯嗯', content: '嗯嗯，了解了', category: '通用' },
    { id: 'tpl_6', name: '哈哈', content: '哈哈哈哈😂', category: '敷衍' },
    { id: 'tpl_7', name: '问号', content: '？', category: '敷衍' },
    { id: 'tpl_8', name: '赞同', content: '你说得对👍', category: '敷衍' },
  ],
  aiConfig: {
    enabled: false,
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    systemPrompt: '你是一个聊天助手，请根据聊天记录的上下文，生成一条合适的回复。回复应该自然、简洁、口语化。如果对方很烦人或无聊，回复可以敷衍一些但不要太明显。只需要给出回复内容，不要加任何解释。',
    maxTokens: 200,
    temperature: 0.7,
  },
  autoReadRules: [],
  muteSchedules: [],
  messageStats: {},
  globalEnabled: true,
};

let pluginConfig: PluginConfig = { ...DEFAULT_CONFIG };
let mainWindow: BrowserWindow | null = null;
const pendingReplies: Map<string, NodeJS.Timeout> = new Map();

function getConfigPath(): string {
  const dataPath = LiteLoader.plugins[SLUG]?.path?.data;
  if (dataPath) {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    return path.join(dataPath, 'config.json');
  }
  return '';
}

function loadConfig(): PluginConfig {
  const configPath = getConfigPath();
  if (configPath && fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf-8');
      const saved = JSON.parse(data) as Partial<PluginConfig>;
      pluginConfig = { ...DEFAULT_CONFIG, ...saved };
    } catch {
      pluginConfig = { ...DEFAULT_CONFIG };
    }
  } else {
    pluginConfig = { ...DEFAULT_CONFIG };
  }
  return pluginConfig;
}

function saveConfig(config: PluginConfig): boolean {
  const configPath = getConfigPath();
  if (!configPath) return false;
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    pluginConfig = config;
    return true;
  } catch {
    return false;
  }
}

function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

function matchKeyword(text: string, rule: KeywordRule): boolean {
  for (const keyword of rule.keywords) {
    if (rule.useRegex) {
      try {
        const regex = new RegExp(keyword, 'i');
        if (regex.test(text)) return true;
      } catch {
        continue;
      }
    } else {
      if (text.includes(keyword)) return true;
    }
  }
  return false;
}

function getReplyText(rule: KeywordRule): string {
  if (rule.replies.length === 0) return '';
  if (rule.randomReply) {
    const index = Math.floor(Math.random() * rule.replies.length);
    return rule.replies[index];
  }
  return rule.replies[0];
}

function checkKeywordRules(
  text: string,
  senderId: string,
  senderType: 'user' | 'group',
  groupId?: string
): { matched: boolean; rule?: KeywordRule; reply?: string; delay?: number } {
  if (!pluginConfig.globalEnabled) return { matched: false };

  for (const rule of pluginConfig.keywordRules) {
    if (!rule.enabled) continue;

    const targetId = senderType === 'group' ? (groupId || senderId) : senderId;
    if (rule.targetType !== senderType || rule.targetId !== targetId) continue;

    if (matchKeyword(text, rule)) {
      const reply = getReplyText(rule);
      const delay = getRandomDelay(rule.delayMin, rule.delayMax);
      return { matched: true, rule, reply, delay };
    }
  }
  return { matched: false };
}

function updateMessageStat(
  targetId: string,
  targetName: string,
  targetType: 'user' | 'group'
): void {
  const now = Date.now();
  if (!pluginConfig.messageStats[targetId]) {
    pluginConfig.messageStats[targetId] = {
      targetId,
      targetName,
      targetType,
      messageCount: 0,
      lastMessageTime: now,
      firstMessageTime: now,
    };
  }
  const stat = pluginConfig.messageStats[targetId];
  stat.messageCount++;
  stat.lastMessageTime = now;
  stat.targetName = targetName;
  saveConfig(pluginConfig);
}

function isInMuteSchedule(targetId: string): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  for (const schedule of pluginConfig.muteSchedules) {
    if (!schedule.enabled || schedule.targetId !== targetId) continue;
    if (!schedule.daysOfWeek.includes(currentDay)) continue;
    if (currentTime >= schedule.startTime && currentTime <= schedule.endTime) {
      return true;
    }
  }
  return false;
}

function shouldAutoRead(targetId: string): boolean {
  return pluginConfig.autoReadRules.some(
    (rule) => rule.enabled && rule.targetId === targetId
  );
}

async function callAI(messages: string[], systemPrompt?: string): Promise<string> {
  const config = pluginConfig.aiConfig;
  if (!config.enabled) {
    throw new Error('AI功能未启用，请在设置中开启');
  }
  if (!config.apiKey) {
    throw new Error('未配置API Key，请在设置中填写');
  }

  const prompt = systemPrompt || config.systemPrompt;
  const chatMessages = [
    { role: 'system' as const, content: prompt },
    { role: 'user' as const, content: `以下是最近的聊天记录：\n\n${messages.join('\n')}\n\n请给出一条合适的回复：` },
  ];

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: chatMessages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API请求失败: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '（AI未能生成回复）';
}

function showNotification(title: string, body: string): void {
  new Notification({ title, body }).show();
}

ipcMain.handle(IPC.GET_CONFIG, () => {
  return loadConfig();
});

ipcMain.handle(IPC.SET_CONFIG, (_e, config: PluginConfig) => {
  return saveConfig(config);
});

ipcMain.handle(IPC.CHECK_KEYWORD, (
  _e,
  text: string,
  senderId: string,
  senderType: 'user' | 'group',
  groupId?: string
) => {
  const result = checkKeywordRules(text, senderId, senderType, groupId);

  if (result.matched && result.rule && result.reply && result.delay !== undefined) {
    const ruleId = result.rule.id;
    const existingTimer = pendingReplies.get(ruleId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      pendingReplies.delete(ruleId);

      if (result.rule!.notifyAfterReply) {
        showNotification(
          '自动回复已发送',
          `已向 ${result.rule!.targetName} 发送回复: ${result.reply!.substring(0, NOTIFICATION_PREVIEW_LENGTH)}${result.reply!.length > NOTIFICATION_PREVIEW_LENGTH ? '...' : ''}`
        );
      }

      mainWindow?.webContents.send(`${SLUG}.autoReplyReady`, {
        targetId: result.rule!.targetId,
        targetType: result.rule!.targetType,
        reply: result.reply,
        ruleId: result.rule!.id,
      });
    }, result.delay);

    pendingReplies.set(ruleId, timer);
  }

  return {
    matched: result.matched,
    reply: result.reply,
    delay: result.delay,
    shouldAutoRead: shouldAutoRead(senderId),
    isInMuteSchedule: isInMuteSchedule(senderId),
  };
});

ipcMain.handle(IPC.AI_REQUEST, async (_e, messages: string[]) => {
  try {
    const reply = await callAI(messages);
    return { success: true, reply };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
});

ipcMain.on(IPC.NOTIFY, (_e, title: string, body: string) => {
  showNotification(title, body);
});

ipcMain.handle(IPC.GET_STATS, () => {
  return pluginConfig.messageStats;
});

ipcMain.handle(IPC.RESET_STATS, (_e, targetId?: string) => {
  if (targetId) {
    delete pluginConfig.messageStats[targetId];
  } else {
    pluginConfig.messageStats = {};
  }
  return saveConfig(pluginConfig);
});

ipcMain.on(IPC.UPDATE_STAT, (
  _e,
  targetId: string,
  targetName: string,
  targetType: 'user' | 'group'
) => {
  updateMessageStat(targetId, targetName, targetType);
});

export const onBrowserWindowCreated = (window: BrowserWindow) => {
  mainWindow = window;
  loadConfig();
};