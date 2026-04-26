"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrbitClassKind, StabilityKind } from "@/types";

export type Locale = "en" | "ja" | "zh";
export type LocalePreference = Locale | "auto";

type SolutionText = {
  family: string;
  name: string;
  stabilityLabel: string;
  stabilitySummary: string;
  summary: string;
  sourceNote: string;
  sourceUrl?: string;
  sourceLinkLabel?: string;
};

const localeStorageKey = "threebody.locale";
const localeChangeEvent = "threebody-locale-change";

type ReferenceText = {
  id: string;
  citation: string;
  url: string;
};

type UiText = {
  appTitle: string;
  heroTitle: string;
  heroBody: string;
  catalogNote: string;
  solutionGridLabel: string;
  classificationGuideTitle: string;
  classificationGuideBody: string;
  classificationLabel: string;
  orbitClassLabel: string;
  stabilityClassLabel: string;
  orbitClassLabels: Record<OrbitClassKind, string>;
  stabilityLabels: Record<StabilityKind, string>;
  dimensionTabsLabel: string;
  dimension2d: string;
  dimension3d: string;
  languageLabel: string;
  languageAuto: string;
  languageEnglish: string;
  languageJapanese: string;
  languageChinese: string;
  backToList: string;
  controlsLabel: string;
  pause: string;
  play: string;
  step: string;
  history: string;
  perturb: string;
  reset: string;
  autoRotate: string;
  resetView: string;
  speed: string;
  integrator: string;
  rk4: string;
  rk45: string;
  zoom: string;
  relativeReference: string;
  periodicReference: string;
  transientReference: string;
  methodTitle: string;
  methodItems: string[];
  sourceTableTitle: string;
  sourceTableBody: string;
  sourceTableLinkLabel: string;
  highPrecisionLinkLabel: string;
  threeDSourceLinkLabel: string;
  referencesTitle: string;
  references: ReferenceText[];
};

export const initialConditionsUrl = "http://three-body.ipb.ac.rs/initial-conditions.pdf";
export const highPrecisionCommentUrl =
  "https://sjliao.sjtu.edu.cn/__local/9/11/18/0E1205CC586DB347FB4808AE88F_B79D576A_719C1B.pdf?e=.pdf";
export const threeDInitialConditionsUrl =
  "https://github.com/sjtu-liao/three-body/blob/main/initial-condition-of-3D-periodic-orbits.txt";
export const threeDArxivUrl = "https://arxiv.org/abs/2508.08568";

