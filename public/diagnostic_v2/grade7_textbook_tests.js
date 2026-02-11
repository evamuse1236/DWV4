var GRADE7_TEXTBOOK_TESTS = {
  version: 1,
  generated_on: "2026-02-10",
  grade: 7,
  source_policy: "Textbook wording kept with light cleanup for readability.",
  sets: [
    {
      id: "power_focus",
      title: "Power Focus (Core Mastery)",
      purpose: "Core Grade 7 CC mastery aligned to the critical areas in cc.md.",
      coverage_summary: {
        critical_areas: [
          "Proportional relationships",
          "Operations with rational numbers and equations",
          "Geometry with scale and measurement",
          "Probability and data reasoning"
        ],
        standards_targeted: [
          "7.RP.1",
          "7.RP.2",
          "7.RP.3",
          "7.NS.1",
          "7.NS.2",
          "7.EE.4",
          "7.G.1",
          "7.G.3",
          "7.G.4",
          "7.G.5",
          "7.SP.5",
          "7.SP.6",
          "7.SP.8"
        ]
      },
      questions: [
        {
          id: "pf_01",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 2 Test, lines 181-183",
          standard_ids: ["7.NS.1"],
          prompt: "Illustrate the sum -5 + 7 in two ways: (1) using counters, and (2) using a number line.",
          answer_key: "2. Any valid counter and number-line representation ending at 2 is acceptable.",
          svg: `<svg viewBox="0 0 640 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Blank number line from minus 10 to plus 10">
  <line x1="30" y1="65" x2="610" y2="65" stroke="#475569" stroke-width="2"/>
  <polygon points="610,65 598,59 598,71" fill="#475569"/>
  <polygon points="30,65 42,59 42,71" fill="#475569"/>
  <g fill="#334155" font-size="12" text-anchor="middle">
    <text x="30" y="90">-10</text><text x="88" y="90">-8</text><text x="146" y="90">-6</text>
    <text x="204" y="90">-4</text><text x="262" y="90">-2</text><text x="320" y="90">0</text>
    <text x="378" y="90">2</text><text x="436" y="90">4</text><text x="494" y="90">6</text>
    <text x="552" y="90">8</text><text x="610" y="90">10</text>
  </g>
  <g stroke="#94a3b8">
    <line x1="30" y1="58" x2="30" y2="72"/><line x1="88" y1="58" x2="88" y2="72"/><line x1="146" y1="58" x2="146" y2="72"/>
    <line x1="204" y1="58" x2="204" y2="72"/><line x1="262" y1="58" x2="262" y2="72"/><line x1="320" y1="55" x2="320" y2="75"/>
    <line x1="378" y1="58" x2="378" y2="72"/><line x1="436" y1="58" x2="436" y2="72"/><line x1="494" y1="58" x2="494" y2="72"/>
    <line x1="552" y1="58" x2="552" y2="72"/><line x1="610" y1="58" x2="610" y2="72"/>
  </g>
  <text x="30" y="24" fill="#0f766e" font-size="13">Use this line for your representation.</text>
</svg>`
        },
        {
          id: "pf_02",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 2 Test, lines 195-200",
          standard_ids: ["7.NS.1", "7.EE.4"],
          prompt: "Write an addition or subtraction, and solve: Aiden owed $21 on his credit card. Then he paid $15. Then he made a purchase for $35. Then he made another payment of $50. What is his balance now?",
          answer_key: "$9 (credit). One valid expression: -21 + 15 - 35 + 50 = 9."
        },
        {
          id: "pf_03",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 2 Test, lines 219-221",
          standard_ids: ["7.NS.2"],
          prompt: "Divide and simplify to the lowest terms: a) 15 ÷ (-3), b) -2 ÷ (-10), c) -20 ÷ 6, d) 72 ÷ (-48).",
          answer_key: "a) -5, b) 1/5, c) -10/3, d) -3/2."
        },
        {
          id: "pf_04",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 2 Test, lines 227-232",
          standard_ids: ["7.EE.4"],
          prompt: "Solve the equations by thinking logically: a) -8y = 96, b) -20a = -300, c) 36 ÷ w = -6.",
          answer_key: "a) y = -12, b) a = 15, c) w = -6."
        },
        {
          id: "pf_05",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 3 Test, lines 253-255",
          standard_ids: ["7.EE.4"],
          prompt: "Solve. Check your solutions: a) x + 8 = -13, b) 4 - (-2) = -y, c) 18 - x = -1, d) 2 - 6 = -z + 5, e) x/10 = -17 + 5, f) -13 = c/7.",
          answer_key: "a) -21, b) -6, c) 19, d) 9, e) -120, f) -91."
        },
        {
          id: "pf_06",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 3 Test, lines 259-261",
          standard_ids: ["7.RP.1"],
          prompt: "Seven pounds of chicken costs $32.41. How much does one pound cost?",
          answer_key: "$4.63 per pound."
        },
        {
          id: "pf_07",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 3 Test, lines 263-270",
          standard_ids: ["7.RP.1", "7.EE.3"],
          prompt: "Use the formula d = vt: A ferry travels at a constant speed of 18 km/h. How long will it take to cross a river, a distance of 600 meters?",
          answer_key: "2 minutes (0.6/18 hour = 0.0333... hour)."
        },
        {
          id: "pf_08",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 4 Test, lines 365-367",
          standard_ids: ["7.RP.3"],
          prompt: "Find 15% of 3/4.",
          answer_key: "9/80 (0.1125)."
        },
        {
          id: "pf_09",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 4 Test, lines 367-368",
          standard_ids: ["7.EE.4"],
          prompt: "Two-thirds of a number is -5.66. What is the number?",
          answer_key: "-8.49."
        },
        {
          id: "pf_10",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 6 Test, lines 471-474",
          standard_ids: ["7.RP.1"],
          prompt: "Chloe bicycled 20 kilometers in 1 1/2 hours. Write a rate for her speed and simplify it to find the unit rate.",
          answer_key: "13 1/3 km/h."
        },
        {
          id: "pf_11",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 6 Test, lines 481-485",
          standard_ids: ["7.RP.3"],
          prompt: "Write a proportion for the following problem and solve it: A bag of 52 kg of wheat costs $169. What would 21 kg of wheat cost?",
          answer_key: "$68.25."
        },
        {
          id: "pf_12",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 6 Test, lines 500-504",
          standard_ids: ["7.G.1", "7.RP.2"],
          prompt: "A town map has a scale of 1:45,000. a) A street in this town is 850 m long. How long is that street on this map? b) How long in reality is a road that measures 5.4 cm on the map?",
          answer_key: "a) about 1.89 cm, b) 2.43 km."
        },
        {
          id: "pf_13",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 8 Test, lines 648-652",
          standard_ids: ["7.G.5", "7.G.2"],
          prompt: "An isosceles triangle has an 80 degree top angle and two 11-cm sides. a) Calculate the angle measure of the base angles. b) Draw the triangle.",
          answer_key: "Each base angle is 50 degrees.",
          svg: `<svg viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Isosceles triangle with top angle 80 degrees and two equal sides 11 cm">
  <polygon points="170,30 60,190 280,190" fill="#ecfeff" stroke="#0f766e" stroke-width="3"/>
  <text x="171" y="52" text-anchor="middle" fill="#0f172a" font-size="14">80 deg</text>
  <text x="98" y="116" fill="#334155" font-size="13">11 cm</text>
  <text x="230" y="116" fill="#334155" font-size="13">11 cm</text>
  <text x="30" y="208" fill="#0f766e" font-size="12">Find each base angle.</text>
</svg>`
        },
        {
          id: "pf_14",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 8 Test, lines 675-680",
          standard_ids: ["7.G.3"],
          prompt: "A rectangular prism is cut with a plane that is perpendicular to the prism's base. What figure is formed at the cross-section? Also answer: A rectangular pyramid is cut with a plane that is parallel to the pyramid's base. What figure is formed at the cross-section?",
          answer_key: "Prism cut: rectangle. Pyramid cut parallel to base: rectangle (similar to the base).",
          svg: `<svg viewBox="0 0 500 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prism and pyramid cross-section sketches">
  <rect x="35" y="70" width="140" height="90" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
  <rect x="75" y="40" width="140" height="90" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <line x1="35" y1="70" x2="75" y2="40" stroke="#94a3b8" stroke-width="2"/>
  <line x1="175" y1="70" x2="215" y2="40" stroke="#94a3b8" stroke-width="2"/>
  <line x1="175" y1="160" x2="215" y2="130" stroke="#94a3b8" stroke-width="2"/>
  <line x1="35" y1="160" x2="75" y2="130" stroke="#94a3b8" stroke-width="2"/>
  <line x1="110" y1="55" x2="110" y2="175" stroke="#0f766e" stroke-width="3"/>
  <polygon points="320,150 450,150 390,55" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
  <line x1="352" y1="100" x2="425" y2="100" stroke="#0f766e" stroke-width="3"/>
  <text x="32" y="28" fill="#334155" font-size="12">Prism cut perpendicular to base</text>
  <text x="300" y="28" fill="#334155" font-size="12">Pyramid cut parallel to base</text>
</svg>`
        },
        {
          id: "pf_15",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 8 Test, lines 685-686",
          standard_ids: ["7.G.4"],
          prompt: "A large circular wall clock has a diameter of 40.0 cm. Find its area to the nearest ten square centimeters.",
          answer_key: "About 1,260 square centimeters."
        },
        {
          id: "pf_16",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 10 Test, lines 770-778",
          standard_ids: ["7.SP.5"],
          prompt: "You roll a number cube with numbers 1, 2, 3, 4, 5, and 6 printed on the faces. Find the probabilities as fractions: a) P(not 5), b) P(2 or 6), c) P(less than 9), d) P(not 2 nor 5).",
          answer_key: "a) 5/6, b) 1/3, c) 1, d) 2/3."
        },
        {
          id: "pf_17",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 10 Test, lines 800-807",
          standard_ids: ["7.SP.8"],
          prompt: "Two dice are rolled. Find the probabilities of these events: a) You get a sum of six on the two dice. b) You get less than 3 on each dice. c) One dice is 6 and the other is not (in either order).",
          answer_key: "a) 5/36, b) 1/9, c) 5/18."
        },
        {
          id: "pf_18",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 10 Test, lines 808-817",
          standard_ids: ["7.SP.6"],
          prompt: "Logan and Alex tossed two coins 400 times. a) List all the possible outcomes when two coins are tossed one time. b) Fill in experimental and theoretical probabilities from the frequency table. c) Suggest a reason for the large discrepancy between experimental and theoretical probabilities.",
          answer_key: "Possible outcomes: TT, TH, HT, HH. Part (c) should discuss non-random process, data error, or biased recording."
        },
        {
          id: "pf_19",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 10 Test, lines 820-826",
          standard_ids: ["7.SP.2", "7.SP.6"],
          prompt: "Lily and Grace placed stuffed animals in a bag, then sampled with replacement 120 times. Frequencies: Elephant 58, Giraffe 29, Bear 17, Cat 11, Bird 5. a) Based on their results, what is the approximate probability of pulling the cat? b) If repeated 300 times, approximately how many bears should be expected?",
          answer_key: "a) 11/120 (about 9.2%), b) about 43 bears."
        }
      ]
    },
    {
      id: "challenge",
      title: "Challenge Areas (Optional Stretch)",
      purpose: "Harder and multi-step items for students ready to go above baseline mastery.",
      coverage_summary: {
        standards_targeted: [
          "7.RP.3",
          "7.EE.3",
          "7.EE.4"
        ]
      },
      questions: [
        {
          id: "ch_01",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 7 Test, line 581",
          standard_ids: ["7.RP.3", "7.EE.3"],
          prompt: "The Jefferson family bought three children's tickets and two adult's tickets to the county fair. They got a 5% discount on the total purchase price before tax. Lastly, a 6.2% sales tax was added to the total. If the normal price of a child's ticket is $10 and an adult's ticket is $20, find the cost of tickets for the family.",
          answer_key: "$70.62 (nearest cent)."
        },
        {
          id: "ch_02",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 7 Test, line 583",
          standard_ids: ["7.RP.3"],
          prompt: "This year the college has 1,210 students, an increase of 6.6% from last year. How many students did the college have last year?",
          answer_key: "About 1,135 students."
        },
        {
          id: "ch_03",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 7 Test, line 591",
          standard_ids: ["7.RP.3", "7.G.6"],
          prompt: "A rectangular playground area measures 5 m by 6.5 m. It is enlarged so that it becomes 7.2 m by 10 m. What is the percentage increase in its area?",
          answer_key: "About 121.5% increase."
        },
        {
          id: "ch_04",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 7 Test, line 599",
          standard_ids: ["7.RP.3"],
          prompt: "A 12-inch pizza in Tony's Pizzeria costs $12.99 and in PizzaTown it costs $15.99. How many percent more expensive is the 12-inch pizza in PizzaTown than in Tony's Pizzeria?",
          answer_key: "About 23.1% more expensive."
        },
        {
          id: "ch_05",
          source_book: "Math Mammoth Grade 7 Tests and Cumulative Reviews",
          source_ref: "Chapter 7 Test, line 603",
          standard_ids: ["7.RP.3"],
          prompt: "Michael borrowed $35,000 for ten years. At the end of those years he paid the bank back $65,800. What was the interest rate?",
          answer_key: "8.8% per year under simple-interest interpretation."
        },
        {
          id: "ch_06",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 725",
          standard_ids: ["7.EE.4"],
          prompt: "A science quiz consists of 15 questions. 2 points are awarded for every correct answer and 1 point is deducted for every wrong answer. Kelly scores 21 points on the science quiz. How many questions does she answer correctly?",
          answer_key: "12 correct answers."
        },
        {
          id: "ch_07",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 727",
          standard_ids: ["7.EE.4"],
          prompt: "There are 30 questions in a math competition. 5 points are awarded for each question answered correctly and 3 points are deducted for each wrong answer. Rena scores 126 points for the math competition. How many questions does she get wrong?",
          answer_key: "3 wrong answers."
        },
        {
          id: "ch_08",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 729",
          standard_ids: ["7.EE.4"],
          prompt: "A math quiz consists of 30 questions. The first 20 questions are worth 4 points each. The last 10 questions are worth 7 points each. No points will be deducted for each wrong answer. Justin scores 124 points on the math quiz. How many of the first 20 questions and how many of the last 10 questions does he answer incorrectly?",
          answer_key: "3 wrong in first 20, and 2 wrong in last 10."
        },
        {
          id: "ch_09",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 731",
          standard_ids: ["7.EE.4"],
          prompt: "Mr. George spent $375 in all for 5 similar tables and 6 similar chairs. Each table cost $20 more than each chair. What was the price of a table? What was the price of a chair?",
          answer_key: "Table: $45, chair: $25."
        },
        {
          id: "ch_10",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 1078",
          standard_ids: ["7.EE.4"],
          prompt: "ABC Megamart sold 4 sacks more than half its sacks of rice on the first day of a week. It sold 3 sacks fewer than half of the remaining sacks of rice on the second day. ABC Megamart ordered another 30 sacks of rice on the third day. It had a total stock of 50 sacks then. How many sacks of rice did ABC Megamart have at first?",
          answer_key: "76 sacks."
        },
        {
          id: "ch_11",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 1086",
          standard_ids: ["7.EE.4"],
          prompt: "There were some marbles in a bag. Jeff took half of the marbles out of the bag. He then put 1 marble back into the bag. He repeated this process five times. There were 3 marbles left in the bag at the end. How many marbles were there in the bag at first?",
          answer_key: "34 marbles."
        },
        {
          id: "ch_12",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Problem set, line 1088",
          standard_ids: ["7.EE.4"],
          prompt: "Alison, Beatrice and Chloe each had some books. Alison gave Beatrice and Chloe some books that doubled the number of books they had at first. Beatrice then gave some books to Alison and Chloe that doubled the number of books they had. Lastly, Chloe gave Alison and Beatrice some books that doubled the number of books they had. Each of them had 32 books at the end. How many books did each of them have at first?",
          answer_key: "Alison 52, Beatrice 28, Chloe 16."
        }
      ]
    }
  ]
};

