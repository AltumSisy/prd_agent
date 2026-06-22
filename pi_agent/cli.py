"""
CLI 入口点 - SAP 工具集
开闭原则设计：新命令只需在 commands 目录添加模块文件
"""

import sys
import io
import argparse
import os
from pathlib import Path

# 设置 UTF-8 输出
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def load_env_file():
    """加载环境配置文件"""
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        with open(env_file, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key, value)  # 使用 setdefault 避免覆盖


# 加载环境变量并设置 PYTHONPATH（如果配置了）
load_env_file()
pythonpath = os.environ.get('PYTHONPATH')
if pythonpath:
    sys.path.insert(0, pythonpath)

# 导入命令注册器
from commands import CommandRegistry
from commands.core.connection import Connection


def get_env_value(key: str, default: str = None) -> str:
    """获取环境变量值"""
    return os.getenv(key, default)


def main():
    """主函数"""
    # 创建主 parser
    parser = argparse.ArgumentParser(
        description='SAP CLI 工具集',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python cli.py program ZSDR079              # 读取程序
  python cli.py program ZSDR079 --include    # 读取程序及其 Include
  python cli.py rfcquery KNA1 --fields KUNNR,NAME1  # RFC 查询表数据

添加新命令:
  在 commands 目录下创建 xxx_cmd.py 模块，定义 Command 子类
"""
    )

    # 全局参数 - 使用 get_env_value 确保从 .env 加载
    parser.add_argument('--ashost', default=get_env_value('SAP_HOST'),
                        help='SAP 服务器地址')
    parser.add_argument('--client', default=get_env_value('SAP_CLIENT'),
                        help='SAP 客户端')
    parser.add_argument('--user', default=get_env_value('SAP_USER'),
                        help='用户名')
    parser.add_argument('--password', default=get_env_value('SAP_PASSWORD'),
                        help='密码')
    parser.add_argument('--port', type=int,
                        default=int(get_env_value('SAP_PORT', '8000')),
                        help='HTTP 端口')
    parser.add_argument('--ssl', action='store_true',
                        default=get_env_value('SAP_SSL', 'no').lower() == 'yes',
                        help='使用 SSL')

    # 发现并注册命令
    registry = CommandRegistry()
    registry.discover_commands()
    registry.install_subparsers(parser)

    # 解析参数
    args = parser.parse_args()

    # 如果没有指定命令，显示帮助
    if not hasattr(args, 'command'):
        parser.print_help()
        return 0

    # 创建连接
    conn = Connection(
        host=args.ashost,
        client=args.client,
        user=args.user,
        password=args.password,
        port=args.port,
        ssl=args.ssl
    )

    # 执行命令
    return args.command.execute(conn, args)


if __name__ == '__main__':
    sys.exit(main())