const uiText: Record<Locale, UiText> = {
  en: {
    appTitle: "ThreeBody Atlas",
    heroTitle: "A working catalog of three-body orbits.",
    heroBody:
      "Liu Cixin's The Three-Body Problem [1] turns an unpredictable triple-star world into fiction; this atlas stays closer to the equations, integrating known planar orbits from published initial conditions [2][3].",
    catalogNote:
      "Start with 2D choreography, relative equilibrium, and scattering, then switch to the new 3D tab for spatial periodic examples.",
    solutionGridLabel: "Known three-body solutions",
    classificationGuideTitle: "Classification rule",
    classificationGuideBody:
      "Orbit type and stability are shown separately. Most entries are periodic solutions; Lagrange is a relative equilibrium, and Pythagorean is a transient scattering example. Many periodic orbits are expected to be sensitive or unstable, and Li and Liao [6] explicitly checked the stability of the original 15 planar examples, but this app marks stability only where the current preset has a clear source or classical criterion.",
    classificationLabel: "Orbit classification",
    orbitClassLabel: "Orbit type",
    stabilityClassLabel: "Stability",
    orbitClassLabels: {
      periodic: "Periodic solution",
      "relative-equilibrium": "Relative equilibrium",
      transient: "Transient scattering",
    },
    stabilityLabels: {
      stable: "Linearly stable",
      unstable: "Unstable",
      unverified: "Stability unverified",
      chaotic: "Chaotic / escape",
    },
    dimensionTabsLabel: "Orbit dimension",
    dimension2d: "2D",
    dimension3d: "3D",
    languageLabel: "Language",
    languageAuto: "Auto",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    backToList: "List",
    controlsLabel: "Simulation controls",
    pause: "Pause",
    play: "Play",
    step: "Step",
    history: "History",
    perturb: "Perturb",
    reset: "Reset",
    autoRotate: "Auto rotate",
    resetView: "Reset view",
    speed: "Speed",
    integrator: "Integrator",
    rk4: "RK4",
    rk45: "RK45",
    zoom: "zoom",
    relativeReference: "Thin dashed circles show the ideal relative-equilibrium orbit.",
    periodicReference:
      "Thin dashed paths are numerical reference traces from the orbit's initial conditions.",
    transientReference: "Thin dashed paths show the transient reference trajectory.",
    methodTitle: "How the app computes the motion",
    methodItems: [
      "The live simulation uses Newtonian gravity with G = 1 and a fixed timestep for each preset.",
      "The live integrator can switch between fixed-substep RK4 and adaptive Dormand-Prince RK45 [4].",
      "A small softening term is applied near collisions to avoid singular forces, so this is a visualization model rather than a proof-grade orbit integrator.",
      "Known solutions are stored as initial positions, velocities, masses, and display metadata. The app integrates forward from those initial conditions.",
      "Public-table presets use six-decimal initial conditions from the published table [2] after RK45 screening in this viewer. High-precision presets use 15-decimal conditions [3] because several six-decimal table values are not accurate enough for long playback.",
      "The 3D tab starts with a small subset of equal-mass spatial periodic-orbit initial conditions reported by Li and Liao [5].",
      "History, wheel zoom, and Perturb are viewing tools: Perturb applies a one-time small kick; it does not continuously inject noise.",
    ],
    sourceTableTitle: "Published periodic-orbit table",
    sourceTableBody:
      "The table lists equal-mass planar three-body periodic-orbit initial conditions as p1, p2, and period T, using units where G = 1 and each mass is 1. Public-table presets here are six-decimal entries that were screened with RK45; high-precision presets use 15-decimal conditions for better numerical behavior. Among the butterfly entries currently shown here, Butterfly I uses the 15-decimal source, while the Butterfly III variants use the six-decimal public table.",
    sourceTableLinkLabel: "Open initial-conditions PDF",
    highPrecisionLinkLabel: "Open high-precision condition note",
    threeDSourceLinkLabel: "Open 3D initial-condition set",
    referencesTitle: "References",
    references: [
      {
        id: "1",
        citation:
          "Cixin Liu, The Three-Body Problem, translated by Ken Liu, Tor Books, 2014; originally published in Chinese as San ti, 2006.",
        url: "https://books.google.com/books?vid=ISBN9780765377067",
      },
      {
        id: "2",
        citation:
          "A. Hudomal, \"New Periodic Three-Body Orbits,\" public initial-condition table for equal-mass planar periodic three-body orbits.",
        url: initialConditionsUrl,
      },
      {
        id: "3",
        citation:
          "S. J. Liao, \"A comment on Three Classes of Newtonian Three-Body Planar Periodic Orbits,\" table of 15-decimal initial conditions and stability discussion.",
        url: highPrecisionCommentUrl,
      },
      {
        id: "4",
        citation:
          "J. R. Dormand and P. J. Prince, \"A family of embedded Runge-Kutta formulae,\" Journal of Computational and Applied Mathematics, 6(1), 19-26, 1980. DOI: 10.1016/0771-050X(80)90013-3.",
        url: "https://doi.org/10.1016/0771-050X(80)90013-3",
      },
      {
        id: "5",
        citation:
          "X. Li and S. Liao, \"Discovery of 10,059 new three-dimensional periodic orbits of general three-body problem,\" arXiv:2508.08568, 2025; initial-condition data in sjtu-liao/three-body.",
        url: threeDArxivUrl,
      },
      {
        id: "6",
        citation:
          "X. Li and S. Liao, \"On the stability of the three classes of Newtonian three-body planar periodic orbits,\" Science China Physics, Mechanics & Astronomy, 57, 2121-2126, 2014. DOI: 10.1007/s11433-014-5563-5.",
        url: "https://doi.org/10.1007/s11433-014-5563-5",
      },
    ],
  },
  ja: {
    appTitle: "ThreeBody Atlas",
    heroTitle: "三体問題の軌道カタログ",
    heroBody:
      "劉慈欣『三体』[1] は、予測しがたい三つの太陽の世界を文明の物語にしました。このアトラスでは、そのロマンの手前にある数式を、公開・高精度の初期条件 [2][3] からその場で積分して眺めます。",
    catalogNote:
      "周期的に舞う軌道、形を保って回る相対平衡、秩序に見えて最後は飛び散る散乱例。2Dと3Dをタブで切り替えて眺めます。",
    solutionGridLabel: "既知の3体問題解",
    classificationGuideTitle: "分類ルール",
    classificationGuideBody:
      "このアプリでは「軌道型」と「安定性」を分けて表示します。ほとんどは周期解ですが、Lagrange は形を保って回る相対平衡、Pythagorean は周期解ではない過渡的な散乱例です。多くの周期解は敏感または不安定と考えるのが自然で、Li と Liao [6] は元の15個の平面例について安定性を調べています。ただし、このアプリでは現在のプリセットについて出典または古典条件から明示できるものだけに安定・不安定を付けます。",
    classificationLabel: "軌道の分類",
    orbitClassLabel: "軌道型",
    stabilityClassLabel: "安定性",
    orbitClassLabels: {
      periodic: "周期解",
      "relative-equilibrium": "相対平衡",
      transient: "過渡散乱",
    },
    stabilityLabels: {
      stable: "線形安定",
      unstable: "不安定",
      unverified: "安定性未確認",
      chaotic: "カオス的脱出",
    },
    dimensionTabsLabel: "軌道の次元",
    dimension2d: "2D",
    dimension3d: "3D",
    languageLabel: "言語",
    languageAuto: "自動",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    backToList: "一覧",
    controlsLabel: "シミュレーション操作",
    pause: "停止",
    play: "再生",
    step: "ステップ",
    history: "履歴",
    perturb: "摂動",
    reset: "リセット",
    autoRotate: "自動回転",
    resetView: "視点リセット",
    speed: "速度",
    integrator: "積分器",
    rk4: "RK4",
    rk45: "RK45",
    zoom: "ズーム",
    relativeReference: "薄い破線の円は、理想的な相対平衡軌道です。",
    periodicReference: "薄い破線は、初期条件から数値積分で描いた参照周期軌道の目安です。",
    transientReference: "薄い破線は、一時的な参照軌道です。",
    methodTitle: "このアプリの計算方法",
    methodItems: [
      "ライブシミュレーションは、重力定数 G = 1 のニュートン重力を、各プリセットの固定時間刻みで積分しています。",
      "ライブ積分器は、固定細分ステップのRK4と、適応刻みの Dormand-Prince RK45 [4] を切り替えられます。",
      "近接時の特異的な力を避けるため、小さな softening を入れています。そのため、厳密な軌道証明用ではなく可視化用のモデルです。",
      "既知解は、初期位置・初期速度・質量・表示用メタデータとして保持し、そこから時間発展させています。",
      "公開表プリセットは、公開初期条件表 [2] の6桁値をこのビューアのRK45でスクリーニングしたものです。高精度プリセットは長時間表示で6桁では足りないものがあるため、15桁初期条件 [3] を使っています。",
      "3Dタブでは、Li と Liao による等質量3D周期軌道の初期条件 [5] から、まず少数を収録しています。",
      "History、ホイールズーム、Perturb は観察用の補助機能です。Perturb は一度だけ小さなキックを入れ、継続的なノイズは加えません。",
    ],
    sourceTableTitle: "公開初期条件表について",
    sourceTableBody:
      "この表には、等質量・平面3体問題の周期軌道について、初期速度 p1, p2 と周期 T が載っています。単位系は G = 1、各質量 m = 1 です。このアプリの公開表プリセットは6桁値をRK45でスクリーニングしたもので、高精度プリセットは15桁の値で精度を上げています。現在表示している Butterfly 系では、Butterfly I は15桁資料、Butterfly III 系は公開表の6桁値を使っています。",
    sourceTableLinkLabel: "初期条件表PDFを開く",
    highPrecisionLinkLabel: "高精度初期条件の資料を開く",
    threeDSourceLinkLabel: "3D初期条件セットを開く",
    referencesTitle: "参考文献",
    references: [
      {
        id: "1",
        citation:
          "劉慈欣『三体』。原著『三体』2006年。英訳: Cixin Liu, The Three-Body Problem, translated by Ken Liu, Tor Books, 2014.",
        url: "https://books.google.com/books?vid=ISBN9780765377067",
      },
      {
        id: "2",
        citation:
          "A. Hudomal, \"New Periodic Three-Body Orbits,\" 等質量・平面3体周期軌道の公開初期条件表。",
        url: initialConditionsUrl,
      },
      {
        id: "3",
        citation:
          "S. J. Liao, \"A comment on Three Classes of Newtonian Three-Body Planar Periodic Orbits,\" 15桁初期条件と安定性に関するコメント。",
        url: highPrecisionCommentUrl,
      },
      {
        id: "4",
        citation:
          "J. R. Dormand and P. J. Prince, \"A family of embedded Runge-Kutta formulae,\" Journal of Computational and Applied Mathematics, 6(1), 19-26, 1980. DOI: 10.1016/0771-050X(80)90013-3.",
        url: "https://doi.org/10.1016/0771-050X(80)90013-3",
      },
      {
        id: "5",
        citation:
          "X. Li and S. Liao, \"Discovery of 10,059 new three-dimensional periodic orbits of general three-body problem,\" arXiv:2508.08568, 2025。初期条件データは sjtu-liao/three-body。",
        url: threeDArxivUrl,
      },
      {
        id: "6",
        citation:
          "X. Li and S. Liao, \"On the stability of the three classes of Newtonian three-body planar periodic orbits,\" Science China Physics, Mechanics & Astronomy, 57, 2121-2126, 2014。DOI: 10.1007/s11433-014-5563-5。",
        url: "https://doi.org/10.1007/s11433-014-5563-5",
      },
    ],
  },
  zh: {
    appTitle: "ThreeBody Atlas",
    heroTitle: "三体问题轨道图鉴",
    heroBody:
      "刘慈欣《三体》[1] 把不可预测的三星世界写成文明故事；这个图鉴回到方程本身，从公开和高精度初始条件 [2][3] 出发，在浏览器中积分并观察轨道。",
    catalogNote:
      "这里有周期编舞、保持形状旋转的相对平衡，也有看似有序但最终散开的散射例子。现在可用标签页切换 2D 和 3D。",
    solutionGridLabel: "已知三体问题解",
    classificationGuideTitle: "分类规则",
    classificationGuideBody:
      "本应用把轨道类型和稳定性分开显示。大多数条目是周期解；Lagrange 是保持形状旋转的相对平衡，Pythagorean 是非周期的暂态散射例。许多周期轨道很可能是敏感或不稳定的，Li 和 Liao [6] 明确检查了最初 15 个平面例子的稳定性；但本应用只在当前预设有明确来源或经典判据时标注稳定或不稳定。",
    classificationLabel: "轨道分类",
    orbitClassLabel: "轨道类型",
    stabilityClassLabel: "稳定性",
    orbitClassLabels: {
      periodic: "周期解",
      "relative-equilibrium": "相对平衡",
      transient: "暂态散射",
    },
    stabilityLabels: {
      stable: "线性稳定",
      unstable: "不稳定",
      unverified: "稳定性未确认",
      chaotic: "混沌 / 逃逸",
    },
    dimensionTabsLabel: "轨道维度",
    dimension2d: "2D",
    dimension3d: "3D",
    languageLabel: "语言",
    languageAuto: "自动",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageChinese: "中文",
    backToList: "列表",
    controlsLabel: "模拟控制",
    pause: "暂停",
    play: "播放",
    step: "单步",
    history: "历史",
    perturb: "扰动",
    reset: "重置",
    autoRotate: "自动旋转",
    resetView: "重置视角",
    speed: "速度",
    integrator: "积分器",
    rk4: "RK4",
    rk45: "RK45",
    zoom: "缩放",
    relativeReference: "细虚线圆表示理想的相对平衡轨道。",
    periodicReference: "细虚线是从轨道初始条件数值积分得到的周期参考轨迹。",
    transientReference: "细虚线表示暂态参考轨道。",
    methodTitle: "本应用的计算方式",
    methodItems: [
      "实时模拟使用牛顿引力，取 G = 1，并为每个预设使用固定时间步长。",
      "实时积分器可在固定细分步长 RK4 和自适应步长 Dormand-Prince RK45 [4] 之间切换。",
      "为避免近距离遭遇时的奇异力，计算中加入了很小的 softening。因此它是可视化模型，不是用于严格证明轨道的积分器。",
      "已知解以初始位置、初始速度、质量和显示元数据保存，应用从这些初始条件向前积分。",
      "公开表预设使用公开初始条件表 [2] 的六位小数数值，并在本查看器中用 RK45 筛选。高精度预设使用 15 位小数初始条件 [3]，因为若干六位小数数值不适合长时间播放。",
      "3D 标签页先收录少量 Li 和 Liao 报告的等质量三维周期轨道初始条件 [5]。",
      "History、鼠标滚轮缩放和 Perturb 都是观察辅助工具。Perturb 只施加一次小扰动，不会持续注入噪声。",
    ],
    sourceTableTitle: "公开初始条件表",
    sourceTableBody:
      "该表列出等质量平面三体周期轨道的初始速度 p1、p2 和周期 T，使用 G = 1 且每个质量 m = 1 的单位。本应用的公开表预设是用 RK45 筛选过的六位小数条目；高精度预设使用 15 位小数数值来提高精度。当前显示的 butterfly 条目中，Butterfly I 使用 15 位小数资料，Butterfly III 变体使用公开表的六位小数数值。",
    sourceTableLinkLabel: "打开初始条件 PDF",
    highPrecisionLinkLabel: "打开高精度初始条件资料",
    threeDSourceLinkLabel: "打开 3D 初始条件集",
    referencesTitle: "参考文献",
    references: [
      {
        id: "1",
        citation:
          "刘慈欣《三体》。原著 2006 年；英译: Cixin Liu, The Three-Body Problem, translated by Ken Liu, Tor Books, 2014.",
        url: "https://books.google.com/books?vid=ISBN9780765377067",
      },
      {
        id: "2",
        citation:
          "A. Hudomal, \"New Periodic Three-Body Orbits,\" 等质量平面三体周期轨道公开初始条件表。",
        url: initialConditionsUrl,
      },
      {
        id: "3",
        citation:
          "S. J. Liao, \"A comment on Three Classes of Newtonian Three-Body Planar Periodic Orbits,\" 15 位小数初始条件和稳定性讨论。",
        url: highPrecisionCommentUrl,
      },
      {
        id: "4",
        citation:
          "J. R. Dormand and P. J. Prince, \"A family of embedded Runge-Kutta formulae,\" Journal of Computational and Applied Mathematics, 6(1), 19-26, 1980. DOI: 10.1016/0771-050X(80)90013-3.",
        url: "https://doi.org/10.1016/0771-050X(80)90013-3",
      },
      {
        id: "5",
        citation:
          "X. Li and S. Liao, \"Discovery of 10,059 new three-dimensional periodic orbits of general three-body problem,\" arXiv:2508.08568, 2025；初始条件数据见 sjtu-liao/three-body。",
        url: threeDArxivUrl,
      },
      {
        id: "6",
        citation:
          "X. Li and S. Liao, \"On the stability of the three classes of Newtonian three-body planar periodic orbits,\" Science China Physics, Mechanics & Astronomy, 57, 2121-2126, 2014。DOI: 10.1007/s11433-014-5563-5。",
        url: "https://doi.org/10.1007/s11433-014-5563-5",
      },
    ],
  },
};

