"""
FunctionReader - 读取 SAP 函数组/函数模块并下载到本地
"""

from pathlib import Path
from typing import Dict, List


class FunctionReader:
    """SAP Function Reader - 下载函数组和函数模块到本地文件"""

    def __init__(self, connection, output_dir: str = './output'):
        self._connection = connection
        self._output_dir = Path(output_dir)

    def read_function(self, group_name: str, func_name: str) -> Dict:
        """读取单个函数模块，保存到本地文件，返回标准格式 dict

        Args:
            group_name: 函数组名
            func_name: 函数名

        Returns:
            dict: 返回字段
                - success: 是否成功
                - function_group: 函数组名
                - function_name: 函数名
                - lines: 源代码行数
                - source_file: 函数文件路径
                - parameters: 函数参数信息
                - body: 函数体（不含参数定义）
                - error: 错误信息
        """
        try:
            # 获取 Function Module 对象
            func_module = self._connection.get_function_module(group_name, func_name)
            source = func_module.text

            # 保存到本地
            filepath = self.download_to_file(source, func_name, sub_dir=group_name)

            # 获取参数和函数体
            parameters = func_module.get_parameters()
            body = func_module.get_body()

            return {
                "success": True,
                "function_group": group_name.upper(),
                "function_name": func_name.upper(),
                "source_file": filepath,
                "lines": len(source.split('\n')),
                "parameters": parameters,
                "body_lines": len(body.split('\n')),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "function_group": group_name.upper(),
                "function_name": func_name.upper(),
                "source_file": None,
                "lines": 0,
                "parameters": {},
                "body_lines": 0,
                "error": str(e)
            }

    def read_function_group(self, group_name: str, download_all_functions: bool = False) -> Dict:
        """读取函数组，可选择下载所有函数模块

        Args:
            group_name: 函数组名
            download_all_functions: 是否下载函数组内所有函数模块

        Returns:
            dict: 返回字段
                - success: 是否成功
                - function_group: 函数组名
                - functions: 函数模块列表
                - function_modules: {func_name: file_path} 当 download_all_functions=True
                - error: 错误信息
        """
        try:
            # 获取 Function Group 对象
            func_group = self._connection.get_function_group(group_name)

            # walk 获取函数组内所有对象
            # walk() 返回 [[[], [], objects]] 结构
            # objects 中每个对象是 SimpleNamespace，有 typ, name, uri 属性
            function_names = []
            for _, _, objects in func_group.walk():
                for obj in objects:
                    # typ='FUGR/FF' 表示函数模块
                    if hasattr(obj, 'typ') and obj.typ == 'FUGR/FF':
                        function_names.append(obj.name.upper())

            result = {
                "success": True,
                "function_group": group_name.upper(),
                "functions": function_names,
                "function_modules": {},
                "error": None
            }

            # 如果需要下载所有函数
            if download_all_functions and function_names:
                for func_name in function_names:
                    func_result = self.read_function(group_name, func_name)
                    if func_result['success']:
                        result["function_modules"][func_name] = func_result['source_file']

            return result
        except Exception as e:
            return {
                "success": False,
                "function_group": group_name.upper(),
                "functions": [],
                "function_modules": {},
                "error": str(e)
            }

    def download_to_file(self, source: str, filename: str, sub_dir: str = None) -> str:
        """保存源代码到本地文件

        Args:
            source: 源代码内容
            filename: 文件名（不含扩展名）
            sub_dir: 子目录名（如函数组名）

        Returns:
            str: 文件绝对路径
        """
        if sub_dir:
            filepath = self._output_dir / sub_dir / f"{filename}.abap"
        else:
            filepath = self._output_dir / f"{filename}.abap"

        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(source, encoding='utf-8')
        return str(filepath.absolute())

    def get_function_parameters(self, group_name: str, func_name: str) -> Dict:
        """获取函数模块的参数信息（不下载源代码）

        Args:
            group_name: 函数组名
            func_name: 函数名

        Returns:
            dict: 参数信息
                - IMPORTING: []
                - EXPORTING: []
                - CHANGING: []
                - TABLES: []
                - EXCEPTIONS: []
        """
        try:
            func_module = self._connection.get_function_module(group_name, func_name)
            return func_module.get_parameters()
        except Exception as e:
            return {"error": str(e)}

    def get_function_body(self, group_name: str, func_name: str) -> str:
        """获取函数模块的函数体（不含参数定义）

        Args:
            group_name: 函数组名
            func_name: 函数名

        Returns:
            str: 函数体源代码
        """
        try:
            func_module = self._connection.get_function_module(group_name, func_name)
            return func_module.get_body()
        except Exception as e:
            return f"ERROR: {str(e)}"