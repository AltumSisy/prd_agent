"""
Function 命令 - 读取 SAP 函数模块并下载到本地
"""

import json
from argparse import ArgumentParser
from pathlib import Path

from commands.base import Command
from commands.core.function import FunctionReader


class FunctionCommand(Command):
    """Function 命令 - 读取 SAP 函数模块"""

    @property
    def name(self) -> str:
        return "function"

    @property
    def description(self) -> str:
        return "读取 SAP 函数模块源代码并下载到本地"

    def install_parser(self, parser: ArgumentParser):
        parser.add_argument('group', help='函数组名')
        parser.add_argument('name', nargs='?', default=None,
                            help='函数名（可选，不指定时列出函数组所有函数）')
        parser.add_argument('--format', choices=['json', 'text'], default='json',
                            help='输出格式 (默认: json)')
        parser.add_argument('--output-dir', default='./output',
                            help='源代码保存目录')
        parser.add_argument('--download-all', action='store_true',
                            help='下载函数组内所有函数模块')

    def execute(self, connection, args) -> int:
        """执行 Function 命令"""
        reader = FunctionReader(connection, output_dir=args.output_dir)

        # 根据参数选择操作
        if args.name:
            # 读取单个函数模块
            result = reader.read_function(args.group, args.name)
        else:
            # 读取函数组（可选择下载所有函数）
            result = reader.read_function_group(
                args.group,
                download_all_functions=args.download_all
            )

        # 输出结果
        if args.format == 'json':
            print(json.dumps(result, ensure_ascii=False))
        else:
            if result['success']:
                if args.name:
                    # 单个函数 - 显示源代码
                    if result['source_file']:
                        source = Path(result['source_file']).read_text(encoding='utf-8')
                        print(source)
                    else:
                        print(f"函数 {args.name} 源代码未下载")
                else:
                    # 函数组 - 显示函数列表
                    print(f"函数组: {result['function_group']}")
                    print(f"包含 {len(result['functions'])} 个函数:")
                    for func_name in result['functions']:
                        print(f"  - {func_name}")
            else:
                print(f"Error: {result['error']}")
                return 1

        return 0 if result['success'] else 1