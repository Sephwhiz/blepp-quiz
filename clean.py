"""
clean.py  —  Golden Drills JSON Cleaner  (ULTIMATE v3)
=======================================================
Requirement : pip install wordninja   ✅ already installed
Usage       : python clean.py

What makes this version powerful:
  ─────────────────────────────────────────────────────────────
  1. PSYCH_DOMAIN_WORDS — 500+ psychology/psychometrician terms
     loaded into wordninja so it NEVER mis-splits domain vocabulary
  2. KNOWN_WORD_FIXES  — maps corrupted source strings → correct words
     (handles missing leading letters like C→Ompetence, n→euro...)
  3. KNOWN_COMPOUNDS   — fixes wordninja phrase-level mis-splits
  4. strip_embedded_choices() — removes a.b.c.d. from question text
  5. Hyphen-aware tokeniser  — keeps end-of-life, 5-year-old intact
  6. Apostrophe + quote spacing fixed automatically
  ─────────────────────────────────────────────────────────────
  Covers ALL BLEPP subjects:
    • Developmental Psychology  • Clinical / Abnormal Psychology
    • Psychological Assessment  • Ethics & Professional Practice
    • Social Psychology         • Cognitive Psychology
    • Theories of Personality   • Industrial-Organizational Psychology
    • Counseling & Psychotherapy • Research Methods & Statistics
    • Biological / Neuropsychology
"""

import json
import os
import re
import glob
import math
import wordninja


# ══════════════════════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════════════════════
INPUT_DIR  = "public/data/golden-drills-fixed"
OUTPUT_DIR = "public/data/golden-drills-fixed"
BATCH_GLOB = "batch-*.json"


