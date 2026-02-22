import type {
  PluginConfig,
  KeywordRule,
  ReplyTemplate,
  AutoReadRule,
  MuteSchedule,
  MessageStat,
} from '@/types/config.d';

const MAX_AI_CONTEXT_MESSAGES = 150;
const MAX_MESSAGE_CONTENT_LENGTH = 500;
const TEMPLATE_PREVIEW_LENGTH = 30;

let currentConfig: PluginConfig | null = null;

function generateId(): string {
  return crypto.randomUUID();
}

async function loadConfig(): Promise<PluginConfig> {
  currentConfig = await DealingWithAnnoyingChats.getConfig();
  return currentConfig;
}

async function saveCurrentConfig(): Promise<boolean> {
  if (!currentConfig) return false;
  return DealingWithAnnoyingChats.setConfig(currentConfig);
}

// ============================================================
// Settings Page
// ============================================================
export const onSettingWindowCreated = async (view: HTMLElement) => {
  const config = await loadConfig();

  const container = document.createElement('div');
  container.className = 'dwac-settings';
  container.innerHTML = `
    <style>
      .dwac-settings { padding: 16px; font-family: inherit; color: var(--text_primary, #333); }
      .dwac-settings h1 { font-size: 22px; margin-bottom: 8px; }
      .dwac-settings h2 { font-size: 17px; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border_dark, #ddd); }
      .dwac-settings h3 { font-size: 14px; margin: 12px 0 6px; }
      .dwac-section { background: var(--bg_bottom, #fff); border-radius: 8px; padding: 14px; margin-bottom: 14px; border: 1px solid var(--border_dark, #eee); }
      .dwac-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
      .dwac-row label { min-width: 90px; font-size: 13px; }
      .dwac-input { padding: 6px 10px; border: 1px solid var(--border_dark, #ccc); border-radius: 4px; font-size: 13px; background: var(--bg_white, #fff); color: inherit; flex: 1; min-width: 0; }
      .dwac-input:focus { outline: none; border-color: var(--brand_standard, #0099ff); }
      .dwac-textarea { width: 100%; min-height: 60px; resize: vertical; }
      .dwac-btn { padding: 6px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: opacity .2s; }
      .dwac-btn:hover { opacity: 0.85; }
      .dwac-btn-primary { background: var(--brand_standard, #0099ff); color: #fff; }
      .dwac-btn-danger { background: #e74c3c; color: #fff; }
      .dwac-btn-success { background: #27ae60; color: #fff; }
      .dwac-btn-secondary { background: var(--bg_bottom_light, #f0f0f0); color: var(--text_primary, #333); border: 1px solid var(--border_dark, #ccc); }
      .dwac-btn-small { padding: 3px 8px; font-size: 12px; }
      .dwac-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
      .dwac-switch input { opacity: 0; width: 0; height: 0; }
      .dwac-switch .slider { position: absolute; inset: 0; background: #ccc; border-radius: 22px; cursor: pointer; transition: .3s; }
      .dwac-switch .slider:before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .3s; }
      .dwac-switch input:checked + .slider { background: var(--brand_standard, #0099ff); }
      .dwac-switch input:checked + .slider:before { transform: translateX(18px); }
      .dwac-rule-card { background: var(--bg_white, #fafafa); border: 1px solid var(--border_dark, #ddd); border-radius: 6px; padding: 12px; margin-bottom: 10px; }
      .dwac-rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .dwac-rule-title { font-weight: bold; font-size: 14px; }
      .dwac-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin: 2px; }
      .dwac-tag-keyword { background: #e3f2fd; color: #1976d2; }
      .dwac-tag-reply { background: #e8f5e9; color: #388e3c; }
      .dwac-tag-category { background: #fff3e0; color: #f57c00; }
      .dwac-tabs { display: flex; border-bottom: 2px solid var(--border_dark, #ddd); margin-bottom: 14px; }
      .dwac-tab { padding: 8px 16px; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: .2s; }
      .dwac-tab:hover { background: var(--bg_bottom_light, #f5f5f5); }
      .dwac-tab.active { border-bottom-color: var(--brand_standard, #0099ff); color: var(--brand_standard, #0099ff); font-weight: bold; }
      .dwac-tab-content { display: none; }
      .dwac-tab-content.active { display: block; }
      .dwac-stat-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .dwac-stat-table th, .dwac-stat-table td { padding: 8px; text-align: left; border-bottom: 1px solid var(--border_dark, #eee); }
      .dwac-stat-table th { font-weight: bold; background: var(--bg_bottom_light, #f5f5f5); }
      .dwac-empty { text-align: center; color: #999; padding: 20px; font-size: 13px; }
      .dwac-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 99999; }
      .dwac-modal { background: var(--bg_bottom, #fff); border-radius: 10px; padding: 20px; min-width: 400px; max-width: 600px; max-height: 80vh; overflow-y: auto; }
      .dwac-modal h3 { margin-top: 0; }
      .dwac-global-toggle { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px; background: var(--bg_bottom, #fff); border-radius: 8px; border: 1px solid var(--border_dark, #eee); }
      .dwac-global-toggle span { font-size: 15px; font-weight: bold; }
      .dwac-desc { font-size: 12px; color: #999; margin-top: 2px; }
      .dwac-template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
      .dwac-template-card { padding: 10px; border: 1px solid var(--border_dark, #ddd); border-radius: 6px; background: var(--bg_white, #fafafa); }
      .dwac-template-name { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
      .dwac-template-content { font-size: 12px; color: #666; word-break: break-all; }
    </style>

    <h1>🛡️ 应付烦人聊天</h1>
    <p class="dwac-desc">自动回复关键词、AI辅助回复、快捷模板、消息统计等功能，帮你轻松应对无聊聊天</p>

    <div class="dwac-global-toggle">
      <span>插件总开关</span>
      <label class="dwac-switch">
        <input type="checkbox" id="dwac-global-enabled" ${config.globalEnabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
    </div>

    <div class="dwac-tabs">
      <div class="dwac-tab active" data-tab="keyword">🔑 关键词回复</div>
      <div class="dwac-tab" data-tab="ai">🤖 AI设置</div>
      <div class="dwac-tab" data-tab="templates">📝 快捷模板</div>
      <div class="dwac-tab" data-tab="autoread">👁️ 自动已读</div>
      <div class="dwac-tab" data-tab="mute">🔕 定时免打扰</div>
      <div class="dwac-tab" data-tab="stats">📊 消息统计</div>
    </div>

    <div class="dwac-tab-content active" id="dwac-tab-keyword"></div>
    <div class="dwac-tab-content" id="dwac-tab-ai"></div>
    <div class="dwac-tab-content" id="dwac-tab-templates"></div>
    <div class="dwac-tab-content" id="dwac-tab-autoread"></div>
    <div class="dwac-tab-content" id="dwac-tab-mute"></div>
    <div class="dwac-tab-content" id="dwac-tab-stats"></div>
  `;

  view.appendChild(container);

  // Tab switching
  container.querySelectorAll('.dwac-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.dwac-tab').forEach((t) => t.classList.remove('active'));
      container.querySelectorAll('.dwac-tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      const target = (tab as HTMLElement).dataset.tab;
      container.querySelector(`#dwac-tab-${target}`)?.classList.add('active');
    });
  });

  // Global toggle
  container.querySelector('#dwac-global-enabled')?.addEventListener('change', async (e) => {
    if (!currentConfig) return;
    currentConfig.globalEnabled = (e.target as HTMLInputElement).checked;
    await saveCurrentConfig();
  });

  // Render all tabs
  renderKeywordTab(container, config);
  renderAITab(container, config);
  renderTemplatesTab(container, config);
  renderAutoReadTab(container, config);
  renderMuteTab(container, config);
  renderStatsTab(container);
};

