
import esbuild from 'esbuild';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = pkg.version;

const featureFlags = {
  VOICE_MODE: false,
  PROACTIVE: false,
  KAIROS: false,
  BRIDGE_MODE: false,
  DAEMON: false,
  AGENT_TRIGGERS: false,
  MONITOR_TOOL: false,
  ABLATION_BASELINE: false,
  DUMP_SYSTEM_PROMPT: false,
  CACHED_MICROCOMPACT: false,
  COORDINATOR_MODE: false,
  CONTEXT_COLLAPSE: false,
  COMMIT_ATTRIBUTION: false,
  TEAMMEM: false,
  UDS_INBOX: false,
  BG_SESSIONS: false,
  AWAY_SUMMARY: false,
  TRANSCRIPT_CLASSIFIER: false,
  WEB_BROWSER_TOOL: false,
  MESSAGE_ACTIONS: false,
  BUDDY: true,
  CHICAGO_MCP: false,
  COWORKER_TYPE_TELEMETRY: false,
};

const masterStubPlugin = {
  name: 'master-stub',
  setup(build) {
    const externalPatterns = [/^bun:bundle$/, /^@ant\//, /^@opentelemetry\//, /^audio-capture-napi$/, /^asciichart$/];

    build.onResolve({ filter: /.*/ }, args => {
      if (externalPatterns.some(p => p.test(args.path))) {
        return { path: args.path, namespace: 'stub-ns' };
      }

      if (args.path.startsWith('.') || args.path.startsWith('src/')) {
        const baseAbsPath = resolve(args.resolveDir, args.path.replace(/\.js$/, ''));
        
        // Verificação inteligente de arquivos .ts / .tsx / .js
        const candidates = [
            baseAbsPath + '.ts', 
            baseAbsPath + '.tsx', 
            baseAbsPath + '.js',
            join(baseAbsPath, 'index.ts'),
            join(baseAbsPath, 'index.tsx')
        ];

        if (!candidates.some(p => existsSync(p))) {
          // Só stubba se REALMENTE não existir nenhuma versão desse arquivo
          return { path: args.path, namespace: 'stub-ns' };
        }
      }
      return null;
    });

    build.onLoad({ filter: /.*/, namespace: 'stub-ns' }, (args) => {
      // Stub dinâmico: se o arquivo for importante, a gente pode adicionar as funções aqui
      // Mas o objetivo principal é evitar o erro de build nos arquivos opcionais da Anthropic
      return {
        contents: `
          const flags = ${JSON.stringify(featureFlags)};
          export const feature = (name) => (flags[name] ?? false);
          export const API_RESIZE_PARAMS = {};
          export const targetImageSize = {};
          export const runDaemonWorker = async () => {};
          export const daemonMain = async () => {};
          export const plot = () => "";
          export const applyProfileEnvToProcessEnv = () => {};
          export const buildStartupEnvFromProfile = () => ({});
          export const getProviderValidationError = () => null;
          export const validateProviderEnvOrExit = () => {};
          const noop = () => null;
          export default noop;
          export const registerDreamSkill = noop;
          export const registerHunterSkill = noop;
          export const registerRunSkillGeneratorSkill = noop;
          export const setOnEnqueue = noop;
          export const buildPRTrailers = noop;
        `,
        loader: 'js',
      };
    });
  },
};

const options = {
  entryPoints: ['./src/entrypoints/cli.tsx'],
  outfile: './dist/cli.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  minify: false,
  define: {
    'MACRO.VERSION': JSON.stringify('99.0.0'),
    'MACRO.DISPLAY_VERSION': JSON.stringify(version),
    'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'MACRO.ISSUES_EXPLAINER': JSON.stringify('GitHub: @gitlawb/openclaude'),
    'MACRO.PACKAGE_URL': JSON.stringify('@gitlawb/openclaude'),
    'global.Bun': 'undefined'
  },
  plugins: [masterStubPlugin],
  external: [
    'esbuild',
    'sharp',
    'google-auth-library',
    'axios',
    'form-data',
    '@anthropic-ai/sdk'
  ],
  loader: {
    '.md': 'text',
    '.txt': 'text'
  }
};

console.log('--- Iniciando Build Inteligente v3.0 (esbuild) ---');
try {
  await esbuild.build(options);
  console.log(`✓ Built openclaude v${version} → dist/cli.mjs`);
} catch (e) {
  console.error('Build falhou:', e);
  process.exit(1);
}
