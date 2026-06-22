"""
Connection - 封装 SAP ADT Connection
"""

from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv


class Connection:
    """SAP ADT Connection 封装"""

    def __init__(self, host: str, client: str, user: str, password: str, port: int = 8000, ssl: bool = False):
        # 参数验证：必需字段不能为空
        if not all([host, client, user, password]):
            raise ValueError("缺少必需的连接参数: host, client, user, password")

        self._host = host
        self._client = client
        self._user = user
        self._password = password
        self._port = port
        self._ssl = ssl

        # 导入 sapcli 的 Connection
        import sap.adt.core
        self._conn = sap.adt.core.Connection(
            host=host,
            client=client,
            user=user,
            password=password,
            port=port,
            ssl=ssl,
            verify=False
        )

    @classmethod
    def from_env(cls) -> Connection:
        """从环境变量创建连接"""
        # 加载 .env 文件
        env_path = Path(__file__).parent.parent.parent / '.env'
        load_dotenv(env_path)

        # 安全检查：必须提供必需的环境变量
        required_vars = {
            'SAP_HOST': 'SAP 服务器地址',
            'SAP_CLIENT': 'SAP 客户端编号',
            'SAP_USER': 'SAP 用户名',
            'SAP_PASSWORD': 'SAP 密码'
        }

        missing = [f"{k} ({desc})" for k, desc in required_vars.items() if not os.getenv(k)]
        if missing:
            raise ValueError(f"缺少必需的环境变量:\n  " + "\n  ".join(missing) + "\n请在 .env 文件中配置这些变量")

        return cls(
            host=os.getenv('SAP_HOST'),
            client=os.getenv('SAP_CLIENT'),
            user=os.getenv('SAP_USER'),
            password=os.getenv('SAP_PASSWORD'),
            port=int(os.getenv('SAP_PORT', '8000')),
            ssl=os.getenv('SAP_SSL', 'no').lower() == 'yes'
        )

    def get_program(self, name: str):
        """获取 Program 对象"""
        import sap.adt.programs
        return sap.adt.programs.Program(self._conn, name)

    def get_include(self, name: str):
        """获取 Include 对象"""
        import sap.adt.programs
        return sap.adt.programs.Include(self._conn, name)

    def get_function_group(self, name: str):
        """获取 Function Group 对象"""
        import sap.adt.function
        return sap.adt.function.FunctionGroup(self._conn, name)

    def get_function_module(self, group_name: str, func_name: str):
        """获取 Function Module 对象

        Args:
            group_name: 函数组名
            func_name: 函数名
        """
        import sap.adt.function
        return sap.adt.function.FunctionModule(self._conn, func_name, group_name)