# ══════════════════════════════════════════════════════════════════════════════
#  PSYCH_DOMAIN_WORDS
#  Every term here is injected into wordninja's model with HIGH frequency
#  so it will ALWAYS be recognised as a single word and never mis-split.
#  Organised by BLEPP subject area.
# ══════════════════════════════════════════════════════════════════════════════
PSYCH_DOMAIN_WORDS = [

    # ── ETHICS & PROFESSIONAL PRACTICE ────────────────────────────────────────
    "competence", "confidentiality", "informed", "consent", "autonomy",
    "beneficence", "nonmaleficence", "justice", "fidelity", "integrity",
    "veracity", "psychometrician", "psychologist", "psychologists",
    "psychometricians", "psychological", "psychologically", "psychology",
    "psychometrics", "psychometric", "neuropsychological", "neuropsychology",
    "neuropsychologist", "test", "security", "privacy", "disclosure",
    "boundaries", "boundary", "crossings", "violations", "violation",
    "malpractice", "negligence", "licensure", "credentialing",
    "supervision", "supervisor", "supervisee", "debriefing", "debrief",
    "mandated", "reporter", "tarasoff", "duty", "warn", "protect",
    "privileged", "communication", "record", "keeping", "documentation",
    "referral", "consultation", "collaboration", "termination",
    "abandonment", "exploitation", "harassment", "discrimination",
    "diversity", "multicultural", "cultural", "competence", "sensitivity",
    "apa", "ethics", "ethical", "unethical", "code", "conduct",
    "principles", "standards", "guidelines", "regulations", "laws",
    "legal", "illegal", "forensic", "evaluee", "examinee", "testtaker",
    "test", "administration", "scoring", "interpretation", "feedback",
    "release", "information", "guardian", "parental", "minor", "minors",
    "adult", "adults", "capacity", "incapacitated", "voluntary",
    "involuntary", "coercion", "undue", "influence", "deception",
    "debriefing", "withdrawal", "participation", "research", "participants",

    # ── PSYCHOLOGICAL ASSESSMENT ──────────────────────────────────────────────
    "reliability", "validity", "standardization", "standardisation",
    "norms", "normative", "norm", "referenced", "criterion", "referenced",
    "percentile", "stanine", "zscore", "tscore", "deviation", "iq",
    "intelligence", "quotient", "achievement", "aptitude", "ability",
    "abilities", "cognitive", "affective", "psychomotor", "domain",
    "domains", "construct", "content", "face", "predictive",
    "concurrent", "convergent", "discriminant", "ecological",
    "internal", "consistency", "cronbach", "alpha", "split", "half",
    "test", "retest", "parallel", "forms", "alternate", "forms",
    "inter", "rater", "interrater", "intra", "rater", "intrarater",
    "observer", "bias", "response", "bias", "social", "desirability",
    "acquiescence", "extreme", "responding", "random", "responding",
    "faking", "good", "faking", "bad", "malingering", "defensiveness",
    "impression", "management", "self", "report", "objective",
    "projective", "performance", "based", "behavioral", "observation",
    "naturalistic", "structured", "interview", "unstructured", "interview",
    "semi", "structured", "mental", "status", "examination", "mse",
    "mini", "mental", "state", "mmse", "beck", "depression", "bdi",
    "hamilton", "rating", "scale", "wechsler", "wais", "wisc", "wppsi",
    "stanford", "binet", "ravens", "matrices", "mmpi", "mmpi2",
    "mcml", "personality", "assessment", "inventory", "neo", "pi",
    "big", "five", "factor", "model", "myers", "briggs", "mbti",
    "sixteen", "pf", "cattell", "epq", "eysenck", "rorschach",
    "tat", "thematic", "apperception", "htp", "house", "tree",
    "person", "draw", "person", "figure", "drawing", "bender",
    "gestalt", "visual", "motor", "vmi", "halstead", "reitan",
    "luria", "nebraska", "battery", "neuropsychological", "screening",
    "diagnostic", "prognostic", "formative", "summative", "ipsative",
    "adaptive", "testing", "computerized", "computerised", "cat",
    "item", "response", "theory", "irt", "classical", "test", "theory",
    "ctt", "difficulty", "index", "discrimination", "index",
    "distractor", "analysis", "item", "analysis", "ceiling", "effect",
    "floor", "effect", "range", "restriction", "attenuation",
    "correction", "attenuation", "standard", "error", "measurement",
    "sem", "confidence", "interval", "true", "score", "observed",
    "score", "error", "score", "variance", "covariance", "correlation",
    "pearson", "spearman", "kendall", "tau", "biserial", "point",
    "phi", "coefficient", "contingency", "chi", "square", "anova",
    "ancova", "manova", "regression", "multiple", "regression",
    "logistic", "regression", "factor", "analysis", "exploratory",
    "confirmatory", "structural", "equation", "modeling", "sem",
    "path", "analysis", "meta", "analysis", "effect", "size",
    "cohens", "d", "eta", "squared", "omega", "squared",
    "statistical", "significance", "practical", "significance",
    "clinical", "significance", "null", "hypothesis", "alternative",
    "hypothesis", "type", "error", "type", "ii", "error", "power",
    "analysis", "sample", "size", "sampling", "random", "sampling",
    "stratified", "sampling", "cluster", "sampling", "convenience",
    "sampling", "purposive", "sampling", "snowball", "sampling",
    "population", "sample", "parameter", "statistic", "mean",
    "median", "mode", "standard", "deviation", "variance", "skewness",
    "kurtosis", "normal", "distribution", "bell", "curve", "gaussian",
    "positively", "skewed", "negatively", "skewed", "leptokurtic",
    "platykurtic", "mesokurtic", "bimodal", "multimodal", "unimodal",
    "outlier", "outliers", "central", "tendency", "dispersion",
    "variability", "spread", "range", "interquartile", "iqr",

    # ── DEVELOPMENTAL PSYCHOLOGY ──────────────────────────────────────────────
    "prenatal", "perinatal", "postnatal", "neonatal", "infancy",
    "toddlerhood", "early", "childhood", "middle", "childhood", "late",
    "childhood", "preadolescence", "adolescence", "emerging", "adulthood",
    "early", "adulthood", "middle", "adulthood", "late", "adulthood",
    "geriatric", "gerontology", "lifespan", "life", "span",
    "development", "developmental", "maturation", "growth", "aging",
    "ageing", "senescence", "puberty", "menarche", "spermarche",
    "menopause", "andropause", "climacteric", "teratogen", "teratogens",
    "teratogenic", "fetal", "alcohol", "syndrome", "fas", "embryo",
    "embryonic", "fetus", "fetal", "zygote", "blastocyst", "morula",
    "gastrulation", "neurulation", "organogenesis", "cephalocaudal",
    "proximodistal", "cephalocaudal", "principle", "piaget", "sensorimotor",
    "preoperational", "concrete", "operational", "formal", "operational",
    "object", "permanence", "conservation", "centration", "egocentrism",
    "animism", "artificialism", "irreversibility", "transductive",
    "reasoning", "hypothetico", "deductive", "abstract", "thought",
    "metacognition", "schemas", "schemata", "assimilation",
    "accommodation", "equilibration", "equilibrium", "disequilibrium",
    "vygotsky", "zone", "proximal", "development", "zpd", "scaffolding",
    "more", "knowledgeable", "other", "mko", "sociocultural", "theory",
    "private", "speech", "inner", "speech", "intersubjectivity",
    "erikson", "psychosocial", "trust", "mistrust", "autonomy",
    "shame", "doubt", "initiative", "guilt", "industry", "inferiority",
    "identity", "role", "confusion", "intimacy", "isolation",
    "generativity", "stagnation", "ego", "integrity", "despair",
    "freud", "psychosexual", "oral", "anal", "phallic", "latency",
    "genital", "oedipus", "complex", "electra", "complex", "castration",
    "anxiety", "penis", "envy", "id", "ego", "superego", "pleasure",
    "principle", "reality", "principle", "defense", "mechanisms",
    "defence", "mechanisms", "repression", "suppression", "denial",
    "projection", "displacement", "sublimation", "reaction", "formation",
    "regression", "rationalization", "rationalisation", "intellectualization",
    "compartmentalization", "undoing", "identification", "introjection",
    "kolberg", "kohlberg", "moral", "development", "preconventional",
    "conventional", "postconventional", "heinz", "dilemma",
    "gilligan", "care", "orientation", "justice", "orientation",
    "attachment", "theory", "bowlby", "ainsworth", "secure",
    "attachment", "insecure", "avoidant", "insecure", "ambivalent",
    "insecure", "resistant", "disorganized", "attachment", "strange",
    "situation", "procedure", "internal", "working", "model",
    "monotropic", "maternal", "deprivation", "separation", "anxiety",
    "stranger", "anxiety", "imprinting", "lorenz", "critical", "period",
    "sensitive", "period", "bronfenbrenner", "ecological", "systems",
    "microsystem", "mesosystem", "exosystem", "macrosystem",
    "chronosystem", "bioecological", "model", "bandura", "social",
    "learning", "theory", "observational", "learning", "modeling",
    "modelling", "vicarious", "reinforcement", "self", "efficacy",
    "reciprocal", "determinism", "bobo", "doll", "experiment",
    "information", "processing", "encoding", "storage", "retrieval",
    "sensory", "memory", "short", "term", "memory", "long", "term",
    "memory", "working", "memory", "episodic", "memory", "semantic",
    "memory", "procedural", "memory", "implicit", "memory", "explicit",
    "memory", "declarative", "memory", "nondeclarative", "memory",
    "priming", "habituation", "dishabituation", "classical",
    "conditioning", "operant", "conditioning", "pavlov", "skinner",
    "watson", "thorndike", "law", "effect", "positive", "reinforcement",
    "negative", "reinforcement", "positive", "punishment", "negative",
    "punishment", "extinction", "spontaneous", "recovery",
    "generalization", "generalisation", "discrimination", "shaping",
    "chaining", "token", "economy", "schedule", "reinforcement",
    "fixed", "ratio", "variable", "ratio", "fixed", "interval",
    "variable", "interval", "continuous", "reinforcement", "partial",
    "reinforcement", "language", "development", "chomsky", "lad",
    "language", "acquisition", "device", "universal", "grammar",
    "skinner", "verbal", "behavior", "babbling", "holophrastic",
    "telegraphic", "speech", "overregularization", "fast", "mapping",
    "joint", "attention", "theory", "mind", "false", "belief",
    "task", "sally", "anne", "task", "executive", "function",
    "inhibitory", "control", "cognitive", "flexibility", "updating",
    "temperament", "thomas", "chess", "easy", "difficult", "slow",
    "warm", "kagan", "behavioral", "inhibition", "goodness", "fit",
    "parenting", "styles", "baumrind", "authoritative", "authoritarian",
    "permissive", "indulgent", "neglectful", "uninvolved",
    "helicopter", "parenting", "peer", "relationships", "friendship",
    "cliques", "crowds", "romantic", "relationships", "dating",
    "gender", "development", "gender", "identity", "gender", "roles",
    "gender", "stereotypes", "gender", "constancy", "sex", "typing",
    "androgyny", "bem", "sex", "role", "inventory", "moral",
    "reasoning", "prosocial", "behavior", "altruism", "empathy",
    "sympathy", "aggression", "relational", "aggression", "bullying",
    "cyberbullying", "play", "development", "solitary", "play",
    "parallel", "play", "associative", "play", "cooperative", "play",
    "pretend", "play", "symbolic", "play", "rough", "tumble", "play",
    "milestones", "motor", "development", "gross", "motor", "fine",
    "motor", "reflexes", "rooting", "sucking", "moro", "grasp",
    "stepping", "babinski", "tonic", "neck", "school", "readiness",
    "academic", "achievement", "learning", "disabilities", "dyslexia",
    "dyscalculia", "dysgraphia", "adhd", "attention", "deficit",
    "hyperactivity", "disorder", "giftedness", "twice", "exceptional",
    "special", "education", "iep", "individualized", "education",
    "program", "mainstreaming", "inclusion", "least", "restrictive",
    "environment", "lrt", "resource", "room", "self", "contained",
    "classroom", "emerging", "literacy", "phonological", "awareness",
    "phonemic", "awareness", "alphabet", "knowledge", "print",
    "awareness", "vocabulary", "development", "comprehension",
    "fluency", "reading", "writing", "spelling", "mathematics",
    "numeracy", "number", "sense", "operations", "problem", "solving",
    "scientific", "reasoning", "logical", "thinking", "critical",
    "thinking", "creative", "thinking", "divergent", "thinking",
    "convergent", "thinking", "fluid", "intelligence", "crystallized",
    "intelligence", "horn", "cattell", "gf", "gc", "wisdom",
    "expertise", "pragmatics", "cognitive", "mechanics", "cognitive",
    "pragmatics", "baltes", "selective", "optimization", "compensation",
    "soc", "model", "successful", "aging", "active", "aging",
    "productive", "aging", "continuity", "theory", "activity", "theory",
    "disengagement", "theory", "socioemotional", "selectivity", "theory",
    "carstensen", "death", "dying", "kubler", "ross", "denial",
    "anger", "bargaining", "depression", "acceptance", "grief",
    "mourning", "bereavement", "complicated", "grief", "anticipatory",
    "grief", "palliative", "care", "hospice", "euthanasia",
    "physician", "assisted", "suicide", "advance", "directive",
    "living", "will", "durable", "power", "attorney", "healthcare",
    "proxy", "do", "not", "resuscitate", "dnr",

    # ── CLINICAL / ABNORMAL PSYCHOLOGY ────────────────────────────────────────
    "psychopathology", "abnormal", "psychology", "clinical", "psychology",
    "diagnosis", "diagnostic", "dsm", "dsm5", "icd", "icd10", "icd11",
    "comorbidity", "comorbid", "prevalence", "incidence", "etiology",
    "aetiology", "prognosis", "symptom", "symptoms", "syndrome",
    "disorder", "disorders", "anxiety", "disorders", "generalized",
    "anxiety", "gad", "panic", "disorder", "agoraphobia", "specific",
    "phobia", "social", "anxiety", "disorder", "social", "phobia",
    "separation", "anxiety", "selective", "mutism", "obsessive",
    "compulsive", "ocd", "hoarding", "disorder", "body", "dysmorphic",
    "trichotillomania", "excoriation", "trauma", "stressor", "related",
    "ptsd", "posttraumatic", "stress", "acute", "stress", "adjustment",
    "reactive", "attachment", "disinhibited", "social", "engagement",
    "dissociative", "disorders", "dissociative", "amnesia", "dissociative",
    "fugue", "dissociative", "identity", "did", "depersonalization",
    "derealization", "somatic", "symptom", "illness", "anxiety", "disorder",
    "conversion", "functional", "neurological", "factitious", "disorder",
    "munchausen", "mood", "disorders", "depressive", "disorders",
    "major", "depressive", "mdd", "persistent", "depressive", "dysthymia",
    "premenstrual", "dysphoric", "pmdd", "disruptive", "mood",
    "dysregulation", "dmdd", "bipolar", "disorders", "bipolar", "i",
    "bipolar", "ii", "cyclothymia", "cyclothymic", "schizophrenia",
    "spectrum", "psychotic", "disorders", "schizoaffective", "schizophreniform",
    "brief", "psychotic", "delusional", "disorder", "prodromal",
    "positive", "symptoms", "negative", "symptoms", "hallucinations",
    "delusions", "disorganized", "speech", "catatonia", "paranoia",
    "paranoid", "persecutory", "grandiose", "referential", "erotomanic",
    "somatic", "delusions", "nihilistic", "delusions", "auditory",
    "hallucinations", "visual", "hallucinations", "command",
    "hallucinations", "thought", "broadcasting", "thought", "insertion",
    "thought", "withdrawal", "thought", "blocking", "loose",
    "associations", "word", "salad", "clang", "associations",
    "neologisms", "echolalia", "flat", "affect", "blunted", "affect",
    "alogia", "avolition", "anhedonia", "asociality", "schizotypal",
    "schizoid", "paranoid", "personality", "antisocial", "personality",
    "borderline", "personality", "histrionic", "personality", "narcissistic",
    "personality", "avoidant", "personality", "dependent", "personality",
    "obsessive", "compulsive", "personality", "ocpd", "personality",
    "disorders", "cluster", "a", "cluster", "b", "cluster", "c",
    "eating", "disorders", "anorexia", "nervosa", "bulimia", "nervosa",
    "binge", "eating", "bed", "pica", "rumination", "avoidant",
    "restrictive", "food", "intake", "arfid", "sleep", "wake",
    "disorders", "insomnia", "hypersomnia", "narcolepsy", "sleep",
    "apnea", "parasomnia", "nightmare", "disorder", "sleep", "terror",
    "sleepwalking", "restless", "legs", "circadian", "rhythm",
    "sexual", "dysfunctions", "erectile", "premature", "ejaculation",
    "delayed", "ejaculation", "female", "orgasmic", "sexual", "interest",
    "arousal", "genito", "pelvic", "pain", "penetration", "vaginismus",
    "dyspareunia", "paraphilic", "disorders", "voyeuristic", "exhibitionistic",
    "frotteuristic", "pedophilic", "fetishistic", "transvestic",
    "sadistic", "masochistic", "gender", "dysphoria", "transgender",
    "disruptive", "impulse", "control", "conduct", "disorder",
    "opposition", "defiant", "od", "intermittent", "explosive",
    "pyromania", "kleptomania", "gambling", "disorder", "substance",
    "related", "addictive", "disorders", "substance", "use", "disorder",
    "sud", "alcohol", "use", "opioid", "use", "stimulant", "use",
    "cannabis", "use", "sedative", "hypnotic", "anxiolytic", "tobacco",
    "nicotine", "caffeine", "intoxication", "withdrawal", "tolerance",
    "dependence", "craving", "relapse", "remission", "abstinence",
    "neurocognitive", "disorders", "delirium", "dementia", "alzheimer",
    "vascular", "dementia", "lewy", "body", "dementia", "frontotemporal",
    "dementia", "parkinson", "disease", "dementia", "huntington",
    "disease", "traumatic", "brain", "injury", "tbi", "mild",
    "neurocognitive", "major", "neurocognitive", "amnestic", "confabulation",
    "apraxia", "agnosia", "aphasia", "broca", "aphasia", "wernicke",
    "aphasia", "conduction", "aphasia", "global", "aphasia", "anomic",
    "aphasia", "alexia", "agraphia", "acalculia", "childhood",
    "disorders", "neurodevelopmental", "disorders", "intellectual",
    "disability", "id", "global", "developmental", "delay", "gdd",
    "communication", "disorders", "language", "disorder", "speech",
    "sound", "disorder", "childhood", "onset", "fluency", "stuttering",
    "pragmatic", "communication", "social", "pragmatic", "autism",
    "spectrum", "asd", "asperger", "rett", "childhood", "disintegrative",
    "pervasive", "developmental", "pdd", "nos", "motor", "disorders",
    "developmental", "coordination", "stereotypic", "movement", "tic",
    "tourette", "elimination", "disorders", "enuresis", "encopresis",
    "suicide", "suicidal", "ideation", "suicidal", "intent", "suicidal",
    "plan", "suicide", "attempt", "completed", "suicide", "parasuicide",
    "self", "harm", "nonsuicidal", "self", "injury", "nssi",
    "risk", "factors", "protective", "factors", "lethality",
    "assessment", "safety", "planning", "no", "suicide", "contract",
    "hospitalization", "involuntary", "commitment", "civil", "commitment",
    "danger", "self", "others", "gravely", "disabled",

    # ── THEORIES OF PERSONALITY ───────────────────────────────────────────────
    "personality", "trait", "theory", "type", "theory", "psychoanalytic",
    "psychodynamic", "humanistic", "existential", "behavioral",
    "social", "cognitive", "biological", "evolutionary", "personality",
    "allport", "cardinal", "traits", "central", "traits", "secondary",
    "traits", "propriate", "striving", "functional", "autonomy",
    "cattell", "surface", "traits", "source", "traits", "sixteen",
    "pf", "eysenck", "pen", "psychoticism", "extraversion",
    "neuroticism", "lie", "scale", "costa", "mccrae", "big", "five",
    "ocean", "openness", "conscientiousness", "extraversion",
    "agreeableness", "neuroticism", "emotional", "stability",
    "lexical", "hypothesis", "factor", "analytic", "approach",
    "mischel", "person", "situation", "debate", "consistency",
    "paradox", "behavioral", "signature", "cognitive", "affective",
    "personality", "system", "caps", "encoding", "competencies",
    "expectancies", "beliefs", "goals", "values", "affects",
    "self", "regulatory", "plans", "kelly", "personal", "construct",
    "repertory", "grid", "fundamental", "postulate", "construction",
    "corollary", "anticipatory", "choice", "constructive", "alternativism",
    "rotter", "locus", "control", "internal", "external", "behavior",
    "potential", "expectancy", "reinforcement", "value", "psychological",
    "situation", "maslow", "hierarchy", "needs", "physiological",
    "safety", "love", "belonging", "esteem", "self", "actualization",
    "self", "actualisation", "peak", "experience", "deficiency",
    "needs", "growth", "needs", "metaneeds", "rogers", "person",
    "centered", "fully", "functioning", "person", "self", "concept",
    "ideal", "self", "real", "self", "incongruence", "congruence",
    "conditional", "positive", "regard", "unconditional", "positive",
    "regard", "organismic", "valuing", "process", "phenomenal", "field",
    "may", "existential", "anxiety", "freedom", "responsibility",
    "meaning", "meaninglessness", "authenticity", "bad", "faith",
    "frankl", "logotherapy", "will", "meaning", "tragic", "optimism",
    "jung", "analytical", "psychology", "collective", "unconscious",
    "personal", "unconscious", "archetypes", "persona", "shadow",
    "anima", "animus", "self", "archetype", "individuation",
    "synchronicity", "psychological", "types", "introversion",
    "extraversion", "thinking", "feeling", "sensing", "intuition",
    "adler", "individual", "psychology", "inferiority", "complex",
    "superiority", "complex", "striving", "superiority", "social",
    "interest", "gemeinschaftsgefuhl", "style", "life", "fictional",
    "finalism", "birth", "order", "firstborn", "middle", "child",
    "youngest", "only", "child", "horney", "basic", "anxiety",
    "moving", "toward", "people", "moving", "against", "people",
    "moving", "away", "from", "people", "idealized", "self", "image",
    "tyranny", "shoulds", "neurotic", "pride", "self", "hatred",
    "sullivan", "interpersonal", "theory", "dynamisms", "prototaxic",
    "parataxic", "syntaxic", "modes", "experience", "good", "me",
    "bad", "me", "not", "me", "chumship", "fromm", "escape",
    "freedom", "authoritarianism", "destructiveness", "automaton",
    "conformity", "being", "mode", "having", "mode", "erich", "fromm",
    "perls", "gestalt", "therapy", "here", "now", "awareness",
    "unfinished", "business", "empty", "chair", "technique",
    "top", "dog", "under", "dog", "contact", "boundary", "retroflection",
    "confluence", "deflection", "introjection", "projection", "egotism",
    "skinner", "radical", "behaviorism", "free", "will", "determinism",
    "beyond", "freedom", "dignity", "dolard", "miller", "drive",
    "cue", "response", "reinforcement", "frustration", "aggression",
    "hypothesis", "murray", "need", "press", "thema", "personology",
    "manifest", "needs", "latent", "needs", "alpha", "press", "beta",
    "press", "achievement", "affiliation", "power", "intimacy",
    "narcissism", "machiavellianism", "dark", "triad", "psychopathy",
    "primary", "psychopathy", "secondary", "psychopathy", "cleckley",
    "hare", "psychopathy", "checklist", "pcl", "antisocial",
    "personality", "sociopathy", "character", "structure", "character",
    "organization", "neurotic", "level", "borderline", "level",
    "psychotic", "level", "kernberg", "object", "relations", "klein",
    "paranoid", "schizoid", "position", "depressive", "position",
    "good", "object", "bad", "object", "splitting", "projective",
    "identification", "winnicott", "transitional", "object",
    "transitional", "phenomena", "true", "self", "false", "self",
    "holding", "environment", "good", "enough", "mother", "mahler",
    "separation", "individuation", "normal", "autism", "normal",
    "symbiosis", "differentiation", "practicing", "rapprochement",
    "object", "constancy", "kohut", "self", "psychology", "mirroring",
    "idealizing", "twinship", "selfobject", "narcissistic", "rage",
    "fragmentation", "bowen", "family", "systems", "differentiation",
    "self", "triangulation", "nuclear", "family", "emotional", "system",
    "family", "projection", "process", "multigenerational", "transmission",
    "emotional", "cutoff", "sibling", "position", "societal", "emotional",
    "process", "minuchin", "structural", "family", "therapy", "boundaries",
    "rigid", "diffuse", "clear", "subsystems", "coalitions", "detouring",
    "stable", "unstable", "enmeshment", "disengagement", "joining",
    "accommodation", "restructuring", "unbalancing", " Haley",
    "strategic", "family", "therapy", "double", "bind", "paradoxical",
    "intervention", "prescribing", "symptom", "reframing", "ordeals",
    "madanes", "satir", "experiential", "family", "therapy",
    "congruent", "communication", "placater", "blamer", "super",
    "reasonable", "irrelevant", "congruent", "stances", "family",
    "sculpting", "family", "reconstruction", "self", "of", "therapist",

    # ── SOCIAL PSYCHOLOGY ─────────────────────────────────────────────────────
    "social", "psychology", "social", "cognition", "social", "perception",
    "attribution", "theory", "heider", "naive", "psychology", "internal",
    "attribution", "dispositional", "attribution", "external",
    "attribution", "situational", "attribution", "fundamental",
    "attribution", "error", "correspondence", "bias", "actor", "observer",
    "bias", "self", "serving", "bias", "hedonic", "bias", "just",
    "world", "hypothesis", "defensive", "attribution", "kelly", "covariation",
    "consensus", "distinctiveness", "consistency", "discounting",
    "principle", "augmentation", "principle", "weiner", "attribution",
    "locus", "stability", "controllability", "learned", "helplessness",
    "seligman", "explanatory", "style", "optimistic", "pessimistic",
    "attitudes", "abc", "model", "affective", "behavioral", "cognitive",
    "components", "explicit", "attitudes", "implicit", "attitudes",
    "iat", "implicit", "association", "test", "bogardus", "social",
    "distance", "likert", "scale", "semantic", "differential",
    "thurstone", "scale", "guttman", "scale", "attitude", "formation",
    "classical", "conditioning", "operant", "conditioning", "observational",
    "learning", "mere", "exposure", "effect", "persuasion", "elaboration",
    "likelihood", "model", "elm", "central", "route", "peripheral",
    "route", "petty", "cacioppo", "hovland", "yale", "model",
    "source", "credibility", "expertise", "trustworthiness",
    "attractiveness", "message", "factors", "one", "sided", "two",
    "sided", "messages", "fear", "appeals", "inoculation", "theory",
    "mcguire", "sleeper", "effect", "boomerang", "effect", "reactance",
    "theory", "brehm", "cognitive", "dissonance", "festinger",
    "insufficient", "justification", "effort", "justification",
    "induced", "compliance", "free", "choice", "paradigm", "forced",
    "compliance", "counterattitudinal", "advocacy", "spreading",
    "alternatives", "self", "perception", "theory", "bem", "overjustification",
    "effect", "balance", "theory", "heider", "po", "x", "triad",
    "social", "comparison", "theory", "festinger", "upward", "comparison",
    "downward", "comparison", "lateral", "comparison", "temporal",
    "comparison", "conformity", "asch", "line", "judgment", "normative",
    "influence", "informational", "influence", "compliance",
    "identification", "internalization", "kelman", "groupthink", "janis",
    "illusion", "invulnerability", "collective", "rationalization",
    "stereotyping", "outgroup", "self", "censorship", "illusion",
    "unanimity", "direct", "pressure", "self", "appointed", "mindguards",
    "obedience", "milgram", "shock", "generator", "teacher", "learner",
    "experimenter", "proximity", "legitimacy", "authority", "agentic",
    "state", "autonomous", "state", "binding", "factors", "strain",
    "resolving", "mechanisms", "zimbardo", "stanford", "prison",
    "experiment", "deindividuation", "role", "playing", "situational",
    "power", "systemic", "factors", "lucifer", "effect", "bystander",
    "effect", "darley", "latane", "diffusion", "responsibility",
    "pluralistic", "ignorance", "evaluation", "apprehension", "helping",
    "behavior", "altruism", "kin", "selection", "reciprocal", "altruism",
    "empathy", "altruism", "hypothesis", "batson", "negative", "state",
    "relief", "model", "arousal", "cost", "reward", "model", "piliavin",
    "aggression", "instinct", "theory", "freud", "thanatos", "lorenz",
    "hydraulic", "model", "frustration", "aggression", "dollard",
    "social", "learning", "aggression", "bandura", "general", "aggression",
    "model", "gam", "anderson", "bushman", "hostile", "aggression",
    "instrumental", "aggression", "relational", "aggression", "passive",
    "aggression", "displaced", "aggression", "triggered", "displaced",
    "aggression", "excitation", "transfer", "zillmann", "weapons",
    "effect", "berkowitz", "heat", "aggression", "noise", "aggression",
    "crowding", "aggression", "alcohol", "aggression", "media",
    "violence", "video", "games", "violence", "desensitization",
    "priming", "effect", "script", "theory", "huesmann", "prejudice",
    "stereotypes", "discrimination", "racism", "sexism", "ageism",
    "homophobia", "xenophobia", "ethnocentrism", "ingroup", "outgroup",
    "bias", "minimal", "group", "paradigm", "tajfel", "social", "identity",
    "theory", "tajfel", "turner", "ingroup", "favoritism", "outgroup",
    "derogation", "realistic", "conflict", "theory", "sherif", "robbers",
    "cave", "experiment", "superordinate", "goals", "jigsaw", "classroom",
    "aronson", "contact", "hypothesis", "allport", "equal", "status",
    "common", "goals", "intergroup", "cooperation", "institutional",
    "support", "aversive", "racism", "dovidio", "gaertner", "modern",
    "racism", "mcconahay", "symbolic", "racism", "sears", "benevolent",
    "sexism", "hostile", "sexism", "ambivalent", "sexism", "glick",
    "fiske", "stereotype", "threat", "steele", "aranson", "self",
    "fulfilling", "prophecy", "rosenthal", "jacobson", "pygmalion",
    "effect", "golem", "effect", "behavioral", "confirmation", "snyder",
    "group", "dynamics", "group", "cohesion", "group", "polarization",
    "risky", "shift", "cautious", "shift", "social", "facilitation",
    "zajonc", "social", "inhibition", "social", "loafing", "ringelmann",
    "effect", "free", "riding", "sucker", "effect", "deindividuation",
    "festinger", "pepitone", "newcomb", "zimbardo", "diener", "mob",
    "behavior", "crowd", "psychology", "le", "bon", "leadership",
    "trait", "theory", "great", "man", "theory", "behavioral", "theory",
    "contingency", "theory", "fiedler", "path", "goal", "theory",
    "house", "leader", "member", "exchange", "lmx", "graeen",
    "transformational", "leadership", "bass", "transactional", "leadership",
    "charismatic", "leadership", "servant", "leadership", "greenleaf",
    "authentic", "leadership", "interpersonal", "attraction", "proximity",
    "propinquity", "similarity", "attraction", "complementarity",
    "physical", "attractiveness", "matching", "hypothesis", "halo",
    "effect", "what", "beautiful", "good", "stereotype", "reciprocity",
    "liking", "gain", "loss", "theory", "aronson", "linton", "triangular",
    "theory", "love", "sternberg", "intimacy", "passion", "commitment",
    "consummate", "love", "romantic", "love", "companionate", "love",
    "fatuous", "love", "empty", "love", "infatuation", "liking",
    "nonlove", "attachment", "styles", "adult", "attachment", "hazan",
    "shaver", "secure", "preoccupied", "anxious", "ambivalent",
    "dismissing", "avoidant", "fearful", "avoidant", "bartholomew",
    "horowitz", "relationship", "satisfaction", "investment", "model",
    "rusbult", "satisfaction", "alternatives", "investments", "commitment",
    "equity", "theory", "walster", "berscheid", "overbenefited",
    "underbenefited", "exchange", "relationships", "communal",
    "relationships", "clark", "mills", "self", "concept", "self",
    "schema", "markus", "possible", "selves", "higgins", "ought",
    "self", "ideal", "self", "actual", "self", "self", "discrepancy",
    "theory", "self", "esteem", " Rosenberg", "self", "efficacy",
    "bandura", "self", "handicapping", "jones", "berglas", "self",
    "verification", "swann", "self", "enhancement", "self", "presentation",
    "impression", "management", "goffman", "dramaturgical", "model",
    "front", "stage", "back", "stage", "face", "work", "stigma",
    "spoiled", "identity", "virtual", "social", "identity", "actual",
    "social", "identity", "discredited", "discreditable", "self",
    "monitoring", "snyder", "high", "self", "monitors", "low", "self",
    "monitors", "self", "awareness", "duval", "wicklund", "objective",
    "self", "awareness", "subjective", "self", "awareness", "self",
    "consciousness", "fenigstein", "scheier", "buss", "public", "self",
    "consciousness", "private", "self", "consciousness", "social",
    "anxiety", "spotlight", "effect", "gilovich", "savitsky",
    "illusion", "transparency", "egocentric", "bias", "false", "consensus",
    "effect", "ross", "unique", "self", "bias", "above", "average",
    "effect", "better", "than", "average", "effect", "unrealistic",
    "optimism", "weinstein", "illusion", "control", "langer",
    "optimism", "bias", "planning", "fallacy", "kahneman", "tversky",

    # ── COGNITIVE PSYCHOLOGY ──────────────────────────────────────────────────
    "cognitive", "psychology", "attention", "selective", "attention",
    "divided", "attention", "sustained", "attention", "vigilance",
    "cocktail", "party", "effect", "cherry", "dichotic", "listening",
    "broadbent", "filter", "model", "treisman", "attenuation", "model",
    "deutsch", "deutsch", "late", "selection", "model", "load", "theory",
    "lavie", "perceptual", "load", "cognitive", "load", "change",
    "blindness", "simons", "chabris", "inattentional", "blindness",
    "mack", "rock", "gorilla", "experiment", "attentional", "blink",
    "raymond", "shapiro", "arnell", "signal", "detection", "theory",
    "hits", "misses", "false", "alarms", "correct", "rejections",
    "sensitivity", "d", "prime", "response", "bias", "criterion",
    "receiver", "operating", "characteristic", "roc", "curve",
    "perception", "sensation", "transduction", "absolute", "threshold",
    "difference", "threshold", "just", "noticeable", "difference",
    "jnd", "weber", "law", "fechner", "law", "steven", "power", "law",
    "signal", "detection", "bottom", "up", "processing", "top", "down",
    "processing", "feature", "integration", "theory", "treisman",
    "gelade", "illusory", "conjunctions", "gestalt", "principles",
    "proximity", "similarity", "continuity", "closure", "common", "fate",
    "good", "continuation", "pragnanz", "simplicity", "figure", "ground",
    "perceptual", "constancy", "size", "constancy", "shape", "constancy",
    "brightness", "constancy", "color", "constancy", "depth", "perception",
    "binocular", "cues", "monocular", "cues", "retinal", "disparity",
    "convergence", "accommodation", "linear", "perspective", "texture",
    "gradient", "relative", "size", "interposition", "overlap",
    "motion", "parallax", "aerial", "perspective", "light", "shadow",
    "visual", "illusions", "muller", "lyer", "ponzo", "ames", "room",
    "moon", "illusion", "autokinetic", "effect", "phi", "phenomenon",
    "wertheimer", "beta", "movement", "apparent", "motion", "pattern",
    "recognition", "template", "matching", "prototype", "theory",
    "feature", "detection", "pandemonium", "model", "selfridge",
    "biederman", "recognition", "components", "geons", "viewpoint",
    "dependent", "viewpoint", "independent", "word", "superiority",
    "effect", "reicher", "wheeler", "object", "superiority", "effect",
    "configural", "superiority", "effect", "memory", "models", "atkinson",
    "shiffrin", "modal", "model", "multi", "store", "model", "sensory",
    "register", "iconic", "memory", "echoic", "memory", "haptic",
    "memory", "sperling", "partial", "report", "whole", "report",
    "short", "term", "memory", "stm", "working", "memory", "baddeley",
    "hitch", "central", "executive", "phonological", "loop", "visuospatial",
    "sketchpad", "episodic", "buffer", "slave", "systems", "articulatory",
    "rehearsal", "maintenance", "rehearsal", "elaborative", "rehearsal",
    "chunking", "miller", "magical", "number", "seven", "plus", "minus",
    "two", "capacity", "duration", "decay", "displacement", "interference",
    "proactive", "interference", "retroactive", "interference", "brown",
    "peterson", "task", "long", "term", "memory", "ltm", "explicit",
    "declarative", "implicit", "nondeclarative", "episodic", "tulving",
    "semantic", "procedural", "skill", "memory", "priming", "perceptual",
    "priming", "conceptual", "priming", "classical", "conditioning",
    "memory", "nonassociative", "memory", "encoding", "specificity",
    "principle", "tulving", "thomson", "transfer", "appropriate",
    "processing", "morris", "levels", "processing", " Craik", "lockhart",
    "shallow", "processing", "deep", "processing", "structural",
    "phonemic", "semantic", "elaboration", "distinctiveness", "von",
    "restorff", "effect", "isolation", "effect", "generation", "effect",
    "slamecka", "graf", "testing", "effect", "retrieval", "practice",
    "effect", "spacing", "effect", "distributed", "practice", "massed",
    "practice", "serial", "position", "effect", "primacy", "effect",
    "recency", "effect", "retrieval", "cue", "dependent", "forgetting",
    "tulving", "pearlstone", "tip", "tongue", "phenomenon", "brown",
    "mcneill", "retrieval", "induced", "forgetting", "anderson", "spellman",
    "directed", "forgetting", "bjork", "weapon", "focus", "effect",
    "loftus", "misinformation", "effect", " Loftus", "palmer", "leading",
    "questions", "eyewitness", "testimony", "confidence", "accuracy",
    "relationship", "flashbulb", "memories", "brown", "kulik",
    "neisser", "harsh", "confabulation", "false", "memories", " Loftus",
    "lost", "mall", "study", "imagination", "inflation", "garry",
    "polaschek", "hyman", "pentland", "source", "monitoring", "johnson",
    "hashtroudi", "lindsay", "source", "amnesia", "reality", "monitoring",
    "cryptomnesia", "unconscious", "plagiarism", "prospective", "memory",
    "remembering", "remember", "event", "based", "time", "based",
    "prospective", "memory", "metamemory", "nelson", "narens",
    "feeling", "knowing", "fok", "judgment", "learning", "jol",
    "confidence", "judgments", "calibration", "resolution", "language",
    "processing", "phonology", "morphology", "syntax", "semantics",
    "pragmatics", "lexicon", "mental", "lexicon", "word", "recognition",
    "cohort", "model", "marslen", "wilson", "interactive", "activation",
    "model", "mcclelland", "rumelhart", "race", "model", "forster",
    "sentence", "processing", "garden", "path", "model", "frazier",
    "rayner", "constraint", "based", "model", "macdonald", "pearlmutter",
    "seidenberg", "syntax", "semantics", "interaction", "discourse",
    "processing", "coherence", "cohesion", "anaphora", "cataphora",
    "given", "new", "contract", "clark", "haviland", "construction",
    "integration", "model", "kintsch", "van", "dijk", "structure",
    "building", "framework", "gernsbacher", "mental", "models",
    "johnson", "laird", "propositional", "representation", "imagery",
    "representation", "dual", "coding", "theory", "paivio", "verbal",
    "code", "imaginal", "code", "referential", "connections",
    "representational", "connections", "associative", "connections",
    "mental", "rotation", "shepard", "metzler", "image", "scanning",
    "kosslyn", "ball", "pinkerton", "tacit", "knowledge", "explanation",
    "pylyshyn", "propositional", "theory", "spatial", "cognition",
    "cognitive", "maps", "tolman", "latent", "learning", "place",
    "cells", "grid", "cells", "head", "direction", "cells",
    "hippocampus", "entorhinal", "cortex", "problem", "solving",
    "well", "defined", "problems", "ill", "defined", "problems",
    "means", "ends", "analysis", "newell", "simon", "general", "problem",
    "solver", "gps", "working", "backward", "analogical", "reasoning",
    "gick", "holyoak", "surface", "features", "structural", "features",
    "functional", "fixedness", "duncker", "candle", "problem",
    "mental", "set", "einstellung", "effect", "luchins", "water", "jug",
    "incubation", "effect", "insight", "kohler", "sultan", "chimpanzee",
    "aha", "moment", "metcalfe", "wiebe", "warmth", "ratings",
    "creativity", "divergent", "thinking", "guilford", "alternative",
    "uses", "test", "torrance", "tests", "creative", "thinking", "ttct",
    "fluency", "flexibility", "originality", "elaboration", "wallace",
    "four", "stage", "model", "preparation", "incubation", "illumination",
    "verification", "csikszentmihalyi", "flow", "state", "decision",
    "making", "normative", "models", "expected", "utility", "theory",
    "bernoulli", "von", "neumann", "morgenstern", "descriptive", "models",
    "prospect", "theory", "kahneman", "tversky", "loss", "aversion",
    "framing", "effect", "endowment", "effect", "thaler", "status",
    "quo", "bias", "sunk", "cost", "fallacy", "conjunction", "fallacy",
    "linda", "problem", "base", "rate", "neglect", "representativeness",
    "heuristic", "availability", "heuristic", "anchoring", "adjustment",
    "heuristic", "simulation", "heuristic", "affect", "heuristic",
    "recognition", "heuristic", "gigerenzer", "fast", "frugal",
    "heuristics", "bounded", "rationality", "simon", "satisficing",
    "dual", "process", "theories", "system", "1", "system", "2",
    "stanovich", "west", "evans", "overton", "hot", "cognition",
    "cold", "cognition", "motivated", "reasoning", "confirmation",
    "bias", "myside", "bias", "belief", "perseverance", "backfire",
    "effect", "cognitive", " miser", "fiske", "taylor", "naive",
    "scientist", "motivated", "tactician", "reasoning", "syllogistic",
    "reasoning", "conditional", "reasoning", "modus", "ponens", "modus",
    "tollens", "affirming", "consequent", "denying", "antecedent",
    "wason", "selection", "task", "four", "card", "problem",
    "thematic", "facilitation", "permission", "schema", "cheng", "holyoak",
    "social", "contract", "theory", "cosmides", "tooby", "cheater",
    "detection", "module", "bayesian", "reasoning", "natural",
    "frequencies", "gigerenzer", "hoffrage", "base", "rate", "use",

    # ── BIOLOGICAL / NEUROPSYCHOLOGY ──────────────────────────────────────────
    "neuroscience", "neuropsychology", "biopsychology", "psychobiology",
    "behavioral", "neuroscience", "cognitive", "neuroscience", "neuron",
    "neurons", "glia", "glial", "cells", "astrocytes", "oligodendrocytes",
    "microglia", "schwann", "cells", "myelin", "sheath", "nodes",
    "ranvier", "axon", "dendrite", "soma", "cell", "body", "synapse",
    "synapses", "synaptic", "cleft", "neurotransmitter", "neurotransmitters",
    "acetylcholine", "dopamine", "serotonin", "norepinephrine",
    "noradrenaline", "epinephrine", "adrenaline", "gaba", "gamma",
    "aminobutyric", "acid", "glutamate", "glycine", "endorphins",
    "enkephalins", "substance", "p", "oxytocin", "vasopressin",
    "melatonin", "cortisol", "adrenaline", "noradrenaline", "agonist",
    "antagonist", "reuptake", "inhibitor", "ssri", "selective",
    "serotonin", "reuptake", "inhibitor", "snri", "maoi", "monoamine",
    "oxidase", "inhibitor", "tca", "tricyclic", "antidepressant",
    "action", "potential", "resting", "potential", "depolarization",
    "repolarization", "hyperpolarization", "refractory", "period",
    "absolute", "refractory", "relative", "refractory", "sodium",
    "potassium", "pump", "ion", "channels", "voltage", "gated",
    "ligand", "gated", "mechanically", "gated", "excitatory",
    "postsynaptic", "potential", "epsp", "inhibitory", "postsynaptic",
    "potential", "ipsp", "temporal", "summation", "spatial", "summation",
    "saltatory", "conduction", "all", "or", "none", "law", "rate",
    "coding", "population", "coding", "neural", "plasticity",
    "neuroplasticity", "synaptic", "plasticity", "long", "term",
    "potentiation", "ltp", "long", "term", "depression", "ltd",
    "hebbian", "learning", "cells", "fire", "together", "wire",
    "together", "neurogenesis", "apoptosis", "programmed", "cell",
    "death", "pruning", "synaptic", "pruning", "brain", "development",
    "central", "nervous", "system", "cns", "peripheral", "nervous",
    "system", "pns", "somatic", "nervous", "system", "autonomic",
    "nervous", "system", "ans", "sympathetic", "nervous", "system",
    "parasympathetic", "nervous", "system", "enteric", "nervous",
    "system", "fight", "flight", "response", "rest", "digest",
    "response", "cerebrum", "cerebral", "cortex", "frontal", "lobe",
    "parietal", "lobe", "temporal", "lobe", "occipital", "lobe",
    "prefrontal", "cortex", "pfc", "dorsolateral", "prefrontal",
    "dlpfc", "ventromedial", "prefrontal", "vmpfc", "orbitofrontal",
    "cortex", "ofc", "anterior", "cingulate", "cortex", "acc",
    "motor", "cortex", "primary", "motor", "somatosensory", "cortex",
    "primary", "somatosensory", "visual", "cortex", "v1", "striate",
    "cortex", "extrastriate", "cortex", "auditory", "cortex",
    "primary", "auditory", "heschl", "gyrus", "wernicke", "area",
    "broca", "area", "arcuate", "fasciculus", "angular", "gyrus",
    "supramarginal", "gyrus", "insula", "basal", "ganglia", "striatum",
    "caudate", "putamen", "globus", "pallidus", "substantia", "nigra",
    "pars", "compacta", "pars", "reticulata", "subthalamic", "nucleus",
    "thalamus", "hypothalamus", "pituitary", "gland", "adenohypophysis",
    "neurohypophysis", "hpaa", "axis", "hypothalamic", "pituitary",
    "adrenal", "axis", "amygdala", "hippocampus", "dentate", "gyrus",
    "entorhinal", "cortex", "parahippocampal", "cortex", "fornix",
    "mammillary", "bodies", "septum", "septal", "nuclei", "nucleus",
    "accumbens", "ventral", "tegmental", "area", "vta", "reward",
    "pathway", "mesolimbic", "pathway", "mesocortical", "pathway",
    "nigrostriatal", "pathway", "tuberoinfundibular", "pathway",
    "limbic", "system", "papez", "circuit", "corpus", "callosum",
    "commissures", "anterior", "commissure", "posterior", "commissure",
    "cerebellum", "brainstem", "midbrain", "pons", "medulla",
    "oblongata", "reticular", "formation", "reticular", "activating",
    "system", "ras", "locus", "coeruleus", "raphe", "nuclei",
    "periaqueductal", "gray", "pag", "superior", "colliculus",
    "inferior", "colliculus", "cranial", "nerves", "spinal", "cord",
    "dorsal", "root", "ventral", "root", "dorsal", "horn", "ventral",
    "horn", "gray", "matter", "white", "matter", "meninges", "dura",
    "mater", "arachnoid", "mater", "pia", "mater", "cerebrospinal",
    "fluid", "csf", "blood", "brain", "barrier", "bbb", "choroid",
    "plexus", "ventricles", "lateral", "ventricles", "third",
    "ventricle", "fourth", "ventricle", "cerebral", "aqueduct",
    "endocrine", "system", "hormones", "thyroid", "adrenal", "gonads",
    "pancreas", "insulin", "glucagon", "testosterone", "estrogen",
    "progesterone", "prolactin", "growth", "hormone", "gh", "thyroid",
    "stimulating", "hormone", "tsh", "adrenocorticotropic", "hormone",
    "acth", "follicle", "stimulating", "hormone", "fsh", "luteinizing",
    "hormone", "lh", "gonadotropin", "releasing", "hormone", "gnrh",
    "corticotropin", "releasing", "hormone", "crh", "thyrotropin",
    "releasing", "hormone", "trh", "somatostatin", "dopamine",
    "prolactin", "inhibiting", "factor", "pif", "neuroimaging", "ct",
    "computed", "tomography", "mri", "magnetic", "resonance", "imaging",
    "fmri", "functional", "mri", "bold", "signal", "blood", "oxygen",
    "level", "dependent", "pet", "positron", "emission", "tomography",
    "spect", "single", "photon", "emission", "computed", "tomography",
    "eeg", "electroencephalography", "erp", "event", "related",
    "potential", "p300", "n400", "mmn", "mismatch", "negativity",
    "meg", "magnetoencephalography", "dti", "diffusion", "tensor",
    "imaging", "tractography", "lesion", "studies", "ablation",
    "studies", "tms", "transcranial", "magnetic", "stimulation",
    "tdcs", "transcranial", "direct", "current", "stimulation",
    "optogenetics", "split", "brain", "studies", "sperry", "gazzaniga",
    "hemispheric", "lateralization", "lateralisation", "left",
    "hemisphere", "right", "hemisphere", "language", "lateralization",
    "spatial", "processing", "lateralization", "emotional", "processing",
    "lateralization", "corpus", "callosotomy", "callosotomy",
    "wada", "test", "intracarotid", "sodium", "amobarbital", "procedure",
    "aphasia", "types", "broca", "aphasia", "expressive", "aphasia",
    "motor", "aphasia", "nonfluent", "aphasia", "wernicke", "aphasia",
    "receptive", "aphasia", "sensory", "aphasia", "fluent", "aphasia",
    "conduction", "aphasia", "global", "aphasia", "anomic", "aphasia",
    "transcortical", "motor", "aphasia", "transcortical", "sensory",
    "aphasia", "mixed", "transcortical", "aphasia", "apraxia", "ideomotor",
    "apraxia", "ideational", "apraxia", "constructional", "apraxia",
    "dressing", "apraxia", "buccofacial", "apraxia", "limb", "kinetic",
    "apraxia", "agnosia", "visual", "agnosia", "apperceptive", "agnosia",
    "associative", "agnosia", "prosopagnosia", "face", "agnosia",
    "anosognosia", "hemineglect", "unilateral", "neglect", "spatial",
    "neglect", "alien", "hand", "syndrome", "phantom", "limb",
    "synesthesia", "synaesthesia", "mirror", "touch", "synesthesia",
    "grapheme", "color", "synesthesia", "chromesthesia", "parkinson",
    "disease", "huntington", "disease", "alzheimer", "disease", "amyloid",
    "plaques", "neurofibrillary", "tangles", "tau", "protein", "beta",
    "amyloid", "apolipoprotein", "apoE", "epsilon", "allele", "lewy",
    "body", "disease", "alpha", "synuclein", "multiple", "sclerosis",
    "ms", "demyelination", "amyotrophic", "lateral", "sclerosis", "als",
    "lou", "gehrig", "disease", "motor", "neuron", "disease",
    "myasthenia", "gravis", "guillain", "barre", "syndrome", "epilepsy",
    "seizures", "focal", "seizures", "generalized", "seizures", "tonic",
    "clonic", "absence", "seizures", "petit", "mal", "grand", "mal",
    "temporal", "lobe", "epilepsy", "kindling", "model", "stroke",
    "cerebrovascular", "accident", "cva", "ischemic", "stroke",
    "hemorrhagic", "stroke", "transient", "ischemic", "attack", "tia",
    "penumbra", "excitotoxicity", "glutamate", "excitotoxicity",
    "calcium", "influx", "apoptosis", "necrosis", "neuroinflammation",
    "microglial", "activation", "cytokines", "neurotrophic", "factors",
    "bdnf", "brain", "derived", "neurotrophic", "factor", "ngf", "nerve",
    "growth", "factor", "gdnf", "glial", "cell", "line", "derived",
    "neurotrophic", "factor", "sleep", "neuroscience", "rem", "sleep",
    "rapid", "eye", "movement", "nrem", "sleep", "slow", "wave",
    "sleep", "sws", "sleep", "spindles", "k", "complexes", "delta",
    "waves", "theta", "waves", "alpha", "waves", "beta", "waves",
    "gamma", "waves", "circadian", "rhythms", "suprachiasmatic",
    "nucleus", "scn", "melatonin", "pineal", "gland", "zeitgeber",
    "zeitgebers", "adenosine", "sleep", "pressure", "homeostatic",
    "sleep", "drive", "process", "s", "process", "c", "borbely",
    "two", "process", "model", "pain", "neuroscience", "nociception",
    "nociceptors", "gate", "control", "theory", "melzack", "wall",
    "descending", "pain", "modulation", "periaqueductal", "gray",
    "raphe", "nuclei", "serotonin", "norepinephrine", "pain",
    "inhibition", "endogenous", "opioids", "endorphins", "enkephalins",
    "dynorphins", "mu", "receptors", "delta", "receptors", "kappa",
    "receptors", "substance", "p", "neurokinin", "receptors",
    "hyperalgesia", "allodynia", "neuropathic", "pain", "phantom",
    "pain", "central", "sensitization", "wind", "up", "phenomenon",
    "stress", "neuroscience", "allostatic", "load", "mcewen", "stress",
    "response", "hpaa", "axis", "glucocorticoids", "cortisol",
    "corticosterone", "mineralocorticoids", "aldosterone", "catecholamines",
    "epinephrine", "norepinephrine", "acute", "stress", "chronic",
    "stress", "stress", "inoculation", " Learned", "helplessness",
    "seligman", "maier", "overmier", "control", "stress", "predictability",
    "stress", "controllability", "stress", "buffering", "social",
    "support", "resilience", "hardiness", "kobasa", "commitment",
    "control", "challenge", "optimism", "scheier", "carver", "coping",
    "strategies", "problem", "focused", "coping", "emotion", "focused",
    "coping", "avoidance", "coping", "approach", "coping", " Lazarus",
    "folkman", "transactional", "model", "stress", "appraisal",
    "primary", "appraisal", "secondary", "appraisal", "reappraisal",
    "cognitive", "appraisal", "psychoneuroimmunology", "pni", "immune",
    "system", "innate", "immunity", "adaptive", "immunity", "humoral",
    "immunity", "cell", "mediated", "immunity", "cytokines",
    "interleukins", "interferons", "tumor", "necrosis", "factor", "tnf",
    "psychosomatic", "medicine", "health", "psychology", "biopsychosocial",
    "model", "engel", "health", "belief", "model", "rosenstock",
    "transtheoretical", "model", "stages", "change", "prochaska",
    "diclemente", "precontemplation", "contemplation", "preparation",
    "action", "maintenance", "termination", "relapse", "self",
    "efficacy", "health", "behavior", "theory", "planned", "behavior",
    "ajzen", "theory", "reasoned", "action", "fishbein", "ajzen",
    "protection", "motivation", "theory", "rogers", "threat", "appraisal",
    "coping", "appraisal", "severity", "susceptibility", "response",
    "efficacy", "self", "efficacy", "response", "costs", "extended",
    "parallel", "process", "model", "eppm", "witte", "danger", "control",
    "fear", "control", "danger", "control", "addiction", "neuroscience",
    "reward", "circuitry", "dopamine", "reward", "prediction", "error",
    "schultz", "incentive", "sensitization", "robinson", "berridge",
    "wanting", "liking", "distinction", "allostatic", "model",
    "addiction", "Koob", "le", "moal", "hedonic", "homeostasis",
    "anti", "reward", "system", "extended", "amygdala", "crf",
    "corticotropin", "releasing", "factor", "dynorphin", "kappa",
    "opioid", "receptors", "tolerance", "sensitization", "kindling",
    "withdrawal", "craving", "cue", "reactivity", "drug", "primed",
    "relapse", "stress", "induced", "relapse", "extinction", "renewal",
    "reinstatement", "spontaneous", "recovery", "relapse", "prevention",
    " Marlatt", "gordon", "lifestyle", "balance", "urge", "surfing",
    "mindfulness", "based", "relapse", "prevention", "mbrp", " Bowen",
    "motivational", "interviewing", "miller", "rollnick", "spirit",
    "mi", "partnership", "acceptance", "compassion", "evocation",
    "oars", "open", "questions", "affirmations", "reflections",
    "summaries", "developing", "discrepancy", "rolling", "resistance",
    "supporting", "self", "efficacy", "contemplation", "ladder",
    "readiness", "ruler", "importance", "ruler", "confidence", "ruler",
    "12", "step", "programs", "alcoholics", "anonymous", "aa",
    "narcotics", "anonymous", "na", "smart", "recovery", "cognitive",
    "behavioral", "approach", "addiction", "community", "reinforcement",
    "approach", "cra", " contingency", "management", "voucher", "based",
    "reinforcement", "prize", "based", "reinforcement", "methadone",
    "maintenance", "buprenorphine", "naltrexone", "acamprosate",
    "disulfiram", "antabuse", "varenicline", "chantix", "nicotine",
    "replacement", "therapy", "nrt",

    # ── COUNSELING & PSYCHOTHERAPY ────────────────────────────────────────────
    "counseling", "counselling", "psychotherapy", "therapeutic",
    "alliance", "working", "alliance", "bordin", "goals", "tasks",
    "bonds", "rapport", "empathy", "unconditional", "positive", "regard",
    "congruence", "genuineness", "authenticity", "active", "listening",
    "reflective", "listening", "paraphrasing", "summarizing", "clarifying",
    "confrontation", "challenging", "immediacy", "self", "disclosure",
    "interpretation", "reframing", "normalizing", "validating",
    "psychoeducation", "crisis", "intervention", "debriefing",
    "psychological", "first", "aid", "pfa", "critical", "incident",
    "stress", "debriefing", "cis", "cis", "d", "mitchell", "everly",
    "suicide", "risk", "assessment", "columbia", "suicide", "severity",
    "rating", "scale", "c", "ssrs", "beck", "scale", "suicidal",
    "ideation", "bsi", "suicide", "probability", "scale", "sps",
    "reasons", "living", "inventory", "rli", "linehan", "dbt",
    "dialectical", "behavior", "therapy", "dialectical", "behavior",
    "therapy", "mindfulness", "distress", "tolerance", "emotion",
    "regulation", "interpersonal", "effectiveness", "wise", "mind",
    "reasonable", "mind", "emotion", "mind", "acceptance", "change",
    "dialectics", "validation", "strategies", "behavioral", "chain",
    "analysis", "diary", "card", "phone", "coaching", "therapist",
    "consultation", "team", "cbt", "cognitive", "behavioral", "therapy",
    "beck", "cognitive", "therapy", "ellis", "rational", "emotive",
    "behavior", "therapy", "rebt", "abc", "model", "activating",
    "event", "beliefs", "consequences", "disputing", "irrational",
    "beliefs", "awfulizing", "catastrophizing", "musturbation",
    "demandingness", "low", "frustration", "tolerance", "global",
    "evaluations", "worth", "cognitive", "distortions", "all", "or",
    "nothing", "thinking", "dichotomous", "thinking", "overgeneralization",
    "mental", "filter", "disqualifying", "positive", "jumping",
    "conclusions", "mind", "reading", "fortune", "telling",
    "magnification", "minimization", "emotional", "reasoning", "should",
    "statements", "labeling", "mislabeling", "personalization", "blame",
    "cognitive", "restructuring", "thought", "record", "automatic",
    "thoughts", "intermediate", "beliefs", "core", "beliefs", "schemas",
    "beck", "cognitive", "model", "situational", "analysis", "Socratic",
    "questioning", "guided", "discovery", "collaborative", "empiricism",
    "behavioral", "experiments", "hypothesis", "testing", "activity",
    "scheduling", "pleasant", "events", "schedule", "graded", "task",
    "assignment", "exposure", "therapy", "systematic", "desensitization",
    "wolpe", "flooding", "implosion", "therapy", "prolonged", "exposure",
    "pe", "foa", "prolonged", "exposure", "therapy", "ptsd",
    "interoceptive", "exposure", "in", "vivo", "exposure", "imaginal",
    "exposure", "virtual", "reality", "exposure", "exposure", "response",
    "prevention", "erp", "ocd", "habituation", "extinction", "inhibitory",
    "learning", "model", "exposure", "craske", "expectancy", "violation",
    "acceptance", "commitment", "therapy", "act", "hayes", "strosahl",
    "wilson", "psychological", "flexibility", "hexaflex", "acceptance",
    "cognitive", "defusion", "present", "moment", "awareness", "self",
    "context", "values", "committed", "action", "experiential",
    "avoidance", "fusion", "defusion", "creative", "hopelessness",
    "control", "agenda", "mindfulness", "based", "stress", "reduction",
    "mbsr", "kabat", "zinn", "mindfulness", "based", "cognitive",
    "therapy", "mbct", "segal", "williams", "teasdale", "relapse",
    "prevention", "depression", "decentering", "metacognitive",
    "awareness", "solution", "focused", "brief", "therapy", "sfbt",
    "de", "shazer", "berg", "miracle", "question", "scaling",
    "questions", "exception", "questions", "coping", "questions",
    "compliments", "formula", "first", "session", "task", "observe",
    "task", "do", "something", "different", "task", "predicting",
    "task", "narrative", "therapy", "white", "epston", "externalization",
    "reauthoring", "unique", "outcomes", "sparkling", "events",
    "definitional", "ceremony", "outsider", "witnesses", "therapeutic",
    "documents", "letters", "certificates", "absent", "but", "implicit",
    "landscape", "action", "landscape", "consciousness", "identity",
    "conclusion", "dominant", "story", "alternative", "story",
    "preferred", "story", "thin", "description", "thick", "description",
    "feminist", "therapy", "egalitarian", "relationship", "gender",
    "role", "analysis", "intervention", "power", "analysis", "social",
    "activism", "personal", "political", "intersectionality", "crenshaw",
    "womanist", "psychology", "multicultural", "counseling", "sue",
    "sue", "awareness", "knowledge", "skills", "cultural", "encapsulation",
    "cultural", "imposition", "color", "blindness", "cultural",
    "tunnel", "vision", "microaggressions", "sue", "microassault",
    "microinsult", "microinvalidation", "racial", "battle", "fatigue",
    "smith", "stereotype", "threat", "steele", "aronson", "imposter",
    "phenomenon", "clance", "imes", "group", "therapy", "yalom",
    "therapeutic", "factors", "instillation", "hope", "universality",
    "imparting", "information", "altruism", "corrective", "recapitulation",
    "primary", "family", "group", "development", "socializing",
    "techniques", "imitative", "behavior", "interpersonal", "learning",
    "group", "cohesiveness", "catharsis", "existential", "factors",
    "group", "stages", "forming", "storming", "norming", "performing",
    "adjourning", "tuckman", "jensen", "psychodrama", "moreno",
    "protagonist", "director", "auxiliary", "egos", "audience", "stage",
    "warming", "up", "enactment", "sharing", "role", "playing", "role",
    "reversal", "doubling", "mirroring", "empty", "chair", "gestalt",
    "two", "chair", "dialogue", "family", "therapy", "systems", "theory",
    "von", "bertalanffy", "general", "systems", "theory", "cybernetics",
    "wiener", "first", "order", "cybernetics", "second", "order",
    "cybernetics", "feedback", "loops", "positive", "feedback",
    "negative", "feedback", "homeostasis", "morphogenesis", "equifinality",
    "multifinality", "circular", "causality", "linear", "causality",
    "double", "bind", "bateson", " jackson", "haley", "weakland",
    "schizophrenogenic", "mother", "family", "communication", "deviance",
    "expressed", "emotion", "ee", "brown", "birley", "wing", "criticism",
    "hostility", "emotional", "overinvolvement", "warmth", "positive",
    "remarks", "play", "therapy", "axline", "non", "directive", "play",
    "therapy", "filial", "therapy", "guerney", "theraplay", "jernberg",
    "booth", "child", "centered", "play", "therapy", "landreth",
    "sandtray", "therapy", "lowenfeld", "art", "therapy", "music",
    "therapy", "dance", "movement", "therapy", "drama", "therapy",
    "bibliotherapy", "animal", "assisted", "therapy", "equine",
    "assisted", "therapy", "nature", "therapy", "ecotherapy", "wilderness",
    "therapy", "adventure", "therapy", "recreation", "therapy",
    "occupational", "therapy", "physical", "therapy", "speech",
    "language", "pathology", "rehabilitation", "counseling", "vocational",
    "rehabilitation", "career", "counseling", " Holland", "riasec",
    "realistic", "investigative", "artistic", "social", "enterprising",
    "conventional", "super", "life", "span", "life", "space", "theory",
    "career", "rainbow", "self", "concept", "career", "development",
    "growth", "exploration", "establishment", "maintenance", "decline",
    "disengagement", "krumboltz", "social", "learning", "theory",
    "career", "decision", "making", "planned", "happenstance", "theory",
    "mitchell", "levin", "krumboltz", "curiosity", "persistence",
    "flexibility", "optimism", "risk", "taking", "gottfredson",
    "circumscription", "compromise", "theory", "cognitive", "map",
    "occupations", "gender", "type", "prestige", "level", "interests",
    "values", "abilities", "tiedeman", "ohara", "decision", "making",
    "model", "anticipation", "implementation", "exploration",
    "crystallization", "choice", "clarification", "induction",
    "reformation", "integration", "career", "construction", "theory",
    "savickas", "life", "design", "narrative", "approach", "career",
    "adaptability", "concern", "control", "curiosity", "confidence",
    "career", "construction", "interview", "cci", "school", "counseling",
    "asca", "national", "model", "academic", "development", "career",
    "development", "social", "emotional", "development", "foundation",
    "student", "standards", "delivery", "system", "guidance", "curriculum",
    "individual", "student", "planning", "responsive", "services",
    "system", "support", "accountability", "data", "driven", "decision",
    "making", "college", "readiness", "career", "readiness", "dropout",
    "prevention", "bullying", "prevention", "suicide", "prevention",
    "schools", "crisis", "response", "schools", "trauma", "informed",
    "schools", "pbis", "positive", "behavioral", "interventions",
    "supports", "mtss", "multi", "tiered", "system", "supports", "rti",
    "response", "intervention", "tier", "1", "universal", "tier", "2",
    "targeted", "tier", "3", "intensive", "progress", "monitoring",
    "data", "based", "decision", "making", "evidence", "based",
    "practices", "ebp", "empirically", "supported", "treatments", "est",
    "apa", "division", "12", "criteria", "well", "established",
    "treatments", "probably", "efficacious", "treatments", "possibly",
    "efficacious", "treatments", "experimental", "treatments", "efficacious",
    "controversy", "treatments", "chambless", "ollendick", "common",
    "factors", "model", "frank", "frank", "lambert", "garfield",
    "weinberger", "wampold", "contextual", "model", "therapeutic",
    "relationship", "client", "factors", "therapist", "factors",
    "technique", "factors", "dodo", "bird", "verdict", "luborsky",
    "singer", "luborsky", "outcome", "equivalence", "paradox",
    "evidence", "based", "practice", "psychology", "ebpp", "apa",
    "presidential", "task", "force", "best", "research", "evidence",
    "clinical", "expertise", "patient", "characteristics", "culture",
    "preferences", "practice", "guidelines", "clinical", "practice",
    "guidelines", "cpg", "treatment", "manuals", "manualized",
    "treatment", "fidelity", "adherence", "competence", "rating",
    "supervision", "models", "developmental", "models", "supervision",
    "stoltenberg", "delworth", " IDM", "integrated", "developmental",
    "model", "level", "1", "level", "2", "level", "3", "level", "4",
    "motivation", "autonomy", "personalized", "awareness", "others",
    "process", "based", "supervision", "discrimination", "model",
    "bernard", "goodyear", "intervention", "roles", "teacher",
    "counselor", "consultant", "focus", "areas", "intervention",
    "skills", "conceptualization", "skills", "personalization", "skills",
    "parallel", "process", "ekstein", "wallenstein", "doehrman",
    "systems", "approach", "supervision", "falender", "shafranske",
    "competency", "based", "supervision", "cbs", "deliberate",
    "practice", "rousseau", "chow", "goldberg", "miller", "wampold",
    "expert", "performance", "Ericsson", " deliberate", "practice",
    "feedback", "loop", "supervisee", "disclosure", "nondisclosure",
    "ladany", "hill", "corbett", "nutt", "supervisory", "working",
    "alliance", "evaluation", "supervisee", "evaluation", "supervisor",
    "due", "process", "remediation", "plans", "dismissal", "programs",
    "professional", "impairment", "fitness", "duty", "competence",
    " gatekeeping", "professional", "psychology",
]


