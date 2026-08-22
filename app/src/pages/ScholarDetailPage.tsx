import { Link, useParams } from 'react-router';
import { scholarsData } from '../lib/content';
import { ExternalLink } from 'lucide-react';

function countryLabel(c: string) {
  const map: Record<string, string> = { USA: '美国', China: '中国', France: '法国' };
  return map[c] || c;
}

export default function ScholarDetailPage() {
  const { scholarId } = useParams<{ scholarId: string }>();
  const scholar = scholarsData.find((s) => s.id === scholarId);
  const idx = scholar ? scholarsData.indexOf(scholar) : -1;
  const prev = idx > 0 ? scholarsData[idx - 1] : null;
  const next = idx < scholarsData.length - 1 ? scholarsData[idx + 1] : null;

  if (!scholar) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6 flex justify-center text-primary/15">🔭</div>
        <h1 className="text-xl font-heading font-semibold text-foreground mb-2">未找到该学者</h1>
        <p className="text-sm text-muted-foreground mb-6">学者信息不存在或已被移除</p>
        <Link
          to="/scholars/"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ← 返回学者列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-16 md:py-24">
      <Link
        to="/scholars/"
        className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-secondary-foreground hover:text-foreground transition-colors mb-12 inline-block"
      >
        ← 返回学者列表
      </Link>

      {/* Header */}
      <div className="mb-12">
        <span className="inline-block text-primary text-lg mb-6" aria-hidden="true">✦</span>
        <h1 className="text-3xl lg:text-5xl font-heading font-semibold text-foreground mb-3 tracking-tight leading-[1.1]">
          {scholar.nameCn || scholar.name}
        </h1>
        {scholar.nameCn && scholar.nameCn !== scholar.name && (
          <p className="text-base text-muted-foreground italic mb-4">{scholar.name}</p>
        )}
        <p className="label-plate">{scholar.institutionCn || scholar.institution}</p>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        <div className="card-space p-4">
          <p className="label-plate mb-2">国家</p>
          <p className="text-sm text-foreground">{countryLabel(scholar.country)}</p>
        </div>
        <div className="card-space p-4 sm:col-span-2">
          <p className="label-plate mb-2.5">研究方向</p>
          <div className="flex flex-wrap gap-1.5">
            {scholar.fields.map((f) => (
              <span
                key={f}
                className="border border-border text-muted-foreground rounded px-2 py-0.5 text-xs"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <section className="card-space p-6 mb-10">
        <h2 className="label-plate mb-4">学术简介</h2>
        <p className="text-secondary-foreground leading-relaxed">{scholar.bio}</p>
      </section>

      {/* Highlight */}
      <div className="card-space border-l-2 border-l-primary p-6 mb-10">
        <p className="label-plate !text-primary mb-3">代表成就</p>
        <p className="text-sm text-foreground font-medium">{scholar.highlight}</p>
      </div>

      {/* Homepage link */}
      {scholar.homepage && (
        <div className="mb-12">
          <a
            href={scholar.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-copper"
          >
            访问个人主页
            <ExternalLink size={14} strokeWidth={2.5} />
          </a>
        </div>
      )}

      {/* Prev/Next */}
      <nav className="pt-6 border-t border-border/40 flex justify-between text-sm">
        <span>
          {prev && (
            <Link
              to={`/scholars/${prev.id}/`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              ← {prev.nameCn || prev.name}
            </Link>
          )}
        </span>
        <span>
          {next && (
            <Link
              to={`/scholars/${next.id}/`}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {next.nameCn || next.name} →
            </Link>
          )}
        </span>
      </nav>
    </div>
  );
}
