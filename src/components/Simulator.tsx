"use client";

import { History, Pause, Play, Rotate3d, RotateCcw, Shuffle, StepForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { cloneBodies, integrateBodies, type SimBody } from "@/lib/physics";
import { useUiText } from "@/lib/i18n";
import type { IntegratorKind, ThreeBodySolution, Vector3 } from "@/types";

type TrailPoint = Vector3;
type ActivePointer = {
  pointerType: string;
  x: number;
  y: number;
};

const historyLimit = 18000;
const autoRotateStep = 0.0022;
const minPitch = -2.75;
const maxPitch = 2.75;
const minZoom = 0.08;
const maxZoom = 5;
const dragRotationScale = 0.009;

function toTrailPoint(body: SimBody): TrailPoint {
  return [body.position[0], body.position[1], body.position[2]];
}

function defaultPitch(solution: ThreeBodySolution) {
  return solution.dimension === "3d" ? -1.07 : 0;
}

function clampPitch(value: number) {
  return Math.min(maxPitch, Math.max(minPitch, value));
}

function clampZoom(value: number) {
  return Math.min(maxZoom, Math.max(minZoom, value));
}

function pointerDistance(first: ActivePointer, second: ActivePointer) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function projectPoint(
  point: TrailPoint,
  solution: ThreeBodySolution,
  yaw: number,
  pitch: number,
): [number, number] {
  const yawCos = Math.cos(yaw);
  const yawSin = Math.sin(yaw);
  const rotatedX = point[0] * yawCos - point[1] * yawSin;
  const rotatedY = point[0] * yawSin + point[1] * yawCos;
  const pitchCos = Math.cos(pitch);
  const pitchSin = Math.sin(pitch);
  const tiltedY = rotatedY * pitchCos - point[2] * pitchSin;

  if (solution.dimension !== "3d") {
    return [rotatedX, tiltedY];
  }

  return [rotatedX, tiltedY];
}

function buildReferenceTrails(
  solution: ThreeBodySolution,
  integrator: IntegratorKind,
): TrailPoint[][] {
  if (solution.referenceKind === "relative-equilibrium") {
    const totalMass = solution.bodies.reduce((sum, body) => sum + body.mass, 0);
    const centerX =
      solution.bodies.reduce((sum, body) => sum + body.position[0] * body.mass, 0) /
      totalMass;
    const centerY =
      solution.bodies.reduce((sum, body) => sum + body.position[1] * body.mass, 0) /
      totalMass;
    const samples = 360;

    return solution.bodies.map((body) => {
      const dx = body.position[0] - centerX;
      const dy = body.position[1] - centerY;
      const radius = Math.hypot(dx, dy);
      const startAngle = Math.atan2(dy, dx);
      const trail: TrailPoint[] = [];

      for (let index = 0; index <= samples; index += 1) {
        const angle = startAngle + (Math.PI * 2 * index) / samples;
        trail.push([
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
          body.position[2],
        ]);
      }

      return trail;
    });
  }

  if (solution.referenceKind === "periodic-reference") {
    const bodies = cloneBodies(solution.bodies);
    const trails: TrailPoint[][] = solution.bodies.map((body) => [[...body.position]]);
    const periodSteps = solution.period
      ? Math.ceil(solution.period / solution.recommendedDt)
      : solution.trailLength;
    const steps = Math.min(Math.max(periodSteps, 1200), 12000);

    for (let step = 0; step < steps; step += 1) {
      const nextBodies = integrateBodies(
        bodies,
        solution.recommendedDt,
        solution.softening,
        solution.integrationDt,
        integrator,
      );
      nextBodies.forEach((body, index) => {
        trails[index].push(toTrailPoint(body));
        bodies[index] = body;
      });
    }

    return trails;
  }

  const bodies = cloneBodies(solution.bodies);
  const trails: TrailPoint[][] = solution.bodies.map((body) => [[...body.position]]);
  const steps = Math.min(solution.trailLength, 1100);

  for (let step = 0; step < steps; step += 1) {
    const nextBodies = integrateBodies(
      bodies,
      solution.recommendedDt,
      solution.softening,
      solution.integrationDt,
      integrator,
    );
    nextBodies.forEach((body, index) => {
      trails[index].push(toTrailPoint(body));
      bodies[index] = body;
    });
  }

  return trails;
}

export function Simulator({
  solution,
  solutionName,
}: {
  solution: ThreeBodySolution;
  solutionName: string;
}) {
  const { t } = useUiText();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bodiesRef = useRef<SimBody[]>(cloneBodies(solution.bodies));
  const trailsRef = useRef<TrailPoint[][]>(solution.bodies.map(() => []));
  const historyRef = useRef<TrailPoint[][]>(solution.bodies.map(() => []));
  const perturbCountRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastPointerXRef = useRef<number | null>(null);
  const lastPointerYRef = useRef<number | null>(null);
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchZoomStartRef = useRef(1);
  const zoomRef = useRef(1);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [viewYaw, setViewYaw] = useState(0);
  const [viewPitch, setViewPitch] = useState(() => defaultPitch(solution));
  const [showHistory, setShowHistory] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isDraggingView, setIsDraggingView] = useState(false);
  const [integrator, setIntegrator] = useState<IntegratorKind>("rk45");
  const shouldDrawReference = solution.referenceKind !== undefined;
  const isPeriodicReference = solution.referenceKind === "periodic-reference";
  const isRelativeEquilibrium = solution.referenceKind === "relative-equilibrium";
  const referenceTrails = useMemo(
    () => (shouldDrawReference ? buildReferenceTrails(solution, integrator) : []),
    [integrator, shouldDrawReference, solution],
  );

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const reset = useCallback(() => {
    bodiesRef.current = cloneBodies(solution.bodies);
    trailsRef.current = solution.bodies.map((body) => [[...body.position]]);
    historyRef.current = solution.bodies.map((body) => [[...body.position]]);
    perturbCountRef.current = 0;
    setZoom(1);
    setViewYaw(0);
    setViewPitch(defaultPitch(solution));
    setAutoRotate(false);
    setTick(0);
  }, [solution]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const pixelsPerUnit = (Math.min(rect.width, rect.height) / solution.viewScale) * zoom;

    context.fillStyle = "#101219";
    context.fillRect(0, 0, rect.width, rect.height);

    context.strokeStyle = "rgba(255,255,255,0.06)";
    context.lineWidth = 1;
    for (let grid = -8; grid <= 8; grid += 1) {
      const x = cx + grid * pixelsPerUnit;
      const y = cy + grid * pixelsPerUnit;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, rect.height);
      context.stroke();
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(rect.width, y);
      context.stroke();
    }

    if (shouldDrawReference) {
      referenceTrails.forEach((trail, index) => {
        const body = solution.bodies[index];
        context.strokeStyle = body.color;
        context.globalAlpha = isRelativeEquilibrium ? 0.2 : isPeriodicReference ? 0.22 : 0.14;
        context.lineWidth = isRelativeEquilibrium || isPeriodicReference ? 1.25 : 1;
        context.setLineDash(isRelativeEquilibrium || isPeriodicReference ? [10, 8] : [5, 8]);
        context.beginPath();
        trail.forEach((point, pointIndex) => {
          const [x, y] = projectPoint(point, solution, viewYaw, viewPitch);
          const sx = cx + x * pixelsPerUnit;
          const sy = cy - y * pixelsPerUnit;
          if (pointIndex === 0) {
            context.moveTo(sx, sy);
          } else {
            context.lineTo(sx, sy);
          }
        });
        if (isRelativeEquilibrium) {
          context.closePath();
        }
        context.stroke();
      });
      context.setLineDash([]);
      context.globalAlpha = 1;
    }

    if (showHistory) {
      historyRef.current.forEach((trail, index) => {
        const body = bodiesRef.current[index];
        context.strokeStyle = body.color;
        context.globalAlpha = 0.22;
        context.lineWidth = 1.05;
        context.beginPath();
        trail.forEach((point, pointIndex) => {
          const [x, y] = projectPoint(point, solution, viewYaw, viewPitch);
          const sx = cx + x * pixelsPerUnit;
          const sy = cy - y * pixelsPerUnit;
          if (pointIndex === 0) {
            context.moveTo(sx, sy);
          } else {
            context.lineTo(sx, sy);
          }
        });
        context.stroke();
      });
      context.globalAlpha = 1;
    }

    const visibleTrails = showHistory ? trailsRef.current.slice(0, 0) : trailsRef.current;

    visibleTrails.forEach((trail, index) => {
      const body = bodiesRef.current[index];
      context.strokeStyle = body.color;
      context.globalAlpha = 0.52;
      context.lineWidth = 1.7;
      context.beginPath();
      trail.forEach((point, pointIndex) => {
        const [x, y] = projectPoint(point, solution, viewYaw, viewPitch);
        const sx = cx + x * pixelsPerUnit;
        const sy = cy - y * pixelsPerUnit;
        if (pointIndex === 0) {
          context.moveTo(sx, sy);
        } else {
          context.lineTo(sx, sy);
        }
      });
      context.stroke();
      context.globalAlpha = 1;
    });

    bodiesRef.current.forEach((body) => {
      const [px, py] = projectPoint(toTrailPoint(body), solution, viewYaw, viewPitch);
      const x = cx + px * pixelsPerUnit;
      const y = cy - py * pixelsPerUnit;
      const radius = 7 + Math.sqrt(body.mass) * 2.2;

      context.shadowColor = body.color;
      context.shadowBlur = 18;
      context.fillStyle = body.color;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      context.fillStyle = "rgba(255,255,255,0.82)";
      context.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.fillText(body.label, x, y - radius - 8);
    });
  }, [
    isPeriodicReference,
    isRelativeEquilibrium,
    referenceTrails,
    shouldDrawReference,
    showHistory,
    solution,
    viewPitch,
    viewYaw,
    zoom,
  ]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const zoomFactor = event.deltaY > 0 ? 0.88 : 1.14;
      setZoom((value) => clampZoom(value * zoomFactor));
    },
    [],
  );

  const handlePointerDown = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    activePointersRef.current.set(event.pointerId, {
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    const touchPointers = [...activePointersRef.current.values()].filter(
      (pointer) => pointer.pointerType === "touch",
    );
    if (touchPointers.length >= 2) {
      pinchDistanceRef.current = pointerDistance(touchPointers[0], touchPointers[1]);
      pinchZoomStartRef.current = zoomRef.current;
      lastPointerXRef.current = null;
      lastPointerYRef.current = null;
      setIsDraggingView(false);
      return;
    }

    lastPointerXRef.current = event.clientX;
    lastPointerYRef.current = event.clientY;
    setIsDraggingView(true);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const activePointer = activePointersRef.current.get(event.pointerId);
      if (activePointer) {
        activePointersRef.current.set(event.pointerId, {
          ...activePointer,
          x: event.clientX,
          y: event.clientY,
        });
      }

      const touchPointers = [...activePointersRef.current.values()].filter(
        (pointer) => pointer.pointerType === "touch",
      );
      if (touchPointers.length >= 2) {
        event.preventDefault();
        const currentDistance = pointerDistance(touchPointers[0], touchPointers[1]);
        if (pinchDistanceRef.current === null) {
          pinchDistanceRef.current = currentDistance;
          pinchZoomStartRef.current = zoomRef.current;
          return;
        }
        if (pinchDistanceRef.current > 0) {
          setZoom(clampZoom((pinchZoomStartRef.current * currentDistance) / pinchDistanceRef.current));
        }
        return;
      }

      if (
        !isDraggingView ||
        lastPointerXRef.current === null ||
        lastPointerYRef.current === null
      ) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - lastPointerXRef.current;
      const deltaY = event.clientY - lastPointerYRef.current;
      lastPointerXRef.current = event.clientX;
      lastPointerYRef.current = event.clientY;
      setViewYaw((value) => value + deltaX * dragRotationScale);
      setViewPitch((value) => clampPitch(value + deltaY * dragRotationScale));
    },
    [isDraggingView],
  );

  const endPointerDrag = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const remainingPointers = [...activePointersRef.current.values()];
    const touchPointers = remainingPointers.filter((pointer) => pointer.pointerType === "touch");
    if (touchPointers.length >= 2) {
      pinchDistanceRef.current = pointerDistance(touchPointers[0], touchPointers[1]);
      pinchZoomStartRef.current = zoomRef.current;
      return;
    }

    pinchDistanceRef.current = null;
    const remainingPointer = remainingPointers[0];
    if (remainingPointer) {
      lastPointerXRef.current = remainingPointer.x;
      lastPointerYRef.current = remainingPointer.y;
      setIsDraggingView(true);
      return;
    }

    lastPointerXRef.current = null;
    lastPointerYRef.current = null;
    setIsDraggingView(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setViewYaw(0);
    setViewPitch(defaultPitch(solution));
    setAutoRotate(false);
  }, [solution]);

  const perturb = useCallback(() => {
    perturbCountRef.current += 1;
    const phase = perturbCountRef.current;
    const positionAmount = 0.004;
    const velocityAmount = 0.003;

    bodiesRef.current = bodiesRef.current.map((body, index) => {
      const angle = phase * 1.731 + index * 2.094;
      return {
        ...body,
        position: [
          body.position[0] + Math.cos(angle) * positionAmount,
          body.position[1] + Math.sin(angle) * positionAmount,
          body.position[2],
        ],
        velocity: [
          body.velocity[0] - Math.sin(angle) * velocityAmount,
          body.velocity[1] + Math.cos(angle) * velocityAmount,
          body.velocity[2],
        ],
      };
    });

    bodiesRef.current.forEach((body, index) => {
      trailsRef.current[index].push(toTrailPoint(body));
      historyRef.current[index].push(toTrailPoint(body));
      if (trailsRef.current[index].length > solution.trailLength) {
        trailsRef.current[index].shift();
      }
      if (historyRef.current[index].length > historyLimit) {
        historyRef.current[index].shift();
      }
    });
    setTick((value) => value + 1);
  }, [solution.trailLength]);

  const advance = useCallback(
    (steps: number) => {
      for (let i = 0; i < steps; i += 1) {
        bodiesRef.current = integrateBodies(
          bodiesRef.current,
          solution.recommendedDt,
          solution.softening,
          solution.integrationDt,
          integrator,
        );
        bodiesRef.current.forEach((body, index) => {
          trailsRef.current[index].push(toTrailPoint(body));
          historyRef.current[index].push(toTrailPoint(body));
          if (trailsRef.current[index].length > solution.trailLength) {
            trailsRef.current[index].shift();
          }
          if (historyRef.current[index].length > historyLimit) {
            historyRef.current[index].shift();
          }
        });
      }
      setTick((value) => value + steps);
    },
    [
      integrator,
      solution.integrationDt,
      solution.recommendedDt,
      solution.softening,
      solution.trailLength,
    ],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- switching presets must reset simulation state immediately.
    reset();
  }, [reset]);

  useEffect(() => {
    draw();
  }, [draw, tick]);

  useEffect(() => {
    if (!isRunning && !autoRotate) {
      return;
    }

    const animate = () => {
      if (isRunning) {
        advance(speed);
      }
      if (autoRotate) {
        setViewYaw((value) => value + autoRotateStep);
      }
      draw();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [advance, autoRotate, draw, isRunning, speed]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const elapsed = useMemo(
    () => (tick * solution.recommendedDt).toFixed(2),
    [solution.recommendedDt, tick],
  );

  return (
    <section className="simulator">
      {shouldDrawReference ? (
        <div className="referenceLegend">
          <span className={`stabilityDot ${solution.stability}`} />
          <span>
            {isPeriodicReference
              ? t.periodicReference
              : isRelativeEquilibrium
                ? t.relativeReference
                : t.transientReference}
          </span>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={`simulationCanvas ${isDraggingView ? "dragging" : ""}`}
        aria-label={`${solutionName} ${solution.dimension.toUpperCase()} simulation canvas`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onWheel={handleWheel}
      />
      <div className="controlBar" aria-label={t.controlsLabel}>
        <div className="controlButtons">
          <button className="iconButton" type="button" onClick={() => setIsRunning((value) => !value)}>
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            <span>{isRunning ? t.pause : t.play}</span>
          </button>
          <button className="iconButton" type="button" onClick={() => advance(24)}>
            <StepForward size={18} />
            <span>{t.step}</span>
          </button>
          <button
            className={`iconButton ${showHistory ? "active" : ""}`}
            type="button"
            onClick={() => setShowHistory((value) => !value)}
          >
            <History size={18} />
            <span>{t.history}</span>
          </button>
          <button className="iconButton" type="button" onClick={perturb}>
            <Shuffle size={18} />
            <span>{t.perturb}</span>
          </button>
          <button
            aria-pressed={autoRotate}
            className={`iconButton ${autoRotate ? "active" : ""}`}
            type="button"
            onClick={() => setAutoRotate((value) => !value)}
          >
            <Rotate3d size={18} />
            <span>{t.autoRotate}</span>
          </button>
          <button className="iconButton" type="button" onClick={resetView}>
            <RotateCcw size={18} />
            <span>{t.resetView}</span>
          </button>
          <button className="iconButton" type="button" onClick={reset}>
            <RotateCcw size={18} />
            <span>{t.reset}</span>
          </button>
        </div>
        <div className="controlStatus">
          <div className="integratorControl" aria-label={t.integrator} role="group">
            <span>{t.integrator}</span>
            <button
              className={integrator === "rk4" ? "active" : ""}
              type="button"
              onClick={() => setIntegrator("rk4")}
            >
              {t.rk4}
            </button>
            <button
              className={integrator === "rk45" ? "active" : ""}
              type="button"
              onClick={() => setIntegrator("rk45")}
            >
              {t.rk45}
            </button>
          </div>
          <label className="speedControl">
            <span>{t.speed}</span>
            <input
              min="1"
              max="18"
              type="range"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <strong>{speed}x</strong>
          </label>
          <div className="timeReadout">t = {elapsed}</div>
          <div className="zoomReadout">
            {t.zoom} {zoom.toFixed(2)}x
          </div>
        </div>
      </div>
    </section>
  );
}