const screenedPublicPresetMeta = {
  "butterfly-i-2b": { label: "I.2.B", p1: "0.392955", p2: "0.097579", period: "7.003707" },
  "butterfly-i-5a": { label: "I.5.A", p1: "0.411293", p2: "0.260755", period: "20.749072" },
  "butterfly-iii-6a": { label: "IVb.6.A", p1: "0.414913", p2: "0.274619", period: "27.664651" },
  "butterfly-iii-11a": { label: "IVb.11.A", p1: "0.395637", p2: "0.154450", period: "41.788445" },
  "moth-i-8f": { label: "IVa.8.F", p1: "0.401574", p2: "0.490047", period: "54.087338" },
  "moth-vii-b-7a": { label: "VIIb.7.A", p1: "0.409495", p2: "0.362823", period: "33.867761" },
  "figure-eight-v7c": { label: "V.7.C", p1: "0.255431", p2: "0.516386", period: "35.043086" },
  "figure-eight-v11a": { label: "V.11.A", p1: "0.202217", p2: "0.531104", period: "53.620586" },
  "figure-eight-v14a": { label: "V.14.A", p1: "0.230004", p2: "0.532303", period: "71.010663" },
} as const;

type ScreenedPublicPresetSlug = keyof typeof screenedPublicPresetMeta;

