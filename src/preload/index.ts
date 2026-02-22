import { contextBridge, ipcRenderer } from 'electron';
import type { PluginConfig, MessageStat } from '@/types/config.d';

const SLUG = 'dealing-with-annoying-chats';

const IPCExports = {
  getConfig: (): Promise<PluginConfig> => {
    return ipcRenderer.invoke(`${SLUG}.getConfig`);
  },
  setConfig: (config: PluginConfig): Promise<boolean> => {
    return ipcRenderer.invoke(`${SLUG}.setConfig`, config);
  },
  checkKeyword: (
    text: string,
    senderId: string,
    senderType: 'user' | 'group',
    groupId?: string
  ): Promise<{
    matched: boolean;
    reply?: string;
    delay?: number;
    shouldAutoRead: boolean;
    isInMuteSchedule: boolean;
  }> => {
    return ipcRenderer.invoke(`${SLUG}.checkKeyword`, text, senderId, senderType, groupId);
  },
  aiRequest: (messages: string[]): Promise<{ success: boolean; reply?: string; error?: string }> => {
    return ipcRenderer.invoke(`${SLUG}.aiRequest`, messages);
  },
  notify: (title: string, body: string): void => {
    ipcRenderer.send(`${SLUG}.notify`, title, body);
  },
  getStats: (): Promise<Record<string, MessageStat>> => {
    return ipcRenderer.invoke(`${SLUG}.getStats`);
  },
  resetStats: (targetId?: string): Promise<boolean> => {
    return ipcRenderer.invoke(`${SLUG}.resetStats`, targetId);
  },
  updateStat: (targetId: string, targetName: string, targetType: 'user' | 'group'): void => {
    ipcRenderer.send(`${SLUG}.updateStat`, targetId, targetName, targetType);
  },
  onAutoReplyReady: (callback: (data: {
    targetId: string;
    targetType: 'user' | 'group';
    reply: string;
    ruleId: string;
  }) => void): void => {
    ipcRenderer.on(`${SLUG}.autoReplyReady`, (_e, data) => callback(data));
  },
};

contextBridge.exposeInMainWorld('DealingWithAnnoyingChats', IPCExports);

export type { IPCExports };
