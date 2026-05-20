---
name: sql-query
description: 通过 RFC_READ_TABLE 查询 SAP 表数据，用于验证分析结论。只执行 SELECT 查询。
---

# SQL 查询 Skill

## 用途

当程序分析显示可能是数据问题时，使用此工具验证：

- 验证数据是否存在
- 检查配置表记录
- 确认数据值是否符合预期

## 规范

### 必须遵守

1. **只执行 SELECT 查询**（RFC_READ_TABLE 只支持读取）
2. **必须带 WHERE 条件**，避免全表扫描
3. **结果限制 1000 行以内**

### 参数规范

| 参数 | 规范 |
|------|------|
| `table` | SAP 表名，必须大写（如 VBAK, VBAP, MARA） |
| `fields` | 字段列表，逗号分隔，默认 `*` |
| `where` | WHERE 条件，**必须提供** |
| `limit` | 返回行数限制，默认 100，最大 1000 |

## 使用场景

### 确认数据存在

```
query_sql(table="VBAK", where="VBELN='0001234567'")
→ 确认订单是否存在
```

### 检查数据值

```
query_sql(table="ZCONFIG", where="KEY='ORDER_TYPE'", fields="KEY,VALUE")
→ 检查配置值
```

### 排除数据问题

```
query_sql(table="MARA", where="MATNR='MAT001'", fields="MATNR,MTART")
→ 如果查询有结果，排除"数据不存在"的推测
```

## 工具协调

与 `download_program` 工具协调使用：

1. `download_program` 分析发现可能是数据问题
2. 明确说明推测
3. `query_sql` 验证推测
4. 根据结果确认或排除

## 示例

```
分析: 程序 ZORDER_CREATE 在处理订单类型时失败
推测: 可能是配置表 ZCONFIG 中缺少 ORDER_TYPE 的配置

验证:
query_sql(table="ZCONFIG", where="KEY='ORDER_TYPE'")

结果:
{ success: true, rows: [], count: 0 }

结论: 确认配置缺失，需要添加配置记录
```