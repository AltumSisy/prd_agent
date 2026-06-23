@echo off
chcp 65001 >nul
title PRD Agent - Environment Check & Dependency Installer

echo ============================================
echo   PRD Agent Environment & Dependency Setup
echo ============================================
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 记录错误数量
set ERROR_COUNT=0
set ENV_ERROR=0

:: ============================================
:: 0. 环境检查
:: ============================================
echo [0/4] Checking environment...
echo.

:: 检查 Node.js
echo       Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo       [FAIL] Node.js not found!
    echo       [FAIL] Please install Node.js from: https://nodejs.org/
    echo       [FAIL] Required: Node.js ^>= 18.0.0
    set /a ENV_ERROR+=1
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo       [OK] Node.js version: %NODE_VERSION%

    :: 检查版本是否 >= 18
    set NODE_MAJOR=%NODE_VERSION:v=%
    for /f "tokens=1 delims=." %%a in ("%NODE_MAJOR%") do set NODE_MAJOR=%%a
    if %NODE_MAJOR% lss 18 (
        echo       [WARN] Node.js version too low, recommended ^>= 18.0.0
        echo       [WARN] Some features may not work properly
    )
)

:: 检查 npm
echo       Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo       [FAIL] npm not found!
    echo       [FAIL] npm should be installed with Node.js
    set /a ENV_ERROR+=1
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo       [OK] npm version: %NPM_VERSION%
)

:: 检查 Python
echo       Checking Python...
where python >nul 2>&1
if errorlevel 1 (
    echo       [FAIL] Python not found!
    echo       [FAIL] Please install Python from: https://www.python.org/
    echo       [FAIL] Required: Python ^>= 3.8
    set /a ENV_ERROR+=1
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('python --version 2>&1') do set PYTHON_VERSION=%%i
    echo       [OK] %PYTHON_VERSION%

    :: 检查版本是否 >= 3.8
    for /f "tokens=2 delims= " %%a in ("%PYTHON_VERSION%") do set PYTHON_VER=%%a
    for /f "tokens=1 delims=." %%a in ("%PYTHON_VER%") do set PYTHON_MAJOR=%%a
    if %PYTHON_MAJOR% lss 3 (
        echo       [FAIL] Python version too low, required ^>= 3.8
        set /a ERROR_COUNT+=1
    ) else (
        if %PYTHON_MAJOR% equ 3 (
            for /f "tokens=2 delims=." %%b in ("%PYTHON_VER%") do set PYTHON_MINOR=%%b
            if %PYTHON_MINOR% lss 8 (
                echo       [WARN] Python 3.%PYTHON_MINOR% detected, recommended ^>= 3.8
            )
        )
    )
)

:: 检查 pip
echo       Checking pip...
where pip >nul 2>&1
if errorlevel 1 (
    echo       [FAIL] pip not found!
    echo       [FAIL] pip should be installed with Python
    set /a ENV_ERROR+=1
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('pip --version 2>&1') do set PIP_VERSION=%%i
    echo       [OK] %PIP_VERSION%
)

:: 检查 git（可选）
echo       Checking git (optional)...
where git >nul 2>&1
if errorlevel 1 (
    echo       [WARN] git not found (optional)
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo       [OK] %GIT_VERSION%
)

echo.

