"""
命令基类 - 所有命令必须继承此类
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from argparse import ArgumentParser


class Command(ABC):
    """命令基类

    所有 CLI 子命令必须继承此类并实现:
    - name: 命令名称
    - description: 命令描述
    - install_parser(): 安装子命令参数
    - execute(): 执行命令逻辑
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """命令名称"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """命令描述"""
        pass

    @abstractmethod
    def install_parser(self, parser: ArgumentParser):
        """安装子命令参数

        Args:
            parser: argparse 子命令 parser
        """
        pass

    @abstractmethod
    def execute(self, connection, args) -> int:
        """执行命令

        Args:
            connection: SAP 连接对象
            args: 解析后的命令参数

        Returns:
            int: 退出码 (0=成功)
        """
        pass