# ══════════════════════════════════════════════════════════════════════════════
#  Build a CUSTOM wordninja model — NO gzip, NO internal file access
#  Downloads a fresh English word frequency list, merges domain words,
#  builds a custom LanguageModel from a plain temp file.
# ══════════════════════════════════════════════════════════════════════════════
_DOMAIN_MODEL = None


def build_domain_model():
    """
    Build a custom wordninja LanguageModel from scratch.
    Step 1: Download a plain-text English word frequency list (one-time)
    Step 2: Merge PSYCH_DOMAIN_WORDS with high frequency boost
    Step 3: Write to a plain .txt temp file
    Step 4: Load via wordninja.LanguageModel() — public API, no gzip needed
    """
    import tempfile, os, urllib.request

    global _DOMAIN_MODEL

    # ── Step 1: Get base English word frequencies ────────────────────────────
    # Cache it locally so we only download once
    cache_path = os.path.join(os.path.dirname(__file__), ".wordninja_cache.txt")

    existing_words = {}

    if os.path.exists(cache_path):
        # Read from local cache
        with open(cache_path, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 2:
                    try:
                        existing_words[parts[0]] = int(parts[1])
                    except ValueError:
                        pass
        print(f"  📖 Loaded {len(existing_words)} base words from local cache")
    else:
        # Download fresh — plain text, no gzip issues ever
        urls = [
            "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt",
            "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
        ]
        downloaded = False
        for url in urls:
            try:
                print(f"  🌐 Downloading word list from {url[:60]}...")
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    raw = resp.read().decode("utf-8", errors="ignore")

                for line in raw.splitlines():
                    word = line.strip().lower()
                    if word and word.isalpha() and len(word) >= 2:
                        # Assign frequency by rank (higher rank = higher freq)
                        existing_words[word] = existing_words.get(word, 0) + 1

                if existing_words:
                    # Save to cache for next time
                    with open(cache_path, "w", encoding="utf-8") as cf:
                        for w, freq in sorted(existing_words.items(), key=lambda x: -x[1]):
                            cf.write(f"{w} {freq}\n")
                    print(f"  📖 Downloaded {len(existing_words)} base words, cached locally")
                    downloaded = True
                    break
            except Exception as e:
                print(f"  ⚠️  Could not download from {url[:50]}: {e}")
                continue

        if not downloaded:
            print("  ⚠️  No internet — using domain words only (still works!)")

    # ── Step 2: Boost domain words ───────────────────────────────────────────
    max_freq = max(existing_words.values()) if existing_words else 1000
    DOMAIN_FREQ = max_freq * 100  # domain words dominate everything

    for word in PSYCH_DOMAIN_WORDS:
        w = word.lower()
        existing_words[w] = DOMAIN_FREQ  # always override with max boost

    # Also assign descending ranks to give wordninja proper probability ordering
    sorted_words = sorted(existing_words.items(), key=lambda x: -x[1])
    total = sum(freq for _, freq in sorted_words)
    ranked_words = {}
    for rank, (word, freq) in enumerate(sorted_words, 1):
        # Higher frequency = lower cost in wordninja
        ranked_words[word] = total - rank + 1

    # ── Step 3: Write to plain temp file ─────────────────────────────────────
    tmp = tempfile.NamedTemporaryFile(
        mode="wt", suffix=".txt", delete=False, encoding="utf-8"
    )
    for word, freq in ranked_words.items():
        tmp.write(f"{word} {freq}\n")
    tmp.close()

    # ── Step 4: Load custom model via PUBLIC API ─────────────────────────────
    try:
        _DOMAIN_MODEL = wordninja.LanguageModel(tmp.name)
        print(f"  📚 Custom model ready: {len(ranked_words)} words "
              f"({len(PSYCH_DOMAIN_WORDS)} domain-boosted)")
    except Exception as e:
        print(f"  ⚠️  Could not build custom model ({e}) — using default wordninja")
        _DOMAIN_MODEL = None
    finally:
        os.unlink(tmp.name)


def wn_split(text: str) -> list:
    """Split text using the domain-boosted model (falls back to default)."""
    if _DOMAIN_MODEL is not None:
        return _DOMAIN_MODEL.split(text)
    return wordninja.split(text)


# Build the model at startup
build_domain_model()


def wn_split(text: str) -> list:
    """Split text using the domain-boosted model (falls back to default)."""
    if _DOMAIN_MODEL is not None:
        return _DOMAIN_MODEL.split(text)
    return wordninja.split(text)


# ══════════════════════════════════════════════════════════════════════════════
#  KNOWN_COMPOUNDS — wordninja phrase-level mis-split corrections
# ══════════════════════════════════════════════════════════════════════════════
KNOWN_COMPOUNDS = {
    "are er":              "career",
    "pre operational":     "preoperational",
    "socio emotional":     "socio-emotional",
    "ego centrism":        "egocentrism",
    "ent ration":          "centration",
    "bs tract":            "abstract",
    "hypo the tico":       "hypothetico",
    "ad vence":            "advance",
    "at all, thin":        "a tall, thin",
    "at all thin":         "a tall, thin",
    "om pete n ce":        "competence",
    "on fide nti ali ty":  "confidentiality",
    "on sent":             "consent",
    "on duct":             "conduct",
    "on fidence":          "confidence",
    "on science":          "conscience",
    "ehavior":             "behavior",
    "e havior":            "behavior",
    "sychology":           "psychology",
    "sychologist":         "psychologist",
    "sychometrician":      "psychometrician",
    "sychological":        "psychological",
    "euro psychological":  "neuropsychological",
    "2- year - old": "2-year-old",
    "3- year - old": "3-year-old",
    "4- year - old": "4-year-old",
    "5- year - old": "5-year-old",
    "6- year - old": "6-year-old",
    "7- year - old": "7-year-old",
}


# ══════════════════════════════════════════════════════════════════════════════
#  KNOWN_WORD_FIXES — corrupted source data (missing letters)
#  Maps broken raw strings → correct words.
#  Add new entries as you discover them.
# ══════════════════════════════════════════════════════════════════════════════
KNOWN_WORD_FIXES = {
    # Missing leading 'C'
    "ompetence":           "competence",
    "onfidentiality":      "confidentiality",
    "onsent":              "consent",
    "onduct":              "conduct",
    "onfidence":           "confidence",
    "onscience":           "conscience",
    "oncrete":             "concrete",
    "onservation":         "conservation",
    "onditioning":         "conditioning",
    "onstruct":            "construct",
    "ontent":              "content",
    "oncurrent":           "concurrent",
    "onvergent":           "convergent",
    "ontingency":          "contingency",
    "ontrol":              "control",
    "ognitive":            "cognitive",
    "ommunication":        "communication",
    "ommitment":           "commitment",
    "omparison":           "comparison",
    "onformity":           "conformity",
    "onsistency":          "consistency",
    "onsolidation":        "consolidation",
    "oncept":              "concept",
    "onsciousness":        "consciousness",
    "onscious":            "conscious",
    "ounter":              "counter",
    "oping":               "coping",
    "ompetency":           "competency",
    "ompulsion":           "compulsion",
    "ompulsive":           "compulsive",
    # Missing leading 'n' (neuro-)
    "europsychological":   "neuropsychological",
    "europsychology":      "neuropsychology",
    "europsychologist":    "neuropsychologist",
    # Missing leading 'p' (psycho-)
    "sychology":           "psychology",
    "sychologist":         "psychologist",
    "sychologists":        "psychologists",
    "sychometrician":      "psychometrician",
    "sychometricians":     "psychometricians",
    "sychological":        "psychological",
    "sychologically":      "psychologically",
    "sychometrics":        "psychometrics",
    "sychometric":         "psychometric",
    "sychopathology":      "psychopathology",
    "sychosocial":         "psychosocial",
    "sychodynamic":        "psychodynamic",
    "sychotic":            "psychotic",
    "sychosis":            "psychosis",
    "sychosomatic":        "psychosomatic",
    "sychomotor":          "psychomotor",
    "sychopharmacology":   "psychopharmacology",
    "sychophysiology":     "psychophysiology",
    "sycholinguistics":    "psycholinguistics",
    "sycholinguistic":     "psycholinguistic",
    # Missing leading 'b'
    "ehavior":             "behavior",
    "ehavioral":           "behavioral",
    "ehaviour":            "behaviour",
    "ehavioural":          "behavioural",
    "eneficence":          "beneficence",
    "oundary":             "boundary",
    "oundaries":           "boundaries",
    # Missing leading 'a'
    "utonomy":             "autonomy",
    "ccommodation":        "accommodation",
    "ssimilation":         "assimilation",
    "ttachment":           "attachment",
    "voidant":             "avoidant",
    "nxious":              "anxious",
    "ntisocial":           "antisocial",
    "bstract":             "abstract",
    "chievement":          "achievement",
    "daptive":             "adaptive",
    "dolescence":          "adolescence",
    "dolescent":           "adolescent",
    "ffective":            "affective",
    "ggression":           "aggression",
    "goraphobia":          "agoraphobia",
    "ltruism":             "altruism",
    "mbivalent":           "ambivalent",
    "mnion":               "amnion",
    "mnesia":              "amnesia",
    "mygdala":             "amygdala",
    "nalogical":           "analogical",
    "nomia":               "anomia",
    "nomic":               "anomic",
    "norexia":             "anorexia",
    "nterograde":          "anterograde",
    "nthropology":         "anthropology",
    "pathy":               "apathy",
    "praxia":              "apraxia",
    "gnosia":              "agnosia",
    # Missing leading 'd'
    "efense":              "defense",
    "efence":              "defence",
    "elirium":             "delirium",
    "elusion":             "delusion",
    "elusions":            "delusions",
    "ementia":             "dementia",
    "epression":           "depression",
    "epressive":           "depressive",
    "evelopment":          "development",
    "evelopmental":        "developmental",
    "iagnosis":            "diagnosis",
    "iagnostic":           "diagnostic",
    "issociation":         "dissociation",
    "issociative":         "dissociative",
    # Missing leading 'e'
    "gocentrism":          "egocentrism",
    "quilibration":        "equilibration",
    "rikson":              "erikson",
    "motion":              "emotion",
    "motional":            "emotional",
    "mpathy":              "empathy",
    "ncoding":             "encoding",
    "ndocrine":            "endocrine",
    "nvironment":          "environment",
    "nvironmental":        "environmental",
    "pilepsy":             "epilepsy",
    "pisodic":             "episodic",
    "tiology":             "etiology",
    "volutionary":         "evolutionary",
    "xtraversion":         "extraversion",
    "xtroversion":         "extroversion",
    # Missing leading 'f'
    "luid":                "fluid",
    "unctional":           "functional",
    "rontal":              "frontal",
    "rustration":          "frustration",
    # Missing leading 'g'
    "eneralized":          "generalized",
    "eneralised":          "generalised",
    "estalt":              "gestalt",
    # Missing leading 'h'
    "abituation":          "habituation",
    "allucination":        "hallucination",
    "allucinations":       "hallucinations",
    "emispheric":          "hemispheric",
    "emisphere":           "hemisphere",
    "ippocampus":          "hippocampus",
    "omeostasis":          "homeostasis",
    "umanistic":           "humanistic",
    "ypothalamus":         "hypothalamus",
    # Missing leading 'i'
    "dentity":             "identity",
    "deation":             "ideation",
    "mplicit":             "implicit",
    "mpulse":              "impulse",
    "nattentional":        "inattentional",
    "ncentive":            "incentive",
    "ncongruence":         "incongruence",
    "ndividuation":        "individuation",
    "nferiority":          "inferiority",
    "nformed":             "informed",
    "nhibition":           "inhibition",
    "nhibitory":           "inhibitory",
    "nsight":              "insight",
    "nstinct":             "instinct",
    "ntegration":          "integration",
    "ntelligence":         "intelligence",
    "nterpersonal":        "interpersonal",
    "ntrinsic":            "intrinsic",
    "ntroversion":         "introversion",
    "ntuitive":            "intuitive",
    # Missing leading 'l'
    "anguage":             "language",
    "earned":              "learned",
    "earning":             "learning",
    "ateralization":       "lateralization",
    "ateralisation":       "lateralisation",
    "imbic":               "limbic",
    "inguistic":           "linguistic",
    "inguistics":          "linguistics",
    "ocus":                "locus",
    "ongitudinal":         "longitudinal",
    # Missing leading 'm'
    "emory":               "memory",
    "etacognition":        "metacognition",
    "etacognitive":        "metacognitive",
    "otivation":           "motivation",
    "otivational":         "motivational",
    "ulticultural":        "multicultural",
    # Missing leading 'n'
    "arcissism":           "narcissism",
    "arcissistic":         "narcissistic",
    "egative":             "negative",
    "eglect":              "neglect",
    "egligence":           "negligence",
    "eurological":         "neurological",
    "eurology":            "neurology",
    "euroscience":         "neuroscience",
    "eurotransmitter":     "neurotransmitter",
    "ormative":            "normative",
    # Missing leading 'o'
    "bedience":            "obedience",
    "bservational":        "observational",
    "bsessive":            "obsessive",
    "perant":              "operant",
    "perational":          "operational",
    "ptogenetics":         "optogenetics",
    "rganismic":           "organismic",
    "rientation":          "orientation",
    # Missing leading 'p'
    "aranoia":             "paranoia",
    "aranoid":             "paranoid",
    "erception":           "perception",
    "erceptual":           "perceptual",
    "ersonality":          "personality",
    "ersuasion":           "persuasion",
    "henomenal":           "phenomenal",
    "henomenology":        "phenomenology",
    "hilosophy":           "philosophy",
    "hobia":               "phobia",
    "hysiological":        "physiological",
    "hysiology":           "physiology",
    "lasticity":           "plasticity",
    "ositron":             "positron",
    "ragmatic":            "pragmatic",
    "ragmatics":           "pragmatics",
    "reconventional":      "preconventional",
    "redictive":           "predictive",
    "renatal":             "prenatal",
    "riming":              "priming",
    "roactive":            "proactive",
    "rocedural":           "procedural",
    "rognosis":            "prognosis",
    "rojection":           "projection",
    "rolonged":            "prolonged",
    "rosocial":            "prosocial",
    "sychodynamic":        "psychodynamic",
    "sychosocial":         "psychosocial",
    # Missing leading 'r'
    "ationalization":      "rationalization",
    "ationalisation":      "rationalisation",
    "eactive":             "reactive",
    "ecinprocation":       "reciprocation",
    "eciprocal":           "reciprocal",
    "eciprocity":          "reciprocity",
    "eflexive":            "reflexive",
    "egression":           "regression",
    "einforcement":        "reinforcement",
    "elational":           "relational",
    "eliability":          "reliability",
    "epression":           "repression",
    "esilience":           "resilience",
    "esponse":             "response",
    "estriction":          "restriction",
    "etrieval":            "retrieval",
    # Missing leading 's'
    "caffolding":          "scaffolding",
    "chemas":              "schemas",
    "chemata":             "schemata",
    "chizophrenia":        "schizophrenia",
    "chizoid":             "schizoid",
    "chizotypal":          "schizotypal",
    "elf":                 "self",
    "emantic":             "semantic",
    "ensation":            "sensation",
    "ensorimotor":         "sensorimotor",
    "eparation":           "separation",
    "erotonin":            "serotonin",
    "ituational":          "situational",
    "ocial":               "social",
    "omatization":         "somatization",
    "omatization":         "somatisation",
    "pecific":             "specific",
    "timulation":          "stimulation",
    "torage":              "storage",
    "tranger":             "stranger",
    "tructural":           "structural",
    "ublimation":          "sublimation",
    "ubstance":            "substance",
    "uperego":             "superego",
    "upervision":          "supervision",
    "uppressor":           "suppressor",
    "ymbolic":             "symbolic",
    "ympathy":             "sympathy",
    "ynapse":              "synapse",
    "ynaptic":             "synaptic",
    "yndrome":             "syndrome",
    "ystematic":           "systematic",
    "ystems":              "systems",
    # Missing leading 't'
    "emperament":          "temperament",
    "emporal":             "temporal",
    "eratology":           "teratology",
    "eratogen":            "teratogen",
    "halamus":             "thalamus",
    "heory":               "theory",
    "herapeutic":          "therapeutic",
    "herapy":              "therapy",
    "hought":              "thought",
    "olerance":            "tolerance",
    "oxicology":           "toxicology",
    "rait":                "trait",
    "ransference":         "transference",
    "ransitional":         "transitional",
    "rauma":               "trauma",
    "raumatic":            "traumatic",
    "rust":                "trust",
    # Missing leading 'u'
    "nconditional":        "unconditional",
    "nconscious":          "unconscious",
    # Missing leading 'v'
    "alidity":             "validity",
    "alues":               "values",
    "ariable":             "variable",
    "erbal":               "verbal",
    "icarious":            "vicarious",
    "igilance":            "vigilance",
    "iolence":             "violence",
    "isual":               "visual",
    "isuospatial":         "visuospatial",
    "olition":             "volition",
    "oluntary":            "voluntary",
    "ygotsky":             "vygotsky",
    # Missing leading 'w'
    "ithdrawal":           "withdrawal",
    "orking":              "working",
}


# ══════════════════════════════════════════════════════════════════════════════
#  restore_spaces()  — core engine
# ══════════════════════════════════════════════════════════════════════════════
def restore_spaces(text: str) -> str:
    if not text or not isinstance(text, str):
        return text

    # A: Collapse ALL whitespace — always start from pure concatenated form
    collapsed = re.sub(r"\s+", "", text)

    # B: Tokenise — hyphenated runs stay as one token
    tokens = re.findall(r"[A-Za-z]+(?:-[A-Za-z]+)*|[^A-Za-z]+", collapsed)

    parts = []
    for token in tokens:
        if re.fullmatch(r"[A-Za-z]+(?:-[A-Za-z]+)*", token):
            if "-" in token:
                segments = token.split("-")
                restored = [" ".join(wn_split(seg)) for seg in segments]
                parts.append("-".join(restored))
            else:
                parts.append(" ".join(wn_split(token)))
        else:
            parts.append(token)

    # C: Smart join — no spurious spaces around punctuation/hyphens
    result = ""
    for part in parts:
        if not result:
            result = part
        elif re.match(r"[-.,;:!?)\"']", part):
            result += part
        elif result[-1] in "-(['\"":
            result += part
        elif part.startswith("'"):
            result += part
        else:
            result += " " + part

    # D: Fix apostrophe spacing
    result = re.sub(r"([A-Za-z]'[A-Za-z])([A-Za-z])", r"\1 \2", result)

    # E: Fix closing-quote spacing
    result = re.sub(r'(["\'])([A-Z])', r"\1 \2", result)

    # F: General tidy-up
    result = re.sub(r"\s+([.,;:!?)\"'])", r"\1", result)
    result = re.sub(r"\s{2,}",            " ",  result).strip()

    # G: Apply KNOWN_COMPOUNDS (phrase-level mis-splits)
    for wrong, right in KNOWN_COMPOUNDS.items():
        result = re.sub(re.escape(wrong), right, result, flags=re.IGNORECASE)

    # H: Apply KNOWN_WORD_FIXES (corrupted source data — missing letters)
    for wrong, right in KNOWN_WORD_FIXES.items():
        # Match whole-word only to avoid partial replacements
        result = re.sub(
            r'\b' + re.escape(wrong) + r'\b',
            right,
            result,
            flags=re.IGNORECASE
        )

    return result


# ══════════════════════════════════════════════════════════════════════════════
#  strip_embedded_choices()
# ══════════════════════════════════════════════════════════════════════════════
def strip_embedded_choices(question: str) -> str:
    if not question:
        return question
    m = re.search(r"[aA]\.", question)
    if m:
        tail = question[m.start():]
        if len(tail) > 30 and re.search(r"[b-dB-D]\.", tail):
            question = question[:m.start()].rstrip(" :")
    return question


# ══════════════════════════════════════════════════════════════════════════════
#  Public cleaners
# ══════════════════════════════════════════════════════════════════════════════
def clean_question(text: str) -> str:
    if not text: return text
    text = strip_embedded_choices(text)
    text = restore_spaces(text)
    return text[0].upper() + text[1:] if text else text

def clean_choice(text: str) -> str:
    if not text: return text
    text = restore_spaces(text)
    return text[0].upper() + text[1:] if text else text

def clean_explanation(text: str) -> str:
    if not text: return text
    text = restore_spaces(text)
    return text[0].upper() + text[1:] if text else text


# ══════════════════════════════════════════════════════════════════════════════
#  process_file()
# ══════════════════════════════════════════════════════════════════════════════
def process_file(file_path: str) -> int:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"  ❌  Cannot read {file_path}: {e}")
        return 0

    if isinstance(data, list):
        questions = data
    elif isinstance(data, dict):
        questions = None
        for key in ("questions", "data", "items", "drills", "results"):
            if isinstance(data.get(key), list):
                questions = data[key]
                break
        if questions is None:
            print(f"  ⚠️   Unknown dict structure in {file_path} — skipping.")
            return 0
    else:
        print(f"  ⚠️   Unexpected JSON type in {file_path} — skipping.")
        return 0

    fixed = 0
    for item in questions:
        if not isinstance(item, dict): continue
        changed = False

        q_key = next((k for k in ("question","stem","text","q","title") if k in item), None)
        if q_key and isinstance(item[q_key], str):
            nv = clean_question(item[q_key])
            if nv != item[q_key]: item[q_key] = nv; changed = True

        c_key = next((k for k in ("choices","options","answers","choices_list","answer_choices") if k in item), None)
        if c_key and isinstance(item[c_key], list):
            nc = []
            for ch in item[c_key]:
                if isinstance(ch, str):
                    nch = clean_choice(ch)
                    if nch != ch: changed = True
                    nc.append(nch)
                elif isinstance(ch, dict):
                    tk = next((k for k in ("text","label","value","choice","name") if k in ch), None)
                    if tk and isinstance(ch[tk], str):
                        nch = clean_choice(ch[tk])
                        if nch != ch[tk]: ch[tk] = nch; changed = True
                    nc.append(ch)
                else:
                    nc.append(ch)
            item[c_key] = nc

        e_key = next((k for k in ("explanation","rationale","explain","reason","hint","feedback") if k in item), None)
        if e_key and isinstance(item[e_key], str):
            nv = clean_explanation(item[e_key])
            if nv != item[e_key]: item[e_key] = nv; changed = True

        if changed: fixed += 1

    out_path = os.path.join(OUTPUT_DIR, os.path.basename(file_path))
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return fixed


# ══════════════════════════════════════════════════════════════════════════════
#  main()
# ══════════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 60)
    print("🧹  Golden Drills JSON Cleaner  (ULTIMATE v3)")
    print(f"📂  Input  : {os.path.abspath(INPUT_DIR)}")
    print(f"📂  Output : {os.path.abspath(OUTPUT_DIR)}")
    print("=" * 60)

    files = sorted(glob.glob(os.path.join(INPUT_DIR, BATCH_GLOB)))
    if not files:
        print(f"\n⚠️   No files matching '{BATCH_GLOB}' in '{INPUT_DIR}'")
        return

    total = 0
    for fp in files:
        fname = os.path.basename(fp)
        count = process_file(fp)
        icon  = "✅" if count else "➖"
        print(f"  {icon}  {fname:<22} → {count} item(s) fixed")
        total += count

    print("-" * 60)
    print(f"🎉  Done!  Total items fixed: {total}")
    print("=" * 60)


if __name__ == "__main__":
    main()