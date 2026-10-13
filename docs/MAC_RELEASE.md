# Mac 签名与公证发布

旧 v0.1.4 ZIP 未签名、公证。添加脚本不会使旧下载自动变成签名版本。需要重新构建并上传通过验证的新安装包。

## 前提

- 有效 Apple Developer Program 会员。
- Mac 钥匙串中有 Developer ID Application 证书及其私钥，不能用 Apple Development、Mac App Store 或临时签名替代。
- Mac 安装 Xcode 命令行工具，xcrun 能找到 notarytool、stapler。
- 已用 notarytool store-credentials 创建公证 Keychain profile。
- Node.js 22+，在项目目录先运行 npm ci。

证书私钥、密码、API 密钥不要提交仓库或发到聊天。账号注册、付款和证书授权由账号持有人完成。

## 构建

设置 WORDNOOK_SIGN_IDENTITY 为钥匙串中完整的 Developer ID Application 身份名称；WORDNOOK_NOTARY_PROFILE 为已保存的公证配置名称。这两个变量是名称，不是密码。

```sh
node scripts/release-mac-signed.mjs
```

脚本先测试、构建，再强制使用 Developer ID 签名，逐个架构提交 Apple 公证。只有 Accepted 后才附加公证票据、验证签名及 Gatekeeper，最后重新压缩带票据的应用。

两个架构全部通过才生成 VERIFIED.txt。输出在 release-signed 下本次独立目录。任何失败均停止；不要发布失败运行目录里的部分产物。脚本不会自动上传或替换 GitHub Release。

## 发布前

在 Mac 从下载来源安装最终 ZIP，验证首次启动、小窗缩放、系统外观、语音、登录启动和学习数据保留；Apple Silicon 与 Intel 应分别确认。公证不等于功能测试。随后上传新 Release，说明签名、公证状态及实机验证范围。

## 当前验证状态

脚本已通过 JavaScript 语法检查；由于尚未提供签名身份和公证授权，未完成 Mac 构建及 Apple 公证端到端验证，不宣称旧包已修复。

参考：https://developer.apple.com/developer-id/ 与 https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
