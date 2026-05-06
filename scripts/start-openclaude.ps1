<#
Start-OpenClaude.ps1

Uso:
  .\start-openclaude.ps1 -Provider openai -ApiKey "sk-..." -Model "gpt-4o"
  .\start-openclaude.ps1 -Provider deepseek -ApiKey "sk-..."
  .\start-openclaude.ps1 -Provider ollama -Model "llama3.1:8b"
  .\start-openclaude.ps1 -Provider lmstudio -Model "your-model-name"

Descr: Define variáveis de ambiente necessárias e inicia o comando `openclaude`.
#>

param(
    [Parameter(Position=0)]
    [ValidateSet("openai","deepseek","ollama","lmstudio")]
    [string]$Provider = "openai",

    [string]$ApiKey,
    [string]$BaseUrl,
    [string]$Model
)

function FailIf([string]$msg) {
    Write-Host $msg -ForegroundColor Red
    exit 1
}

Write-Host "Provider selecionado: $Provider"

switch ($Provider) {
    'openai' {
        if (-not $ApiKey) { FailIf "OpenAI requer -ApiKey. Ex: -ApiKey 'sk-...'." }
        $env:CLAUDE_CODE_USE_OPENAI = "1"
        $env:OPENAI_API_KEY = $ApiKey
        if ($Model) { $env:OPENAI_MODEL = $Model } else { $env:OPENAI_MODEL = "gpt-4o" }
        if ($BaseUrl) { $env:OPENAI_BASE_URL = $BaseUrl }
    }
    'deepseek' {
        if (-not $ApiKey) { FailIf "DeepSeek requer -ApiKey. Ex: -ApiKey 'sk-...'." }
        $env:CLAUDE_CODE_USE_OPENAI = "1"
        $env:OPENAI_API_KEY = $ApiKey
        if ($BaseUrl) { $env:OPENAI_BASE_URL = $BaseUrl } else { $env:OPENAI_BASE_URL = "https://api.deepseek.com/v1" }
        if ($Model) { $env:OPENAI_MODEL = $Model } else { $env:OPENAI_MODEL = "deepseek-chat" }
    }
    'ollama' {
        # Assumes Ollama está rodando localmente
        if (-not $Model) { $Model = "llama3.1:8b" }
        $env:CLAUDE_CODE_USE_OPENAI = "1"
        $env:OPENAI_BASE_URL = if ($BaseUrl) { $BaseUrl } else { "http://localhost:11434/v1" }
        $env:OPENAI_MODEL = $Model
        # Não é necessário API key para Ollama local por padrão
    }
    'lmstudio' {
        if (-not $Model) { FailIf "LM Studio requer -Model. Ex: -Model 'your-model-name'." }
        $env:CLAUDE_CODE_USE_OPENAI = "1"
        $env:OPENAI_BASE_URL = if ($BaseUrl) { $BaseUrl } else { "http://localhost:1234/v1" }
        $env:OPENAI_MODEL = $Model
        # Alguns usuários definem OPENAI_API_KEY="lmstudio" se encontrarem erros de autenticação
    }
}

Write-Host "Variáveis de ambiente definidas:"
Write-Host "  CLAUDE_CODE_USE_OPENAI = $($env:CLAUDE_CODE_USE_OPENAI)"
if ($env:OPENAI_API_KEY) { Write-Host "  OPENAI_API_KEY = <secret>" } else { Write-Host "  OPENAI_API_KEY = (não definido)" }
if ($env:OPENAI_BASE_URL) { Write-Host "  OPENAI_BASE_URL = $($env:OPENAI_BASE_URL)" }
if ($env:OPENAI_MODEL) { Write-Host "  OPENAI_MODEL = $($env:OPENAI_MODEL)" }

Write-Host "Iniciando openclaude..." -ForegroundColor Green
try {
    & openclaude
} catch {
    Write-Host "Falha ao executar 'openclaude'. Verifique se está instalado globalmente e no PATH." -ForegroundColor Red
    Write-Host "Exemplo: npm install -g @gitlawb/openclaude" -ForegroundColor Yellow
    exit 1
}
