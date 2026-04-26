"use client";

import { ArrowRight, Orbit } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { solutions } from "@/data/solutions";
import {
  highPrecisionCommentUrl,
  initialConditionsUrl,
  threeDInitialConditionsUrl,
  useSolutionText,
  useUiText,
} from "@/lib/i18n";
import type { SolutionDimension, ThreeBodySolution } from "@/types";
import { LanguageSelector } from "./LanguageSelector";
import { OrbitThumbnail } from "./OrbitThumbnail";

function SolutionCard({ solution }: { solution: ThreeBodySolution }) {
  const { text } = useSolutionText(solution.slug);

  return (
    <Link className="solutionCard" href={`/solutions/${solution.slug}`}>
      <div>
        <div className="cardTop">
          <div>
            <p className="family">{text.family}</p>
            <span className={`stabilityBadge ${solution.stability}`}>{text.stabilityLabel}</span>
          </div>
          <OrbitThumbnail label={`${text.name} orbit thumbnail`} solution={solution} />
        </div>
        <h2>{text.name}</h2>
        <p>{text.summary}</p>
        <p className="stabilityText">{text.stabilitySummary}</p>
      </div>
      <div className="cardFooter">
        <span>{text.sourceNote}</span>
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}

export function HomePage() {
  const { locale, t } = useUiText();
  const [activeDimension, setActiveDimension] = useState<SolutionDimension>("2d");
  const filteredSolutions = useMemo(
    () => solutions.filter((solution) => solution.dimension === activeDimension),
    [activeDimension],
  );
  const dimensionCounts = useMemo(
    () => ({
      "2d": solutions.filter((solution) => solution.dimension === "2d").length,
      "3d": solutions.filter((solution) => solution.dimension === "3d").length,
    }),
    [],
  );

  return (
    <main className="appShell" lang={locale}>
      <section className="intro">
        <div className="topBar">
          <div className="brandLine">
            <Orbit size={22} />
            <span>{t.appTitle}</span>
          </div>
          <LanguageSelector />
        </div>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroBody}</p>
        <p className="catalogNote">{t.catalogNote}</p>
      </section>

      <div className="dimensionTabs" aria-label={t.dimensionTabsLabel} role="tablist">
        {(["2d", "3d"] as const).map((dimension) => (
          <button
            aria-selected={activeDimension === dimension}
            className={activeDimension === dimension ? "active" : ""}
            key={dimension}
            role="tab"
            type="button"
            onClick={() => setActiveDimension(dimension)}
          >
            <span>{dimension === "2d" ? t.dimension2d : t.dimension3d}</span>
            <strong>{dimensionCounts[dimension]}</strong>
          </button>
        ))}
      </div>

      <section className="solutionGrid" aria-label={t.solutionGridLabel}>
        {filteredSolutions.map((solution) => (
          <SolutionCard solution={solution} key={solution.slug} />
        ))}
      </section>

      <section className="methodSection" aria-labelledby="method-title">
        <h2 id="method-title">{t.methodTitle}</h2>
        <ul>
          {t.methodItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="sourcePanel">
          <h3>{t.sourceTableTitle}</h3>
          <p>{t.sourceTableBody}</p>
          <a href={initialConditionsUrl} rel="noreferrer" target="_blank">
            {t.sourceTableLinkLabel}
            <ArrowRight size={16} />
          </a>
          <a href={highPrecisionCommentUrl} rel="noreferrer" target="_blank">
            {t.highPrecisionLinkLabel}
            <ArrowRight size={16} />
          </a>
          <a href={threeDInitialConditionsUrl} rel="noreferrer" target="_blank">
            {t.threeDSourceLinkLabel}
            <ArrowRight size={16} />
          </a>
        </div>
        <div className="referenceList" aria-labelledby="references-title">
          <h3 id="references-title">{t.referencesTitle}</h3>
          <ol>
            {t.references.map((reference) => (
              <li key={reference.id} id={`ref-${reference.id}`}>
                <span>[{reference.id}] </span>
                <a href={reference.url} rel="noreferrer" target="_blank">
                  {reference.citation}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