var NEO_MAP_BY_STANDARD = {
  "7.EE.1": {
    module: "Module 6: Algebra",
    topic_id: "6.5",
    topic_title: "Equivalent Expressions & Factoring"
  },
  "7.EE.2": {
    module: "Module 6: Algebra",
    topic_id: "6.5",
    topic_title: "Equivalent Expressions & Factoring"
  },
  "7.EE.3": {
    module: "Module 6: Algebra",
    topic_id: "6.2",
    topic_title: "Solving Equations"
  },
  "7.EE.4": {
    module: "Module 6: Algebra",
    topic_id: "6.4",
    topic_title: "Inequalities & Constraints"
  },
  "7.G.1": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.1",
    topic_title: "Coordinate Geometry"
  },
  "7.G.2": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.8",
    topic_title: "Geometric Constructions & Angle Reasoning"
  },
  "7.G.3": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.8",
    topic_title: "Geometric Constructions & Angle Reasoning"
  },
  "7.G.4": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.2",
    topic_title: "Area & 2D Figures"
  },
  "7.G.5": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.8",
    topic_title: "Geometric Constructions & Angle Reasoning"
  },
  "7.G.6": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.3",
    topic_title: "3D Figures"
  },
  "7.NS.1": {
    module: "Module 4: Integers (Negative Numbers)",
    topic_id: "4.2",
    topic_title: "Integer Operations (Advanced)"
  },
  "7.NS.2": {
    module: "Module 4: Integers (Negative Numbers)",
    topic_id: "4.3",
    topic_title: "Rational Number Operations"
  },
  "7.NS.3": {
    module: "Module 4: Integers (Negative Numbers)",
    topic_id: "4.3",
    topic_title: "Rational Number Operations"
  },
  "7.RP.1": {
    module: "Module 5: Ratios, Rates & Percentages",
    topic_id: "5.4",
    topic_title: "Proportional Relationships"
  },
  "7.RP.2": {
    module: "Module 5: Ratios, Rates & Percentages",
    topic_id: "5.4",
    topic_title: "Proportional Relationships"
  },
  "7.RP.3": {
    module: "Module 5: Ratios, Rates & Percentages",
    topic_id: "5.3",
    topic_title: "Advanced Percent Application"
  },
  "7.SP.1": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.5",
    topic_title: "Statistical Inference"
  },
  "7.SP.2": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.5",
    topic_title: "Statistical Inference"
  },
  "7.SP.3": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.5",
    topic_title: "Statistical Inference"
  },
  "7.SP.4": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.5",
    topic_title: "Statistical Inference"
  },
  "7.SP.5": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.6",
    topic_title: "Chance & Probability Models"
  },
  "7.SP.6": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.6",
    topic_title: "Chance & Probability Models"
  },
  "7.SP.7": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.6",
    topic_title: "Chance & Probability Models"
  },
  "7.SP.8": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.6",
    topic_title: "Chance & Probability Models"
  }
};

