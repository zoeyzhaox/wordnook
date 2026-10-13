# UI 重做约束 · v0.1.1

本文件是本项目使用的设计提示词，不是需要安装的新技能。

设计一个用户每天反复操作的 Mac 词汇工具。让用户进来立即看到当前学习队列、单词内容和下一步操作。把空间用于词汇与操作，不用于介绍产品理念。

具体要求：

1. 使用 Mac 工具式信息结构：常驻侧栏、紧凑标题栏、列表与详情两栏。队列点击必须更新右侧内容。列表、题目、偏好设置各使用符合任务的布局。
2. 使用系统无衬线字体。界面标题 16–20px，操作与正文 12–15px。只有学习对象本身，即英文单词，允许明显放大。
3. 删除宣传区、励志文案、装饰英文小标题、植物和山景、倾斜纸片、大面积主题色底。不用插画填补信息结构不足。
4. 主背景 #FFFFFF，侧栏 #F5F5F6，正文 #202124，辅助文字 #686B70，分隔线 #E2E3E5。重点操作 #006ADC，选中底 #EAF3FF。按钮白字需检查对比度。
5. 蓝色服务于操作和选中状态；绿色只传达成功，红色传达错误，橙色局部区分拼写练习。每处颜色须有可解释的用途，不把强调色扩张成整页背景。
6. 用分隔线、对齐和间距组织信息。弹窗和真实可操作选项可以有容器；不要给每一段文字套卡片。
7. 游戏保留输入、选择、生命和奖励反馈，文案直接说明操作。颜色之外还要有文字说明，避免只靠红绿判断对错。
8. 保留现有学习进度及所有功能。验证学习、队列选择、收藏、游戏、奖励、导入和备份。
9. 评估实际截图，不以 CSS 中出现设计术语作为完成依据。检查 1180px 主窗口、900px 最小窗口和 330px 悬浮窗。

研究参考：
- Refero anti-AI-slop： https://github.com/referodesign/refero_skill/blob/master/skills/refero-design/references/anti-ai-slop.md
- Anthropic frontend-design： https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Apple Color： https://developer.apple.com/design/human-interface-guidelines/color
- Radix 色阶用途： https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

这些资料提供判断方法，而非普遍审美真理。尤其“不用系统字体”“永远不用某种颜色”不适合照搬到原生桌面工具。本项目以用户反馈和实际操作需求为准。