// ============================================================
// Keyword Rules Tab
// ============================================================
function renderKeywordTab(container: HTMLElement, config: PluginConfig): void {
  const tabEl = container.querySelector('#dwac-tab-keyword') as HTMLElement;

  function render(): void {
    tabEl.innerHTML = `
      <div class="dwac-section">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;border:none;">关键词自动回复规则</h2>
          <button class="dwac-btn dwac-btn-primary" id="dwac-add-rule">+ 添加规则</button>
        </div>
        <p class="dwac-desc">设置关键词匹配规则，当收到匹配的消息时自动延时回复</p>
        <div id="dwac-rules-list"></div>
      </div>
    `;

    const listEl = tabEl.querySelector('#dwac-rules-list') as HTMLElement;
    if (!currentConfig || currentConfig.keywordRules.length === 0) {
      listEl.innerHTML = '<div class="dwac-empty">暂无规则，点击"添加规则"创建第一条</div>';
    } else {
      currentConfig.keywordRules.forEach((rule) => {
        const card = document.createElement('div');
        card.className = 'dwac-rule-card';
        card.innerHTML = `
          <div class="dwac-rule-header">
            <div>
              <span class="dwac-rule-title">${escapeHtml(rule.targetName || rule.targetId)}</span>
              <span class="dwac-tag dwac-tag-category">${rule.targetType === 'group' ? '群聊' : '私聊'}</span>
              ${rule.useRegex ? '<span class="dwac-tag dwac-tag-keyword">正则</span>' : ''}
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <label class="dwac-switch">
                <input type="checkbox" class="dwac-rule-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <button class="dwac-btn dwac-btn-secondary dwac-btn-small dwac-edit-rule" data-id="${rule.id}">编辑</button>
              <button class="dwac-btn dwac-btn-danger dwac-btn-small dwac-delete-rule" data-id="${rule.id}">删除</button>
            </div>
          </div>
          <div>
            <span style="font-size:12px;color:#999;">关键词：</span>
            ${rule.keywords.map((k) => `<span class="dwac-tag dwac-tag-keyword">${escapeHtml(k)}</span>`).join('')}
          </div>
          <div style="margin-top:4px;">
            <span style="font-size:12px;color:#999;">回复：</span>
            ${rule.replies.map((r) => `<span class="dwac-tag dwac-tag-reply">${escapeHtml(r.length > TEMPLATE_PREVIEW_LENGTH ? r.substring(0, TEMPLATE_PREVIEW_LENGTH) + '...' : r)}</span>`).join('')}
          </div>
          <div style="margin-top:4px;font-size:12px;color:#999;">
            延时 ${rule.delayMin}-${rule.delayMax} 秒 | ${rule.randomReply ? '随机回复' : '顺序回复'} | ${rule.notifyAfterReply ? '回复后通知' : '静默回复'}
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    tabEl.querySelector('#dwac-add-rule')?.addEventListener('click', () => {
      showRuleModal(container, null, render);
    });

    tabEl.querySelectorAll('.dwac-rule-toggle').forEach((el) => {
      el.addEventListener('change', async (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        const rule = currentConfig?.keywordRules.find((r) => r.id === id);
        if (rule) {
          rule.enabled = (e.target as HTMLInputElement).checked;
          await saveCurrentConfig();
        }
      });
    });

    tabEl.querySelectorAll('.dwac-edit-rule').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id;
        const rule = currentConfig?.keywordRules.find((r) => r.id === id);
        if (rule) showRuleModal(container, rule, render);
      });
    });

    tabEl.querySelectorAll('.dwac-delete-rule').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = (el as HTMLElement).dataset.id;
        if (currentConfig) {
          currentConfig.keywordRules = currentConfig.keywordRules.filter((r) => r.id !== id);
          await saveCurrentConfig();
          render();
        }
      });
    });
  }

  render();
}

function showRuleModal(
  container: HTMLElement,
  existingRule: KeywordRule | null,
  onSave: () => void
): void {
  const isEdit = !!existingRule;
  const rule: KeywordRule = existingRule || {
    id: generateId(),
    enabled: true,
    targetType: 'user',
    targetId: '',
    targetName: '',
    keywords: [],
    useRegex: false,
    replies: [],
    randomReply: true,
    delayMin: 3,
    delayMax: 15,
    notifyAfterReply: true,
  };

  const overlay = document.createElement('div');
  overlay.className = 'dwac-modal-overlay';
  overlay.innerHTML = `
    <div class="dwac-modal">
      <h3>${isEdit ? '编辑' : '添加'}关键词回复规则</h3>
      <div class="dwac-row">
        <label>目标类型</label>
        <select class="dwac-input" id="dwac-modal-targetType">
          <option value="user" ${rule.targetType === 'user' ? 'selected' : ''}>私聊 (用户)</option>
          <option value="group" ${rule.targetType === 'group' ? 'selected' : ''}>群聊</option>
        </select>
      </div>
      <div class="dwac-row">
        <label>目标ID</label>
        <input class="dwac-input" id="dwac-modal-targetId" value="${escapeHtml(rule.targetId)}" placeholder="QQ号或群号">
      </div>
      <div class="dwac-row">
        <label>备注名</label>
        <input class="dwac-input" id="dwac-modal-targetName" value="${escapeHtml(rule.targetName)}" placeholder="可选，方便识别">
      </div>
      <div class="dwac-row">
        <label>关键词</label>
        <input class="dwac-input" id="dwac-modal-keywords" value="${escapeHtml(rule.keywords.join(','))}" placeholder="用英文逗号分隔多个关键词">
      </div>
      <div class="dwac-row">
        <label>使用正则</label>
        <label class="dwac-switch">
          <input type="checkbox" id="dwac-modal-useRegex" ${rule.useRegex ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <div class="dwac-row">
        <label>回复内容</label>
        <textarea class="dwac-input dwac-textarea" id="dwac-modal-replies" placeholder="每行一条回复">${escapeHtml(rule.replies.join('\n'))}</textarea>
      </div>
      <div class="dwac-row">
        <label>随机回复</label>
        <label class="dwac-switch">
          <input type="checkbox" id="dwac-modal-randomReply" ${rule.randomReply ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <span class="dwac-desc">开启后随机选择一条回复，关闭则按顺序</span>
      </div>
      <div class="dwac-row">
        <label>延时(秒)</label>
        <input class="dwac-input" id="dwac-modal-delayMin" type="number" value="${rule.delayMin}" style="max-width:80px;" min="0"> ~
        <input class="dwac-input" id="dwac-modal-delayMax" type="number" value="${rule.delayMax}" style="max-width:80px;" min="0">
      </div>
      <div class="dwac-row">
        <label>回复后通知</label>
        <label class="dwac-switch">
          <input type="checkbox" id="dwac-modal-notifyAfterReply" ${rule.notifyAfterReply ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
        <button class="dwac-btn dwac-btn-secondary" id="dwac-modal-cancel">取消</button>
        <button class="dwac-btn dwac-btn-primary" id="dwac-modal-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#dwac-modal-cancel')?.addEventListener('click', () => {
    overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector('#dwac-modal-save')?.addEventListener('click', async () => {
    rule.targetType = (overlay.querySelector('#dwac-modal-targetType') as HTMLSelectElement).value as 'user' | 'group';
    rule.targetId = (overlay.querySelector('#dwac-modal-targetId') as HTMLInputElement).value.trim();
    rule.targetName = (overlay.querySelector('#dwac-modal-targetName') as HTMLInputElement).value.trim();
    rule.keywords = (overlay.querySelector('#dwac-modal-keywords') as HTMLInputElement).value.split(',').map((s) => s.trim()).filter(Boolean);
    rule.useRegex = (overlay.querySelector('#dwac-modal-useRegex') as HTMLInputElement).checked;
    rule.replies = (overlay.querySelector('#dwac-modal-replies') as HTMLTextAreaElement).value.split('\n').map((s) => s.trim()).filter(Boolean);
    rule.randomReply = (overlay.querySelector('#dwac-modal-randomReply') as HTMLInputElement).checked;
    rule.delayMin = parseInt((overlay.querySelector('#dwac-modal-delayMin') as HTMLInputElement).value) || 0;
    rule.delayMax = parseInt((overlay.querySelector('#dwac-modal-delayMax') as HTMLInputElement).value) || 0;
    rule.notifyAfterReply = (overlay.querySelector('#dwac-modal-notifyAfterReply') as HTMLInputElement).checked;

    if (!rule.targetId) {
      alert('请填写目标ID');
      return;
    }
    if (rule.keywords.length === 0) {
      alert('请至少添加一个关键词');
      return;
    }
    if (rule.replies.length === 0) {
      alert('请至少添加一条回复');
      return;
    }

    if (currentConfig) {
      if (!isEdit) {
        currentConfig.keywordRules.push(rule);
      }
      await saveCurrentConfig();
    }
    overlay.remove();
    onSave();
  });
}

// ============================================================
// AI Settings Tab
// ============================================================
function renderAITab(container: HTMLElement, config: PluginConfig): void {
  const tabEl = container.querySelector('#dwac-tab-ai') as HTMLElement;
  const ai = config.aiConfig;

  tabEl.innerHTML = `
    <div class="dwac-section">
      <h2 style="margin-top:0;border:none;">AI辅助回复设置</h2>
      <p class="dwac-desc">配置AI接口，在聊天栏使用AI按钮可将最近聊天记录发送给AI生成回复建议</p>
      <div class="dwac-row">
        <label>启用AI</label>
        <label class="dwac-switch">
          <input type="checkbox" id="dwac-ai-enabled" ${ai.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
      <div class="dwac-row">
        <label>API地址</label>
        <input class="dwac-input" id="dwac-ai-url" value="${escapeHtml(ai.apiUrl)}" placeholder="https://api.openai.com/v1/chat/completions">
      </div>
      <div class="dwac-row">
        <label>API Key</label>
        <input class="dwac-input" id="dwac-ai-key" type="password" value="${escapeHtml(ai.apiKey)}" placeholder="sk-...">
      </div>
      <div class="dwac-row">
        <label>模型</label>
        <input class="dwac-input" id="dwac-ai-model" value="${escapeHtml(ai.model)}" placeholder="gpt-3.5-turbo">
      </div>
      <div class="dwac-row">
        <label>系统提示</label>
        <textarea class="dwac-input dwac-textarea" id="dwac-ai-prompt" rows="4">${escapeHtml(ai.systemPrompt)}</textarea>
      </div>
      <div class="dwac-row">
        <label>Max Tokens</label>
        <input class="dwac-input" id="dwac-ai-maxTokens" type="number" value="${ai.maxTokens}" min="50" max="4000" style="max-width:120px;">
      </div>
      <div class="dwac-row">
        <label>Temperature</label>
        <input class="dwac-input" id="dwac-ai-temperature" type="number" value="${ai.temperature}" min="0" max="2" step="0.1" style="max-width:120px;">
      </div>
      <div style="margin-top:12px;">
        <button class="dwac-btn dwac-btn-primary" id="dwac-ai-save">保存设置</button>
        <button class="dwac-btn dwac-btn-secondary" id="dwac-ai-test" style="margin-left:8px;">测试连接</button>
      </div>
    </div>
  `;

  tabEl.querySelector('#dwac-ai-save')?.addEventListener('click', async () => {
    if (!currentConfig) return;
    currentConfig.aiConfig.enabled = (tabEl.querySelector('#dwac-ai-enabled') as HTMLInputElement).checked;
    currentConfig.aiConfig.apiUrl = (tabEl.querySelector('#dwac-ai-url') as HTMLInputElement).value.trim();
    currentConfig.aiConfig.apiKey = (tabEl.querySelector('#dwac-ai-key') as HTMLInputElement).value.trim();
    currentConfig.aiConfig.model = (tabEl.querySelector('#dwac-ai-model') as HTMLInputElement).value.trim();
    currentConfig.aiConfig.systemPrompt = (tabEl.querySelector('#dwac-ai-prompt') as HTMLTextAreaElement).value.trim();
    currentConfig.aiConfig.maxTokens = parseInt((tabEl.querySelector('#dwac-ai-maxTokens') as HTMLInputElement).value) || 200;
    currentConfig.aiConfig.temperature = parseFloat((tabEl.querySelector('#dwac-ai-temperature') as HTMLInputElement).value) || 0.7;
    const saved = await saveCurrentConfig();
    alert(saved ? 'AI设置已保存！' : '保存失败，请重试');
  });

  tabEl.querySelector('#dwac-ai-test')?.addEventListener('click', async () => {
    const result = await DealingWithAnnoyingChats.aiRequest(['用户: 你好', '对方: 你好呀']);
    if (result.success) {
      alert(`AI连接成功！\n测试回复: ${result.reply}`);
    } else {
      alert(`AI连接失败: ${result.error}`);
    }
  });
}

// ============================================================
// Reply Templates Tab
// ============================================================
function renderTemplatesTab(container: HTMLElement, config: PluginConfig): void {
  const tabEl = container.querySelector('#dwac-tab-templates') as HTMLElement;

  function render(): void {
    const categories = [...new Set(currentConfig?.replyTemplates.map((t) => t.category) || [])];

    tabEl.innerHTML = `
      <div class="dwac-section">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;border:none;">快捷回复模板</h2>
          <button class="dwac-btn dwac-btn-primary" id="dwac-add-template">+ 添加模板</button>
        </div>
        <p class="dwac-desc">预设常用回复模板，聊天时快速选用，在聊天栏右键AI按钮可选择模板</p>
        ${categories.map((cat) => `
          <h3>${escapeHtml(cat)}</h3>
          <div class="dwac-template-grid">
            ${(currentConfig?.replyTemplates || []).filter((t) => t.category === cat).map((t) => `
              <div class="dwac-template-card">
                <div style="display:flex;justify-content:space-between;">
                  <div class="dwac-template-name">${escapeHtml(t.name)}</div>
                  <button class="dwac-btn dwac-btn-danger dwac-btn-small dwac-delete-template" data-id="${t.id}">×</button>
                </div>
                <div class="dwac-template-content">${escapeHtml(t.content)}</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
        ${categories.length === 0 ? '<div class="dwac-empty">暂无模板</div>' : ''}
      </div>
    `;

    tabEl.querySelector('#dwac-add-template')?.addEventListener('click', () => {
      showTemplateModal(container, render);
    });

    tabEl.querySelectorAll('.dwac-delete-template').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = (el as HTMLElement).dataset.id;
        if (currentConfig) {
          currentConfig.replyTemplates = currentConfig.replyTemplates.filter((t) => t.id !== id);
          await saveCurrentConfig();
          render();
        }
      });
    });
  }

  render();
}

function showTemplateModal(container: HTMLElement, onSave: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'dwac-modal-overlay';
  overlay.innerHTML = `
    <div class="dwac-modal">
      <h3>添加快捷回复模板</h3>
      <div class="dwac-row">
        <label>模板名称</label>
        <input class="dwac-input" id="dwac-tpl-name" placeholder="例如: 在忙">
      </div>
      <div class="dwac-row">
        <label>分类</label>
        <input class="dwac-input" id="dwac-tpl-category" placeholder="例如: 通用、工作、敷衍" value="通用">
      </div>
      <div class="dwac-row">
        <label>回复内容</label>
        <textarea class="dwac-input dwac-textarea" id="dwac-tpl-content" placeholder="模板回复内容"></textarea>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
        <button class="dwac-btn dwac-btn-secondary" id="dwac-tpl-cancel">取消</button>
        <button class="dwac-btn dwac-btn-primary" id="dwac-tpl-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#dwac-tpl-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#dwac-tpl-save')?.addEventListener('click', async () => {
    const name = (overlay.querySelector('#dwac-tpl-name') as HTMLInputElement).value.trim();
    const category = (overlay.querySelector('#dwac-tpl-category') as HTMLInputElement).value.trim() || '通用';
    const content = (overlay.querySelector('#dwac-tpl-content') as HTMLTextAreaElement).value.trim();

    if (!name || !content) {
      alert('请填写模板名称和内容');
      return;
    }

    if (currentConfig) {
      currentConfig.replyTemplates.push({
        id: generateId(),
        name,
        content,
        category,
      });
      await saveCurrentConfig();
    }
    overlay.remove();
    onSave();
  });
}

// ============================================================
// Auto Read Tab
// ============================================================
function renderAutoReadTab(container: HTMLElement, config: PluginConfig): void {
  const tabEl = container.querySelector('#dwac-tab-autoread') as HTMLElement;

  function render(): void {
    tabEl.innerHTML = `
      <div class="dwac-section">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;border:none;">自动已读</h2>
          <button class="dwac-btn dwac-btn-primary" id="dwac-add-autoread">+ 添加规则</button>
        </div>
        <p class="dwac-desc">对指定用户/群的消息自动标记为已读，不显示未读红点，避免被催促回复</p>
        <div id="dwac-autoread-list"></div>
      </div>
    `;

    const listEl = tabEl.querySelector('#dwac-autoread-list') as HTMLElement;
    if (!currentConfig || currentConfig.autoReadRules.length === 0) {
      listEl.innerHTML = '<div class="dwac-empty">暂无自动已读规则</div>';
    } else {
      currentConfig.autoReadRules.forEach((rule) => {
        const card = document.createElement('div');
        card.className = 'dwac-rule-card';
        card.innerHTML = `
          <div class="dwac-rule-header">
            <div>
              <span class="dwac-rule-title">${escapeHtml(rule.targetName || rule.targetId)}</span>
              <span class="dwac-tag dwac-tag-category">${rule.targetType === 'group' ? '群聊' : '私聊'}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <label class="dwac-switch">
                <input type="checkbox" class="dwac-autoread-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <button class="dwac-btn dwac-btn-danger dwac-btn-small dwac-delete-autoread" data-id="${rule.id}">删除</button>
            </div>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    tabEl.querySelector('#dwac-add-autoread')?.addEventListener('click', () => {
      showAutoReadModal(container, render);
    });

    tabEl.querySelectorAll('.dwac-autoread-toggle').forEach((el) => {
      el.addEventListener('change', async (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        const rule = currentConfig?.autoReadRules.find((r) => r.id === id);
        if (rule) {
          rule.enabled = (e.target as HTMLInputElement).checked;
          await saveCurrentConfig();
        }
      });
    });

    tabEl.querySelectorAll('.dwac-delete-autoread').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = (el as HTMLElement).dataset.id;
        if (currentConfig) {
          currentConfig.autoReadRules = currentConfig.autoReadRules.filter((r) => r.id !== id);
          await saveCurrentConfig();
          render();
        }
      });
    });
  }

  render();
}

