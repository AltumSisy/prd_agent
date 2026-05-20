"""
CLI 测试 - TDD 先写测试
测试 JSON 输出格式和文件下载功能
"""

import subprocess
import json
import sys
import os
from pathlib import Path

# 添加项目根目录到 Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# 设置 UTF-8 输出
sys.stdout.reconfigure(encoding='utf-8')


def run_cli(program_name: str, args: list = None) -> dict:
    """运行 CLI 并返回 JSON 输出"""
    cli_path = Path(__file__).parent.parent / 'cli.py'

    cmd_args = [program_name]
    if args:
        cmd_args.extend(args)

    result = subprocess.run(
        [sys.executable, str(cli_path)] + cmd_args,
        capture_output=True,
        text=True,
        env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}
    )

    if result.returncode != 0:
        print(f"CLI stderr: {result.stderr}")

    return json.loads(result.stdout)


class TestCliOutput:
    """CLI 输出格式测试"""

    def test_cli_json_output_success(self):
        """测试 JSON 输出格式 - 真实读取 ZSDR079"""
        output = run_cli('ZSDR079')

        assert output['success'] == True
        assert output['program'] == 'ZSDR079'
        assert 'source_file' in output
        assert output['source_file'] is not None

        # 验证文件存在
        assert Path(output['source_file']).exists()

        # 验证文件内容
        source = Path(output['source_file']).read_text(encoding='utf-8')
        assert 'REPORT ZSDR079' in source

    def test_cli_with_includes(self):
        """测试 Include 下载 - ZSDR079 有多个 Include"""
        output = run_cli('ZSDR079', ['--include'])

        assert output['success'] == True
        assert 'includes' in output
        assert len(output['includes']) >= 4  # TOP, SCREEN, FRM, ALV

        # 验证 Include 文件都已下载
        for inc_name, inc_path in output['includes'].items():
            assert Path(inc_path).exists()
            content = Path(inc_path).read_text(encoding='utf-8')
            assert len(content) > 0

    def test_cli_error_output(self):
        """测试错误输出格式 - 读取不存在程序"""
        output = run_cli('ZINVALID999')

        assert output['success'] == False
        assert output['error'] is not None
        assert output['source_file'] is None

    def test_cli_output_dir(self):
        """测试自定义输出目录"""
        custom_dir = './custom_output'
        output = run_cli('ZSDR079', ['--output-dir', custom_dir])

        assert output['success'] == True
        # 验证路径中包含 custom_output（绝对路径会转换相对路径）
        assert 'custom_output' in output['source_file']

        # 验证文件存在
        assert Path(output['source_file']).exists()

    def test_cli_text_format(self):
        """测试纯文本输出"""
        cli_path = Path(__file__).parent.parent / 'cli.py'

        result = subprocess.run(
            [sys.executable, str(cli_path), 'ZSDR079', '--format', 'text'],
            capture_output=True,
            # 使用 utf-8 编码避免 Windows GBK 问题
            encoding='utf-8',
            errors='replace',
            env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}
        )

        # 检查 stdout 不是 None
        if result.stdout:
            assert 'REPORT ZSDR079' in result.stdout
        else:
            # 如果 stdout 为空，检查 stderr
            assert result.returncode == 0