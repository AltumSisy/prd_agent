---
name: program-analysis
description: 下载远程 SAP 程序并进行本地分析，支持 SQL 数据验证。用于产品问题诊断场景。
---

# 程序分析 Skill

## 用途

当用户询问产品问题时使用，例如：
- "为什么这个程序报错了？"
- "这个程序的 XX 是什么意思？"
- "帮我分析一下这个程序的逻辑"

## Workflow

1. **理解问题** → 分析用户的问题描述
2. **下载程序** → 调用 `download_program` 工具下载相关程序
3. **本地分析** → 使用 `read`、`bash` 等工具分析代码
4. **SQL验证** → 如果分析发现可能是数据问题，调用 `query_sql` 验证
5. **输出结论** → 提供诊断结果和证据链

## 工具协调

当程序分析结果显示可能是数据问题时：

1. 明确说明推测（如"分析显示可能是 XX 数据为空导致的")
2. 调用 `query_sql` 工具验证
3. 根据查询结果确认或排除推测

## 下载程序规范

参数：
- `program_name`: SAP 程序名（必需）
- `output_dir`: 保存目录（可选，默认 ./output）
- `include_includes`: 是否下载 Include 文件（可选）

## 示例

```
用户: 为什么订单创建程序 ZORDER_CREATE 报错了？

Agent:
1. 调用 download_program(program_name="ZORDER_CREATE")
2. 读取下载的程序文件
3. 分析代码逻辑
4. 发现可能是配置数据缺失
5. 调用 query_sql(table="ZCONFIG", where="KEY='ORDER_TYPE'")
6. 确认数据确实缺失
7. 输出结论：配置表中缺少 ORDER_TYPE 的配置记录
```

## 错误处理与澄清

### 工具调用失败时

当 download_program 或 download_function 返回 `{ success: false }` 时：

**第一步：分析错误原因**
- 检查 `error` 字段关键词：
  - "not found" / "不存在" / "object not found" → 可能是名称错误或类型混淆
  - "connection" / "timeout" / "RFC" → 连接问题，建议重试
  - 其他错误 → 展示错误信息

**第二步：判断是否需要提问**

✅ **需要提问**：
- 用户未明确类型（如"下载 ZORDER_CREATE"，没说程序还是函数）
- 错误包含 "not found"
- 未尝试过另一种工具

❌ **不需要提问**：
- 用户已明确类型（如"分析程序 ZORDER_CREATE"）
- 错误是连接/权限问题
- 已尝试过另一种工具

**第三步：如何提问**

使用简洁、友好的提问：

> 抱歉，下载失败了。ZORDER_CREATE 是 SAP 程序还是函数模块？
> - 如果是函数模块，请提供函数组名

**第四步：处理用户回答**

- 用户确认"程序" → 调用 `download_program`
- 用户确认"函数" → 请求函数组名，调用 `download_function`
- 用户不确定 → 建议提供更多上下文或查询 SAP 系统（SE38/SE37）