function showAutoReadModal(container: HTMLElement, onSave: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'dwac-modal-overlay';
  overlay.innerHTML = `
    <div class="dwac-modal">
      <h3>添加自动已读规则</h3>
      <div class="dwac-row">
        <label>目标类型</label>
        <select class="dwac-input" id="dwac-ar-targetType">
          <option value="user">私聊 (用户)</option>
          <option value="group">群聊</option>
        </select>
      </div>
      <div class="dwac-row">
        <label>目标ID</label>
        <input class="dwac-input" id="dwac-ar-targetId" placeholder="QQ号或群号">
      </div>
      <div class="dwac-row">
        <label>备注名</label>
        <input class="dwac-input" id="dwac-ar-targetName" placeholder="可选">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
        <button class="dwac-btn dwac-btn-secondary" id="dwac-ar-cancel">取消</button>
        <button class="dwac-btn dwac-btn-primary" id="dwac-ar-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#dwac-ar-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#dwac-ar-save')?.addEventListener('click', async () => {
    const targetType = (overlay.querySelector('#dwac-ar-targetType') as HTMLSelectElement).value as 'user' | 'group';
    const targetId = (overlay.querySelector('#dwac-ar-targetId') as HTMLInputElement).value.trim();
    const targetName = (overlay.querySelector('#dwac-ar-targetName') as HTMLInputElement).value.trim();

    if (!targetId) {
      alert('请填写目标ID');
      return;
    }

    if (currentConfig) {
      currentConfig.autoReadRules.push({
        id: generateId(),
        enabled: true,
        targetType,
        targetId,
        targetName,
      });
      await saveCurrentConfig();
    }
    overlay.remove();
    onSave();
  });
}

// ============================================================
// Mute Schedule Tab
// ============================================================
function renderMuteTab(container: HTMLElement, config: PluginConfig): void {
  const tabEl = container.querySelector('#dwac-tab-mute') as HTMLElement;
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  function render(): void {
    tabEl.innerHTML = `
      <div class="dwac-section">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;border:none;">定时免打扰</h2>
          <button class="dwac-btn dwac-btn-primary" id="dwac-add-mute">+ 添加计划</button>
        </div>
        <p class="dwac-desc">设置在特定时间段内对指定联系人免打扰，消息将被静默处理</p>
        <div id="dwac-mute-list"></div>
      </div>
    `;

    const listEl = tabEl.querySelector('#dwac-mute-list') as HTMLElement;
    if (!currentConfig || currentConfig.muteSchedules.length === 0) {
      listEl.innerHTML = '<div class="dwac-empty">暂无免打扰计划</div>';
    } else {
      currentConfig.muteSchedules.forEach((schedule) => {
        const card = document.createElement('div');
        card.className = 'dwac-rule-card';
        card.innerHTML = `
          <div class="dwac-rule-header">
            <div>
              <span class="dwac-rule-title">${escapeHtml(schedule.targetName || schedule.targetId)}</span>
              <span class="dwac-tag dwac-tag-category">${schedule.targetType === 'group' ? '群聊' : '私聊'}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <label class="dwac-switch">
                <input type="checkbox" class="dwac-mute-toggle" data-id="${schedule.id}" ${schedule.enabled ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <button class="dwac-btn dwac-btn-danger dwac-btn-small dwac-delete-mute" data-id="${schedule.id}">删除</button>
            </div>
          </div>
          <div style="font-size:12px;color:#666;">
            🕐 ${schedule.startTime} - ${schedule.endTime} | 
            每周${schedule.daysOfWeek.map((d) => dayNames[d]).join('、')}
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    tabEl.querySelector('#dwac-add-mute')?.addEventListener('click', () => {
      showMuteModal(container, render);
    });

    tabEl.querySelectorAll('.dwac-mute-toggle').forEach((el) => {
      el.addEventListener('change', async (e) => {
        const id = (e.target as HTMLElement).dataset.id;
        const schedule = currentConfig?.muteSchedules.find((s) => s.id === id);
        if (schedule) {
          schedule.enabled = (e.target as HTMLInputElement).checked;
          await saveCurrentConfig();
        }
      });
    });

    tabEl.querySelectorAll('.dwac-delete-mute').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = (el as HTMLElement).dataset.id;
        if (currentConfig) {
          currentConfig.muteSchedules = currentConfig.muteSchedules.filter((s) => s.id !== id);
          await saveCurrentConfig();
          render();
        }
      });
    });
  }

  render();
}

