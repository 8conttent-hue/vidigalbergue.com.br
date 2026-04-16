import React, { useState, useEffect } from 'react';
import { Save, Loader2, LayoutTemplate, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

// Schema scaffold home.json:
// {
//   meta: { title, description },
//   hero: { title, subtitle, btnText, btnLink, bgImage },
//   features: { title, items: [{ icon, title, desc }] },
//   about: { title, desc, image, btnText, btnLink, stats: [{ value, label }] },
//   posts: { title, limit, btnText, btnLink }
// }

export default function HomeEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [home, setHome] = useState<any>(null);
    const [fileSha, setFileSha] = useState('');
    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});

    useEffect(() => {
        githubApi('read', 'src/data/home.json')
            .then(data => { setHome(JSON.parse(data.content)); setFileSha(data.sha); })
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
        triggerToast('Sincronizando Home...', 'progress', 20);
        try {
            let finalJson = { ...home };

            for (const [key, fileObj] of Object.entries(pendingUploads)) {
                const base64Content = await fileToBase64(fileObj as File);
                const fileExt = (fileObj as File).name.split('.').pop() || 'jpg';
                const ghPath = `public/images/${key}.${fileExt}`;
                await githubApi('write', ghPath, { content: base64Content, isBase64: true, message: `Upload ${key} ${ghPath}` });
                const publicPath = `/${ghPath.replace('public/', '')}`;
                if (key === 'hero') finalJson = { ...finalJson, hero: { ...finalJson.hero, bgImage: publicPath } };
                if (key === 'about') finalJson = { ...finalJson, about: { ...finalJson.about, image: publicPath } };
            }

            const res = await githubApi('write', 'src/data/home.json', { content: JSON.stringify(finalJson, null, 2), sha: fileSha, message: 'CMS: Customização da Home' });
            setFileSha(res.sha); setHome(finalJson); setPendingUploads({});
            triggerToast('Home atualizada com sucesso!', 'success', 100);
        } catch (err: any) {
            setError(err.message); triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, key: string, previewPath: string[]) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingUploads(prev => ({ ...prev, [key]: file }));
        const url = URL.createObjectURL(file);
        setHome((prev: any) => {
            const next = { ...prev };
            let cur: any = next;
            for (let i = 0; i < previewPath.length - 1; i++) {
                cur[previewPath[i]] = { ...(cur[previewPath[i]] || {}) };
                cur = cur[previewPath[i]];
            }
            cur[previewPath[previewPath.length - 1]] = url;
            return next;
        });
        e.target.value = '';
    };

    const setPath = (path: string[], value: any) => {
        setHome((prev: any) => {
            const next = JSON.parse(JSON.stringify(prev));
            let cur: any = next;
            for (let i = 0; i < path.length - 1; i++) {
                cur = cur[path[i]];
            }
            cur[path[path.length - 1]] = value;
            return next;
        });
    };

    const addFeatureItem = () => {
        setHome((prev: any) => ({
            ...prev,
            features: {
                ...prev.features,
                items: [...(prev.features?.items || []), { icon: '', title: 'Novo Item', desc: 'Descrição do item' }]
            }
        }));
    };

    const removeFeatureItem = (i: number) => {
        setHome((prev: any) => ({
            ...prev,
            features: { ...prev.features, items: prev.features.items.filter((_: any, idx: number) => idx !== i) }
        }));
    };

    const addStat = () => {
        setHome((prev: any) => ({
            ...prev,
            about: { ...prev.about, stats: [...(prev.about?.stats || []), { value: '0', label: 'Label' }] }
        }));
    };

    const removeStat = (i: number) => {
        setHome((prev: any) => ({
            ...prev,
            about: { ...prev.about, stats: prev.about.stats.filter((_: any, idx: number) => idx !== i) }
        }));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <LayoutTemplate className="w-10 h-10 animate-pulse mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando home.json...</p>
        </div>
    );

    const cardClass = "p-8 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm";
    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
    const smallInputClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all w-full";

    return (
        <div className="max-w-4xl pb-32">
            <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Editar Página: Home</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Edita o arquivo <code className="bg-slate-100 px-1 rounded">src/data/home.json</code></p>
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
                        <div><label className={labelClass}>Título da Página (aba do navegador)</label><input type="text" value={home?.meta?.title || ''} onChange={e => setPath(['meta', 'title'], e.target.value)} className={inputClass} /></div>
                        <div><label className={labelClass}>Meta Descrição</label><textarea rows={2} value={home?.meta?.description || ''} onChange={e => setPath(['meta', 'description'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                    </div>
                </div>

                {/* Hero */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">1. Seção Hero (banner principal)</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título Principal (H1)</label><input type="text" value={home?.hero?.title || ''} onChange={e => setPath(['hero', 'title'], e.target.value)} className={inputClass} /></div>
                        <div><label className={labelClass}>Subtítulo</label><textarea rows={2} value={home?.hero?.subtitle || ''} onChange={e => setPath(['hero', 'subtitle'], e.target.value)} className={`${inputClass} resize-none`} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>Texto do Botão</label><input type="text" value={home?.hero?.btnText || ''} onChange={e => setPath(['hero', 'btnText'], e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>Link do Botão</label><input type="text" value={home?.hero?.btnLink || ''} onChange={e => setPath(['hero', 'btnLink'], e.target.value)} className={inputClass} placeholder="/blog" /></div>
                        </div>
                        {/* bgImage upload */}
                        <div>
                            <label className={labelClass}>Imagem de Fundo</label>
                            <label className="group relative border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50 hover:bg-violet-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center overflow-hidden" style={{ minHeight: '120px' }}>
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'hero', ['hero', 'bgImage'])} />
                                {home?.hero?.bgImage ? (
                                    <>
                                        <img src={home.hero.bgImage} alt="Hero BG" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20">
                                            <ImageIcon className="w-8 h-8 text-slate-800" /><span className="text-xs font-bold text-slate-900 mt-1">Trocar imagem</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-6 flex flex-col items-center text-slate-400 group-hover:text-violet-500 transition-colors">
                                        <ImageIcon className="w-8 h-8 mb-2" /><span className="text-xs font-bold">hero.jpg — fundo do banner</span>
                                    </div>
                                )}
                            </label>
                            {pendingUploads['hero'] && <span className="text-[10px] text-amber-600 font-bold block mt-2">Upload pendente — será enviado ao salvar</span>}
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">2. Seção Features (destaques)</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título da Seção</label><input type="text" value={home?.features?.title || ''} onChange={e => setPath(['features', 'title'], e.target.value)} className={inputClass} /></div>
                        <div>
                            <label className={labelClass}>Itens de Destaque</label>
                            <div className="space-y-3">
                                {(home?.features?.items || []).map((item: any, i: number) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-4 flex gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título</label>
                                                <input type="text" value={item.title} onChange={e => { const items = [...home.features.items]; items[i] = { ...items[i], title: e.target.value }; setPath(['features', 'items'], items); }} className={smallInputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
                                                <input type="text" value={item.desc} onChange={e => { const items = [...home.features.items]; items[i] = { ...items[i], desc: e.target.value }; setPath(['features', 'items'], items); }} className={smallInputClass} />
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeFeatureItem(i)} className="mt-5 text-slate-400 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addFeatureItem} className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all">
                                    <Plus className="w-4 h-4" /> Adicionar item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">3. Seção Sobre (na Home)</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título</label><input type="text" value={home?.about?.title || ''} onChange={e => setPath(['about', 'title'], e.target.value)} className={inputClass} /></div>
                        <div><label className={labelClass}>Descrição</label><textarea rows={3} value={home?.about?.desc || ''} onChange={e => setPath(['about', 'desc'], e.target.value)} className={`${inputClass} resize-y`} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>Texto do Botão</label><input type="text" value={home?.about?.btnText || ''} onChange={e => setPath(['about', 'btnText'], e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>Link do Botão</label><input type="text" value={home?.about?.btnLink || ''} onChange={e => setPath(['about', 'btnLink'], e.target.value)} className={inputClass} placeholder="/sobre" /></div>
                        </div>
                        {/* About Image */}
                        <div>
                            <label className={labelClass}>Imagem</label>
                            <label className="group relative border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50 hover:bg-violet-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center overflow-hidden" style={{ minHeight: '100px' }}>
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e, 'about', ['about', 'image'])} />
                                {home?.about?.image ? (
                                    <>
                                        <img src={home.about.image} alt="About" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20">
                                            <ImageIcon className="w-6 h-6 text-slate-800" /><span className="text-xs font-bold text-slate-900 mt-1">Trocar</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-4 flex flex-col items-center text-slate-400 group-hover:text-violet-500 transition-colors">
                                        <ImageIcon className="w-6 h-6 mb-1" /><span className="text-xs font-bold">about.jpg</span>
                                    </div>
                                )}
                            </label>
                            {pendingUploads['about'] && <span className="text-[10px] text-amber-600 font-bold block mt-2">Upload pendente — será enviado ao salvar</span>}
                        </div>
                        {/* Stats */}
                        <div>
                            <label className={labelClass}>Estatísticas</label>
                            <div className="space-y-2">
                                {(home?.about?.stats || []).map((stat: any, i: number) => (
                                    <div key={i} className="flex gap-2">
                                        <input type="text" value={stat.value} onChange={e => { const stats = [...home.about.stats]; stats[i] = { ...stats[i], value: e.target.value }; setPath(['about', 'stats'], stats); }} className={`${smallInputClass} w-28`} placeholder="500+" />
                                        <input type="text" value={stat.label} onChange={e => { const stats = [...home.about.stats]; stats[i] = { ...stats[i], label: e.target.value }; setPath(['about', 'stats'], stats); }} className={smallInputClass} placeholder="Artigos" />
                                        <button type="button" onClick={() => removeStat(i)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={addStat} className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium">
                                    <Plus className="w-4 h-4" /> Adicionar estatística
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Section */}
                <div className={cardClass}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">4. Seção de Posts</h3>
                    <div className="space-y-4">
                        <div><label className={labelClass}>Título da Seção</label><input type="text" value={home?.posts?.title || ''} onChange={e => setPath(['posts', 'title'], e.target.value)} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Número de Posts</label>
                                <input type="number" min={1} max={9} value={home?.posts?.limit || 3} onChange={e => setPath(['posts', 'limit'], parseInt(e.target.value))} className={inputClass} />
                            </div>
                            <div><label className={labelClass}>Texto do Botão</label><input type="text" value={home?.posts?.btnText || ''} onChange={e => setPath(['posts', 'btnText'], e.target.value)} className={inputClass} /></div>
                        </div>
                        <div><label className={labelClass}>Link do Botão</label><input type="text" value={home?.posts?.btnLink || ''} onChange={e => setPath(['posts', 'btnLink'], e.target.value)} className={inputClass} placeholder="/blog" /></div>
                    </div>
                </div>
            </form>
        </div>
    );
}