const screenedPublicPresetCopy: Record<
  Locale,
  Record<ScreenedPublicPresetSlug, Pick<SolutionText, "family" | "name" | "summary">>
> = {
  en: {
    "butterfly-i-2b": {
      family: "Periodic choreography",
      name: "Butterfly I 2B",
      summary: "A compact alternate Butterfly I loop with a tight central crossing.",
    },
    "butterfly-i-5a": {
      family: "Periodic choreography",
      name: "Butterfly I 5A",
      summary: "A longer butterfly-family orbit with a broader woven loop.",
    },
    "butterfly-iii-6a": {
      family: "Periodic choreography",
      name: "Butterfly III 6A",
      summary: "A medium-period Butterfly III loop with repeated compact crossings.",
    },
    "butterfly-iii-11a": {
      family: "Periodic choreography",
      name: "Butterfly III 11A",
      summary: "A longer Butterfly III variant with a compact repeated crossing pattern.",
    },
    "moth-i-8f": {
      family: "Periodic choreography",
      name: "Moth I 8F",
      summary: "A long moth-family entry whose one-period trace fills a wider winged shape.",
    },
    "moth-vii-b-7a": {
      family: "Periodic choreography",
      name: "Moth VIIb 7A",
      summary: "A VIIb moth-family orbit with a dense but still readable crossing structure.",
    },
    "figure-eight-v7c": {
      family: "Figure-eight family",
      name: "Figure-eight V.7.C",
      summary: "A figure-eight-family variant with a longer looping choreography.",
    },
    "figure-eight-v11a": {
      family: "Figure-eight family",
      name: "Figure-eight V.11.A",
      summary: "A longer figure-eight-family preset that stays compact while the pattern develops.",
    },
    "figure-eight-v14a": {
      family: "Figure-eight family",
      name: "Figure-eight V.14.A",
      summary: "A long-period figure-eight-family path with many compact returns.",
    },
  },
  ja: {
    "butterfly-i-2b": {
      family: "周期コレオグラフィー",
      name: "Butterfly I 2B",
      summary: "中心で締まった交差を作る、Butterfly I 系の小さなループです。",
    },
    "butterfly-i-5a": {
      family: "周期コレオグラフィー",
      name: "Butterfly I 5A",
      summary: "より長い周期で、広めに編み込む Butterfly 系の軌道です。",
    },
    "butterfly-iii-6a": {
      family: "周期コレオグラフィー",
      name: "Butterfly III 6A",
      summary: "小さな交差を繰り返す、中周期の Butterfly III 系ループです。",
    },
    "butterfly-iii-11a": {
      family: "周期コレオグラフィー",
      name: "Butterfly III 11A",
      summary: "交差が詰まった模様を作る、長めの Butterfly III 変種です。",
    },
    "moth-i-8f": {
      family: "周期コレオグラフィー",
      name: "Moth I 8F",
      summary: "1周期の参照線が大きな羽状に広がる、長周期の Moth 系エントリです。",
    },
    "moth-vii-b-7a": {
      family: "周期コレオグラフィー",
      name: "Moth VIIb 7A",
      summary: "密な交差を持ちながら形を読み取りやすい VIIb 系 Moth 軌道です。",
    },
    "figure-eight-v7c": {
      family: "8の字ファミリー",
      name: "Figure-eight V.7.C",
      summary: "より長いループを持つ、8の字ファミリーの変種です。",
    },
    "figure-eight-v11a": {
      family: "8の字ファミリー",
      name: "Figure-eight V.11.A",
      summary: "長周期でもコンパクトに模様が育つ、8の字ファミリーのプリセットです。",
    },
    "figure-eight-v14a": {
      family: "8の字ファミリー",
      name: "Figure-eight V.14.A",
      summary: "多数の小さな戻りを重ねる、長周期の8の字ファミリー軌道です。",
    },
  },
  zh: {
    "butterfly-i-2b": {
      family: "周期编舞轨道",
      name: "Butterfly I 2B",
      summary: "Butterfly I 族的紧凑小回路，中心交叉较集中。",
    },
    "butterfly-i-5a": {
      family: "周期编舞轨道",
      name: "Butterfly I 5A",
      summary: "周期更长、编织范围更宽的 butterfly 族轨道。",
    },
    "butterfly-iii-6a": {
      family: "周期编舞轨道",
      name: "Butterfly III 6A",
      summary: "中等周期 Butterfly III 回路，反复形成紧凑交叉。",
    },
    "butterfly-iii-11a": {
      family: "周期编舞轨道",
      name: "Butterfly III 11A",
      summary: "较长的 Butterfly III 变体，形成紧凑的重复交叉图案。",
    },
    "moth-i-8f": {
      family: "周期编舞轨道",
      name: "Moth I 8F",
      summary: "长周期 moth 族条目，一个周期的轨迹展开成较宽的翼状图案。",
    },
    "moth-vii-b-7a": {
      family: "周期编舞轨道",
      name: "Moth VIIb 7A",
      summary: "VIIb moth 族轨道，交叉密集但仍较易辨认。",
    },
    "figure-eight-v7c": {
      family: "8 字形族",
      name: "Figure-eight V.7.C",
      summary: "8 字形族的一个变体，具有更长的循环编舞。",
    },
    "figure-eight-v11a": {
      family: "8 字形族",
      name: "Figure-eight V.11.A",
      summary: "周期更长但整体保持紧凑的 8 字形族预设。",
    },
    "figure-eight-v14a": {
      family: "8 字形族",
      name: "Figure-eight V.14.A",
      summary: "长周期 8 字形族轨道，包含多次紧凑回返。",
    },
  },
};

