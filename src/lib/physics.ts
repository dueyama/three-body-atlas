import type { BodyState, IntegratorKind, Vector3 } from "@/types";

export type SimBody = {
  position: Vector3;
  velocity: Vector3;
  mass: number;
  color: string;
  label: string;
};

export const defaultSoftening = 0.012;

function add(a: Vector3, b: Vector3): Vector3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vector3, n: number): Vector3 {
  return [v[0] * n, v[1] * n, v[2] * n];
}

function weightedSum(
  a: Vector3,
  b: Vector3,
  c: Vector3,
  d: Vector3,
  dt: number,
): Vector3 {
  return [
    (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]),
    (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]),
    (dt / 6) * (a[2] + 2 * b[2] + 2 * c[2] + d[2]),
  ];
}

function accelerations(bodies: SimBody[], softening: number): Vector3[] {
  return bodies.map((body, index) => {
    const acceleration: Vector3 = [0, 0, 0];

    bodies.forEach((other, otherIndex) => {
      if (index === otherIndex) {
        return;
      }

      const dx = other.position[0] - body.position[0];
      const dy = other.position[1] - body.position[1];
      const dz = other.position[2] - body.position[2];
      const distanceSquared = dx * dx + dy * dy + dz * dz + softening * softening;
      const distance = Math.sqrt(distanceSquared);
      const factor = other.mass / (distanceSquared * distance);

      acceleration[0] += dx * factor;
      acceleration[1] += dy * factor;
      acceleration[2] += dz * factor;
    });

    return acceleration;
  });
}

export function cloneBodies(bodies: BodyState[]): SimBody[] {
  return bodies.map((body) => ({
    ...body,
    position: [...body.position],
    velocity: [...body.velocity],
  }));
}

type Derivative = {
  dPosition: Vector3;
  dVelocity: Vector3;
};

function derivatives(bodies: SimBody[], softening: number): Derivative[] {
  const acceleration = accelerations(bodies, softening);

  return bodies.map((body, index) => ({
    dPosition: body.velocity,
    dVelocity: acceleration[index],
  }));
}

function offsetBodies(bodies: SimBody[], derivative: Derivative[], dt: number): SimBody[] {
  return bodies.map((body, index) => ({
    ...body,
    position: add(body.position, scale(derivative[index].dPosition, dt)),
    velocity: add(body.velocity, scale(derivative[index].dVelocity, dt)),
  }));
}

function combineBodies(
  bodies: SimBody[],
  derivativesByStage: Derivative[][],
  coefficients: number[],
  dt: number,
): SimBody[] {
  return bodies.map((body, bodyIndex) => {
    const position: Vector3 = [...body.position];
    const velocity: Vector3 = [...body.velocity];

    derivativesByStage.forEach((stage, stageIndex) => {
      const coefficient = coefficients[stageIndex] * dt;
      position[0] += stage[bodyIndex].dPosition[0] * coefficient;
      position[1] += stage[bodyIndex].dPosition[1] * coefficient;
      position[2] += stage[bodyIndex].dPosition[2] * coefficient;
      velocity[0] += stage[bodyIndex].dVelocity[0] * coefficient;
      velocity[1] += stage[bodyIndex].dVelocity[1] * coefficient;
      velocity[2] += stage[bodyIndex].dVelocity[2] * coefficient;
    });

    return {
      ...body,
      position,
      velocity,
    };
  });
}

function maxStateDifference(a: SimBody[], b: SimBody[]): number {
  return Math.max(
    ...a.map((body, index) => {
      const other = b[index];
      const positionError = Math.hypot(
        body.position[0] - other.position[0],
        body.position[1] - other.position[1],
        body.position[2] - other.position[2],
      );
      const velocityError = Math.hypot(
        body.velocity[0] - other.velocity[0],
        body.velocity[1] - other.velocity[1],
        body.velocity[2] - other.velocity[2],
      );

      return Math.max(positionError, velocityError);
    }),
  );
}