function showMuteModal(container: HTMLElement, onSave: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'dwac-modal-overlay';
  overlay.innerHTML = `
    <div class="dwac-modal">
      <h3>添加定时免打扰</h3>
      <div class="dwac-row">
        <label>目标类型</label>
        <select class="dwac-input" id="dwac-mute-targetType">
          <option value="user">私聊 (用户)</option>
          <option value="group">群聊</option>
        </select>
      </div>
      <div class="dwac-row">
        <label>目标ID</label>
        <input class="dwac-input" id="dwac-mute-targetId" placeholder="QQ号或群号">
      </div>
      <div class="dwac-row">
        <label>备注名</label>
        <input class="dwac-input" id="dwac-mute-targetName" placeholder="可选">
      </div>
      <div class="dwac-row">
        <label>开始时间</label>
        <input class="dwac-input" id="dwac-mute-startTime" type="time" value="09:00" style="max-width:140px;">
      </div>
      <div class="dwac-row">
        <label>结束时间</label>
        <input class="dwac-input" id="dwac-mute-endTime" type="time" value="18:00" style="max-width:140px;">
      </div>
      <div class="dwac-row" style="flex-wrap:wrap;">
        <label>重复日</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${['日', '一', '二', '三', '四', '五', '六'].map((d, i) => `
            <label style="display:flex;align-items:center;gap:2px;font-size:13px;">
              <input type="checkbox" class="dwac-mute-day" value="${i}" ${i >= 1 && i <= 5 ? 'checked' : ''}> ${d}
            </label>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
        <button class="dwac-btn dwac-btn-secondary" id="dwac-mute-cancel">取消</button>
        <button class="dwac-btn dwac-btn-primary" id="dwac-mute-save">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#dwac-mute-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#dwac-mute-save')?.addEventListener('click', async () => {
    const targetType = (overlay.querySelector('#dwac-mute-targetType') as HTMLSelectElement).value as 'user' | 'group';
    const targetId = (overlay.querySelector('#dwac-mute-targetId') as HTMLInputElement).value.trim();
    const targetName = (overlay.querySelector('#dwac-mute-targetName') as HTMLInputElement).value.trim();
    const startTime = (overlay.querySelector('#dwac-mute-startTime') as HTMLInputElement).value;
    const endTime = (overlay.querySelector('#dwac-mute-endTime') as HTMLInputElement).value;
    const days = Array.from(overlay.querySelectorAll('.dwac-mute-day:checked')).map(
      (el) => parseInt((el as HTMLInputElement).value)
    );

    if (!targetId) {
      alert('请填写目标ID');
      return;
    }

    if (currentConfig) {
      currentConfig.muteSchedules.push({
        id: generateId(),
        enabled: true,
        targetType,
        targetId,
        targetName,
        startTime,
        endTime,
        daysOfWeek: days,
      });
      await saveCurrentConfig();
    }
    overlay.remove();
    onSave();
  });
}

