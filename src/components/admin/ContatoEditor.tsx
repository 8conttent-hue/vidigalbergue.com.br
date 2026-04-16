import React, { useState, useEffect } from 'react';
import { Save, Loader2, LayoutTemplate } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

// Schema scaffold contato.json:
// { meta:{title,description}, title, subtitle, email, responseTime }

export default function ContatoEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [contato, setContato] = useState<any>(null);
    const [fileSha, setFileSha] = useState('');

    useEffect(() => {
        githubApi('read', 'src/data/contato.json')
            .then(data => { setContato(JSON.parse(data.content)); setFileSha(data.sha); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Sincronizando Página de Contato...', 'progress', 20);
        try {
            const res = await githubApi('write', 'src/data/contato.json', { content: JSON.stringify(contato, null, 2), sha: fileSha, message: 'CMS: Customização da Página Contato' });
            setFileSha(res.sha);
            triggerToast('Página de Contato atualizada!', 'success', 100);
        } catch (err: any) {
            setError(err.message); triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    const set = (path: string[], value: string) => {
        setContato((prev: any) => {
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
            <LayoutTemplate className="w-10 h-10 animate-pulse mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando contato.json...</p>
        </div>
    );

    const cardClass = "p-8 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm";
    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";

    return (
        <div className="max-w-4xl pb-32">
            <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Editar Página: Contato</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Edita o arquivo <code className="bg-slate-100 px-1 rounded">src/data/contato.json</code></p>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium mb-4">{error}</div>}

            <form onSubmit={handleSave} className="space-y-6">
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">SEO</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título da Página (aba do navegador)</label><input type="text" value={contato?.meta?.title || ''} onChange={e => set(['meta', 'title'], e.target.value)} className={inputClass} placeholder="Contato | Nome do Site" /></div>
                        <div><label className={labelClass}>Meta Descrição</label><textarea rows={2} value={contato?.meta?.description || ''} onChange={e => set(['meta', 'description'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                    </div>
                </div>

                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Conteúdo da Página</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título Principal (H1)</label><input type="text" value={contato?.title || ''} onChange={e => set(['title'], e.target.value)} className={inputClass} /></div>
                        <div><label className={labelClass}>Subtítulo / Chamada</label><textarea rows={2} value={contato?.subtitle || ''} onChange={e => set(['subtitle'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                    </div>
                </div>

                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Informações de Contato</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>E-mail de Contato</label><input type="email" value={contato?.email || ''} onChange={e => set(['email'], e.target.value)} className={inputClass} placeholder="contato@seusite.com.br" /></div>
                        <div><label className={labelClass}>Tempo de Resposta</label><input type="text" value={contato?.responseTime || ''} onChange={e => set(['responseTime'], e.target.value)} className={inputClass} placeholder="Respondemos em até 48 horas úteis." /></div>
                    </div>
                </div>
            </form>
        </div>
    );
}
