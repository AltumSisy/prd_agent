"""
命令模块 - CLI 子命令

使用方式:
1. 创建新的命令模块文件 (如 xxx_cmd.py)
2. 定义 Command 子类
3. 命令会被自动发现和加载
"""

from .base import Command
from .registry import CommandRegistry

__all__ = ['Command', 'CommandRegistry']