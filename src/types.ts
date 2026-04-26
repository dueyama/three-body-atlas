export type Vector3 = [number, number, number];

export type BodyState = {
  position: Vector3;
  velocity: Vector3;
  mass: number;
  color: string;
  label: string;
};

export type OrbitClassKind = "periodic" | "relative-equilibrium" | "transient";
export type StabilityKind = "stable" | "unstable" | "unverified" | "chaotic";
export type ReferenceKind = "relative-equilibrium" | "periodic-reference" | "transient";
export type IntegratorKind = "rk4" | "rk45";
export type SolutionDimension = "2d" | "3d";

export type ThreeBodySolution = {
  slug: string;
  dimension: SolutionDimension;
  orbitClass: OrbitClassKind;
  stability: StabilityKind;
  recommendedDt: number;
  viewScale: number;
  trailLength: number;
  period?: number;
  integrationDt?: number;
  softening?: number;
  referenceKind?: ReferenceKind;
  bodies: BodyState[];
};
