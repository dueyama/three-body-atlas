"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Simulator } from "@/components/Simulator";
import { useSolutionText, useUiText } from "@/lib/i18n";
import type { ThreeBodySolution } from "@/types";

export function SolutionDetailPage({ solution }: { solution: ThreeBodySolution }) {
  const { locale, t } = useUiText();
  const { text } = useSolutionText(solution.slug);

  return (
    <main className="detailShell" lang={locale}>
      <header className="detailHeader">
        <Link className="backLink" href="/">
          <ArrowLeft size={17} />
          {t.backToList}
        </Link>
        <div>
          <p className="family">{text.family}</p>
          <span className={`stabilityBadge ${solution.stability}`}>{text.stabilityLabel}</span>
          <h1>{text.name}</h1>
          <p>{text.summary}</p>
          <p className="stabilityDetail">{text.stabilitySummary}</p>
          <p className="sourceDetail">
            {text.sourceNote}
            {text.sourceUrl && text.sourceLinkLabel ? (
              <>
                {" "}
                <a href={text.sourceUrl} rel="noreferrer" target="_blank">
                  {text.sourceLinkLabel}
                </a>
              </>
            ) : null}
          </p>
        </div>
      </header>
      <Simulator solution={solution} solutionName={text.name} />
    </main>
  );
}
