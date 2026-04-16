/**
 * SEOScoreWidget — checklist SEO em tempo real para o PostEditor.
 * Avalia título, descrição, imagem, conteúdo e hierarquia de headings.
 */

import React, { useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface SEOScoreWidgetProps {
  title: string;
  description: string;
  heroImage: string;
  content: string;
}

interface Check {
  label: string;
  pass: boolean;
  hint: string;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function hasH1(html: string): boolean {
  return /<h1[\s>]/i.test(html);
}

function hasH2(html: string): boolean {
  return /<h2[\s>]/i.test(html);
}

function h3OnlyAfterH2(html: string): boolean {
  // Finds the position of first H3 and first H2 — H3 must come after H2
  const h2Match = html.search(/<h2[\s>]/i);
  const h3Match = html.search(/<h3[\s>]/i);
  if (h3Match === -1) return true; // no H3 is fine
  if (h2Match === -1) return false; // has H3 but no H2
  return h3Match > h2Match;
}

export default function SEOScoreWidget({ title, description, heroImage, content }: SEOScoreWidgetProps) {
  const checks = useMemo<Check[]>(() => {
    const tLen = title.trim().length;
    const dLen = description.trim().length;
    const words = countWords(content);
    return [
      {
        label: 'Título: 30–60 caracteres',
        pass: tLen >= 30 && tLen <= 60,
        hint: tLen < 30 ? `Muito curto (${tLen})` : tLen > 60 ? `Muito longo (${tLen})` : `${tLen} caracteres`,
      },
      {
        label: 'Descrição: 120–160 caracteres',
        pass: dLen >= 120 && dLen <= 160,
        hint: dLen === 0 ? 'Não preenchida' : dLen < 120 ? `Muito curta (${dLen})` : dLen > 160 ? `Muito longa (${dLen})` : `${dLen} caracteres`,
      },
      {
        label: 'Imagem de capa definida',
        pass: !!heroImage.trim(),
        hint: heroImage.trim() ? 'Imagem configurada' : 'Sem imagem de capa',
      },
      {
        label: 'Conteúdo > 300 palavras',
        pass: words > 300,
        hint: `${words} palavra${words !== 1 ? 's' : ''}`,
      },
      {
        label: 'Sem H1 no corpo (título já é H1)',
        pass: !hasH1(content),
        hint: hasH1(content) ? 'Remova o H1 do corpo — use H2/H3' : 'Correto',
      },
      {
        label: 'Pelo menos um H2 no conteúdo',
        pass: hasH2(content),
        hint: hasH2(content) ? 'H2 encontrado' : 'Adicione subtítulos H2',
      },
      {
        label: 'H3 só aparece após um H2',
        pass: h3OnlyAfterH2(content),
        hint: h3OnlyAfterH2(content) ? 'Hierarquia correta' : 'H3 antes de H2 — ajuste a ordem',
      },
    ];
  }, [title, description, heroImage, content]);

  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  const scoreColor =
    score >= 75 ? 'bg-green-500' :
    score >= 50 ? 'bg-amber-500' :
    'bg-red-500';

  const scoreText =
    score >= 75 ? 'text-green-700' :
    score >= 50 ? 'text-amber-700' :
    'text-red-700';

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="font-bold text-slate-700 text-sm">Score SEO</h3>
        <span className={`text-lg font-black ${scoreText}`}>{score}%</span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-2">
        {checks.map(check => (
          <div key={check.label} className="flex items-start gap-2">
            {check.pass ? (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${check.pass ? 'text-slate-700' : 'text-slate-500'}`}>
                {check.label}
              </p>
              <p className={`text-xs ${check.pass ? 'text-green-600' : 'text-slate-400'}`}>
                {check.hint}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
