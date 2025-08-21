import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPresets, setPreset } from '../lib/api';
import type { ModelItem, RoleItem, SelectionRequest } from '../types/Presets';

function RadioCard<T extends string>({
  id,
  name,
  value,
  current,
  onChange,
  title,
  description,
  disabled = false,
}: {
  id: string;
  name: string;
  value: T;
  current: T | null;
  onChange: (v: T) => void;
  title: string;
  description?: string;
  disabled?: boolean;
}) {
  const selected = current === value;
  return (
    <label
      htmlFor={id}
      className={[
        'cursor-pointer rounded-xl border p-3 transition',
        selected
          ? 'border-pink-600 bg-pink-50/40 ring-2 ring-pink-200'
          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
        disabled ? 'opacity-50 cursor-not-allowed grayscale' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="radio"
          value={value}
          checked={selected}
          onChange={() => onChange(value)}
          className="mt-1 h-4 w-4 accent-pink-600"
          disabled={disabled}
        />
        <div className="flex-1">
          <div className="font-medium text-zinc-900">{title}</div>
          {description && (
            <div className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{description}</div>
          )}
        </div>
      </div>
    </label>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const appName = import.meta.env.VITE_APP_NAME ?? 'Maja';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  // form state
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem('chat.username') || ''
  );
  const [modelId, setModelId] = useState<string>(() => localStorage.getItem('chat.model_id') || '');
  const [roleId, setRoleId] = useState<string>(() => localStorage.getItem('chat.role_id') || '');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('chat.apiKey') || '');

  const isCloud = useMemo(() => modelId && modelId !== 'local', [modelId]);

  // username is optional
  const validationMsg = useMemo(() => {
    if (!modelId) return 'Please choose a model to continue.';
    if (!roleId) return 'Please select a role for your assistant.';
    if (isCloud && apiKey.trim().length === 0) return 'API key is required for cloud models.';
    return null;
  }, [modelId, roleId, apiKey, isCloud]);

  const canStart = !validationMsg && !submitting;

  // load presets
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await getPresets();
        if (!mounted) return;

        setModels(res.data.models || []);
        setRoles(res.data.roles || []);

        if (!modelId && res.data.models?.length) setModelId(res.data.models[0].id);
        if (!roleId && res.data.roles?.length) setRoleId(res.data.roles[0].id);
      } catch (e: any) {
        const errorMessage = e?.response?.data?.detail || e?.message || 'Failed to load presets';
        setErr(
          `Connection error: ${errorMessage}. Please make sure the backend server is running.`
        );

        // Set default options if API fails
        if (!modelId) setModelId('local');
        if (!roleId) setRoleId('default');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleStart() {
    if (!canStart) return;

    setSubmitting(true);
    setErr(null);

    // only store username if provided
    if (username.trim()) localStorage.setItem('chat.username', username.trim());
    else localStorage.removeItem('chat.username');

    localStorage.setItem('chat.model_id', modelId);
    localStorage.setItem('chat.role_id', roleId);
    if (isCloud) localStorage.setItem('chat.apiKey', apiKey);
    else localStorage.removeItem('chat.apiKey');

    const userChoices: SelectionRequest = {
      username: username.trim() || undefined,
      model_id: modelId || undefined,
      role_id: roleId || undefined,
      ...(isCloud && apiKey ? { api_key: apiKey } : {}),
    };

    try {
      await setPreset(userChoices);
      localStorage.setItem('chat.started', '1');
      navigate('/chat', { replace: true });
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail || e?.message || 'Failed to start conversation. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading your options...</p>
          <p className="text-sm text-zinc-500 mt-1">This might take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100">
      <div className="mx-auto w-full max-w-6xl h-full grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 px-4 py-8">
        {/* LEFT: form card (scrolls) */}
        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {appName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
                  Welcome to {appName} 👋
                </h1>
                <p className="text-zinc-600 mt-1">
                  Let's get you set up for an amazing conversation
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div className="px-6 md:px-8 pt-4 shrink-0">
              <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm flex items-start gap-3">
                <span className="text-red-500">⚠️</span>
                <div>
                  <strong className="font-medium">Oops!</strong>
                  <p className="mt-1">{err}</p>
                  {err.includes('backend') && (
                    <p className="text-xs mt-2">
                      Make sure your backend server is running and try refreshing the page.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scrollable middle */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            {/* Name */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-zinc-900">
                  Your name (optional)
                </label>
                {!username.trim() && (
                  <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                    Will use "Friend" if blank
                  </span>
                )}
              </div>
              <input
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:ring-3 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-zinc-400"
                placeholder="What should I call you?"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </section>

            {/* Model cards */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-zinc-900">Choose a model</label>
                <span className="text-xs text-zinc-500 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {isCloud ? '🌤️ Cloud model' : '💻 Local model'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {models.map(m => (
                  <RadioCard
                    key={m.id}
                    id={`model-${m.id}`}
                    name="model"
                    value={m.id}
                    current={modelId}
                    onChange={setModelId}
                    title={m.label}
                    description={m.description}
                  />
                ))}
              </div>

              {/* API key only for cloud */}
              {isCloud && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    🔑 API Key required
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-blue-300 bg-white px-4 py-3 text-base outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    Your API key is stored locally and only used for cloud requests.
                  </p>
                </div>
              )}
            </section>

            {/* Roles */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-zinc-900">
                  Assistant personality
                </label>
                <span className="text-xs text-zinc-500">Choose how I should behave</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleId(r.id)}
                    className={[
                      'text-left rounded-xl border p-4 transition-all group text-sm',
                      'hover:scale-[1.02] transform hover:shadow-sm',
                      roleId === r.id
                        ? 'border-pink-600 bg-pink-50/40 ring-2 ring-pink-200'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                    ].join(' ')}
                    aria-pressed={roleId === r.id}
                  >
                    <div className="font-medium text-zinc-900 mb-2">{r.label}</div>
                    <div className="text-zinc-600 leading-relaxed line-clamp-3 text-xs">
                      {r.prompt}
                    </div>
                    {roleId === r.id && (
                      <div className="mt-2 text-pink-600 text-xs font-medium">✓ Selected</div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* RIGHT: sticky sidebar with Start button */}
        <aside className="md:sticky md:top-8 md:self-start h-max bg-white rounded-2xl shadow-lg border border-zinc-200 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Ready to start?</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Your name:</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {username.trim() || <span className="text-zinc-400 italic">Friend</span>}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Model:</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {models.find(m => m.id === modelId)?.label || (
                      <span className="text-zinc-400 italic">Not selected</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Personality:</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {roles.find(r => r.id === roleId)?.label || (
                      <span className="text-zinc-400 italic">Not selected</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {isCloud && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <div className="text-xs text-amber-700">
                    <strong>Cloud model selected</strong>
                    <p className="mt-1">An API key is required for this model to work.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!canStart}
              onClick={handleStart}
              className={[
                'w-full px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02]',
                'focus:outline-none focus:ring-4 focus:ring-pink-500/20',
                canStart
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-zinc-200 text-zinc-500 cursor-not-allowed',
                submitting ? 'opacity-75 cursor-wait' : '',
              ].join(' ')}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Starting...
                </div>
              ) : (
                '✨ Start Conversation'
              )}
            </button>

            {validationMsg && (
              <div className="text-sm text-zinc-500 text-center p-2 bg-zinc-50 rounded-lg">
                {validationMsg}
              </div>
            )}

            <div className="text-xs text-zinc-400 text-center">
              You can change these settings anytime during the conversation
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