export function stepBodies(
  bodies: SimBody[],
  dt: number,
  softening = defaultSoftening,
): SimBody[] {
  const k1 = derivatives(bodies, softening);
  const k2 = derivatives(offsetBodies(bodies, k1, dt * 0.5), softening);
  const k3 = derivatives(offsetBodies(bodies, k2, dt * 0.5), softening);
  const k4 = derivatives(offsetBodies(bodies, k3, dt), softening);

  return bodies.map((body, index) => ({
    ...body,
    position: add(
      body.position,
      weightedSum(
        k1[index].dPosition,
        k2[index].dPosition,
        k3[index].dPosition,
        k4[index].dPosition,
        dt,
      ),
    ),
    velocity: add(
      body.velocity,
      weightedSum(
        k1[index].dVelocity,
        k2[index].dVelocity,
        k3[index].dVelocity,
        k4[index].dVelocity,
        dt,
      ),
    ),
  }));
}

function stepBodiesRk45(
  bodies: SimBody[],
  dt: number,
  softening = defaultSoftening,
): { next: SimBody[]; error: number } {
  const k1 = derivatives(bodies, softening);
  const k2 = derivatives(combineBodies(bodies, [k1], [1 / 5], dt), softening);
  const k3 = derivatives(combineBodies(bodies, [k1, k2], [3 / 40, 9 / 40], dt), softening);
  const k4 = derivatives(
    combineBodies(bodies, [k1, k2, k3], [44 / 45, -56 / 15, 32 / 9], dt),
    softening,
  );
  const k5 = derivatives(
    combineBodies(
      bodies,
      [k1, k2, k3, k4],
      [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
      dt,
    ),
    softening,
  );
  const k6 = derivatives(
    combineBodies(
      bodies,
      [k1, k2, k3, k4, k5],
      [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
      dt,
    ),
    softening,
  );
  const fifthOrder = combineBodies(
    bodies,
    [k1, k3, k4, k5, k6],
    [35 / 384, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
    dt,
  );
  const k7 = derivatives(fifthOrder, softening);
  const fourthOrder = combineBodies(
    bodies,
    [k1, k3, k4, k5, k6, k7],
    [5179 / 57600, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40],
    dt,
  );

  return {
    next: fifthOrder,
    error: maxStateDifference(fifthOrder, fourthOrder),
  };
}

export function integrateBodies(
  bodies: SimBody[],
  dt: number,
  softening = defaultSoftening,
  integrationDt = dt,
  integrator: IntegratorKind = "rk4",
): SimBody[] {
  if (integrator === "rk45") {
    const tolerance = 1e-8;
    const minStep = Math.min(Math.abs(dt), integrationDt) / 4096;
    const maxStep = Math.min(Math.abs(dt), integrationDt * 64);
    let elapsed = 0;
    let step = Math.min(maxStep, Math.abs(dt));
    let current = bodies;

    while (elapsed < Math.abs(dt)) {
      const remaining = Math.abs(dt) - elapsed;
      const signedStep = Math.min(step, remaining) * Math.sign(dt);
      const trial = stepBodiesRk45(current, signedStep, softening);

      if (trial.error <= tolerance || Math.abs(signedStep) <= minStep) {
        current = trial.next;
        elapsed += Math.abs(signedStep);
      }

      const safety = 0.9;
      const factor =
        trial.error === 0
          ? 2
          : Math.min(2, Math.max(0.25, safety * (tolerance / trial.error) ** 0.2));
      step = Math.min(maxStep, Math.max(minStep, Math.abs(signedStep) * factor));
    }

    return current;
  }

  const substeps = Math.max(1, Math.ceil(dt / integrationDt));
  const subDt = dt / substeps;
  let current = bodies;

  for (let index = 0; index < substeps; index += 1) {
    current = stepBodies(current, subDt, softening);
  }

  return current;
}