function makeScreenedPublicPresetText(locale: Locale): Record<string, SolutionText> {
  return Object.fromEntries(
    (Object.keys(screenedPublicPresetMeta) as ScreenedPublicPresetSlug[]).map((slug) => {
      const meta = screenedPublicPresetMeta[slug];
      const copy = screenedPublicPresetCopy[locale][slug];

      if (locale === "ja") {
        return [
          slug,
          {
            ...copy,
            summary: `軌道: ${copy.summary}`,
            stabilityLabel: "周期解 / 公開表",
            stabilitySummary:
              "状態: 公開表の6桁初期条件をRK45でスクリーニングした可視化用プリセットです。長時間では崩れることがあります。",
            sourceNote: `出典: [2] 公開初期条件表 ${meta.label}; p1 = ${meta.p1}, p2 = ${meta.p2}, T = ${meta.period}。`,
            sourceUrl: initialConditionsUrl,
            sourceLinkLabel: "初期条件表PDFを開く",
          },
        ];
      }

      if (locale === "zh") {
        return [
          slug,
          {
            ...copy,
            summary: `轨道: ${copy.summary}`,
            stabilityLabel: "周期解 / 公开表",
            stabilitySummary:
              "状态: 这是用公开表六位小数初始条件经 RK45 筛选的可视化预设。长时间播放时可能会漂移或逃逸。",
            sourceNote: `来源: [2] 公开初始条件表 ${meta.label}; p1 = ${meta.p1}, p2 = ${meta.p2}, T = ${meta.period}。`,
            sourceUrl: initialConditionsUrl,
            sourceLinkLabel: "打开初始条件 PDF",
          },
        ];
      }

      return [
        slug,
        {
          ...copy,
          summary: `Orbit: ${copy.summary}`,
          stabilityLabel: "Periodic / public table",
          stabilitySummary:
            "Status: visualization preset screened with RK45 from six-decimal public-table data. Long playback may drift or escape.",
          sourceNote: `Source: [2] initial-condition table ${meta.label}; p1 = ${meta.p1}, p2 = ${meta.p2}, T = ${meta.period}.`,
          sourceUrl: initialConditionsUrl,
          sourceLinkLabel: "Open the initial-conditions PDF",
        },
      ];
    }),
  );
}

