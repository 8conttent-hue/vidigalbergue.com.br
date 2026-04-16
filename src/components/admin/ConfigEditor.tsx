import React, { useState, useEffect } from 'react';
import { Save, Loader2, Settings } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

// Schema scaffold siteConfig.json (plano):
// { name, slug, description, url, email, palette, font, fontFamily,
//   social: { instagram, facebook, twitter, youtube } }

export default function ConfigEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [config, setConfig] = useState<any>(null);
    const [fileSha, setFileSha] = useState('');

    useEffect(() => {
        githubApi('read', 'src/data/siteConfig.json')
            .then(data => { setConfig(JSON.parse(data.content)); setFileSha(data.sha); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Salvando configurações...', 'progress', 30);
        try {
            const res = await githubApi('write', 'src/data/siteConfig.json', {
                content: JSON.stringify(config, null, 2),
                sha: fileSha,
                message: 'CMS: Update siteConfig.json',
            });
            setFileSha(res.sha);
            triggerToast('Configurações salvas com sucesso!', 'success', 100);
        } catch (err: any) {
            setError(err.message); triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    const set = (path: string[], value: string) => {
        setConfig((prev: any) => {
            const next = { ...prev };
            let cur: any = next;
            for (let i = 0; i < path.length - 1; i++) {
                cur[path[i]] = { ...(cur[path[i]] || {}) };
                cur = cur[path[i]];
            }
            cur[path[path.length - 1]] = value;
            return next;
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Settings className="w-10 h-10 animate-spin mb-6 text-slate-300" style={{ animationDuration: '3s' }} />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando siteConfig.json...</p>
        </div>
    );

    const cardClass = "p-8 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm";
    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";

    return (
        <div className="max-w-4xl pb-32">
            <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Configurações do Site</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Edita o arquivo <code className="bg-slate-100 px-1 rounded">src/data/siteConfig.json</code></p>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium mb-4">{error}</div>}

            <form onSubmit={handleSave} className="space-y-6">
                {/* Informações básicas */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Informações Básicas</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>Nome do Site</label><input type="text" value={config?.name || ''} onChange={e => set(['name'], e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>Slug (identificador)</label><input type="text" value={config?.slug || ''} onChange={e => set(['slug'], e.target.value)} className={`${inputClass} font-mono text-xs`} /></div>
                        </div>
                        <div><label className={labelClass}>Descrição do Site</label><textarea rows={2} value={config?.description || ''} onChange={e => set(['description'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>URL do Site</label><input type="url" value={config?.url || ''} onChange={e => set(['url'], e.target.value)} className={inputClass} placeholder="https://seusite.com.br" /></div>
                            <div><label className={labelClass}>E-mail de Contato</label><input type="email" value={config?.email || ''} onChange={e => set(['email'], e.target.value)} className={inputClass} placeholder="contato@seusite.com.br" /></div>
                        </div>
                    </div>
                </div>

                {/* Visual */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Visual (Cores e Fonte)</h3>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-4">
                        <p className="text-xs text-violet-700 font-medium">Para mudar as cores do site, edite as variáveis CSS em <code className="bg-violet-100 px-1 rounded">src/styles/global.css</code> (--color-primary, --color-accent, --color-dark).</p>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className={labelClass}>ID da Paleta</label><input type="text" value={config?.palette || ''} onChange={e => set(['palette'], e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>ID da Fonte</label><input type="text" value={config?.font || ''} onChange={e => set(['font'], e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>Família de Fonte</label><input type="text" value={config?.fontFamily || ''} onChange={e => set(['fontFamily'], e.target.value)} className={inputClass} placeholder="Inter" /></div>
                        </div>
                    </div>
                </div>

                {/* Redes Sociais */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Redes Sociais</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/seusite' },
                            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/seusite' },
                            { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/seusite' },
                            { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@seusite' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label className={labelClass}>{label}</label>
                                <input type="url" value={config?.social?.[key] || ''} onChange={e => set(['social', key], e.target.value)} className={inputClass} placeholder={placeholder} />
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </div>
    );
}