// ============================================================
// Stats Tab
// ============================================================
function renderStatsTab(container: HTMLElement): void {
  const tabEl = container.querySelector('#dwac-tab-stats') as HTMLElement;

  async function render(): Promise<void> {
    const stats = await DealingWithAnnoyingChats.getStats();
    const entries = Object.values(stats).sort(
      (a: MessageStat, b: MessageStat) => b.messageCount - a.messageCount
    );

    tabEl.innerHTML = `
      <div class="dwac-section">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 style="margin:0;border:none;">消息统计</h2>
          <button class="dwac-btn dwac-btn-danger" id="dwac-clear-stats">清空统计</button>
        </div>
        <p class="dwac-desc">统计各联系人的消息频率，帮你识别最频繁发消息的人，数据仅在本地保存</p>
        ${entries.length === 0 ? '<div class="dwac-empty">暂无统计数据，开始聊天后自动记录</div>' : `
          <table class="dwac-stat-table">
            <thead>
              <tr><th>联系人</th><th>类型</th><th>消息数</th><th>最后消息</th><th>操作</th></tr>
            </thead>
            <tbody>
              ${entries.map((s: MessageStat) => `
                <tr>
                  <td>${escapeHtml(s.targetName || s.targetId)}</td>
                  <td>${s.targetType === 'group' ? '群聊' : '私聊'}</td>
                  <td><strong>${s.messageCount}</strong></td>
                  <td>${new Date(s.lastMessageTime).toLocaleString()}</td>
                  <td><button class="dwac-btn dwac-btn-danger dwac-btn-small dwac-delete-stat" data-id="${s.targetId}">删除</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    tabEl.querySelector('#dwac-clear-stats')?.addEventListener('click', async () => {
      if (confirm('确定要清空所有消息统计数据吗？')) {
        await DealingWithAnnoyingChats.resetStats();
        render();
      }
    });

    tabEl.querySelectorAll('.dwac-delete-stat').forEach((el) => {
      el.addEventListener('click', async () => {
        const id = (el as HTMLElement).dataset.id;
        if (id) {
          await DealingWithAnnoyingChats.resetStats(id);
          render();
        }
      });
    });
  }

  render();
}

// ============================================================
// Chat Bar Integration - AI Button & Template Quick Access
// ============================================================
function injectChatBarButton(): void {
  const observer = new MutationObserver(() => {
    const chatToolbar = document.querySelector('.chat-func-bar, .chat-input-area .toolbar, .operation-area, .chat-input-area');
    if (chatToolbar && !document.querySelector('#dwac-ai-btn')) {
      const btn = document.createElement('div');
      btn.id = 'dwac-ai-btn';
      btn.title = 'AI辅助回复 / 右键查看快捷模板';
      btn.style.cssText = 'cursor:pointer;padding:4px 8px;display:flex;align-items:center;gap:4px;border-radius:4px;font-size:13px;user-select:none;';
      btn.innerHTML = '🤖 <span style="font-size:12px;">AI回复</span>';

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'var(--bg_bottom_light, #f0f0f0)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
      });

      btn.addEventListener('click', () => handleAIButtonClick());

      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showTemplatePopup(e.clientX, e.clientY);
      });

      chatToolbar.appendChild(btn);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function handleAIButtonClick(): Promise<void> {
  const config = await DealingWithAnnoyingChats.getConfig();
  if (!config.aiConfig.enabled || !config.aiConfig.apiKey) {
    alert('请先在插件设置中启用AI功能并配置API Key');
    return;
  }

  const messages = collectRecentMessages(MAX_AI_CONTEXT_MESSAGES);
  if (messages.length === 0) {
    alert('未能获取到聊天记录，请确保当前有打开的聊天窗口');
    return;
  }

  showAIReplyDialog(messages);
}

function collectRecentMessages(count: number): string[] {
  const messages: string[] = [];
  const msgElements = document.querySelectorAll(
    '.message, .msg-content-container, .message-content, [class*="message"]'
  );

  const elements = Array.from(msgElements).slice(-count);
  elements.forEach((el) => {
    const nameEl = el.querySelector('.user-name, .avatar-span, .name, [class*="name"]');
    const contentEl = el.querySelector('.text-element, .msg-content, .text-normal, [class*="content"], [class*="text"]');

    const name = nameEl?.textContent?.trim() || '未知';
    const content = contentEl?.textContent?.trim() || el.textContent?.trim() || '';

    if (content && content.length > 0 && content.length < MAX_MESSAGE_CONTENT_LENGTH) {
      messages.push(`${name}: ${content}`);
    }
  });

  return messages;
}

function showAIReplyDialog(messages: string[]): void {
  const overlay = document.createElement('div');
  overlay.className = 'dwac-modal-overlay';
  overlay.style.zIndex = '999999';
  overlay.innerHTML = `
    <div class="dwac-modal" style="min-width:500px;">
      <h3>🤖 AI辅助回复</h3>
      <p style="font-size:12px;color:#999;">已收集 ${messages.length} 条聊天记录，正在请求AI生成回复...</p>
      <div id="dwac-ai-reply-area" style="min-height:80px;padding:12px;background:var(--bg_bottom_light,#f5f5f5);border-radius:6px;margin:10px 0;font-size:14px;white-space:pre-wrap;">
        ⏳ 正在思考中...
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">
        <button class="dwac-btn dwac-btn-secondary" id="dwac-ai-cancel">取消</button>
        <button class="dwac-btn dwac-btn-secondary" id="dwac-ai-retry">🔄 重新生成</button>
        <button class="dwac-btn dwac-btn-primary" id="dwac-ai-use" disabled>✅ 使用此回复</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let currentReply = '';

  const fetchReply = async () => {
    const replyArea = overlay.querySelector('#dwac-ai-reply-area') as HTMLElement;
    const useBtn = overlay.querySelector('#dwac-ai-use') as HTMLButtonElement;
    replyArea.textContent = '⏳ 正在思考中...';
    useBtn.disabled = true;

    const result = await DealingWithAnnoyingChats.aiRequest(messages);
    if (result.success && result.reply) {
      currentReply = result.reply;
      replyArea.textContent = result.reply;
      useBtn.disabled = false;
    } else {
      replyArea.textContent = `❌ 生成失败: ${result.error || '未知错误'}`;
    }
  };

  fetchReply();

  overlay.querySelector('#dwac-ai-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#dwac-ai-retry')?.addEventListener('click', () => fetchReply());

  overlay.querySelector('#dwac-ai-use')?.addEventListener('click', () => {
    if (currentReply) {
      insertTextToInput(currentReply);
      overlay.remove();
    }
  });
}

function showTemplatePopup(x: number, y: number): void {
  const existing = document.querySelector('#dwac-template-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'dwac-template-popup';
  popup.style.cssText = `
    position: fixed; left: ${x}px; top: ${y}px; z-index: 999999;
    background: var(--bg_bottom, #fff); border: 1px solid var(--border_dark, #ddd);
    border-radius: 8px; padding: 8px 0; min-width: 200px; max-height: 400px;
    overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,.15);
  `;

  DealingWithAnnoyingChats.getConfig().then((config) => {
    if (config.replyTemplates.length === 0) {
      popup.innerHTML = '<div style="padding:12px;text-align:center;color:#999;font-size:13px;">暂无模板，请在设置中添加</div>';
    } else {
      const categories = [...new Set(config.replyTemplates.map((t) => t.category))];
      categories.forEach((cat) => {
        const catEl = document.createElement('div');
        catEl.style.cssText = 'padding:4px 12px;font-size:11px;color:#999;font-weight:bold;';
        catEl.textContent = cat;
        popup.appendChild(catEl);

        config.replyTemplates
          .filter((t) => t.category === cat)
          .forEach((tpl) => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:6px 12px;cursor:pointer;font-size:13px;transition:.15s;';
            item.textContent = `${tpl.name}: ${tpl.content.substring(0, TEMPLATE_PREVIEW_LENGTH)}${tpl.content.length > TEMPLATE_PREVIEW_LENGTH ? '...' : ''}`;
            item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg_bottom_light,#f0f0f0)'; });
            item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
            item.addEventListener('click', () => {
              insertTextToInput(tpl.content);
              popup.remove();
            });
            popup.appendChild(item);
          });
      });
    }
  });

  document.body.appendChild(popup);

  const closePopup = (e: MouseEvent) => {
    if (!popup.contains(e.target as Node)) {
      popup.remove();
      document.removeEventListener('click', closePopup);
    }
  };
  setTimeout(() => document.addEventListener('click', closePopup), 100);
}

function insertTextToInput(text: string): void {
  const editors = document.querySelectorAll(
    '.ck-editor__editable, .chat-input-area .editor, [contenteditable="true"], .ql-editor'
  );

  for (const editor of Array.from(editors)) {
    if (editor instanceof HTMLElement && editor.isContentEditable) {
      editor.focus();
      const p = document.createElement('p');
      p.textContent = text;
      editor.appendChild(p);

      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
  }

  const textarea = document.querySelector(
    '.chat-input-area textarea, textarea[class*="input"]'
  ) as HTMLTextAreaElement | null;
  if (textarea) {
    textarea.value += text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    DealingWithAnnoyingChats.notify('已复制到剪贴板', '回复内容已复制，请手动粘贴发送');
  });
}

// ============================================================
// Auto Reply Listener
// ============================================================
function setupAutoReplyListener(): void {
  DealingWithAnnoyingChats.onAutoReplyReady((data) => {
    insertTextToInput(data.reply);
    DealingWithAnnoyingChats.notify(
      '自动回复已就绪',
      `回复内容已填入输入框: ${data.reply.substring(0, 50)}`
    );
  });
}

// ============================================================
// Utility
// ============================================================
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// Bootstrap
// ============================================================
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    injectChatBarButton();
    setupAutoReplyListener();
  });
}