const solutionText: Record<Locale, Record<string, SolutionText>> = {
  en: {
    "figure-eight": {
      family: "Equal-mass choreography",
      name: "Figure-eight orbit",
      stabilityLabel: "Stable / classic",
      stabilitySummary:
        "Status: linearly stable in the Hamiltonian, non-dissipative sense. Perturbations need not decay, but they do not immediately grow exponentially.",
      summary:
        "Orbit: three equal masses chase one another around the same horizontal figure-eight curve.",
      sourceNote: "Source: classic Chenciner-Montgomery planar solution.",
    },
    "lagrange-equilateral": {
      family: "Relative equilibrium",
      name: "Lagrange equilateral",
      stabilityLabel: "Unstable / exact",
      stabilitySummary:
        "Status: exact relative equilibrium, but unstable for equal masses by the classical Routh-Gascheau condition.",
      summary:
        "Orbit: the bodies keep an equilateral triangle shape while the whole system rotates.",
      sourceNote: "Source: one of Euler and Lagrange's classical central configurations.",
    },
    "butterfly-i": {
      family: "Periodic choreography",
      name: "Butterfly I",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. It remains sensitive to perturbation and numerical settings, but closes well with the RK45 default.",
      summary: "Orbit: three equal masses weave a compact butterfly-like loop from a symmetric collinear start.",
      sourceNote:
        "Source: [3] 15-decimal Butterfly I condition; p1 = 0.306892758965492, p2 = 0.125506782829762, T = 6.23564136316479.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    ...makeScreenedPublicPresetText("en"),
    goggles: {
      family: "Periodic choreography",
      name: "Goggles",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. It is intended for RK45 playback as a visualization, not as a proof-grade integrator result.",
      summary: "Orbit: three bodies draw a tight looped pattern resembling paired lenses.",
      sourceNote:
        "Source: [3] 15-decimal Goggles condition; p1 = 0.0833000564575194, p2 = 0.127889282226563, T = 10.4668176954385.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    "yin-yang-i-a": {
      family: "Periodic choreography",
      name: "Yin-yang I alpha",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. It is one crossing of the Yin-yang I family and is best viewed with RK45.",
      summary: "Orbit: a balanced two-lobed periodic pattern with a yin-yang-like structure.",
      sourceNote:
        "Source: [3] 15-decimal Yin-yang I alpha condition; p1 = 0.513938054919243, p2 = 0.304736003875733, T = 17.328369755004.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    "yin-yang-i-b": {
      family: "Periodic choreography",
      name: "Yin-yang I beta",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. It is the second crossing of the Yin-yang I family and is best viewed with RK45.",
      summary: "Orbit: a smaller two-lobed yin-yang-like periodic pattern.",
      sourceNote:
        "Source: [3] 15-decimal Yin-yang I beta condition; p1 = 0.282698682308198, p2 = 0.327208786129952, T = 10.9625630756217.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    "moth-i": {
      family: "Periodic choreography",
      name: "Moth I",
      stabilityLabel: "Periodic / public table",
      stabilitySummary:
        "Status: public-table six-decimal preset. It behaves well in this viewer, but it is still a visualization preset.",
      summary: "Orbit: a wing-like equal-mass periodic orbit with broad moth-shaped loops.",
      sourceNote: "Source: [2] public initial-condition table IVa.2.A.",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "Open the initial-conditions PDF",
    },
    "moth-iii": {
      family: "Periodic choreography",
      name: "Moth III",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. The long period makes it numerically sensitive, so RK45 is the preferred playback mode.",
      summary: "Orbit: a wide moth-like periodic orbit with a longer period.",
      sourceNote:
        "Source: [3] 15-decimal Moth III condition; p1 = 0.383443534851074, p2 = 0.377363693237305, T = 25.8406180475758.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    dragonfly: {
      family: "Periodic choreography",
      name: "Dragonfly",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. It closes best in this viewer with the RK45 default.",
      summary: "Orbit: a periodic orbit with long crossing strokes and a dragonfly-like outline.",
      sourceNote:
        "Source: [3] 15-decimal Dragonfly condition; p1 = 0.080584285736084, p2 = 0.588836087036132, T = 21.2709751966648.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    yarn: {
      family: "Periodic choreography",
      name: "Yarn",
      stabilityLabel: "Periodic / high precision",
      stabilitySummary:
        "Status: 15-decimal high-precision preset. It is a long-period orbit and should be viewed with the RK45 default.",
      summary: "Orbit: a long looping path that builds into a dense yarn-like pattern.",
      sourceNote:
        "Source: [3] 15-decimal Yarn condition; p1 = 0.559064247131347, p2 = 0.349191558837891, T = 55.5017624421301.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    pythagorean: {
      family: "Chaotic scattering / escape",
      name: "Pythagorean three-body",
      stabilityLabel: "Transient / escape",
      stabilitySummary:
        "Status: not a periodic or stable solution. It is a chaotic scattering benchmark where escape is expected.",
      summary:
        "Orbit: masses 3, 4, and 5 begin at a 3-4-5 triangle, fall inward, and scatter apart.",
      sourceNote: "Source: classic Pythagorean three-body scattering benchmark.",
    },
    "spatial-o3-equal-mass": {
      family: "3D equal-mass periodic orbit",
      name: "Spatial O3",
      stabilityLabel: "3D periodic / stable",
      stabilitySummary:
        "Status: linearly stable in Li and Liao's 3D initial-condition table. This viewer shows a rotating projection of the spatial trajectory.",
      summary:
        "Orbit: a short-period equal-mass spatial loop that rises out of the original line configuration.",
      sourceNote:
        "Source: [5] Li-Liao 3D table O_3(1.0); z0 = 0.476878264280312, T = 6.83162203628444.",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "Open the 3D initial-condition set",
    },
    "spatial-o4-equal-mass": {
      family: "3D equal-mass periodic orbit",
      name: "Spatial O4",
      stabilityLabel: "3D periodic / stable",
      stabilitySummary:
        "Status: linearly stable in the published 3D table. The orbit is compact, so it is a good first 3D playback preset.",
      summary:
        "Orbit: a compact three-dimensional periodic motion with a low vertical offset and visible depth weave.",
      sourceNote:
        "Source: [5] Li-Liao 3D table O_4(1.0); z0 = 0.106564650719102, T = 7.23030545798305.",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "Open the 3D initial-condition set",
    },
    "spatial-o7-equal-mass": {
      family: "3D equal-mass periodic orbit",
      name: "Spatial O7",
      stabilityLabel: "3D periodic / stable",
      stabilitySummary:
        "Status: linearly stable in the published 3D table. Longer playback reveals more of the spatial folding.",
      summary:
        "Orbit: a longer equal-mass spatial orbit with a stronger out-of-plane swing.",
      sourceNote:
        "Source: [5] Li-Liao 3D table O_7(1.0); z0 = -0.310609261713568, T = 13.9816179875663.",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "Open the 3D initial-condition set",
    },
  },
  ja: {
    "figure-eight": {
      family: "等質量コレオグラフィー",
      name: "8の字軌道",
      stabilityLabel: "安定 / 古典解",
      stabilitySummary:
        "状態: ハミルトン系の非散逸的な意味で線形安定です。摂動は減衰しませんが、すぐ指数的に離れるわけでもありません。",
      summary: "軌道: 3つの等質量天体が、同じ水平な8の字曲線を追いかけます。",
      sourceNote: "出典: Chenciner-Montgomery による古典的な平面解。",
    },
    "lagrange-equilateral": {
      family: "相対平衡",
      name: "Lagrange 正三角形配置",
      stabilityLabel: "不安定 / 厳密解",
      stabilitySummary:
        "状態: 厳密な相対平衡解ですが、等質量では古典的な Routh-Gascheau 条件を満たさず不安定です。",
      summary: "軌道: 3天体が正三角形を保ったまま、系全体として回転します。",
      sourceNote: "出典: Euler と Lagrange による古典的な中心配置のひとつ。",
    },
    "butterfly-i": {
      family: "周期コレオグラフィー",
      name: "Butterfly I",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。摂動や数値設定には敏感ですが、RK45デフォルトではよく閉じます。",
      summary: "軌道: 3つの等質量天体が、対称な直線配置から蝶のような小さなループを描きます。",
      sourceNote:
        "出典: [3] 15桁 Butterfly I 条件; p1 = 0.306892758965492, p2 = 0.125506782829762, T = 6.23564136316479。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    ...makeScreenedPublicPresetText("ja"),
    goggles: {
      family: "周期コレオグラフィー",
      name: "Goggles",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。厳密証明用ではなく、RK45表示向けの可視化用データです。",
      summary: "軌道: 3天体が、左右のレンズのような締まったループを描きます。",
      sourceNote:
        "出典: [3] 15桁 Goggles 条件; p1 = 0.0833000564575194, p2 = 0.127889282226563, T = 10.4668176954385。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    "yin-yang-i-a": {
      family: "周期コレオグラフィー",
      name: "Yin-yang I alpha",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。Yin-yang I ファミリーの一つの通過点から始まります。",
      summary: "軌道: 陰陽図のような、2つの大きな葉を持つ周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Yin-yang I alpha 条件; p1 = 0.513938054919243, p2 = 0.304736003875733, T = 17.328369755004。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    "yin-yang-i-b": {
      family: "周期コレオグラフィー",
      name: "Yin-yang I beta",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。Yin-yang I ファミリーの別の通過点から始まります。",
      summary: "軌道: より小さくまとまった、2葉の陰陽図的な周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Yin-yang I beta 条件; p1 = 0.282698682308198, p2 = 0.327208786129952, T = 10.9625630756217。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    "moth-i": {
      family: "周期コレオグラフィー",
      name: "Moth I",
      stabilityLabel: "周期解 / 公開表",
      stabilitySummary:
        "状態: 公開表の6桁初期条件を使う可視化用プリセットです。このビューアでは比較的よく保たれます。",
      summary: "軌道: 大きな羽のようなループを持つ、等質量の周期軌道です。",
      sourceNote: "出典: [2] 公開初期条件表 IVa.2.A。",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "初期条件表PDFを開く",
    },
    "moth-iii": {
      family: "周期コレオグラフィー",
      name: "Moth III",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。長周期で数値的に敏感なため、RK45での表示を前提にしています。",
      summary: "軌道: 長周期で大きく広がる、蛾のような周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Moth III 条件; p1 = 0.383443534851074, p2 = 0.377363693237305, T = 25.8406180475758。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    dragonfly: {
      family: "周期コレオグラフィー",
      name: "Dragonfly",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。RK45デフォルトでの表示に向いています。",
      summary: "軌道: 長い交差ストロークを持つ、トンボのような輪郭の周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Dragonfly 条件; p1 = 0.080584285736084, p2 = 0.588836087036132, T = 21.2709751966648。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    yarn: {
      family: "周期コレオグラフィー",
      name: "Yarn",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状態: 15桁初期条件の高精度プリセットです。長周期なので、RK45デフォルトでの表示を前提にしています。",
      summary: "軌道: 長いループが少しずつ重なり、糸玉のような模様を作ります。",
      sourceNote:
        "出典: [3] 15桁 Yarn 条件; p1 = 0.559064247131347, p2 = 0.349191558837891, T = 55.5017624421301。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    pythagorean: {
      family: "カオス的散乱・脱出",
      name: "Pythagorean three-body",
      stabilityLabel: "過渡軌道 / 脱出",
      stabilitySummary:
        "状態: 周期解でも安定解でもありません。近接遭遇後に脱出することが特徴の散乱ベンチマークです。",
      summary: "軌道: 質量 3、4、5 の天体を 3-4-5 三角形から始め、近接遭遇を経て散乱させます。",
      sourceNote: "出典: 古典的な Pythagorean three-body 散乱ベンチマーク。",
    },
    "spatial-o3-equal-mass": {
      family: "3D等質量周期軌道",
      name: "Spatial O3",
      stabilityLabel: "3D周期解 / 安定",
      stabilitySummary:
        "状態: Li と Liao の3D初期条件表では線形安定です。このビューアでは空間軌道を回転投影して表示します。",
      summary: "軌道: 直線配置から面外へ立ち上がる、短周期の等質量3Dループです。",
      sourceNote:
        "出典: [5] Li-Liao 3D表 O_3(1.0); z0 = 0.476878264280312, T = 6.83162203628444。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "3D初期条件セットを開く",
    },
    "spatial-o4-equal-mass": {
      family: "3D等質量周期軌道",
      name: "Spatial O4",
      stabilityLabel: "3D周期解 / 安定",
      stabilitySummary:
        "状態: 公開3D表では線形安定です。コンパクトなので、最初に見る3Dプリセットとして扱いやすいものです。",
      summary: "軌道: 小さめの鉛直オフセットから、奥行きのある編み込みを作る3D周期運動です。",
      sourceNote:
        "出典: [5] Li-Liao 3D表 O_4(1.0); z0 = 0.106564650719102, T = 7.23030545798305。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "3D初期条件セットを開く",
    },
    "spatial-o7-equal-mass": {
      family: "3D等質量周期軌道",
      name: "Spatial O7",
      stabilityLabel: "3D周期解 / 安定",
      stabilitySummary:
        "状態: 公開3D表では線形安定です。長めに再生すると、空間的な折り返しが見えてきます。",
      summary: "軌道: 面外への振れが大きい、やや長周期の等質量3D軌道です。",
      sourceNote:
        "出典: [5] Li-Liao 3D表 O_7(1.0); z0 = -0.310609261713568, T = 13.9816179875663。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "3D初期条件セットを開く",
    },
  },
  zh: {
    "figure-eight": {
      family: "等质量编舞轨道",
      name: "8字形轨道",
      stabilityLabel: "稳定 / 经典解",
      stabilitySummary:
        "状态: 在哈密顿、非耗散意义下线性稳定。扰动不会衰减，但也不会立刻指数式远离。",
      summary: "轨道: 三个等质量天体沿同一条水平 8 字形曲线相互追逐。",
      sourceNote: "来源: 经典 Chenciner-Montgomery 平面解。",
    },
    "lagrange-equilateral": {
      family: "相对平衡",
      name: "Lagrange 等边三角形",
      stabilityLabel: "不稳定 / 精确解",
      stabilitySummary:
        "状态: 这是精确相对平衡解，但等质量情形不满足经典 Routh-Gascheau 稳定条件。",
      summary: "轨道: 三个天体保持等边三角形形状，同时整个系统旋转。",
      sourceNote: "来源: Euler 和 Lagrange 的经典中心配置之一。",
    },
    "butterfly-i": {
      family: "周期编舞轨道",
      name: "Butterfly I",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。它对扰动和数值设置敏感，但在默认 RK45 下闭合较好。",
      summary: "轨道: 三个等质量天体从对称共线初态出发，织出紧凑的蝴蝶状回路。",
      sourceNote:
        "来源: [3] 15 位小数 Butterfly I 条件; p1 = 0.306892758965492, p2 = 0.125506782829762, T = 6.23564136316479。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    ...makeScreenedPublicPresetText("zh"),
    goggles: {
      family: "周期编舞轨道",
      name: "Goggles",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。它是面向 RK45 播放的可视化数据，不是严格证明用积分结果。",
      summary: "轨道: 三个天体画出类似一副镜片的紧凑环形图案。",
      sourceNote:
        "来源: [3] 15 位小数 Goggles 条件; p1 = 0.0833000564575194, p2 = 0.127889282226563, T = 10.4668176954385。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    "yin-yang-i-a": {
      family: "周期编舞轨道",
      name: "Yin-yang I alpha",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。它从 Yin-yang I 族的一个穿越点开始。",
      summary: "轨道: 具有阴阳图式双叶结构的周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Yin-yang I alpha 条件; p1 = 0.513938054919243, p2 = 0.304736003875733, T = 17.328369755004。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    "yin-yang-i-b": {
      family: "周期编舞轨道",
      name: "Yin-yang I beta",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。它从 Yin-yang I 族的另一个穿越点开始。",
      summary: "轨道: 较紧凑的双叶阴阳图式周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Yin-yang I beta 条件; p1 = 0.282698682308198, p2 = 0.327208786129952, T = 10.9625630756217。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    "moth-i": {
      family: "周期编舞轨道",
      name: "Moth I",
      stabilityLabel: "周期解 / 公开表",
      stabilitySummary:
        "状态: 使用公开表六位小数初始条件的可视化预设。在本查看器中表现较稳定。",
      summary: "轨道: 具有宽大翼状回路的等质量周期轨道。",
      sourceNote: "来源: [2] 公开初始条件表 IVa.2.A。",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "打开初始条件 PDF",
    },
    "moth-iii": {
      family: "周期编舞轨道",
      name: "Moth III",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。由于周期较长且数值敏感，建议使用默认 RK45。",
      summary: "轨道: 周期较长、展开较大的蛾形周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Moth III 条件; p1 = 0.383443534851074, p2 = 0.377363693237305, T = 25.8406180475758。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    dragonfly: {
      family: "周期编舞轨道",
      name: "Dragonfly",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。适合用默认 RK45 播放。",
      summary: "轨道: 带有长交叉笔画、轮廓类似蜻蜓的周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Dragonfly 条件; p1 = 0.080584285736084, p2 = 0.588836087036132, T = 21.2709751966648。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    yarn: {
      family: "周期编舞轨道",
      name: "Yarn",
      stabilityLabel: "周期解 / 高精度",
      stabilitySummary:
        "状态: 使用 15 位小数初始条件的高精度预设。周期很长，适合用默认 RK45 播放。",
      summary: "轨道: 长回路逐渐叠加，形成类似线团的图案。",
      sourceNote:
        "来源: [3] 15 位小数 Yarn 条件; p1 = 0.559064247131347, p2 = 0.349191558837891, T = 55.5017624421301。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    pythagorean: {
      family: "混沌散射 / 逃逸",
      name: "勾股三体问题",
      stabilityLabel: "暂态轨道 / 逃逸",
      stabilitySummary:
        "状态: 这不是周期解或稳定解。它是以近距离遭遇后逃逸为特征的散射基准。",
      summary: "轨道: 质量为 3、4、5 的天体从 3-4-5 三角形开始，经过近距离遭遇后散射开。",
      sourceNote: "来源: 经典 Pythagorean three-body 散射基准。",
    },
    "spatial-o3-equal-mass": {
      family: "3D 等质量周期轨道",
      name: "Spatial O3",
      stabilityLabel: "3D 周期解 / 稳定",
      stabilitySummary:
        "状态: 在 Li 和 Liao 的 3D 初始条件表中线性稳定。本查看器以旋转投影显示空间轨道。",
      summary: "轨道: 从共线初态向面外展开的短周期等质量 3D 回路。",
      sourceNote:
        "来源: [5] Li-Liao 3D 表 O_3(1.0); z0 = 0.476878264280312, T = 6.83162203628444。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "打开 3D 初始条件集",
    },
    "spatial-o4-equal-mass": {
      family: "3D 等质量周期轨道",
      name: "Spatial O4",
      stabilityLabel: "3D 周期解 / 稳定",
      stabilitySummary:
        "状态: 在公开 3D 表中线性稳定。轨道较紧凑，适合作为第一个 3D 播放预设。",
      summary: "轨道: 低垂直偏移的紧凑三维周期运动，能看到明显的深度编织。",
      sourceNote:
        "来源: [5] Li-Liao 3D 表 O_4(1.0); z0 = 0.106564650719102, T = 7.23030545798305。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "打开 3D 初始条件集",
    },
    "spatial-o7-equal-mass": {
      family: "3D 等质量周期轨道",
      name: "Spatial O7",
      stabilityLabel: "3D 周期解 / 稳定",
      stabilitySummary:
        "状态: 在公开 3D 表中线性稳定。较长播放可以看到更多空间折叠。",
      summary: "轨道: 面外摆动更强的较长等质量空间轨道。",
      sourceNote:
        "来源: [5] Li-Liao 3D 表 O_7(1.0); z0 = -0.310609261713568, T = 13.9816179875663。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "打开 3D 初始条件集",
    },
  },
};

function detectLocale(): Locale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  const match = languages.find((language) => {
    const normalized = language.toLowerCase();
    return normalized.startsWith("ja") || normalized.startsWith("zh") || normalized.startsWith("en");
  });

  if (!match) {
    return "en";
  }

  const normalized = match.toLowerCase();
  if (normalized.startsWith("ja")) {
    return "ja";
  }
  if (normalized.startsWith("zh")) {
    return "zh";
  }
  return "en";
}

function isLocalePreference(value: string | null): value is LocalePreference {
  return value === "auto" || value === "en" || value === "ja" || value === "zh";
}

function readLocalePreference(): LocalePreference {
  if (typeof window === "undefined") {
    return "auto";
  }

  const stored = window.localStorage.getItem(localeStorageKey);
  return isLocalePreference(stored) ? stored : "auto";
}

function resolveLocale(preference: LocalePreference): Locale {
  return preference === "auto" ? detectLocale() : preference;
}

export function useLocalePreference() {
  const [preference, setPreferenceState] = useState<LocalePreference>("auto");
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const syncLocalePreference = () => {
      const nextPreference = readLocalePreference();
      setPreferenceState(nextPreference);
      setLocale(resolveLocale(nextPreference));
    };

    syncLocalePreference();
    window.addEventListener("storage", syncLocalePreference);
    window.addEventListener("languagechange", syncLocalePreference);
    window.addEventListener(localeChangeEvent, syncLocalePreference);

    return () => {
      window.removeEventListener("storage", syncLocalePreference);
      window.removeEventListener("languagechange", syncLocalePreference);
      window.removeEventListener(localeChangeEvent, syncLocalePreference);
    };
  }, []);

  const setPreference = useCallback((nextPreference: LocalePreference) => {
    if (nextPreference === "auto") {
      window.localStorage.removeItem(localeStorageKey);
    } else {
      window.localStorage.setItem(localeStorageKey, nextPreference);
    }
    window.dispatchEvent(new Event(localeChangeEvent));
  }, []);

  return useMemo(
    () => ({ locale, preference, setPreference }),
    [locale, preference, setPreference],
  );
}

export function useLocale() {
  return useLocalePreference().locale;
}

export function useUiText() {
  const { locale, preference, setPreference } = useLocalePreference();
  return useMemo(
    () => ({ locale, preference, setPreference, t: uiText[locale] }),
    [locale, preference, setPreference],
  );
}

export function useSolutionText(slug: string) {
  const locale = useLocale();
  return useMemo(
    () => ({ locale, text: solutionText[locale][slug] ?? solutionText.en[slug] }),
    [locale, slug],
  );
}
