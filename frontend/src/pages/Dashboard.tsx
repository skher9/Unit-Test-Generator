import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createGeneration,
  listGenerations,
  type Generation,
} from '../api/generations';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
] as const;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>(LANGUAGES[0].value);
  const [generatedTests, setGeneratedTests] = useState<string | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const list = await listGenerations();
      setHistory(list);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please paste some source code.');
      return;
    }
    setError(null);
    setGeneratedTests(null);
    setSelectedId(null);
    setLoading(true);
    try {
      const gen = await createGeneration(code.trim(), language);
      setGeneratedTests(gen.generatedTests ?? null);
      setSelectedId(gen.id);
      await loadHistory();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } })
              .response?.data?.message
          : null;
      setError(
        Array.isArray(message) ? message.join(', ') : message || 'Generation failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function selectHistoryItem(gen: Generation) {
    setSelectedId(gen.id);
    setGeneratedTests(gen.generatedTests ?? null);
    setCode(gen.inputCode);
    setLanguage(gen.language);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Unit Test Generator</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-indigo-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your source code here..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {LANGUAGES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Generating...' : 'Generate Tests'}
                </button>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
          </form>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated tests
            </label>
            <div className="min-h-[200px] rounded-lg border border-gray-300 bg-white p-4">
              {loading && (
                <p className="text-gray-500 text-sm">Generating tests...</p>
              )}
              {!loading && generatedTests === null && !selectedId && (
                <p className="text-gray-500 text-sm">
                  Paste code, choose a language, and click Generate Tests to see output here.
                </p>
              )}
              {!loading && generatedTests !== null && (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto">
                  {generatedTests}
                </pre>
              )}
              {!loading && selectedId && generatedTests === null && (
                <p className="text-gray-500 text-sm">
                  This generation has no test output (e.g. failed or pending).
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">History</h2>
          <div className="rounded-lg border border-gray-300 bg-white p-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {historyLoading && (
              <p className="text-gray-500 text-sm">Loading...</p>
            )}
            {!historyLoading && history.length === 0 && (
              <p className="text-gray-500 text-sm">No generations yet.</p>
            )}
            {!historyLoading && history.length > 0 && (
              <ul className="space-y-2">
                {history.map((gen) => (
                  <li key={gen.id}>
                    <button
                      type="button"
                      onClick={() => selectHistoryItem(gen)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        selectedId === gen.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="font-mono truncate block">
                        {gen.inputCode.slice(0, 50)}
                        {gen.inputCode.length > 50 ? '…' : ''}
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {gen.language} · {gen.status} ·{' '}
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
