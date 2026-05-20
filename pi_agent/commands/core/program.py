"""
ProgramReader - 读取 SAP 程序并下载到本地
"""

import re
from pathlib import Path
from typing import Dict, List


class ProgramReader:
    """SAP Program Reader - 下载程序到本地文件"""

    def __init__(self, connection, output_dir: str = './output'):
        self._connection = connection
        self._output_dir = Path(output_dir)

    def read(self, name: str) -> Dict:
        """读取程序，保存到本地文件，返回标准格式 dict

        Args:
            name: SAP 程序名

        Returns:
            dict: 返回字段
                - success: 是否成功
                - program: 程序名
                - lines: 源代码行数
                - source_file: 主程序文件路径
                - includes: {} (不下载 Include 时为空)
                - error: 错误信息
        """
        try:
            # 获取 Program 对象
            program = self._connection.get_program(name)
            source = program.text

            # 保存到本地
            filepath = self.download_to_file(source, name)

            return {
                "success": True,
                "program": name.upper(),
                "source_file": filepath,
                "lines": len(source.split('\n')),
                "includes": {},
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "program": name.upper(),
                "source_file": None,
                "includes": {},
                "error": str(e)
            }

    def download_includes(self, name: str) -> Dict:
        """下载程序及其 Include 到本地文件

        Args:
            name: SAP 程序名

        Returns:
            dict: 返回字段
                - success: 是否成功
                - program: 程序名
                - lines: 源代码行数
                - source_file: 主程序文件路径
                - includes: {include_name: file_path}
                - error: 错误信息
        """
        try:
            # 读取主程序
            program = self._connection.get_program(name)
            main_source = program.text

            # 保存主程序
            main_filepath = self.download_to_file(main_source, name)

            # 解析 INCLUDE 语句
            include_names = self.parse_includes(main_source)

            # 递归下载 Include
            includes = {}
            for inc_name in include_names:
                try:
                    inc = self._connection.get_include(inc_name)
                    inc_source = inc.text
                    inc_filepath = self.download_to_file(inc_source, inc_name)
                    includes[inc_name] = inc_filepath

                    # 递归: Include 中可能还有 INCLUDE
                    nested = self.parse_includes(inc_source)
                    for nested_name in nested:
                        if nested_name not in includes:
                            try:
                                nested_inc = self._connection.get_include(nested_name)
                                nested_source = nested_inc.text
                                nested_filepath = self.download_to_file(nested_source, nested_name)
                                includes[nested_name] = nested_filepath
                            except Exception:
                                pass  # 忽略嵌套 Include 读取失败
                except Exception:
                    pass  # 忽略单个 Include 读取失败

            return {
                "success": True,
                "program": name.upper(),
                "source_file": main_filepath,
                "lines": len(main_source.split('\n')),
                "includes": includes,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "program": name.upper(),
                "source_file": None,
                "includes": {},
                "error": str(e)
            }

    def download_to_file(self, source: str, filename: str) -> str:
        """保存源代码到本地文件

        Args:
            source: 源代码内容
            filename: 文件名（不含扩展名）

        Returns:
            str: 文件绝对路径
        """
        filepath = self._output_dir / f"{filename}.abap"
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(source, encoding='utf-8')
        return str(filepath.absolute())

    def parse_includes(self, source: str) -> List[str]:
        """从源代码解析 INCLUDE 语句

        Args:
            source: ABAP 源代码

        Returns:
            List[str]: Include 名称列表
        """
        pattern = r'INCLUDE\s+(\w+)\s*\.'
        matches = re.findall(pattern, source, re.IGNORECASE)
        return [m.upper() for m in matches]