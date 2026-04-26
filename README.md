# ThreeBody Atlas

三体問題の既知軌道を、ブラウザ上で数値積分して眺めるための軌道カタログです。

劉慈欣『三体』が三つの太陽を持つ世界を物語にしたのに対し、このアプリはその手前にある古典力学の方程式と初期条件を、実際に動く可視化として扱います。

## Features

- 2D and projected 3D visualization of selected three-body examples
- Periodic choreographies, relative equilibrium, and chaotic scattering presets
- 2D / 3D catalog tabs
- RK4 / Dormand-Prince RK45 integrator switch
- Orbit history display, mouse-wheel zoom, and one-shot perturbation
- Browser-language localization for Japanese, English, and Chinese
- Catalog thumbnails generated from the same initial-condition data

## Current Scope

This is a visualization app, not a proof-grade orbit integrator.

- Gravity is Newtonian with `G = 1`.
- Most presets use equal masses unless noted otherwise.
- Some entries use 15-decimal high-precision initial conditions.
- Some entries use six-decimal public-table values screened with RK45.
- Small softening is used near close encounters to avoid singular forces.
- The 3D view is currently a projected visualization of spatial initial conditions, not a full 3D camera tool.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the production build locally:

```bash
npm run start
```

## Deployment Notes

This is a Next.js app and should deploy to Vercel with the default framework detection.

Recommended public release flow:

1. Create or choose a public GitHub repository.
2. Push the project to GitHub.
3. Import the GitHub repository from Vercel.
4. Keep the default Next.js build settings unless the project later adds custom requirements.
5. Confirm that `/` and `/solutions/[slug]` routes are generated correctly after deployment.

## References

- J. R. Dormand and P. J. Prince, "A family of embedded Runge-Kutta formulae," Journal of Computational and Applied Mathematics, 6(1), 19-26, 1980.
- A. Hudomal, "New Periodic Three-Body Orbits," public initial-condition table for equal-mass planar periodic three-body orbits.
- S. J. Liao, "A comment on Three Classes of Newtonian Three-Body Planar Periodic Orbits," high-precision initial-condition note.
- X. Li and S. Liao, "Discovery of 10,059 new three-dimensional periodic orbits of general three-body problem," arXiv:2508.08568, 2025.
- 劉慈欣『三体』。英訳: Cixin Liu, The Three-Body Problem, translated by Ken Liu, Tor Books, 2014.
