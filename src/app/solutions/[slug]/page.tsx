import { notFound } from "next/navigation";
import { SolutionDetailPage } from "@/components/SolutionDetailPage";
import { getSolution, solutions } from "@/data/solutions";

export function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }));
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = getSolution(slug);

  if (!solution) {
    notFound();
  }

  return <SolutionDetailPage solution={solution} />;
}