function attachMappings(payload) {
  if (!payload || !Array.isArray(payload.sets)) return;
  for (var i = 0; i < payload.sets.length; i++) {
    var set = payload.sets[i];
    if (!set || !Array.isArray(set.questions)) continue;
    for (var j = 0; j < set.questions.length; j++) {
      var q = set.questions[j];
      var standards = Array.isArray(q.standard_ids) ? q.standard_ids.slice() : [];
      var standardMappings = [];
      q.cc_mapping = {
        standard_ids: standards,
        primary_standard: standards.length ? standards[0] : ""
      };

      for (var k = 0; k < standards.length; k++) {
        var sid = standards[k];
        var entry = NEO_MAP_BY_STANDARD[sid];
        if (entry) {
          standardMappings.push({
            standard_id: sid,
            status: "mapped",
            module: entry.module,
            topic_id: entry.topic_id,
            topic_title: entry.topic_title
          });
        } else {
          standardMappings.push({
            standard_id: sid,
            status: "not_mapped",
            note: "No Neo Grade 7 topic currently mapped to this CC standard."
          });
        }
      }

      q.standard_mappings = standardMappings;

      var mappedCount = 0;
      for (var m = 0; m < standardMappings.length; m++) {
        if (standardMappings[m].status === "mapped") mappedCount += 1;
      }

      if (!standards.length) {
        q.neo_mapping = {
          status: "not_tagged",
          note: "No CC standard is tagged on this question."
        };
      } else if (mappedCount === standards.length) {
        q.neo_mapping = {
          status: "mapped_all",
          note: "All tagged CC standards map to Neo topics."
        };
      } else if (mappedCount > 0) {
        q.neo_mapping = {
          status: "partial",
          note: "Some tagged CC standards map to Neo topics, others do not."
        };
      } else {
        q.neo_mapping = {
          status: "not_mapped",
          note: "No tagged CC standard maps to Neo in current Grade 7 scope."
        };
      }
    }
  }
}

attachMappings(GRADE7_TEXTBOOK_TESTS);

if (typeof window !== "undefined") {
  window.GRADE7_TEXTBOOK_TESTS = GRADE7_TEXTBOOK_TESTS;
}