:: 如果环境检查有严重错误，询问是否继续
if %ENV_ERROR% gtr 0 (
    echo ============================================
    echo   Environment check failed with %ENV_ERROR% critical errors!
    echo ============================================
    echo.
    echo   Cannot continue without:
    echo     - Node.js (for web/server)
    echo     - Python (for pi_agent)
    echo.
    echo   Please install missing components first.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: ============================================
:: 1. 设置 SAP RFC SDK 环境变量
:: ============================================
echo [1/4] Setting SAP RFC SDK environment...
set RFC_SDK_PATH=%~dp0nwrfcsdk\nwrfcsdk\lib
if exist "%RFC_SDK_PATH%" (
    set PATH=%RFC_SDK_PATH%;%PATH%
    echo       [OK] SAP RFC SDK path added
    echo       [OK] Path: %RFC_SDK_PATH%

    :: 检查关键 DLL 是否存在
    if exist "%RFC_SDK_PATH%\sapnwrfc.dll" (
        echo       [OK] sapnwrfc.dll found
    ) else (
        echo       [WARN] sapnwrfc.dll not found, RFC may not work
    )
) else (
    echo       [WARN] SAP RFC SDK not found at: %RFC_SDK_PATH%
    echo       [WARN] RFC features will not be available
    echo       [WARN] Download from SAP Software Download Center if needed
)
echo.

:: ============================================
:: 2. 安装根目录 npm workspaces 依赖
:: ============================================
echo [2/4] Installing npm dependencies (workspaces)...
echo       This includes: web, server, pi_agent/agent
echo.
if exist package.json (
    call npm install
    if errorlevel 1 (
        echo       [FAIL] npm install failed for root workspaces
        echo       [FAIL] Check network connection and npm registry
        set /a ERROR_COUNT+=1
    ) else (
        echo       [OK] Root workspaces dependencies installed
    )
) else (
    echo       [FAIL] package.json not found in root directory
    set /a ERROR_COUNT+=1
)
echo.

:: ============================================
:: 3. 安装 pi_agent Python 依赖
:: ============================================
echo [3/4] Installing pi_agent Python dependencies...
cd pi_agent
if exist requirements.txt (
    pip install -r requirements.txt
    if errorlevel 1 (
        echo       [FAIL] pip install failed for pi_agent
        echo       [FAIL] Check network connection and pip registry
        set /a ERROR_COUNT+=1
    ) else (
        echo       [OK] pi_agent Python dependencies installed
    )
) else (
    echo       [FAIL] requirements.txt not found in pi_agent
    set /a ERROR_COUNT+=1
)
cd ..
echo.

:: ============================================
:: 4. 验证关键依赖
:: ============================================
echo [4/4] Verifying critical dependencies...
echo.

:: 检查 vite（web）
echo       Checking vite for web...
cd web
if exist node_modules (
    if exist node_modules\vite (
        echo       [OK] vite installed in web
    ) else (
        echo       [WARN] vite not found in web/node_modules
    )
) else (
    echo       [WARN] web/node_modules not found
)
cd ..

:: 检查 hono（server）
echo       Checking hono for server...
cd server
if exist node_modules (
    if exist node_modules\hono (
        echo       [OK] hono installed in server
    ) else (
        echo       [WARN] hono not found in server/node_modules
    )
) else (
    echo       [WARN] server/node_modules not found
)
cd ..

:: 检查 requests（pi_agent）
echo       Checking requests for pi_agent...
pip show requests >nul 2>&1
if errorlevel 1 (
    echo       [WARN] requests not installed in Python
) else (
    echo       [OK] requests installed in Python
)

:: 检查 sapcli（可选）
echo       Checking sapcli (optional for RFC)...
pip show sapcli >nul 2>&1
if errorlevel 1 (
    echo       [WARN] sapcli not installed - RFC features disabled
    echo       [WARN] Install manually if you need SAP RFC integration
) else (
    echo       [OK] sapcli installed - RFC features available
)

echo.

:: ============================================
:: 结果汇总
:: ============================================
echo ============================================
if %ERROR_COUNT% equ 0 (
    echo   All checks passed, dependencies installed!
    echo ============================================
    echo.
    echo   Environment:
    echo     Node.js:  %NODE_VERSION%
    echo     npm:      %NPM_VERSION%
    echo     Python:   %PYTHON_VERSION%
    echo     pip:      installed
    echo.
    echo   Next step: Run start.bat to launch the project
) else (
    echo   Completed with %ERROR_COUNT% errors!
    echo ============================================
    echo.
    echo   Please fix the following:
    echo     1. Check Node.js/npm installation
    echo     2. Check Python/pip installation
    echo     3. Check network connection
    echo     4. Run this script again after fixing
)
echo.

echo Press any key to exit...
pause >nul