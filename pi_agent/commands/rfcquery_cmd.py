"""
RFC Query 命令 - 通过 RFC_READ_TABLE 函数读取 SAP 表数据
"""

import json
from argparse import ArgumentParser

from commands.base import Command


class RfcQueryCommand(Command):
    """RFC Query 命令 - 通过 RFC 读取 SAP 表数据"""

    @property
    def name(self) -> str:
        return "rfcquery"

    @property
    def description(self) -> str:
        return "通过 RFC_READ_TABLE 函数读取 SAP 表数据"

    def install_parser(self, parser: ArgumentParser):
        parser.add_argument('table', help='SAP 表名')
        parser.add_argument('--fields', default='*',
                            help='字段列表 (用逗号分隔)')
        parser.add_argument('--where', default=None,
                            help='WHERE 条件 (SQL WHERE 子句)')
        parser.add_argument('--limit', type=int, default=100,
                            help='返回行数限制')
        parser.add_argument('--format', choices=['json', 'csv'], default='json',
                            help='输出格式')

    def execute(self, connection, args) -> int:
        """执行 RFC Query 命令"""
        try:
            # 检查 RFC 是否可用
            import sap.rfc
            if not sap.rfc.rfc_is_available():
                result = {
                    "success": False,
                    "error": "RFC SDK 未安装，请安装 SAP RFC SDK"
                }
                print(json.dumps(result, ensure_ascii=False))
                return 1

            # 建立 RFC 连接
            rfc_conn = sap.rfc.connect(
                ashost=connection._host,
                sysnr='00',
                client=connection._client,
                user=connection._user,
                passwd=connection._password
            )

            # 准备 RFC_READ_TABLE 参数
            fields_list = []
            if args.fields != '*':
                for field in args.fields.split(','):
                    fields_list.append({'FIELDNAME': field.strip().upper()})

            # 调用 RFC_READ_TABLE
            params = {
                'QUERY_TABLE': args.table.upper(),
                'DELIMITER': '|',
                'NO_DATA': '',
                'ROWSKIPS': 0,
                'ROWCOUNT': args.limit
            }

            if fields_list:
                params['FIELDS'] = fields_list

            if args.where:
                params['OPTIONS'] = [{'TEXT': args.where}]

            # 执行 RFC 调用
            response = rfc_conn.call('RFC_READ_TABLE', **params)

            # 解析结果
            rows = []
            if 'DATA' in response:
                for row in response['DATA']:
                    line = row.get('WA', '')
                    # 按 | 分隔符拆分
                    values = line.split('|')
                    rows.append(values)

            # 获取字段名
            columns = []
            if 'FIELDS' in response:
                for field in response['FIELDS']:
                    columns.append(field.get('FIELDNAME', ''))

            # 构造输出
            if args.format == 'json':
                # 组合成字典格式
                data_rows = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        if i < len(row):
                            row_dict[col] = row[i].strip()
                    data_rows.append(row_dict)

                result = {
                    "success": True,
                    "table": args.table,
                    "columns": columns,
                    "rows": data_rows,
                    "count": len(data_rows)
                }
                print(json.dumps(result, ensure_ascii=False, indent=2))
            else:
                # CSV 格式
                if columns:
                    print(','.join(columns))
                for row in rows:
                    print(','.join(v.strip() for v in row))

            # 关闭 RFC 连接
            rfc_conn.close()

            return 0

        except ImportError as e:
            result = {
                "success": False,
                "error": f"无法导入 RFC 模块: {e}",
                "hint": "请确保安装了 SAP RFC SDK (pyrfc)"
            }
            print(json.dumps(result, ensure_ascii=False))
            return 1

        except Exception as e:
            result = {
                "success": False,
                "error": str(e)
            }
            print(json.dumps(result, ensure_ascii=False))
            return 1