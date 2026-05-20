# SAP CLI 工具集

基于 Python 的 SAP 系统命令行工具，支持程序读取和表数据查询。

## 功能特性

| 命令 | 功能 | 状态 |
|------|------|------|
| `program` | 读取 SAP 程序源代码并下载到本地 | ✅ 可用 |
| `rfcquery` | 通过 RFC_READ_TABLE 查询表数据 | ✅ 可用 |

## 快速开始

### 1. 环境要求

- Python 3.12+
- SAP RFC SDK (pyrfc) - 用于 RFC 查询
- SAP 系统访问权限

### 2. 安装依赖

```bash
pip install requests urllib3 pytest python-dotenv
```

### 3. 配置连接

编辑 `.env` 文件：

```ini
SAP_HOST=172.18.29.27
SAP_CLIENT=112
SAP_USER=YOUR_USER
SAP_PASSWORD=YOUR_PASSWORD
SAP_PORT=8000
SAP_SSL=no
```

### 4. 使用命令

```bash
# 查看帮助
python cli.py --help

# 读取程序
python cli.py program ZSDR079
python cli.py program ZSDR079 --include    # 包含 Include 文件
python cli.py program ZSDR079 --format text  # 纯文本输出

# RFC 查询表数据
python cli.py rfcquery KNA1 --fields KUNNR,NAME1 --limit 10
python cli.py rfcquery KNA1 --where "KUNNR = '0000900000'"
python cli.py rfcquery KNA1 --format csv
```

## 项目结构

```
pi_agent/
├── cli.py                      # CLI 入口点
├── .env                        # SAP 连接配置
├── commands/                   # 命令模块 (开闭原则)
│   ├── __init__.py
│   ├── base.py                 # Command 基类
│   ├── registry.py             # 命令注册器
│   ├── program_cmd.py          # program 命令
│   ├── rfcquery_cmd.py         # rfcquery 命令
│   └── core/                   # 核心工具层
│       ├── __init__.py
│       ├── connection.py       # SAP 连接封装
│       └── program.py          # Program 读取器
├── tests/                      # 测试文件
│   └── test_cli.py
├── output/                     # 下载文件目录
├── requirements.txt
└── pytest.ini
```

**目录说明：**

| 目录/文件 | 说明 |
|-----------|------|
| `commands/` | CLI 命令层，存放各命令实现 |
| `commands/core/` | 核心工具层，存放工具类（连接、读取器等） |
| `cli.py` | 入口点，解析参数并调用命令 |
| `output/` | 下载的 ABAP 程序存放目录 |

## 命令详解

### program - 程序读取

读取 SAP ABAP 程序源代码，下载到本地文件。

```bash
python cli.py program <程序名> [选项]

选项:
  --include      下载 Include 文件
  --format       输出格式: json(默认) | text
  --output-dir   文件保存目录 (默认: ./output)
```

**输出格式 (JSON)**：

```json
{
  "success": true,
  "program": "ZSDR079",
  "source_file": "E:/path/output/ZSDR079.abap",
  "lines": 46,
  "includes": {
    "ZSDR079_TOP": "E:/path/output/ZSDR079_TOP.abap"
  }
}
```

### rfcquery - 表数据查询

通过 RFC_READ_TABLE 函数查询 SAP 表数据。

```bash
python cli.py rfcquery <表名> [选项]

选项:
  --fields       字段列表 (逗号分隔，默认: *)
  --where        WHERE 条件
  --limit        返回行数 (默认: 100)
  --format       输出格式: json(默认) | csv
```

**使用示例**：

```bash
# 查询客户表
python cli.py rfcquery KNA1 --fields KUNNR,NAME1,ORT01 --limit 20

# 条件查询
python cli.py rfcquery KNA1 --where "NAME1 LIKE '%金发%'"

# CSV 输出
python cli.py rfcquery T000 --fields MANDT,MTEXT --format csv
```

## 添加新命令

遵循开闭原则，只需在 `commands/` 目录创建新模块：

**步骤**：

1. 创建 `commands/xxx_cmd.py`
2. 定义 `Command` 子类
3. 实现 `name`, `description`, `install_parser()`, `execute()`

**示例**：

```python
# commands/newcmd_cmd.py
from argparse import ArgumentParser
from commands.base import Command


class NewCommand(Command):
    @property
    def name(self) -> str:
        return "newcmd"
    
    @property
    def description(self) -> str:
        return "新命令描述"
    
    def install_parser(self, parser: ArgumentParser):
        parser.add_argument('param', help='参数说明')
    
    def execute(self, connection, args) -> int:
        # 实现逻辑
        return 0
```

命令会自动被发现和加载，无需修改 `cli.py`。

## 添加新工具类

核心工具类放在 `commands/core/` 目录：

```python
# commands/core/my_tool.py
class MyTool:
    """工具类描述"""
    
    def __init__(self, connection):
        self._connection = connection
    
    def do_something(self, name: str) -> dict:
        # 实现逻辑
        return {"success": True}
```

在 `commands/core/__init__.py` 中导出：

```python
from .connection import Connection
from .program import ProgramReader
from .my_tool import MyTool

__all__ = ['Connection', 'ProgramReader', 'MyTool']
```

## 运行测试

```bash
cd E:/code/prd_agent/pi_agent
pytest tests/ -v
```

## TypeScript Agent 集成

CLI 输出 JSON 格式，便于 TypeScript 调用：

```typescript
import { exec } from 'child_process';
import * as fs from 'fs';

interface SapResult {
  success: boolean;
  program: string;
  source_file: string | null;
  includes?: Record<string, string>;
  error: string | null;
}

async function readSapProgram(name: string): Promise<SapResult> {
  return new Promise((resolve, reject) => {
    exec(`python cli.py program ${name} --include`, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      maxBuffer: 10 * 1024 * 1024
    }, (error, stdout) => {
      if (error) reject(error);
      else resolve(JSON.parse(stdout));
    });
  });
}

// 使用
const result = await readSapProgram('ZSDR079');
if (result.success) {
  const source = fs.readFileSync(result.source_file!, 'utf-8');
  console.log(source);
}
```

## 常见问题

### Q: RFC 连接失败？

A: 检查 `.env` 配置和网络连通性：
```bash
ping 172.18.29.27
```

### Q: 中文乱码？

A: CLI 已设置 UTF-8 编码，Windows 终端需执行：
```cmd
chcp 65001
```

## 相关资源

- [sapcli 项目](https://github.com/jfilak/sapcli)
- [SAP ADT 文档](https://help.sap.com/docs/ABAP_PLATFORM_NEW)
- [Python RFC SDK](https://pypi.org/project/pyrfc/)