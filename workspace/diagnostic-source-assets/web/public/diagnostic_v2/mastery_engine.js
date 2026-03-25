(function (global) {
  "use strict";

  var STORAGE_KEY = "diagnostic_v2_mastery_profiles_v1";

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function hashString(input) {
    var text = String(input || "");
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    var state = seed >>> 0;
    return function () {
      state += 0x6d2b79f5;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createRng(seedInput) {
    var seed = typeof seedInput === "number" ? seedInput >>> 0 : hashString(seedInput);
    return mulberry32(seed);
  }

  function shuffle(list, rng) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function uniqueStrings(items) {
    var out = [];
    var seen = {};
    for (var i = 0; i < items.length; i++) {
      var value = String(items[i] || "");
      if (!value || seen[value]) continue;
      seen[value] = true;
      out.push(value);
    }
    return out;
  }

  function getRules(data) {
    var defaultRules = {
      min_questions: 12,
      power_pass_percent: 90,
      power_min_attempts: 2
    };
    var rules = data && data.rules ? data.rules : {};
    return {
      min_questions: Number(rules.min_questions || defaultRules.min_questions),
      power_pass_percent: Number(rules.power_pass_percent || defaultRules.power_pass_percent),
      power_min_attempts: Number(rules.power_min_attempts || defaultRules.power_min_attempts)
    };
  }

  function listProfiles() {
    if (typeof localStorage === "undefined") return [];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return safeArray(parsed).map(function (profile) {
        return profile && typeof profile === "object" ? profile : {};
      });
    } catch (err) {
      return [];
    }
  }

  function saveProfiles(profiles) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeArray(profiles)));
  }

  function createProfile(name, grade) {
    var trimmedName = String(name || "").trim();
    var normalizedGrade = Number(grade || 0);
    if (!trimmedName) {
      throw new Error("Profile name is required.");
    }
    if ([5, 6, 7].indexOf(normalizedGrade) === -1) {
      throw new Error("Profile grade must be 5, 6, or 7.");
    }

    var profiles = listProfiles();
    var profile = {
      profile_id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
      name: trimmedName,
      grade: normalizedGrade,
      created_at: nowIso(),
      updated_at: nowIso(),
      attempt_history: [],
      topic_mastery: {},
      misconception_stats: {}
    };
    profiles.push(profile);
    saveProfiles(profiles);
    return profile;
  }

  function upsertProfile(updatedProfile) {
    var profiles = listProfiles();
    var found = false;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].profile_id === updatedProfile.profile_id) {
        profiles[i] = updatedProfile;
        found = true;
        break;
      }
    }
    if (!found) profiles.push(updatedProfile);
    saveProfiles(profiles);
    return updatedProfile;
  }

  function getProfile(profileId) {
    var profiles = listProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].profile_id === profileId) return profiles[i];
    }
    return null;
  }

  function getTopicKey(grade, topicId) {
    return String(grade) + "|" + String(topicId);
  }

  function getTopicFocusKey(grade, topicId, focusArea) {
    return getTopicKey(grade, topicId) + "|" + String(focusArea);
  }

  function getTopicsByGrade(data, grade) {
    var topics = safeArray(data && data.topics);
    var out = [];
    for (var i = 0; i < topics.length; i++) {
      if (Number(topics[i].grade) === Number(grade)) out.push(topics[i]);
    }
    out.sort(function (a, b) {
      if (a.module !== b.module) return a.module < b.module ? -1 : 1;
      return String(a.topic_id).localeCompare(String(b.topic_id));
    });
    return out;
  }

  function getModulesByGrade(data, grade) {
    var topics = getTopicsByGrade(data, grade);
    var out = [];
    var seen = {};
    for (var i = 0; i < topics.length; i++) {
      var moduleName = String(topics[i].module || "");
      if (!moduleName || seen[moduleName]) continue;
      seen[moduleName] = true;
      out.push(moduleName);
    }
    return out;
  }

  function getTopic(data, grade, topicId) {
    var topics = safeArray(data && data.topics);
    for (var i = 0; i < topics.length; i++) {
      if (Number(topics[i].grade) === Number(grade) && String(topics[i].topic_id) === String(topicId)) {
        return topics[i];
      }
    }
    return null;
  }

  function getAttemptsFor(profile, grade, topicId, focusArea) {
    var targetKey = getTopicFocusKey(grade, topicId, focusArea);
    var all = safeArray(profile && profile.attempt_history);
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].topic_focus_key) === targetKey) out.push(all[i]);
    }
    out.sort(function (a, b) {
      return String(a.completed_at || a.started_at || "").localeCompare(String(b.completed_at || b.started_at || ""));
    });
    return out;
  }

  function evaluatePowerMastery(powerAttempts, rules) {
    var attempts = safeArray(powerAttempts);
    if (!attempts.length) {
      return {
        attempts: 0,
        latest_score_percent: null,
        mastered: false,
        reason: "No attempts yet."
      };
    }
    var latest = attempts[attempts.length - 1];
    var mastered = attempts.length >= rules.power_min_attempts && Number(latest.score_percent) >= rules.power_pass_percent;
    var reason = "";
    if (mastered) {
      reason = "Power mastery achieved.";
    } else if (attempts.length < rules.power_min_attempts) {
      reason = "Need at least " + rules.power_min_attempts + " attempts.";
    } else {
      reason = "Latest score is below " + rules.power_pass_percent + "%.";
    }
    return {
      attempts: attempts.length,
      latest_score_percent: Number(latest.score_percent),
      mastered: mastered,
      reason: reason
    };
  }

  function isChallengeUnlocked(data, profile, grade, topicId) {
    if (!profile) return false;
    var rules = getRules(data);
    var powerAttempts = getAttemptsFor(profile, grade, topicId, "power");
    var status = evaluatePowerMastery(powerAttempts, rules);
    return status.mastered;
  }

  function chooseQuestionFromStandard(bankItems, rng, deniedIds, usedIds) {
    var shuffled = shuffle(bankItems, rng);
    for (var i = 0; i < shuffled.length; i++) {
      var candidate = shuffled[i];
      var id = String(candidate.template_id || candidate.question_id || "");
      if (!id) continue;
      if (deniedIds[id]) continue;
      if (usedIds[id]) continue;
      return candidate;
    }
    for (var j = 0; j < shuffled.length; j++) {
      var fallback = shuffled[j];
      var fallbackId = String(fallback.template_id || fallback.question_id || "");
      if (!fallbackId) continue;
      if (usedIds[fallbackId]) continue;
      return fallback;
    }
    return shuffled.length ? shuffled[0] : null;
  }

  function shuffleChoices(question, rng) {
    var choices = safeArray(question.choices);
    return shuffle(choices, rng);
  }

  function getWeaknessWeights(profile, standardIds) {
    var weights = {};
    var attempts = safeArray(profile && profile.attempt_history);
    for (var i = 0; i < standardIds.length; i++) {
      weights[standardIds[i]] = 1;
    }
    for (var j = 0; j < attempts.length; j++) {
      var perStandard = attempts[j] && attempts[j].per_standard ? attempts[j].per_standard : {};
      for (var sid in perStandard) {
        if (!Object.prototype.hasOwnProperty.call(weights, sid)) continue;
        var stat = perStandard[sid];
        if (!stat || !stat.total) continue;
        var missed = Number(stat.total) - Number(stat.correct || 0);
        if (missed > 0) weights[sid] += missed;
      }
    }
    return weights;
  }

  function weightedStandardsOrder(standardIds, weights, rng) {
    var pairs = [];
    for (var i = 0; i < standardIds.length; i++) {
      var sid = standardIds[i];
      var base = Number(weights[sid] || 1);
      var noise = rng() * 0.25;
      pairs.push({ sid: sid, score: base + noise });
    }
    pairs.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.sid.localeCompare(b.sid);
    });
    return pairs.map(function (p) { return p.sid; });
  }

  function buildSession(data, options) {
    if (!data || !options) throw new Error("buildSession requires data and options.");
    var grade = Number(options.grade);
    var topicId = String(options.topic_id || "");
    var focusArea = String(options.focus_area || "power");
    var profile = options.profile || null;
    var rules = getRules(data);
    var topic = getTopic(data, grade, topicId);
    if (!topic) throw new Error("Topic not found for grade/topic selection.");

    if (focusArea === "challenge" && !isChallengeUnlocked(data, profile, grade, topicId)) {
      throw new Error("Challenge is locked until Power mastery is achieved.");
    }

    var bank = data.question_bank || {};
    var requiredStandards = focusArea === "challenge" ? safeArray(topic.challenge_standards) : safeArray(topic.power_standards);
    requiredStandards = uniqueStrings(requiredStandards);
    var availableStandards = [];
    var missingStandards = [];
    for (var i = 0; i < requiredStandards.length; i++) {
      var sid = requiredStandards[i];
      var pool = safeArray(bank[sid]);
      if (pool.length) availableStandards.push(sid);
      else missingStandards.push(sid);
    }

    var attemptNo = Number(options.attempt_no || 1);
    var seedSource = [
      options.profile_id || "anon",
      grade,
      topicId,
      focusArea,
      attemptNo
    ].join("|");
    var rng = createRng(seedSource);

    var deniedIds = {};
    var recentTemplateIds = safeArray(options.recent_template_ids);
    for (var d = 0; d < recentTemplateIds.length; d++) {
      deniedIds[String(recentTemplateIds[d])] = true;
    }

    var usedTemplateIds = {};
    var selected = [];
    var standardsOrder = shuffle(availableStandards, rng);

    for (var s = 0; s < standardsOrder.length; s++) {
      var standardId = standardsOrder[s];
      var candidate = chooseQuestionFromStandard(safeArray(bank[standardId]), rng, deniedIds, usedTemplateIds);
      if (!candidate) continue;
      var templateId = String(candidate.template_id || candidate.question_id || "");
      if (templateId) usedTemplateIds[templateId] = true;
      var instance = clone(candidate);
      instance.standard_id = standardId;
      selected.push(instance);
    }

    var targetCount = Math.max(rules.min_questions, requiredStandards.length);
    var weights = getWeaknessWeights(profile, availableStandards);
    var weightedOrder = weightedStandardsOrder(availableStandards, weights, rng);
    var spin = 0;
    while (selected.length < targetCount && weightedOrder.length && spin < 2000) {
      var nextStandard = weightedOrder[spin % weightedOrder.length];
      var nextCandidate = chooseQuestionFromStandard(safeArray(bank[nextStandard]), rng, {}, usedTemplateIds);
      if (!nextCandidate) {
        spin++;
        continue;
      }
      var nextTemplateId = String(nextCandidate.template_id || nextCandidate.question_id || "");
      if (nextTemplateId) usedTemplateIds[nextTemplateId] = true;
      var nextInstance = clone(nextCandidate);
      nextInstance.standard_id = nextStandard;
      selected.push(nextInstance);
      spin++;
    }

    var sessionQuestions = [];
    var mixed = shuffle(selected, rng);
    for (var q = 0; q < mixed.length; q++) {
      var row = clone(mixed[q]);
      row.session_question_id = "sq_" + (q + 1);
      row.choices = shuffleChoices(row, rng);
      sessionQuestions.push(row);
    }

    return {
      session_id: "sess_" + Date.now() + "_" + Math.floor(rng() * 100000),
      started_at: nowIso(),
      rules_used: rules,
      grade: grade,
      module: topic.module,
      topic_id: topic.topic_id,
      topic_title: topic.topic_title,
      focus_area: focusArea,
      attempt_no: attemptNo,
      mapped_standards: requiredStandards,
      covered_standards: uniqueStrings(sessionQuestions.map(function (qItem) { return qItem.standard_id; })),
      missing_standards: missingStandards,
      questions: sessionQuestions
    };
  }

  function scoreSession(session, answersByQuestionId) {
    var questions = safeArray(session && session.questions);
    var answers = answersByQuestionId || {};
    var resultRows = [];
    var perStandard = {};
    var misconceptions = {};
    var correctCount = 0;

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var qid = String(q.session_question_id || "");
      var pickedLabel = String(answers[qid] || "");
      var choices = safeArray(q.choices);
      var picked = null;
      var correctChoice = null;
      for (var c = 0; c < choices.length; c++) {
        if (choices[c].correct === true) correctChoice = choices[c];
        if (String(choices[c].label) === pickedLabel) picked = choices[c];
      }

      var isCorrect = !!(picked && picked.correct === true);
      if (isCorrect) correctCount++;

      var sid = String(q.standard_id || "");
      if (!perStandard[sid]) perStandard[sid] = { total: 0, correct: 0, missed_question_ids: [] };
      perStandard[sid].total += 1;
      if (isCorrect) perStandard[sid].correct += 1;
      else perStandard[sid].missed_question_ids.push(qid);

      if (!isCorrect && picked && picked.misconception_code) {
        var code = String(picked.misconception_code);
        if (!misconceptions[code]) {
          misconceptions[code] = {
            count: 0,
            examples: []
          };
        }
        misconceptions[code].count += 1;
        if (picked.misconception_text && misconceptions[code].examples.length < 3) {
          misconceptions[code].examples.push(String(picked.misconception_text));
        }
      }

      resultRows.push({
        session_question_id: qid,
        template_id: String(q.template_id || q.question_id || ""),
        question_id: String(q.question_id || ""),
        standard_id: sid,
        chosen_label: pickedLabel || null,
        correct_label: correctChoice ? String(correctChoice.label) : null,
        is_correct: isCorrect,
        misconception_code: !isCorrect && picked ? String(picked.misconception_code || "") : "",
        misconception_text: !isCorrect && picked ? String(picked.misconception_text || "") : ""
      });
    }

    var totalQuestions = questions.length;
    var scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;
    var passPower = scorePercent >= Number(session.rules_used.power_pass_percent || 90);
    var pass = session.focus_area === "power" ? passPower : passPower;

    return {
      completed_at: nowIso(),
      total_questions: totalQuestions,
      correct_count: correctCount,
      score_percent: scorePercent,
      pass: pass,
      per_standard: perStandard,
      misconceptions: misconceptions,
      rows: resultRows
    };
  }

  function summarizeTopicMastery(data, profile, grade, topicId) {
    var rules = getRules(data);
    var powerAttempts = getAttemptsFor(profile, grade, topicId, "power");
    var challengeAttempts = getAttemptsFor(profile, grade, topicId, "challenge");
    var powerStatus = evaluatePowerMastery(powerAttempts, rules);
    var challengeLatest = challengeAttempts.length ? challengeAttempts[challengeAttempts.length - 1] : null;

    return {
      power: {
        attempts: powerAttempts.length,
        latest_score_percent: powerStatus.latest_score_percent,
        mastered: powerStatus.mastered,
        reason: powerStatus.reason
      },
      challenge: {
        attempts: challengeAttempts.length,
        latest_score_percent: challengeLatest ? Number(challengeLatest.score_percent) : null
      }
    };
  }

  function mergeMisconceptionStats(profile, scoring) {
    var out = profile.misconception_stats || {};
    var map = scoring && scoring.misconceptions ? scoring.misconceptions : {};
    for (var code in map) {
      if (!Object.prototype.hasOwnProperty.call(map, code)) continue;
      out[code] = Number(out[code] || 0) + Number(map[code].count || 0);
    }
    profile.misconception_stats = out;
  }

  function recordAttempt(data, profile, session, scoring) {
    if (!profile) throw new Error("recordAttempt requires a profile.");
    var attempt = {
      attempt_id: "att_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
      session_id: String(session.session_id),
      topic_focus_key: getTopicFocusKey(session.grade, session.topic_id, session.focus_area),
      grade: Number(session.grade),
      module: String(session.module || ""),
      topic_id: String(session.topic_id || ""),
      topic_title: String(session.topic_title || ""),
      focus_area: String(session.focus_area || ""),
      attempt_no: Number(session.attempt_no || 1),
      mapped_standards: safeArray(session.mapped_standards),
      missing_standards: safeArray(session.missing_standards),
      covered_standards: safeArray(session.covered_standards),
      started_at: session.started_at,
      completed_at: scoring.completed_at,
      total_questions: Number(scoring.total_questions || 0),
      correct_count: Number(scoring.correct_count || 0),
      score_percent: Number(scoring.score_percent || 0),
      pass: !!scoring.pass,
      per_standard: scoring.per_standard || {},
      misconceptions: scoring.misconceptions || {}
    };
    attempt.rows = scoring.rows || [];

    if (!Array.isArray(profile.attempt_history)) profile.attempt_history = [];
    profile.attempt_history.push(attempt);

    if (!profile.topic_mastery || typeof profile.topic_mastery !== "object") {
      profile.topic_mastery = {};
    }
    var topicKey = getTopicKey(session.grade, session.topic_id);
    profile.topic_mastery[topicKey] = summarizeTopicMastery(data, profile, session.grade, session.topic_id);

    mergeMisconceptionStats(profile, scoring);
    profile.updated_at = nowIso();

    return upsertProfile(profile);
  }

  function getKaLinksForStandards(data, standardIds) {
    var out = [];
    var seen = {};
    var index = data && data.standards_index ? data.standards_index : {};
    var ids = uniqueStrings(safeArray(standardIds));
    for (var i = 0; i < ids.length; i++) {
      var sid = ids[i];
      var row = index[sid];
      if (!row || !Array.isArray(row.ka_links)) continue;
      for (var k = 0; k < row.ka_links.length; k++) {
        var link = row.ka_links[k];
        if (!link || !link.url) continue;
        var key = String(link.url);
        if (seen[key]) continue;
        seen[key] = true;
        out.push({
          standard_id: sid,
          label: String(link.label || "Khan Academy"),
          url: key
        });
      }
    }
    return out;
  }

  function getRecentTemplateIds(profile, grade, topicId, focusArea, limit) {
    var attempts = getAttemptsFor(profile, grade, topicId, focusArea);
    if (!attempts.length) return [];
    var out = [];
    var seen = {};
    var remaining = Math.max(1, Number(limit || 20));
    for (var i = attempts.length - 1; i >= 0; i--) {
      var attempt = attempts[i];
      var rows = safeArray(attempt && attempt.rows);
      for (var j = 0; j < rows.length; j++) {
        var templateId = String(rows[j].template_id || "");
        if (!templateId || seen[templateId]) continue;
        seen[templateId] = true;
        out.push(templateId);
        if (out.length >= remaining) return out;
      }
    }
    return out;
  }

  function getCoverageSummary(topic) {
    var coverage = topic && topic.coverage ? topic.coverage : {};
    return {
      power_mapped_count: Number(coverage.power_mapped_count || 0),
      power_available_count: Number(coverage.power_available_count || 0),
      challenge_mapped_count: Number(coverage.challenge_mapped_count || 0),
      challenge_available_count: Number(coverage.challenge_available_count || 0)
    };
  }

  global.MASTERY_ENGINE = {
    getRules: getRules,
    listProfiles: listProfiles,
    createProfile: createProfile,
    getProfile: getProfile,
    upsertProfile: upsertProfile,
    getTopicsByGrade: getTopicsByGrade,
    getModulesByGrade: getModulesByGrade,
    getTopic: getTopic,
    getTopicKey: getTopicKey,
    getTopicFocusKey: getTopicFocusKey,
    getAttemptsFor: getAttemptsFor,
    evaluatePowerMastery: evaluatePowerMastery,
    isChallengeUnlocked: isChallengeUnlocked,
    buildSession: buildSession,
    scoreSession: scoreSession,
    recordAttempt: recordAttempt,
    summarizeTopicMastery: summarizeTopicMastery,
    getKaLinksForStandards: getKaLinksForStandards,
    getCoverageSummary: getCoverageSummary,
    getRecentTemplateIds: getRecentTemplateIds
  };
})(typeof window !== "undefined" ? window : globalThis);
