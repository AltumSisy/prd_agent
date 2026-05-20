"""
命令注册器 - 自动发现和加载命令模块
"""

import importlib
import pkgutil
from pathlib import Path
from typing import List, Type
from argparse import ArgumentParser

from .base import Command


class CommandRegistry:
    """命令注册器 - 自动发现和加载命令"""

    def __init__(self, commands_dir: str = None):
        """
        Args:
            commands_dir: 命令模块目录路径
        """
        self._commands: List[Command] = []
        self._commands_dir = commands_dir or Path(__file__).parent

    def discover_commands(self) -> List[Command]:
        """自动发现命令模块

        遍历 commands 目录，加载所有非 __init__.py 的模块，
        查找其中定义的 Command 类并实例化。

        Returns:
            List[Command]: 已发现的命令实例列表
        """
        commands = []

        # 获取 commands 包的路径
        commands_path = Path(self._commands_dir)

        for module_info in pkgutil.iter_modules([str(commands_path)]):
            # 跳过 __init__ 和 base 模块
            if module_info.name in ('__init__', 'base'):
                continue

            # 导入模块
            module_name = f"commands.{module_info.name}"
            try:
                module = importlib.import_module(module_name)

                # 查找模块中的 Command 类
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    # 检查是否是 Command 的子类（但不是 Command 本身）
                    if isinstance(attr, type) and issubclass(attr, Command) and attr is not Command:
                        # 实例化命令
                        command = attr()
                        commands.append(command)
            except ImportError as e:
                print(f"Warning: Failed to import command module {module_name}: {e}")

        self._commands = commands
        return commands

    def install_subparsers(self, parser: ArgumentParser):
        """将所有命令安装到 argparse subparsers

        Args:
            parser: argparse 主 parser
        """
        subparsers = parser.add_subparsers(help='可用命令')

        for command in self._commands:
            # 创建子命令 parser
            cmd_parser = subparsers.add_parser(command.name, help=command.description)
            cmd_parser.set_defaults(command=command)

            # 让命令安装自己的参数
            command.install_parser(cmd_parser)

    def get_command(self, name: str) -> Command | None:
        """根据名称获取命令

        Args:
            name: 命令名称

        Returns:
            Command | None: 命令实例或 None
        """
        for command in self._commands:
            if command.name == name:
                return command
        return None

    @property
    def commands(self) -> List[Command]:
        """获取所有已发现的命令"""
        return self._commands