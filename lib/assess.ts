// Rule engine for the patient-assessment page. Every rule cites the guideline recommendation (R-id from data/recs.json)
// or the guideline text it was condensed from. It is decision support — not patient-specific orders.
export type Patient = {
  setting: "stable" | "new" | "afterDHF" | "inDHF";
  stage: "A" | "B" | "C" | "D";
  lvef: number | null;
  nyha: 1 | 2 | 3 | 4;
  aetiology: "ischaemic" | "nonischaemic" | "unknown";
  sbp: number | null; hr: number | null; qrs: number | null;
  egfr: number | null; k: number | null; ferritin: number | null; tsat: number | null; bmi: number | null;
  rhythm: "sinus" | "af" | "other"; lbbb: boolean;
  cur: string[]; // acei, arb, arni, bb, mra, sglt2
  co: string[];
};
export type Tier = "Acute" | "Foundational" | "Additional" | "Comorbidity" | "Interventional" | "Prevention" | "Care" | "Avoid";
export type Item = { tier: Tier; action: string; title: string; drugIds?: string[]; why: string; when: string; cautions: string[]; recs: string[] };
export type Alert = { level: "stop" | "warn" | "info"; text: string };
export type Result = {
  summary: string[]; alerts: Alert[]; items: Item[];
  timeline: { when: string; steps: string[] }[];
  monitoring: { group: string; rows: { what: string; why: string }[] }[];
  recIds: string[];
};

export const COMORBIDITIES: [string, string][] = [
  ["t2dm", "Type 2 diabetes"], ["t1dm", "Type 1 diabetes"], ["htn", "Hypertension"], ["ckd", "Chronic kidney disease"],
  ["cad", "Coronary artery disease"], ["angina", "Persistent angina despite FMT"], ["recentMI", "MI within last 40 days"],
  ["mr", "Severe secondary mitral regurgitation"], ["as", "Severe aortic stenosis"],
  ["copd", "COPD / lung disease"], ["osa", "Sleep apnoea – predominantly obstructive"], ["csa", "Sleep apnoea – predominantly central"],
  ["depression", "Anxiety / depression / frailty concern"], ["ttr", "Suspected/confirmed ATTR cardiac amyloidosis"],
  ["pregnancy", "Pregnant / planning pregnancy"], ["black", "Self-identified black patient"],
  ["hyperk", "History of hyperkalaemia"], ["hypoHx", "History of symptomatic hypotension"],
  ["aceIntol", "ACE-I/ARNI intolerance (cough/angio-oedema)"], ["bbIntol", "Beta-blocker intolerance"],
  ["congestion", "Congestion / fluid overload now"], ["vtSurvivor", "Survived haemodynamically unstable VT/VF"],
  ["pacing", "Conventional pacemaker/ICD with high RV pacing"], ["nsaid", "Using NSAIDs / COX-2 inhibitors"],
];
export const CURRENT: [string, string][] = [
  ["acei", "ACE-I"], ["arb", "ARB"], ["arni", "ARNI"], ["bb", "Beta-blocker"], ["mra", "MRA"], ["sglt2", "SGLT2-I"],
];

