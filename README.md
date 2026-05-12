# ThreeBody Atlas

ThreeBody Atlas is an interactive orbit catalog for exploring known three-body problem examples through browser-based numerical simulation.

Cixin Liu's *The Three-Body Problem* turns a world with three suns into fiction. This app stays closer to the mechanics behind that imagination: classical equations, published initial conditions, and live visualizations you can perturb, rotate, and compare.

## Features

- 2D and projected 3D visualization of selected three-body examples
- Periodic choreographies, relative equilibrium, and chaotic scattering presets
- 2D / 3D catalog tabs
- RK4 / Dormand-Prince RK45 integrator switch
- Orbit history display, mouse-wheel zoom, and one-shot perturbation
- Browser-language localization for Japanese, English, Chinese, and French
- Catalog thumbnails generated from the same initial-condition data

## Current Scope

This is a visualization app, not a proof-grade orbit integrator.

- Gravity is Newtonian with `G = 1`.
- Most presets use equal masses unless noted otherwise.
- Some entries use 15-decimal high-precision initial conditions.
- Some entries use six-decimal public-table values screened with RK45.
- Small softening is used near close encounters to avoid singular forces.
- The 3D view is currently a projected visualization of spatial initial conditions, not a full 3D camera tool.

## Version

Current version: `v1.4`

Version history is intentionally coarse:

- `v1.4` - French localization: French UI, version history, simulator controls, source notes, and orbit descriptions.
- `v1.3` - Version history and public metadata: visible version badge, release history, MIT license, and dueyama GitHub links.
- `v1.2` - Public polish: browser icon, clearer README/project metadata, and public-safe GitHub/Vercel workflow notes.
- `v1.1` - Clearer classifications: orbit type and stability separated, with family labels and stability wording explained.
- `v1.0` - 2D and 3D atlas: 2D/projected-3D tabs, source links, and stable/unstable spatial orbit examples.
- `v0.4` - RK45 and high-precision presets: adaptive Dormand-Prince RK45, higher-precision periodic presets, and references.
- `v0.3` - Localized explanations: Japanese, English, and Chinese UI, browser-language selection, and method notes.
- `v0.2` - Interactive simulator controls: stability badges, reference traces, wheel zoom, long history, perturbation, and RK4.
- `v0.1` - Initial 2D catalog: Next.js app, detail pages, and Canvas simulation.

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
- Cixin Liu, *The Three-Body Problem*, translated by Ken Liu, Tor Books, 2014; originally published in Chinese as *San ti*, 2006.

## License

MIT License. See [LICENSE](LICENSE).

## Maintainer

GitHub: [@dueyama](https://github.com/dueyama)
