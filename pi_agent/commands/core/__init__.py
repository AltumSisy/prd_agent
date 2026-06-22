"""
Core 模块 - 核心工具类

包含 SAP 连接封装和程序/函数读取器等基础工具。
"""

from .connection import Connection
from .program import ProgramReader
from .function import FunctionReader

__all__ = ['Connection', 'ProgramReader', 'FunctionReader']