export function assess(p: Patient): Result {
  const has = (x: string) => p.co.includes(x);
  const on = (x: string) => p.cur.includes(x);
  const lv = p.lvef;
  const hfref = lv !== null && lv < 50;
  const hfpef = lv !== null && lv >= 50;
  const symptomatic = p.stage === "C" || p.stage === "D";
  const inHosp = p.setting === "inDHF";
  const items: Item[] = [];
  const alerts: Alert[] = [];
  const add = (i: Omit<Item, "cautions"> & { cautions?: string[] }) => items.push({ cautions: [], ...i });
  const preg = has("pregnancy");
  const fmtOn = (hfref ? ["sglt2", "bb", "mra"].every(on) && (on("acei") || on("arb") || on("arni")) : true);
  const devAct = (a: string) => (fmtOn ? a : "Plan");

  const idDef =
    (p.ferritin !== null && (p.ferritin < 100 || (p.ferritin <= 299 && p.tsat !== null && p.tsat < 20))) ||
    (p.ferritin === null && p.tsat !== null && p.tsat < 20);

  // ---- alerts from numbers ----
  if (preg) alerts.push({ level: "stop", text: "Pregnancy: ACE-I, ARB, ARNI, MRA, ivabradine and SGLT2-I are NOT recommended (foetotoxicity/teratogenicity, R124). Non-selective beta-blockers should be switched to β1-selective agents (R123). Refer for multidisciplinary pregnancy-heart team care (R122)." });
  if (p.sbp !== null && p.sbp < 100) alerts.push({ level: "warn", text: `SBP ${p.sbp} mmHg (<100): use ACE-I/ARNI/ARB with caution; ARNI may be started at the lower 24/26 mg b.i.d. dose (Table 11 footnote). Sequence agents according to BP.` });
  if (p.sbp !== null && p.sbp < 90 && inHosp) alerts.push({ level: "stop", text: "SBP <90 mmHg in decompensated HF: assess hypoperfusion/cardiogenic shock; involve the Shock Team if temporary MCS is a candidate (R073). Inotropes may be considered with hypoperfusion (R070)." });
  if (p.egfr !== null && p.egfr < 30) alerts.push({ level: "warn", text: `eGFR ${p.egfr}: use ACE-I/ARNI/ARB with caution (<30); MRA was not tested at eGFR <25. Even so, guideline text supports starting FMT in most CKD patients; evidence is limited in severe CKD (excluded from RCTs).` });
  else if (symptomatic && hfref && !preg && p.egfr !== null && p.egfr <= 60) alerts.push({ level: "info", text: `eGFR ${p.egfr}: ARNI may start at 24/26 mg b.i.d. (eGFR 30–60); finerenone dose uses the ≤60 band. A small early eGFR fall after ACE-I/ARNI/ARB, MRA or SGLT2-I is usually transient and not a reason to stop.` });
  if (p.k !== null && p.k > 5.5) alerts.push({ level: "stop", text: `K⁺ ${p.k}: recheck; consider dose reduction or temporary discontinuation of MRA and/or ACE-I/ARB/ARNI, restart when resolved. Do not start/uptitrate MRA until controlled.` });
  else if (p.k !== null && p.k >= 5.0) alerts.push({ level: "warn", text: `K⁺ ${p.k}: caution with MRA (≥5.0) and ACE-I/ARB/ARNI (>5.2). Close K⁺ monitoring after any start or uptitration.` });
  if (p.bmi !== null && p.bmi >= 30) alerts.push({ level: "info", text: "Obesity lowers natriuretic peptide levels and can underestimate congestion — interpret NT-proBNP with caution (§10.1)." });
  if (has("t1dm")) alerts.push({ level: "warn", text: "Type 1 diabetes: SGLT2-I are not indicated (diabetic ketoacidosis risk, §10.2)." });
  if (has("csa")) alerts.push({ level: "stop", text: "Predominantly central sleep apnoea with HFrEF: adaptive servo-ventilation is NOT recommended — increased CV and all-cause death (R107)." });
  if (has("nsaid")) alerts.push({ level: "stop", text: "Stop NSAIDs/COX-2 inhibitors — they increase HF worsening and hospitalization (R110)." });
  if (symptomatic && lv === null) alerts.push({ level: "warn", text: "LVEF not entered — enter it to get phenotype-specific recommendations." });
  if (p.stage === "A" || p.stage === "B") { /* no-op */ }

  // ---- stage A / B (prevention) ----
  if (p.stage === "A") {
    if (has("htn")) add({ tier: "Prevention", action: "Treat", title: "Strict BP control (SBP <130 mmHg)", why: "Hypertension is a major driver of HF.", when: "At diagnosis; titrate to target.", recs: ["R001"] });
    if (has("t2dm")) add({ tier: "Prevention", action: has("ckd") ? "Start" : "Consider", title: has("ckd") ? "SGLT2-I and finerenone (T2DM + CKD)" : "SGLT2-I (T2DM at risk of HF) ± GLP-1 RA", drugIds: has("ckd") ? ["dapagliflozin", "empagliflozin", "finerenone"] : ["dapagliflozin", "empagliflozin"], why: "Reduces HF/CV death risk in T2DM; finerenone reduces HF risk with T2DM+CKD.", when: "At diagnosis of T2DM with multiple ASCVD risk factors/established ASCVD, or T2DM with CKD.", recs: has("ckd") ? ["R002", "R003", "R004", "R007"] : ["R002", "R007"] });
    if (has("cad")) add({ tier: "Prevention", action: "Consider", title: "Statin", why: "High-risk or established ASCVD.", when: "Now.", recs: ["R006"] });
    add({ tier: "Prevention", action: "Counsel", title: "Healthy lifestyle", why: "Weight, diet, no sedentary behaviour, no smoking/heavy alcohol, avoid cocaine/amphetamines/anabolic steroids.", when: "Every visit.", recs: ["R005"] });
  }
  if (p.stage === "B") {
    const r: string[] = [];
    if (lv !== null && lv <= 40) { add({ tier: "Prevention", action: on("acei") || on("arb") ? "Continue" : "Start", title: "ACE-I (or ARB if intolerant)", drugIds: ["ramipril", "enalapril", "lisinopril", "candesartan", "valsartan"], why: "Stage B with LVEF ≤40%: reduces HFH/death.", when: "As soon as asymptomatic LV systolic dysfunction is identified.", recs: ["R008"], cautions: ["SBP <100, eGFR <30, K⁺ >5.2: caution"] }); r.push("R008"); }
    if (lv !== null && lv < 50) add({ tier: "Prevention", action: on("bb") ? "Continue" : "Start", title: "Beta-blocker", drugIds: ["bisoprolol", "carvedilol", "metoprolol"], why: "Stage B with LVEF <50%: reduces HFH/death.", when: "As soon as LVEF <50% is documented, euvolaemic.", recs: ["R009"] });
    if (has("recentMI") && lv !== null && lv <= 40) add({ tier: "Prevention", action: "Start", title: "Eplerenone after MI", drugIds: ["eplerenone"], why: "LVEF ≤40% after MI with signs of HF or diabetes.", when: "After MI once signs of HF/diabetes present.", recs: ["R010"], cautions: ["Monitor K⁺ and eGFR"] });
    if (has("htn")) add({ tier: "Prevention", action: "Treat", title: "Strict BP control (<130 mmHg)", why: "", when: "Ongoing.", recs: ["R001"] });
    if (has("t2dm")) add({ tier: "Prevention", action: "Consider", title: "SGLT2-I (± finerenone with CKD)", drugIds: ["dapagliflozin", "empagliflozin"], why: "T2DM at risk of HF.", when: "Now.", recs: has("ckd") ? ["R002", "R003", "R004"] : ["R002"] });
    if (has("cad")) add({ tier: "Prevention", action: "Consider", title: "Statin", why: "", when: "Now.", recs: ["R006"] });
    add({ tier: "Prevention", action: "Counsel", title: "Healthy lifestyle", why: "", when: "Every visit.", recs: ["R005"] });
  }

  // ---- acute ----
  if (inHosp && symptomatic) {
    add({ tier: "Acute", action: "Give", title: "IV loop diuretic for fluid overload", drugIds: ["loop-diuretics"], why: "Improves symptoms; use dynamic, individualized dosing.", when: "On admission.", recs: ["R065", "R030"], cautions: ["If overload persists: add short-term IV acetazolamide or oral hydrochlorothiazide (R066)", "Urinary Na⁺-guided diuresis may be considered (R067)"] });
    add({ tier: "Acute", action: "If hypoxaemic", title: "Oxygen / ventilatory support", why: "SpO₂ <90% or PaO₂ <60 mmHg: oxygen; respiratory distress: consider NIV; intubate if progressive failure.", when: "Immediately if criteria met.", recs: ["R062", "R064", "R063"] });
    if (p.sbp !== null && p.sbp > 110) add({ tier: "Acute", action: "May consider", title: "IV vasodilator", why: "SBP >110 mmHg as initial therapy.", when: "Initial phase.", recs: ["R069"] });
    if (p.sbp !== null && p.sbp < 90) add({ tier: "Acute", action: "May consider", title: "Inotrope / vasopressor (norepinephrine in shock)", why: "SBP <90 with hypoperfusion unresponsive to standard treatment.", when: "Initial phase; Shock Team.", recs: ["R070", "R071", "R073"] });
    add({ tier: "Avoid", action: "Avoid", title: "Routine opiates", why: "Not recommended unless severe/intractable pain or anxiety.", when: "—", recs: ["R072"] });
    add({ tier: "Care", action: "Do", title: "Pre-discharge evaluation and early rehab", why: "Exclude persistent congestion (clinical, NP, kidney function/electrolytes, imaging); consider cardiac rehabilitation as soon as safely possible.", when: "Before discharge.", recs: ["R060", "R117"] });
  }

  // ---- chronic HFrEF / HFpEF ----
  const hosp = inHosp ? " After initial stabilization, in hospital." : "";
  if (symptomatic && hfref && !preg) {
    add({ tier: "Foundational", action: on("sglt2") ? "Continue" : "Start", title: "SGLT2 inhibitor", drugIds: ["dapagliflozin", "empagliflozin"], why: "Recommended in all symptomatic HF regardless of LVEF; reduces HFH/CV death.", when: inHosp ? "In-hospital initiation after initial stabilization (R068)." : "At diagnosis — first-line, simple fixed dose.", recs: ["R028", "R068"], cautions: has("t1dm") ? ["Not indicated in type 1 diabetes"] : ["Genital/urinary infections", "Small early eGFR dip expected"] });
    add({ tier: "Foundational", action: on("bb") ? "Continue / uptitrate" : "Start", title: "Beta-blocker", drugIds: ["bisoprolol", "carvedilol", "metoprolol", "nebivolol"], why: "Reduces HFH and death in symptomatic HFrEF.", when: inHosp || has("congestion") ? "Start low once euvolaemic/haemodynamically stable; do not initiate during unstable congestion." : "Start low in stable, euvolaemic patient; uptitrate to target/highest tolerated.", recs: ["R033", "R031"], cautions: has("bbIntol") ? ["Intolerance noted: consider ivabradine if sinus rhythm and LVEF ≤35% (R039)"] : ["Use cautiously if congested or hypotensive"] });
    const raasCautions: string[] = [];
    if (p.sbp !== null && p.sbp < 100) raasCautions.push("SBP <100: caution");
    if (p.egfr !== null && p.egfr < 30) raasCautions.push("eGFR <30: caution");
    if (p.k !== null && p.k > 5.2) raasCautions.push("K⁺ >5.2: caution");
    if (has("aceIntol")) {
      add({ tier: "Foundational", action: on("arb") ? "Continue / uptitrate" : "Start", title: "ARB (unable to tolerate ACE-I/ARNI)", drugIds: ["candesartan", "valsartan", "losartan"], why: "ARB recommended when ACE-I/ARNI cannot be tolerated.", when: "At diagnosis.", recs: ["R036"], cautions: raasCautions });
    } else if (on("arni")) {
      add({ tier: "Foundational", action: "Continue / uptitrate", title: "ARNI (sacubitril–valsartan)", drugIds: ["sacubitril-valsartan"], why: "Superior to enalapril in PARADIGM-HF.", when: "Uptitrate every 1–2 weeks to 97/103 mg b.i.d.", recs: ["R034", "R031"], cautions: raasCautions });
    } else if (on("acei") || on("arb")) {
      add({ tier: "Foundational", action: "Switch", title: "ACE-I/ARB → ARNI", drugIds: ["sacubitril-valsartan"], why: "Switching is recommended in symptomatic HFrEF.", when: "Now if BP/eGFR allow; ≥36 h wash-out when stopping an ACE-I (angio-oedema risk).", recs: ["R035", "R034"], cautions: raasCautions.concat(p.sbp !== null && p.sbp < 100 || has("hypoHx") || (p.egfr !== null && p.egfr >= 30 && p.egfr <= 60) ? ["Consider lower start dose 24/26 mg b.i.d."] : []) });
    } else {
      add({ tier: "Foundational", action: "Start", title: "ARNI (preferred) or ACE-I", drugIds: ["sacubitril-valsartan", "ramipril", "enalapril", "lisinopril"], why: "Recommended in symptomatic HFrEF; ARNI may be used de novo.", when: inHosp ? "Once stable, before discharge." : "At diagnosis.", recs: ["R034", "R031"], cautions: raasCautions.concat(has("hypoHx") || (p.egfr !== null && p.egfr >= 30 && p.egfr <= 60) ? ["ACE-I-naïve/hypotension history/eGFR 30–60: ARNI start 24/26 mg b.i.d. optional"] : []) });
    }
    const mraCautions: string[] = [];
    if (p.k !== null && p.k >= 5.0) mraCautions.push("K⁺ ≥5.0: caution/do not start until controlled");
    if (p.egfr !== null && p.egfr < 25) mraCautions.push("eGFR <25: not tested in trials");
    if (has("hyperk")) mraCautions.push("History of hyperkalaemia: closer K⁺ monitoring");
    add({ tier: "Foundational", action: on("mra") ? "Continue / uptitrate" : "Start", title: "Steroidal MRA", drugIds: ["spironolactone", "eplerenone"], why: "Recommended in symptomatic HF regardless of LVEF; reduces HFH/CV death.", when: "At diagnosis if K⁺ and eGFR permit.", recs: ["R029"], cautions: mraCautions });
    if (has("congestion")) add({ tier: "Foundational", action: "Give", title: "Loop diuretic for congestion", drugIds: ["loop-diuretics"], why: "Dynamic dosing by volume status; lowest dose that maintains euvolaemia.", when: "Now; reduce as FMT takes effect.", recs: ["R030"] });
    add({ tier: "Foundational", action: "Do", title: "Uptitrate and maintain FMT", why: "Uptitrate at least every 1–2 weeks to target doses; continue highest tolerated dose even if asymptomatic or LVEF improves.", when: "Every 1–2 weeks until target.", recs: ["R031", "R032", ...(inHosp || p.setting === "afterDHF" ? ["R061"] : [])] });

    // additional therapy
    if (lv !== null && lv <= 35 && p.rhythm === "sinus" && !preg) {
      if (p.hr !== null && p.hr > 70) add({ tier: "Additional", action: "Consider", title: "Ivabradine", drugIds: ["ivabradine"], why: `LVEF ≤35%, sinus rhythm, resting HR ${p.hr} >70 b.p.m. on highest tolerated FMT.`, when: "After FMT is at highest tolerated doses and symptoms/HR persist.", recs: ["R038"] });
      else if (has("bbIntol")) add({ tier: "Additional", action: "Consider", title: "Ivabradine (beta-blocker intolerant)", drugIds: ["ivabradine"], why: "LVEF ≤35%, sinus rhythm, unable to tolerate beta-blocker.", when: "When beta-blocker not tolerated.", recs: ["R039"] });
    }
    if (lv !== null && lv <= 40) add({ tier: "Additional", action: "Consider", title: "Digoxin / digitoxin", drugIds: ["digoxin", "digitoxin"], why: "Symptomatic despite optimal FMT, LVEF ≤40%: reduce HFH.", when: "After optimal FMT, if still symptomatic.", recs: ["R037"], cautions: ["Target digoxin level <1.2 ng/mL", "Renal elimination"] });
    if (lv !== null && lv < 45) add({ tier: "Additional", action: "May consider", title: "Vericiguat", drugIds: ["vericiguat"], why: "LVEF <45% despite optimal FMT.", when: "After optimal FMT; best evidence after recent worsening.", recs: ["R042"] });
    if (p.lvef !== null && lv !== null && lv <= 40 && p.co.includes("black")) add({ tier: "Additional", action: "Consider", title: "Hydralazine + isosorbide dinitrate", drugIds: ["hydralazine-isdn"], why: "Self-identified black patient, LVEF ≤40%, on top of optimal FMT.", when: "On top of optimal FMT.", recs: ["R040"] });
    else if (lv !== null && lv <= 40 && has("aceIntol") && !on("arb")) add({ tier: "Additional", action: "May consider", title: "Hydralazine + isosorbide dinitrate", drugIds: ["hydralazine-isdn"], why: "Cannot tolerate ACE-I, ARNI or ARB.", when: "When RAS inhibition impossible.", recs: ["R041"] });
  }

  if (symptomatic && hfpef && !preg) {
    add({ tier: "Foundational", action: on("sglt2") ? "Continue" : "Start", title: "SGLT2 inhibitor", drugIds: ["dapagliflozin", "empagliflozin"], why: "Reduces HFH/CV death across LVEF; benefit in HFpEF driven by fewer HFH.", when: inHosp ? "After initial stabilization (R068)." : "At diagnosis.", recs: ["R028", "R068"] });
    add({ tier: "Foundational", action: on("mra") ? "Continue" : "Start", title: "MRA (steroidal or finerenone)", drugIds: ["finerenone", "spironolactone"], why: "Recommended in symptomatic HF independent of LVEF; finerenone studied at LVEF >40%.", when: "At diagnosis if K⁺/eGFR permit.", recs: ["R029"], cautions: [p.k !== null && p.k >= 5.0 ? "K⁺ ≥5.0: caution" : "", p.egfr !== null && p.egfr < 25 ? "eGFR <25: not tested" : ""].filter(Boolean) });
    if (has("congestion")) add({ tier: "Foundational", action: "Give", title: "Loop diuretic for congestion", drugIds: ["loop-diuretics"], why: "Dynamic dosing by volume status.", when: "Now.", recs: ["R030"] });
    add({ tier: "Additional", action: "May consider", title: "ARNI / ACE-I / ARB", drugIds: ["sacubitril-valsartan"], why: "To reduce HFH in symptomatic HFpEF; benefit most apparent at lower LVEF.", when: "If persistent symptoms/HFH after SGLT2-I and MRA.", recs: ["R044"], cautions: ["Hypotension, kidney function, K⁺"] });
  }
  if (symptomatic && lv !== null && lv >= 45 && p.bmi !== null && p.bmi >= 30) add({ tier: "Comorbidity", action: "Consider", title: "Semaglutide or tirzepatide", drugIds: ["glp1-tirzepatide"], why: "Symptomatic HF, LVEF ≥45%, BMI ≥30 kg/m², regardless of diabetes.", when: "Once on FMT; weight/QoL goals.", recs: ["R102"] });
  if (symptomatic && p.bmi !== null && p.bmi >= 35) add({ tier: "Comorbidity", action: "May consider", title: "Bariatric surgery", why: "BMI ≥35 kg/m² when repetitive lifestyle attempts failed.", when: "Referral.", recs: ["R103"] });

  // ---- comorbidity-directed ----
  if (symptomatic && idDef) add({ tier: "Comorbidity", action: hfref ? "Give" : "Consider", title: "Intravenous iron (iron deficiency)", drugIds: ["iv-iron"], why: `Ferritin ${p.ferritin ?? "—"} ng/mL, TSAT ${p.tsat ?? "—"}% meets the HF iron-deficiency definition (ferritin <100, or 100–299 with TSAT <20%).`, when: inHosp ? "Pre-discharge is a good moment (AFFIRM-AHF)." : "When ID confirmed in symptomatic HFrEF.", recs: hfref ? ["R104", "R105"] : ["R104"], cautions: hfref ? [] : ["Data in HFpEF are scarce — recommendations are for HFrEF"] });
  if (symptomatic && (p.rhythm === "af") && !preg) {
    add({ tier: "Comorbidity", action: "Assess/start", title: "Oral anticoagulation (DOAC preferred) by CHA₂DS₂-VA", drugIds: ["anticoag"], why: "Clinical AF with elevated thromboembolic risk.", when: "At AF diagnosis.", recs: ["R089", "R090"] });
    if (hfref) add({ tier: "Comorbidity", action: "Rate control", title: "Beta-blocker first-line; digoxin if rate remains high", drugIds: ["af-rate"], why: "Stable HFrEF with AF.", when: "Now; urgent cardioversion if unstable with rapid rate (R095).", recs: ["R091", "R092", "R095"] });
    if (hfref) add({ tier: "Interventional", action: "Consider", title: "Catheter ablation of AF", why: "Selected symptomatic AF with HFrEF — improves QoL and reduces HF events.", when: "Selected patients after FMT.", recs: ["R096"] });
  }
  if (has("angina") || (has("cad") && symptomatic && hfref)) add({ tier: "Interventional", action: has("angina") ? "Revascularize" : "Evaluate", title: "Coronary revascularization", why: "HF with obstructive CAD and persistent angina despite FMT; CABG preferred when planned after Heart Team review.", when: "After Heart Team assessment.", recs: ["R097", "R098", "R024", "R025"] });
  if (has("mr") && hfref) add({ tier: "Interventional", action: "Consider", title: "Mitral transcatheter edge-to-edge repair", why: "Symptomatic HFrEF with persistent severe secondary MR despite optimized FMT/CRT; Heart Team.", when: "After FMT/CRT optimization.", recs: ["R100", "R101"] });
  if (has("as") && symptomatic) add({ tier: "Interventional", action: "Treat", title: "Aortic valve intervention (SAVR/TAVI)", why: "Severe aortic stenosis with HF.", when: "Heart Team.", recs: ["R099"] });
  if (has("osa") && hfref) add({ tier: "Comorbidity", action: "May consider", title: "Adaptive servo-ventilation", why: "Predominant obstructive sleep apnoea to improve sleep/QoL.", when: "Sleep-medicine referral.", recs: ["R106"] });
  if (has("ttr") && symptomatic) add({ tier: "Comorbidity", action: "Start", title: "TTR-directed therapy (vutrisiran, tafamidis, acoramidis)", drugIds: ["ttr"], why: "Variant or wild-type ATTR-CM, NYHA I–III.", when: "On confirmed diagnosis.", recs: ["R125", "R017"] });
  if (has("depression")) add({ tier: "Care", action: "Assess", title: "Anxiety, depression, frailty assessment", why: "Supports personalized care plan.", when: "At visits.", recs: ["R108"] });
  if (has("ckd") && symptomatic) alerts.push({ level: "info", text: "CKD: guideline text supports starting beta-blocker, ACE-I/ARNI/ARB, SGLT2-I and MRA in most patients — FMT benefits are similar or higher irrespective of CKD; monitor kidney function and K⁺." });
  if (has("t2dm") && symptomatic) alerts.push({ level: "info", text: "T2DM: FMT efficacy is unchanged by diabetes; SGLT2-I recommended irrespective of HbA1c. Add semaglutide/tirzepatide with HFpEF + obesity (§10.2)." });

  // ---- devices ----
  if (symptomatic && hfref && !preg) {
    if (has("vtSurvivor")) add({ tier: "Interventional", action: "Implant", title: "ICD — secondary prevention", why: "Recovered from haemodynamically unstable ventricular arrhythmia; expected survival >1 year with good function, no reversible cause (not <48 h post-MI).", when: "Before discharge after the event.", recs: ["R045"] });
    else if (lv !== null && lv <= 35 && (p.nyha === 2 || p.nyha === 3)) {
      if (has("recentMI")) add({ tier: "Interventional", action: "Defer", title: "ICD — primary prevention", why: "Not recommended within 40 days of MI.", when: "Re-evaluate LVEF ≥40 days after MI and after ≥3 months of optimal FMT.", recs: ["R050"] });
      else if (p.aetiology === "ischaemic") add({ tier: "Interventional", action: devAct("Implant"), title: "ICD — primary prevention (ischaemic)", why: "NYHA II/III, LVEF ≤35% despite ≥3 months optimal FMT, expected survival >1 year with good function.", when: "After ≥3 months of optimal FMT and LVEF reassessment.", recs: ["R046"] });
      else if (p.aetiology === "nonischaemic") add({ tier: "Interventional", action: devAct("Consider"), title: "ICD — primary prevention (non-ischaemic)", why: "NYHA II/III, LVEF ≤35% despite ≥3 months optimal FMT, expected survival >1 year.", when: "After ≥3 months of optimal FMT and LVEF reassessment.", recs: ["R047"] });
    }
    if (p.nyha === 4) alerts.push({ level: "warn", text: "NYHA IV refractory to drug therapy: ICD implantation is not recommended (see R051 for exceptions) — consider advanced HF pathway." });
    if (lv !== null && lv <= 35 && p.nyha >= 2 && p.rhythm === "sinus" && p.qrs !== null) {
      if (p.qrs < 130) add({ tier: "Avoid", action: "Avoid", title: "CRT", why: "QRS <130 ms without a pacing indication due to high-degree AV block.", when: "—", recs: ["R059"] });
      else if (p.lbbb && p.qrs >= 150) add({ tier: "Interventional", action: devAct("Implant"), title: "CRT (CRT-P/CRT-D per ICD indication)", why: "Sinus rhythm, LBBB, QRS ≥150 ms, LVEF ≤35% despite optimal FMT.", when: "Despite optimal FMT; may plan CRT in parallel with FMT initiation (reassess LVEF before implant).", recs: ["R052", "R058"] });
      else if (p.lbbb) add({ tier: "Interventional", action: "Consider", title: "CRT", why: "LBBB, QRS 130–149 ms, LVEF ≤35% despite optimal FMT.", when: "After optimal FMT.", recs: ["R056"] });
      else if (p.qrs >= 150) add({ tier: "Interventional", action: "Consider", title: "CRT", why: "Non-LBBB, QRS ≥150 ms, LVEF ≤35% despite optimal FMT.", when: "After optimal FMT.", recs: ["R055"] });
      else add({ tier: "Interventional", action: "May consider", title: "CRT", why: "Non-LBBB, QRS 130–149 ms, LVEF ≤35%.", when: "After optimal FMT.", recs: ["R057"] });
    }
    if (has("pacing") && lv !== null && lv <= 35) add({ tier: "Interventional", action: "Consider", title: "Upgrade to CRT", why: "Worsening HF with significant RV pacing despite optimal FMT; review RV pacing burden.", when: "Despite optimal FMT.", recs: ["R053", "R026"] });
  }

  // ---- advanced / palliative ----
  if (p.stage === "D" || p.nyha === 4) {
    add({ tier: "Care", action: "Refer", title: "Early advanced HF centre consultation", why: "Advanced HF or at risk of advanced HF — evaluate for transplant/LVAD; CPET and right heart catheterization as part of evaluation.", when: "Now.", recs: ["R079", "R080", "R081"] });
    add({ tier: "Interventional", action: "Evaluate", title: "LVAD / heart transplantation", why: "Selected advanced HFrEF refractory to FMT and GDIT.", when: "Via advanced HF centre.", recs: ["R086", "R088"] });
    add({ tier: "Care", action: "Do", title: "Goals-of-care discussion and palliative care access", why: "Proactive discussion of trajectory/advance care planning; integrated palliative team.", when: "Now and ongoing.", recs: ["R120", "R121"] });
    add({ tier: "Additional", action: "Consider", title: "Advanced-stage drug adjustments", why: "Selected patients: down-titrate/stop beta-blocker or ivabradine; continuous inotropes with low output/hypoperfusion; kidney replacement or ultrafiltration for refractory overload.", when: "Specialist-led.", recs: ["R082", "R083", "R084", "R085"] });
  }

  // ---- universal care for symptomatic HF ----
  if (symptomatic) {
    add({ tier: "Care", action: "Enrol", title: "Multidisciplinary programme, self-care education, adherence/polypharmacy review", why: "Reduces HFH/death.", when: "At diagnosis and every visit.", recs: ["R111", "R112", "R113"] });
    add({ tier: "Care", action: "Prescribe", title: "Exercise training / cardiac rehabilitation", why: "Personalized exercise training for stable patients.", when: "Once stable.", recs: ["R114", "R115"] });
    add({ tier: "Care", action: "Give", title: "Influenza and pneumococcal vaccination", why: "Reduce pneumonia complications.", when: "Seasonally / per schedule.", recs: ["R109"] });
    add({ tier: "Care", action: "May consider", title: "Telemonitoring", why: "Non-invasive telemonitoring may reduce HFH; PA-pressure sensor in selected NYHA III with recent HFH.", when: "Selected patients.", recs: ["R119", "R118"] });
  }
  if (preg) {
    add({ tier: "Care", action: "Do", title: "Pre-conception counselling and heart-team care", why: "Multidisciplinary pregnancy management.", when: "Now.", recs: ["R122", "R123"] });
    add({ tier: "Avoid", action: "Avoid", title: "ACE-I/ARB/ARNI, MRA, ivabradine, SGLT2-I", why: "Foetotoxicity/teratogenicity.", when: "—", recs: ["R124"] });
  }
  if (has("nsaid")) add({ tier: "Avoid", action: "Stop", title: "NSAIDs / COX-2 inhibitors", why: "Increase HF worsening and hospitalization.", when: "Now.", recs: ["R110"] });
  if (has("csa")) add({ tier: "Avoid", action: "Avoid", title: "Adaptive servo-ventilation", why: "Predominant central sleep apnoea in HFrEF: increased death.", when: "—", recs: ["R107"] });
  if (has("t1dm")) add({ tier: "Avoid", action: "Avoid", title: "SGLT2 inhibitors", why: "Type 1 diabetes — ketoacidosis risk.", when: "—", recs: [] });

  // ---- timeline ----
  const timeline: Result["timeline"] = [];
  if (symptomatic) {
    timeline.push({ when: inHosp ? "Now (acute phase)" : "This visit", steps: [
      inHosp ? "Relieve congestion (IV loop diuretic); start SGLT2-I after initial stabilization; begin/continue other FMT as BP, renal function and K⁺ allow." : "Confirm work-up (NP, ECG, echo, labs incl. kidney function, electrolytes, iron status — R011–R015).",
      hfref ? "Start the four foundational classes early (SGLT2-I, MRA, beta-blocker, ARNI/ACE-I) — sequence by BP, HR, eGFR and K⁺; the guideline favours rapid initiation over slow one-at-a-time titration." : "Start SGLT2-I and MRA; add loop diuretic only for congestion.",
    ] });
    timeline.push({ when: "Weeks 1–2, then every 1–2 weeks", steps: ["Uptitrate FMT toward target doses (R031), guided by symptoms, vital signs and labs.", "Re-check BP, HR, creatinine/eGFR, K⁺ (± NT-proBNP) at each step."] });
    if (inHosp || p.setting === "afterDHF") timeline.push({ when: "First 6 weeks after HF hospitalization", steps: ["Frequent follow-up visits with intensive initiation/uptitration of FMT (R061).", "Pre-discharge: exclude residual congestion; iron repletion if iron deficient; enrol in rehab/MDT programme."] });
    if (hfref) timeline.push({ when: "After ≥3 months of optimal FMT", steps: ["Re-measure LVEF/QRS to decide ICD (LVEF ≤35%) and CRT eligibility.", "If still symptomatic at highest tolerated FMT: consider ivabradine, digoxin/digitoxin, vericiguat, H-ISDN per criteria."] });
    timeline.push({ when: "Long term", steps: ["Continue FMT at the highest tolerated dose even if asymptomatic or LVEF improves (R032).", "Regular in-person follow-up; vaccination; exercise/rehab; self-care education.", ...(p.stage === "D" || p.nyha === 4 ? ["Advanced HF referral and advance care planning."] : [])] });
  } else {
    timeline.push({ when: "Now", steps: ["Treat risk factors; start stage-appropriate therapy as listed."] });
    timeline.push({ when: "Ongoing", steps: ["Re-assess symptoms and natriuretic peptide/echo if clinical change; progress to symptomatic-HF pathway if HF develops."] });
  }

  // ---- monitoring ----
  const monitoring: Result["monitoring"] = [];
  if (symptomatic) {
    monitoring.push({ group: "Safety indicators for uptitration (STRONG-HF set)", rows: [
      { what: "Blood pressure and heart rate", why: "Hypotension/bradycardia limit RAS-inhibitor and beta-blocker uptitration." },
      { what: "Creatinine / eGFR", why: "Early small fall after ACE-I/ARNI/ARB, MRA, SGLT2-I is usually transient; investigate larger drops." },
      { what: "Potassium", why: ">5.5 recheck and reduce/stop MRA and/or RAS inhibitor; caution ≥5.0 (MRA) and >5.2 (ACE-I/ARNI)." },
      { what: "NT-proBNP / natriuretic peptides", why: "Congestion and response to therapy; interpret by age, obesity, AF, kidney function." },
    ] });
    monitoring.push({ group: "Congestion and symptoms", rows: [
      { what: "Symptoms (NYHA), weight, oedema, JVP, lung signs", why: "Dynamic individualized diuretic dosing (R030)." },
      { what: "Adherence and polypharmacy review", why: "R113." },
    ] });
    const drug: { what: string; why: string }[] = [];
    if (hfref) drug.push({ what: "Euvolaemia before/while uptitrating beta-blocker", why: "Beta-blockers started in stable, euvolaemic patients." });
    drug.push({ what: "ARNI: symptomatic hypotension; 36 h ACE-I wash-out", why: "Angio-oedema risk with overlap." });
    drug.push({ what: "SGLT2-I: genital and urinary tract infections", why: "Most frequent adverse effect." });
    if (lv !== null && lv <= 40) drug.push({ what: "Digoxin/digitoxin: plasma level (digoxin <1.2 ng/mL)", why: "Narrow therapeutic window; renal elimination." });
    if (lv !== null && lv <= 35 && p.rhythm === "sinus") drug.push({ what: "Resting heart rate (ivabradine criteria >70 b.p.m.)", why: "Eligibility and response." });
    monitoring.push({ group: "Drug-specific", rows: drug });
    const dis: { what: string; why: string }[] = [
      { what: "12-lead ECG: rhythm, QRS width/morphology", why: "AF, conduction disease, CRT eligibility." },
      { what: "Echocardiography (LVEF, structure) when clinically relevant", why: "Reassess LVEF after ≥3 months of optimal FMT and before device decisions." },
      { what: "Full blood count, electrolytes, iron status (ferritin, TSAT), liver, kidney and thyroid function", why: "Follow-up work-up listed in §11.6.1." },
    ];
    if (has("t2dm")) dis.push({ what: "HbA1c / glycaemic control", why: "Diabetes comorbidity." });
    if (p.rhythm === "af") dis.push({ what: "CHA₂DS₂-VA score and anticoagulation adherence", why: "Stroke prevention." });
    if (p.bmi !== null && p.bmi >= 30) dis.push({ what: "Body weight / BMI", why: "Weight-reduction goals; NP interpretation." });
    monitoring.push({ group: "Disease and comorbidity", rows: dis });
    monitoring.push({ group: "Follow-up", rows: [
      { what: inHosp || p.setting === "afterDHF" ? "Frequent visits through first 6 weeks post-HFH" : "Regular in-person follow-up; content and interval depend on HF stage (guideline Figure 22)", why: "R061 / §11.6.1. The main text gives no fixed lab-check days — follow Figure 22 and local protocol." },
      { what: "Remote/device monitoring where available", why: "PA-pressure sensor in selected NYHA III with recent HFH (R118); non-invasive telemonitoring may be considered (R119)." },
    ] });
  } else {
    monitoring.push({ group: "At-risk / pre-HF", rows: [
      { what: "BP, weight, glycaemic and lipid control, smoking/alcohol", why: "Prevention targets (R001, R005)." },
      { what: "Symptoms; natriuretic peptide ± echocardiography if suspicion arises", why: "Early detection of progression to symptomatic HF." },
    ] });
  }

  if (inHosp && p.sbp !== null && p.sbp < 90) {
    for (const i of items) if (["Foundational", "Additional", "Interventional"].includes(i.tier) && i.action !== "Do") { i.action = "Defer"; i.when = "After haemodynamic stabilization (SBP <90 mmHg now). " + i.when; }
  }
  const recIds = Array.from(new Set(items.flatMap((i) => i.recs))).sort();
  const phen = lv === null ? "LVEF not entered" : hfref ? `HFrEF (LVEF ${lv}%)` : `HFpEF (LVEF ${lv}%)`;
  const summary = [
    `Stage ${p.stage}${symptomatic ? `, NYHA ${p.nyha}` : ""}`,
    symptomatic ? phen : lv !== null ? `LVEF ${lv}%` : "",
    { stable: "Chronic, stable", new: "Newly diagnosed", afterDHF: "Recent HF hospitalization", inDHF: "Currently decompensated (in hospital)" }[p.setting],
    symptomatic && p.aetiology !== "unknown" ? `${p.aetiology === "ischaemic" ? "Ischaemic" : "Non-ischaemic"} aetiology` : "",
    p.rhythm === "af" ? "Atrial fibrillation" : "",
  ].filter(Boolean);
  return { summary, alerts, items, timeline, monitoring, recIds };
}
