"use client";

import { useMemo } from "react";
import { cloneBodies, integrateBodies } from "@/lib/physics";
import type { ThreeBodySolution, Vector3 } from "@/types";

type TrailPoint = Vector3;

const thumbnailSize = 128;
const thumbnailPadding = 12;
const thumbnailYaw = 0.72;

function projectPoint(point: TrailPoint, solution: ThreeBodySolution): [number, number] {
  if (solution.dimension !== "3d") {
    return [point[0], point[1]];
  }

  const cos = Math.cos(thumbnailYaw);
  const sin = Math.sin(thumbnailYaw);
  const rotatedX = point[0] * cos - point[1] * sin;
  const rotatedY = point[0] * sin + point[1] * cos;

  return [rotatedX, rotatedY * 0.48 + point[2] * 0.88];
}

function buildRelativeEquilibriumTrails(solution: ThreeBodySolution): TrailPoint[][] {
  const totalMass = solution.bodies.reduce((sum, body) => sum + body.mass, 0);
  const centerX =
    solution.bodies.reduce((sum, body) => sum + body.position[0] * body.mass, 0) / totalMass;
  const centerY =
    solution.bodies.reduce((sum, body) => sum + body.position[1] * body.mass, 0) / totalMass;
  const steps = 240;

  return solution.bodies.map((body) => {
    const radius = Math.hypot(body.position[0] - centerX, body.position[1] - centerY);
    const angle = Math.atan2(body.position[1] - centerY, body.position[0] - centerX);

    return Array.from({ length: steps + 1 }, (_, index) => {
      const theta = angle + (index / steps) * Math.PI * 2;
      return [
        centerX + Math.cos(theta) * radius,
        centerY + Math.sin(theta) * radius,
        body.position[2],
      ];
    });
  });
}

function buildIntegratedTrails(solution: ThreeBodySolution): TrailPoint[][] {
  const bodies = cloneBodies(solution.bodies);
  const trails: TrailPoint[][] = solution.bodies.map((body) => [[...body.position]]);
  const hasPeriod = typeof solution.period === "number";
  const isTransient = solution.referenceKind === "transient";
  const duration = hasPeriod
    ? solution.period ?? 0
    : solution.recommendedDt * (isTransient ? Math.max(solution.trailLength, 1400) : 760);
  const steps = hasPeriod
    ? Math.min(1800, Math.max(360, Math.ceil(duration / (solution.recommendedDt * 2))))
    : isTransient
      ? 520
      : 360;
  const dt = duration / steps;
  const escapeRadius = solution.viewScale * (isTransient ? 0.78 : 0.52);
  let current = bodies;

  for (let step = 0; step < steps; step += 1) {
    const next = integrateBodies(
      current,
      dt,
      solution.softening,
      Math.max(Math.abs(dt), solution.integrationDt ?? Math.abs(dt)),
      "rk45",
    );
    const maxRadius = Math.max(
      ...next.map((body) => Math.hypot(body.position[0], body.position[1], body.position[2])),
    );

    if (maxRadius > escapeRadius && step > 36) {
      break;
    }

    current = next;

    current.forEach((body, index) => {
      trails[index].push([body.position[0], body.position[1], body.position[2]]);
    });
  }

  return trails;
}

function buildThumbnailTrails(solution: ThreeBodySolution): TrailPoint[][] {
  if (solution.referenceKind === "relative-equilibrium") {
    return buildRelativeEquilibriumTrails(solution);
  }

  return buildIntegratedTrails(solution);
}

function projectTrails(trails: TrailPoint[][], solution: ThreeBodySolution): string[] {
  const points = trails.flat().map((point) => projectPoint(point, solution));
  const minX = Math.min(...points.map((point) => point[0]));
  const maxX = Math.max(...points.map((point) => point[0]));
  const minY = Math.min(...points.map((point) => point[1]));
  const maxY = Math.max(...points.map((point) => point[1]));
  const width = Math.max(maxX - minX, 1e-6);
  const height = Math.max(maxY - minY, 1e-6);
  const scale = (thumbnailSize - thumbnailPadding * 2) / Math.max(width, height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return trails.map((trail) =>
    trail
      .map((point, index) => {
        const projected = projectPoint(point, solution);
        const x = thumbnailSize / 2 + (projected[0] - centerX) * scale;
        const y = thumbnailSize / 2 - (projected[1] - centerY) * scale;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" "),
  );
}

export function OrbitThumbnail({ solution, label }: { solution: ThreeBodySolution; label: string }) {
  const paths = useMemo(() => projectTrails(buildThumbnailTrails(solution), solution), [solution]);

  return (
    <svg
      aria-label={label}
      className="orbitThumbnail"
      role="img"
      viewBox={`0 0 ${thumbnailSize} ${thumbnailSize}`}
    >
      <rect
        className="orbitThumbnailFrame"
        height={thumbnailSize - 1}
        rx="7"
        width={thumbnailSize - 1}
        x="0.5"
        y="0.5"
      />
      {paths.map((path, index) => (
        <path
          className="orbitThumbnailPath"
          d={path}
          key={`${solution.slug}-${solution.bodies[index].label}`}
          stroke={solution.bodies[index].color}
        />
      ))}
    </svg>
  );
}
