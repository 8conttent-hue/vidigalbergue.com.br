import React, { useState, useEffect } from 'react';
import { Navigation, Plus, Trash2, ChevronUp, ChevronDown, Save, Loader2, AlertCircle, LayoutList, ExternalLink } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

// scaffold: menu está dentro de siteConfig.json → lê/salva siteConfig.json

type MenuItem = {
    label: string;
    href: string;
};

export default function MenuEditor() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [fileSha, setFileSha] = useState('');
    const [siteConfig, setSiteConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        githubApi('read', 'src/data/siteConfig.json')
            .then(data => {
                const parsed = JSON.parse(data.content);
                setSiteConfig(parsed);
                setItems(Array.isArray(parsed.menu) ? parsed.menu : []);
                setFileSha(data.sha);
            })
            .catch(err => {
                if (err.message.includes('404')) setItems([]);
                else setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    async function save() {
        setSaving(true);
        triggerToast('Salvando menu...', 'progress', 30);
        try {
            const updatedConfig = { ...siteConfig, menu: items };
            const res = await githubApi('write', 'src/data/siteConfig.json', {
                content: JSON.stringify(updatedConfig, null, 2),
                sha: fileSha,
                message: 'CMS: Update menu in siteConfig.json',
            });
            setFileSha(res.sha);
            setSiteConfig(updatedConfig);
            triggerToast('Menu atualizado!', 'success');
        } catch (err: any) {
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    }

    function addItem() {
        setItems(prev => [...prev, { label: 'Novo Link', href: '/' }]);
    }

    function removeItem(i: number) {
        setItems(prev => prev.filter((_, idx) => idx !== i));
    }

    function moveUp(i: number) {
        if (i === 0) return;
        setItems(prev => {
            const next = [...prev];
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
            return next;
        });
    }

    function moveDown(i: number) {
        setItems(prev => {
            if (i === prev.length - 1) return prev;
            const next = [...prev];
            [next[i], next[i + 1]] = [next[i + 1], next[i]];
            return next;
        });
    }

    function updateItem(i: number, field: keyof MenuItem, value: string) {
        setItems(prev => {
            const next = [...prev];
            next[i] = { ...next[i], [field]: value };
            return next;
        });
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-sm">Carregando menu...</span>
        </div>
    );

    if (error) return (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200 max-w-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
        </div>
    );

    return (
        <div className="max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <Navigation className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">Menu de Navegação</h2>
                        <p className="text-sm text-slate-500">Itens do cabeçalho do site</p>
                    </div>
                </div>
                <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-500 disabled:opacity-60 transition-all shadow-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Salvando...' : 'Salvar'}
                </button>
            </div>

            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-700">
                <p className="font-semibold mb-1">Dicas</p>
                <ul className="space-y-0.5 text-violet-600 text-xs">
                    <li>• Para páginas do seu site, escreva só o caminho (ex: <strong>/sobre</strong>)</li>
                    <li>• Para sites externos, cole o link completo com https://</li>
                    <li>• A ordem aqui é a ordem exibida no menu do site</li>
                </ul>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                        <LayoutList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">Nenhum item no menu</p>
                        <p className="text-slate-400 text-xs mt-1">Clique em "Adicionar item" para começar</p>
                    </div>
                )}

                {items.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="flex items-start gap-3">
                            {/* Reorder */}
                            <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
                                <button onClick={() => moveUp(i)} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Fields */}
                            <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Texto do link</label>
                                    <input type="text" value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Ex: Blog" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">URL / caminho</label>
                                    <input type="text" value={item.href} onChange={e => updateItem(i, 'href', e.target.value)} placeholder="Ex: /blog" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all" />
                                </div>
                            </div>

                            {/* Delete */}
                            <button onClick={() => removeItem(i)} className="mt-5 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={addItem} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-medium text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all">
                <Plus className="w-4 h-4" />
                Adicionar item
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
                <ExternalLink className="w-3 h-3" />
                <span>As mudanças aparecem no site após salvar e recarregar a página.</span>
            </div>
        </div>
    );
}
