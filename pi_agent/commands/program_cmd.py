"""
Program 命令 - 读取 SAP 程序并下载到本地
"""

import json
from argparse import ArgumentParser
from pathlib import Path

from commands.base import Command
from commands.core.program import ProgramReader


class ProgramCommand(Command):
    """Program 命令 - 读取 SAP 程序"""

    @property
    def name(self) -> str:
        return "program"

    @property
    def description(self) -> str:
        return "读取 SAP 程序源代码并下载到本地"

    def install_parser(self, parser: ArgumentParser):
        parser.add_argument('name', help='SAP 程序名')
        parser.add_argument('--format', choices=['json', 'text'], default='json',
                            help='输出格式 (默认: json)')
        parser.add_argument('--output-dir', default='./output',
                            help='Include 文件保存目录')
        parser.add_argument('--include', action='store_true',
                            help='下载 Include 文件')

    def execute(self, connection, args) -> int:
        """执行 Program 命令"""
        reader = ProgramReader(connection, output_dir=args.output_dir)

        # 读取程序
        if args.include:
            result = reader.download_includes(args.name)
        else:
            result = reader.read(args.name)

        # 输出结果
        if args.format == 'json':
            print(json.dumps(result, ensure_ascii=False))
        else:
            if result['success'] and result['source_file']:
                source = Path(result['source_file']).read_text(encoding='utf-8')
                print(source)
            else:
                print(f"Error: {result['error']}")
                return 1

        return 0 if result['success'] else 1