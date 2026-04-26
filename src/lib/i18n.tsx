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

type GuideItemText = {
  label: string;
  body: string;
};

type UiText = {
  appTitle: string;
  heroTitle: string;
  heroBody: string;
  catalogNote: string;
  solutionGridLabel: string;
  classificationGuideTitle: string;
  classificationGuideBody: string;
  familyGuideTitle: string;
  familyGuideItems: GuideItemText[];
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
      "Orbit type and stability are shown separately. Most entries are periodic solutions; Lagrange is a relative equilibrium, and Pythagorean is a transient scattering example. Li and Liao [6] explicitly checked the original 15 planar examples: this app marks the seven Table 1 cases as unstable, the Table 3 matches included here as stable, and leaves less certain derived presets unverified.",
    familyGuideTitle: "Card family names",
    familyGuideItems: [
      {
        label: "Choreography",
        body: "Three bodies follow one shared curve with a time shift.",
      },
      {
        label: "Relative equilibrium",
        body: "The shape stays fixed while the whole configuration rotates.",
      },
      {
        label: "Family",
        body: "A named group of related periodic orbits, such as butterfly, moth, or figure-eight variants.",
      },
      {
        label: "Scattering / escape",
        body: "A non-periodic close-encounter example where one or more bodies eventually leave.",
      },
    ],
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
      "The 3D tab collects a curated subset of equal-mass spatial periodic-orbit initial conditions reported by Li and Liao [5].",
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
      "このアプリでは「軌道型」と「安定性」を分けて表示します。ほとんどは周期解ですが、Lagrange は形を保って回る相対平衡、Pythagorean は周期解ではない過渡的な散乱例です。Li と Liao [6] は元の15個の平面例を調べており、このアプリでは Table 1 の7例を不安定、収録済みの Table 3 対応例を安定、対応が曖昧な派生プリセットを未確認として表示します。",
    familyGuideTitle: "カード上部の族名",
    familyGuideItems: [
      {
        label: "コレオグラフィー",
        body: "3天体が時間差をつけて同じ曲線をたどるタイプです。",
      },
      {
        label: "相対平衡",
        body: "天体同士の形を保ったまま、配置全体が回転する解です。",
      },
      {
        label: "ファミリー",
        body: "Butterfly、Moth、8の字変種のような、似た形や対称性を持つ周期解のまとまりです。",
      },
      {
        label: "散乱・脱出",
        body: "周期解ではなく、近接遭遇のあとに天体が遠方へ離れていく例です。",
      },
    ],
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
      "3Dタブでは、Li と Liao による等質量3D周期軌道の初期条件 [5] から、見やすいものを選んで収録しています。",
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
      "本应用把轨道类型和稳定性分开显示。大多数条目是周期解；Lagrange 是保持形状旋转的相对平衡，Pythagorean 是非周期的暂态散射例。Li 和 Liao [6] 检查了最初 15 个平面例子：本应用把 Table 1 的七个例子标为不稳定，把已收录且对应 Table 3 的例子标为稳定，其余对应不够确定的派生预设仍标为未确认。",
    familyGuideTitle: "卡片顶部的族名",
    familyGuideItems: [
      {
        label: "编舞轨道",
        body: "三个天体以时间差沿同一条曲线运动。",
      },
      {
        label: "相对平衡",
        body: "天体之间的形状保持不变，整个构型一起旋转。",
      },
      {
        label: "轨道族",
        body: "Butterfly、Moth、8 字形变体等具有相近形状或对称性的周期解分组。",
      },
      {
        label: "散射 / 逃逸",
        body: "不是周期解，而是近距离遭遇后有天体远离的例子。",
      },
    ],
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
      "3D 标签页从 Li 和 Liao 报告的等质量三维周期轨道初始条件 [5] 中选取较适合观看的一部分。",
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
      name: "Butterfly II",
      summary: "A compact butterfly-family loop with a tight central crossing.",
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
      name: "Butterfly II",
      summary: "中心で締まった交差を作る、Butterfly 系の小さなループです。",
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
      name: "Butterfly II",
      summary: "Butterfly 族的紧凑小回路，中心交叉较集中。",
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
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this among seven original planar cases that depart from the reported periodic orbit in long high-precision CNS runs.",
      summary: "Orbit: three equal masses weave a compact butterfly-like loop from a symmetric collinear start.",
      sourceNote:
        "Source: [3] 15-decimal Butterfly I condition; p1 = 0.306892758965492, p2 = 0.125506782829762, T = 6.23564136316479.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    ...makeScreenedPublicPresetText("en"),
    "butterfly-i-2b": {
      family: "Periodic choreography",
      name: "Butterfly II",
      stabilityLabel: "Stable / public table",
      stabilitySummary:
        "Status: the matching 15-decimal Butterfly II case appears in Li and Liao's stable Table 3 [6]. This viewer uses the six-decimal public-table preset for visualization.",
      summary:
        "Orbit: a compact butterfly-family loop with a tight central crossing.",
      sourceNote:
        "Source: [2] public initial-condition table I.A.2.B; stability cross-check: [6] Table 3 Butterfly II.",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "Open the initial-conditions PDF",
    },
    goggles: {
      family: "Periodic choreography",
      name: "Goggles",
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this among seven original planar cases that eventually depart from the periodic orbit.",
      summary: "Orbit: three bodies draw a tight looped pattern resembling paired lenses.",
      sourceNote:
        "Source: [3] 15-decimal Goggles condition; p1 = 0.0833000564575194, p2 = 0.127889282226563, T = 10.4668176954385.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    "yin-yang-i-a": {
      family: "Periodic choreography",
      name: "Yin-yang I alpha",
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this Yin-yang I branch among the seven most possibly unstable original planar cases.",
      summary: "Orbit: a balanced two-lobed periodic pattern with a yin-yang-like structure.",
      sourceNote:
        "Source: [3] 15-decimal Yin-yang I alpha condition; p1 = 0.513938054919243, p2 = 0.304736003875733, T = 17.328369755004.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    "yin-yang-i-b": {
      family: "Periodic choreography",
      name: "Yin-yang I beta",
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this Yin-yang I branch among the seven most possibly unstable original planar cases.",
      summary: "Orbit: a smaller two-lobed yin-yang-like periodic pattern.",
      sourceNote:
        "Source: [3] 15-decimal Yin-yang I beta condition; p1 = 0.282698682308198, p2 = 0.327208786129952, T = 10.9625630756217.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    "moth-i": {
      family: "Periodic choreography",
      name: "Moth I",
      stabilityLabel: "Stable / public table",
      stabilitySummary:
        "Status: the matching 15-decimal Moth I case appears in Li and Liao's stable Table 3 [6]. This viewer uses the six-decimal public-table preset for visualization.",
      summary: "Orbit: a wing-like equal-mass periodic orbit with broad moth-shaped loops.",
      sourceNote: "Source: [2] public initial-condition table IVa.2.A.",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "Open the initial-conditions PDF",
    },
    "moth-iii": {
      family: "Periodic choreography",
      name: "Moth III",
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this among seven original planar cases that become non-periodic after a long enough interval.",
      summary: "Orbit: a wide moth-like periodic orbit with a longer period.",
      sourceNote:
        "Source: [3] 15-decimal Moth III condition; p1 = 0.383443534851074, p2 = 0.377363693237305, T = 25.8406180475758.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    dragonfly: {
      family: "Periodic choreography",
      name: "Dragonfly",
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this among seven original planar cases that drift away in long high-precision CNS runs.",
      summary: "Orbit: a periodic orbit with long crossing strokes and a dragonfly-like outline.",
      sourceNote:
        "Source: [3] 15-decimal Dragonfly condition; p1 = 0.080584285736084, p2 = 0.588836087036132, T = 21.2709751966648.",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "Open the high-precision condition note",
    },
    yarn: {
      family: "Periodic choreography",
      name: "Yarn",
      stabilityLabel: "Unstable / high precision",
      stabilitySummary:
        "Status: Li and Liao [6] list this among seven original planar cases that become non-periodic after a long enough interval.",
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
    "spatial-o9-equal-mass": {
      family: "3D equal-mass periodic orbit",
      name: "Spatial O9",
      stabilityLabel: "3D periodic / stable",
      stabilitySummary:
        "Status: linearly stable in Li and Liao's 3D initial-condition table. It adds a higher-energy spatial weave to the 3D set.",
      summary:
        "Orbit: a stable equal-mass spatial loop with a tall out-of-plane sweep and moderate period.",
      sourceNote:
        "Source: [5] Li-Liao 3D table O_9(1.0); z0 = 0.192548096928661, T = 19.6566389794529.",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "Open the 3D initial-condition set",
    },
    "spatial-o20-equal-mass": {
      family: "3D equal-mass periodic orbit",
      name: "Spatial O20",
      stabilityLabel: "3D periodic / stable",
      stabilitySummary:
        "Status: linearly stable in Li and Liao's 3D initial-condition table. It is longer than O9 but still practical for playback.",
      summary:
        "Orbit: a stable 3D equal-mass loop that builds a layered ribbon-like trace over one period.",
      sourceNote:
        "Source: [5] Li-Liao 3D table O_20(1.0); z0 = 0.144949067603394, T = 25.4311471535674.",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "Open the 3D initial-condition set",
    },
    "spatial-o27-equal-mass": {
      family: "3D equal-mass periodic orbit",
      name: "Spatial O27",
      stabilityLabel: "3D periodic / stable",
      stabilitySummary:
        "Status: linearly stable in Li and Liao's 3D initial-condition table. Its longer cycle makes the 3D tab feel less repetitive.",
      summary:
        "Orbit: a stable, longer-period spatial choreography with a compact central braid.",
      sourceNote:
        "Source: [5] Li-Liao 3D table O_27(1.0); z0 = 0.117108530067078, T = 31.7238726897393.",
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
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、長時間の高精度CNSで報告周期軌道から離れる7例のひとつとして扱われています。",
      summary: "軌道: 3つの等質量天体が、対称な直線配置から蝶のような小さなループを描きます。",
      sourceNote:
        "出典: [3] 15桁 Butterfly I 条件; p1 = 0.306892758965492, p2 = 0.125506782829762, T = 6.23564136316479。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    ...makeScreenedPublicPresetText("ja"),
    "butterfly-i-2b": {
      family: "周期コレオグラフィー",
      name: "Butterfly II",
      stabilityLabel: "安定 / 公開表",
      stabilitySummary:
        "状態: 対応する15桁 Butterfly II は Li と Liao の安定 Table 3 [6] に載っています。このビューアでは6桁の公開表プリセットを可視化に使います。",
      summary: "軌道: 中心で締まった交差を作る、Butterfly 系の小さなループです。",
      sourceNote:
        "出典: [2] 公開初期条件表 I.A.2.B。安定性の対応確認: [6] Table 3 Butterfly II。",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "初期条件表PDFを開く",
    },
    goggles: {
      family: "周期コレオグラフィー",
      name: "Goggles",
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、十分長い時間で周期軌道から離れる7例のひとつとして扱われています。",
      summary: "軌道: 3天体が、左右のレンズのような締まったループを描きます。",
      sourceNote:
        "出典: [3] 15桁 Goggles 条件; p1 = 0.0833000564575194, p2 = 0.127889282226563, T = 10.4668176954385。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    "yin-yang-i-a": {
      family: "周期コレオグラフィー",
      name: "Yin-yang I alpha",
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、Yin-yang I の不安定7例のひとつとして扱われています。",
      summary: "軌道: 陰陽図のような、2つの大きな葉を持つ周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Yin-yang I alpha 条件; p1 = 0.513938054919243, p2 = 0.304736003875733, T = 17.328369755004。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    "yin-yang-i-b": {
      family: "周期コレオグラフィー",
      name: "Yin-yang I beta",
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、Yin-yang I の不安定7例のひとつとして扱われています。",
      summary: "軌道: より小さくまとまった、2葉の陰陽図的な周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Yin-yang I beta 条件; p1 = 0.282698682308198, p2 = 0.327208786129952, T = 10.9625630756217。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    "moth-i": {
      family: "周期コレオグラフィー",
      name: "Moth I",
      stabilityLabel: "安定 / 公開表",
      stabilitySummary:
        "状態: 対応する15桁 Moth I は Li と Liao の安定 Table 3 [6] に載っています。このビューアでは6桁の公開表プリセットを可視化に使います。",
      summary: "軌道: 大きな羽のようなループを持つ、等質量の周期軌道です。",
      sourceNote: "出典: [2] 公開初期条件表 IVa.2.A。",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "初期条件表PDFを開く",
    },
    "moth-iii": {
      family: "周期コレオグラフィー",
      name: "Moth III",
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、十分長い時間で非周期的になる7例のひとつとして扱われています。",
      summary: "軌道: 長周期で大きく広がる、蛾のような周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Moth III 条件; p1 = 0.383443534851074, p2 = 0.377363693237305, T = 25.8406180475758。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    dragonfly: {
      family: "周期コレオグラフィー",
      name: "Dragonfly",
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、長時間の高精度CNSで周期軌道から離れる7例のひとつとして扱われています。",
      summary: "軌道: 長い交差ストロークを持つ、トンボのような輪郭の周期軌道です。",
      sourceNote:
        "出典: [3] 15桁 Dragonfly 条件; p1 = 0.080584285736084, p2 = 0.588836087036132, T = 21.2709751966648。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "高精度初期条件の資料を開く",
    },
    yarn: {
      family: "周期コレオグラフィー",
      name: "Yarn",
      stabilityLabel: "不安定 / 高精度",
      stabilitySummary:
        "状態: Li と Liao [6] では、十分長い時間で非周期的になる7例のひとつとして扱われています。",
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
    "spatial-o9-equal-mass": {
      family: "3D等質量周期軌道",
      name: "Spatial O9",
      stabilityLabel: "3D周期解 / 安定",
      stabilitySummary:
        "状態: Li と Liao の3D初期条件表では線形安定です。3Dタブに、より高く面外へ振れる軌道を追加します。",
      summary: "軌道: 面外への振れが大きく、中程度の周期を持つ安定な等質量3Dループです。",
      sourceNote:
        "出典: [5] Li-Liao 3D表 O_9(1.0); z0 = 0.192548096928661, T = 19.6566389794529。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "3D初期条件セットを開く",
    },
    "spatial-o20-equal-mass": {
      family: "3D等質量周期軌道",
      name: "Spatial O20",
      stabilityLabel: "3D周期解 / 安定",
      stabilitySummary:
        "状態: Li と Liao の3D初期条件表では線形安定です。O9より長いですが、再生しやすい範囲の3D例です。",
      summary: "軌道: 一周期でリボン状の層を作る、安定な等質量3Dループです。",
      sourceNote:
        "出典: [5] Li-Liao 3D表 O_20(1.0); z0 = 0.144949067603394, T = 25.4311471535674。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "3D初期条件セットを開く",
    },
    "spatial-o27-equal-mass": {
      family: "3D等質量周期軌道",
      name: "Spatial O27",
      stabilityLabel: "3D周期解 / 安定",
      stabilitySummary:
        "状態: Li と Liao の3D初期条件表では線形安定です。やや長い周期で、3Dタブの見え方に変化を出します。",
      summary: "軌道: 中心でコンパクトに編み込む、やや長周期の安定な空間コレオグラフィーです。",
      sourceNote:
        "出典: [5] Li-Liao 3D表 O_27(1.0); z0 = 0.117108530067078, T = 31.7238726897393。",
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
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将它列入七个在长时间高精度 CNS 运行中偏离报告周期轨道的原始平面例子。",
      summary: "轨道: 三个等质量天体从对称共线初态出发，织出紧凑的蝴蝶状回路。",
      sourceNote:
        "来源: [3] 15 位小数 Butterfly I 条件; p1 = 0.306892758965492, p2 = 0.125506782829762, T = 6.23564136316479。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    ...makeScreenedPublicPresetText("zh"),
    "butterfly-i-2b": {
      family: "周期编舞轨道",
      name: "Butterfly II",
      stabilityLabel: "稳定 / 公开表",
      stabilitySummary:
        "状态: 对应的 15 位 Butterfly II 出现在 Li 和 Liao 的稳定 Table 3 [6] 中。本查看器使用六位小数公开表预设进行可视化。",
      summary: "轨道: Butterfly 族的紧凑小回路，中心交叉较集中。",
      sourceNote:
        "来源: [2] 公开初始条件表 I.A.2.B；稳定性对应: [6] Table 3 Butterfly II。",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "打开初始条件 PDF",
    },
    goggles: {
      family: "周期编舞轨道",
      name: "Goggles",
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将它列入七个最终偏离周期轨道的原始平面例子。",
      summary: "轨道: 三个天体画出类似一副镜片的紧凑环形图案。",
      sourceNote:
        "来源: [3] 15 位小数 Goggles 条件; p1 = 0.0833000564575194, p2 = 0.127889282226563, T = 10.4668176954385。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    "yin-yang-i-a": {
      family: "周期编舞轨道",
      name: "Yin-yang I alpha",
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将这个 Yin-yang I 分支列入七个很可能不稳定的原始平面例子。",
      summary: "轨道: 具有阴阳图式双叶结构的周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Yin-yang I alpha 条件; p1 = 0.513938054919243, p2 = 0.304736003875733, T = 17.328369755004。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    "yin-yang-i-b": {
      family: "周期编舞轨道",
      name: "Yin-yang I beta",
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将这个 Yin-yang I 分支列入七个很可能不稳定的原始平面例子。",
      summary: "轨道: 较紧凑的双叶阴阳图式周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Yin-yang I beta 条件; p1 = 0.282698682308198, p2 = 0.327208786129952, T = 10.9625630756217。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    "moth-i": {
      family: "周期编舞轨道",
      name: "Moth I",
      stabilityLabel: "稳定 / 公开表",
      stabilitySummary:
        "状态: 对应的 15 位 Moth I 出现在 Li 和 Liao 的稳定 Table 3 [6] 中。本查看器使用六位小数公开表预设进行可视化。",
      summary: "轨道: 具有宽大翼状回路的等质量周期轨道。",
      sourceNote: "来源: [2] 公开初始条件表 IVa.2.A。",
      sourceUrl: initialConditionsUrl,
      sourceLinkLabel: "打开初始条件 PDF",
    },
    "moth-iii": {
      family: "周期编舞轨道",
      name: "Moth III",
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将它列入七个在足够长时间后变为非周期的原始平面例子。",
      summary: "轨道: 周期较长、展开较大的蛾形周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Moth III 条件; p1 = 0.383443534851074, p2 = 0.377363693237305, T = 25.8406180475758。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    dragonfly: {
      family: "周期编舞轨道",
      name: "Dragonfly",
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将它列入七个在长时间高精度 CNS 运行中偏离周期轨道的原始平面例子。",
      summary: "轨道: 带有长交叉笔画、轮廓类似蜻蜓的周期轨道。",
      sourceNote:
        "来源: [3] 15 位小数 Dragonfly 条件; p1 = 0.080584285736084, p2 = 0.588836087036132, T = 21.2709751966648。",
      sourceUrl: highPrecisionCommentUrl,
      sourceLinkLabel: "打开高精度初始条件资料",
    },
    yarn: {
      family: "周期编舞轨道",
      name: "Yarn",
      stabilityLabel: "不稳定 / 高精度",
      stabilitySummary:
        "状态: Li 和 Liao [6] 将它列入七个在足够长时间后变为非周期的原始平面例子。",
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
    "spatial-o9-equal-mass": {
      family: "3D 等质量周期轨道",
      name: "Spatial O9",
      stabilityLabel: "3D 周期解 / 稳定",
      stabilitySummary:
        "状态: 在 Li 和 Liao 的 3D 初始条件表中线性稳定。它为 3D 标签页加入更高的面外摆动。",
      summary: "轨道: 稳定的等质量空间回路，具有较高的面外扫动和中等周期。",
      sourceNote:
        "来源: [5] Li-Liao 3D 表 O_9(1.0); z0 = 0.192548096928661, T = 19.6566389794529。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "打开 3D 初始条件集",
    },
    "spatial-o20-equal-mass": {
      family: "3D 等质量周期轨道",
      name: "Spatial O20",
      stabilityLabel: "3D 周期解 / 稳定",
      stabilitySummary:
        "状态: 在 Li 和 Liao 的 3D 初始条件表中线性稳定。它比 O9 更长，但仍适合交互播放。",
      summary: "轨道: 稳定的 3D 等质量回路，一个周期内形成层叠的带状轨迹。",
      sourceNote:
        "来源: [5] Li-Liao 3D 表 O_20(1.0); z0 = 0.144949067603394, T = 25.4311471535674。",
      sourceUrl: threeDInitialConditionsUrl,
      sourceLinkLabel: "打开 3D 初始条件集",
    },
    "spatial-o27-equal-mass": {
      family: "3D 等质量周期轨道",
      name: "Spatial O27",
      stabilityLabel: "3D 周期解 / 稳定",
      stabilitySummary:
        "状态: 在 Li 和 Liao 的 3D 初始条件表中线性稳定。较长周期让 3D 标签页的图案更有变化。",
      summary: "轨道: 稳定、较长周期的空间编舞轨道，中心形成紧凑编织。",
      sourceNote:
        "来源: [5] Li-Liao 3D 表 O_27(1.0); z0 = 0.117108530067078, T = 31.7238726897393。",
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
