# 应付烦人聊天 - LiteLoaderQQNT 插件

一款帮助你应付烦人/无聊聊天的 [LiteLoaderQQNT](https://github.com/LiteLoaderQQNT/LiteLoaderQQNT) 插件，让你从无意义的社交中解脱出来。

## ✨ 功能特性

### 🔑 关键词自动回复
- 为指定用户/群聊设置关键词触发规则
- 支持纯文本匹配和正则表达式
- 多条回复内容支持随机或顺序选择
- 可设置随机延时回复（时间范围可自定义），模拟真人打字节奏
- 回复后可选择通知用户

### 🤖 AI 辅助回复
- 聊天栏新增 AI 按钮，一键获取 AI 建议回复
- 自动收集最近 150 条聊天记录作为上下文
- 支持自定义 AI API（兼容 OpenAI 格式）
- AI 回复需经用户确认后才会填入输入框
- 可重新生成不满意的回复
- 可自定义系统提示词、温度等参数

### 📝 快捷回复模板
- 预设常用回复模板（在忙、收到、开会中等）
- 支持分类管理（通用、工作、敷衍等）
- 右键 AI 按钮快速选择模板
- 可自由添加/删除模板

### 👁️ 自动已读
- 对指定用户/群的消息自动标记为已读
- 避免出现未读红点，不被催促回复

### 🔕 定时免打扰
- 按时间段设置免打扰（如工作时间 9:00-18:00）
- 支持按星期几重复
- 免打扰期间消息静默处理

### 📊 消息统计
- 统计各联系人的消息频率
- 帮助识别最频繁发消息的「烦人」联系人
- 支持按消息数排序
- 数据仅保存在本地

## 📦 安装

1. 下载 [最新 Release](../../releases/latest) 中的 `dealing-with-annoying-chats.zip`
2. 在 LiteLoaderQQNT 中安装插件
3. 重启 QQNT

## 🔧 使用

1. 打开 QQNT 设置 → 找到「应付烦人聊天」插件设置页
2. 配置关键词回复规则、AI 设置、快捷模板等
3. 在聊天界面使用 🤖 AI 按钮获取回复建议
4. 右键 AI 按钮可快速选择回复模板

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 构建
npm run build
```

## License
```
    dealing-with-annoying-chats
    Copyright (C) 2025

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
```