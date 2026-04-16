import React, { useState, useEffect } from 'react';
import { Save, Loader2, LayoutTemplate, Image as ImageIcon } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

// Schema scaffold sobre.json:
// { meta:{title,description}, hero:{title,subtitle}, content, mission, image, team }

export default function SobreEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [sobre, setSobre] = useState<any>(null);
    const [fileSha, setFileSha] = useState('');
    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});

    useEffect(() => {
        githubApi('read', 'src/data/sobre.json')
            .then(data => { setSobre(JSON.parse(data.content)); setFileSha(data.sha); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Sincronizando Página Sobre...', 'progress', 20);
        try {
            let finalJson = { ...sobre };
            if (pendingUploads['image']) {
                const fileObj = pendingUploads['image'];
                const base64Content = await fileToBase64(fileObj);
                const fileExt = fileObj.name.split('.').pop() || 'jpg';
                const ghPath = `public/uploads/${Date.now()}-sobre.${fileExt}`;
                await githubApi('write', ghPath, { content: base64Content, isBase64: true, message: `Upload imagem sobre ${ghPath}` });
                finalJson.image = ghPath.replace('public', '');
            }
            const res = await githubApi('write', 'src/data/sobre.json', { content: JSON.stringify(finalJson, null, 2), sha: fileSha, message: 'CMS: Customização da Página Sobre' });
            setFileSha(res.sha); setSobre(finalJson); setPendingUploads({});
            triggerToast('Página Sobre atualizada com sucesso!', 'success', 100);
        } catch (err: any) {
            setError(err.message); triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, uiKey: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingUploads(prev => ({ ...prev, [uiKey]: file }));
        setSobre((prev: any) => ({ ...prev, image: URL.createObjectURL(file) }));
        e.target.value = '';
    };

    const set = (path: string[], value: string) => {
        setSobre((prev: any) => {
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
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando sobre.json...</p>
        </div>
    );

    const cardClass = "p-8 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm";
    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";

    return (
        <div className="max-w-4xl space-y-0 pb-32">
            <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Editar Página: Sobre Nós</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Edita o arquivo <code className="bg-slate-100 px-1 rounded">src/data/sobre.json</code></p>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium mb-4">{error}</div>}

            <form onSubmit={handleSave} className="space-y-6">
                {/* SEO */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">SEO</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título da Página (aba do navegador)</label><input type="text" value={sobre?.meta?.title || ''} onChange={e => set(['meta', 'title'], e.target.value)} className={inputClass} placeholder="Sobre Nós | Nome do Site" /></div>
                        <div><label className={labelClass}>Meta Descrição</label><textarea rows={2} value={sobre?.meta?.description || ''} onChange={e => set(['meta', 'description'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                    </div>
                </div>

                {/* Hero */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Cabeçalho da Página</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título (H1)</label><input type="text" value={sobre?.hero?.title || ''} onChange={e => set(['hero', 'title'], e.target.value)} className={inputClass} /></div>
                        <div><label className={labelClass}>Subtítulo</label><textarea rows={2} value={sobre?.hero?.subtitle || ''} onChange={e => set(['hero', 'subtitle'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                    </div>
                </div>

                {/* Content */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Conteúdo</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Texto principal</label><textarea rows={6} value={sobre?.content || ''} onChange={e => set(['content'], e.target.value)} className={`${inputClass} resize-y`} placeholder="Texto sobre a empresa/portal..." /></div>
                        <div><label className={labelClass}>Missão</label><textarea rows={3} value={sobre?.mission || ''} onChange={e => set(['mission'], e.target.value)} className={`${inputClass} resize-y`} placeholder="Declaração de missão..." /></div>
                    </div>
                </div>

                {/* Image */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Imagem</h3>
                    <label className="group relative border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50 hover:bg-violet-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center overflow-hidden" style={{ minHeight: '160px' }}>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
                        {sobre?.image ? (
                            <>
                                <img src={sobre.image} alt="Sobre" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20">
                                    <ImageIcon className="w-8 h-8 text-slate-800" />
                                    <span className="text-xs font-bold text-slate-900 mt-1">Trocar imagem</span>
                                </div>
                            </>
                        ) : (
                            <div className="py-8 flex flex-col items-center text-slate-400 group-hover:text-violet-500 transition-colors">
                                <ImageIcon className="w-10 h-10 mb-2" />
                                <span className="text-sm font-bold">Enviar imagem</span>
                                <span className="text-xs mt-1">sobre.jpg — aparece na página Sobre</span>
                            </div>
                        )}
                    </label>
                    {pendingUploads['image'] && <span className="text-[10px] text-amber-600 font-bold block mt-2">Upload pendente — será enviado ao salvar</span>}
                </div>
            </form>
        </div>
    );
}
