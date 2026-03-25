var GRADE5_TEXTBOOK_TESTS = {
  version: 1,
  generated_on: "2026-02-10",
  grade: 5,
  source_policy: "Textbook wording kept with light cleanup for readability.",
  sets: [
    {
      id: "power_focus",
      title: "Power Focus (Core Mastery)",
      purpose: "Pilot subset for Grade 5 CC (4 standards currently), focused on multiplication, fraction operations, and decimal operations.",
      coverage_summary: {
        critical_areas: [
          "Multi-digit whole-number multiplication",
          "Fraction addition and subtraction with unlike denominators",
          "Fraction multiplication",
          "Decimal operations through hundredths"
        ],
        standards_targeted: [
          "5.NBT.5",
          "5.NF.1",
          "5.NF.4",
          "5.NBT.7"
        ]
      },
      questions: [
        {
          id: "pf_01",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Workbook Page 27, line 2687",
          standard_ids: ["5.NBT.5"],
          prompt: "Multiply 4,000 by 26.",
          answer_key: "104,000."
        },
        {
          id: "pf_02",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Exercise 1.3 Basic Practice, line 2743",
          standard_ids: ["5.NBT.5"],
          prompt: "Multiply the expression: 307 x 89.",
          answer_key: "27,323."
        },
        {
          id: "pf_03",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Exercise 1.3 Basic Practice, line 2743",
          standard_ids: ["5.NBT.5"],
          prompt: "Multiply the expression: 2,093 x 72.",
          answer_key: "150,696."
        },
        {
          id: "pf_04",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Chapter 1 Practice, Q6(e), line 417",
          standard_ids: ["5.NBT.5"],
          prompt: "Use a simple method to compute: 198 x 56.",
          answer_key: "11,088."
        },
        {
          id: "pf_05",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Page 300, line 7411",
          standard_ids: ["5.NF.1"],
          prompt: "Subtract: 3/5 - 1/4.",
          answer_key: "7/20."
        },
        {
          id: "pf_06",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Page 300, line 7413",
          standard_ids: ["5.NF.1"],
          prompt: "Subtract: 3/10 - 1/5.",
          answer_key: "1/10."
        },
        {
          id: "pf_07",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Page 300, line 7415",
          standard_ids: ["5.NF.1"],
          prompt: "Subtract: 4/5 - 1/3.",
          answer_key: "7/15."
        },
        {
          id: "pf_08",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Page 300, line 7848",
          standard_ids: ["5.NF.1"],
          prompt: "Manny and Frank ordered sausage on 1/4 of a pizza and pepperoni on 1/3 of the pizza. The rest had only cheese. How much of the pizza had only cheese?",
          answer_key: "5/12 of the pizza.",
          svg: `<svg viewBox="0 0 440 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bar model split into twelfths for pizza fractions">
  <rect x="20" y="35" width="360" height="34" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
  <g stroke="#94a3b8">
    <line x1="50" y1="35" x2="50" y2="69"/><line x1="80" y1="35" x2="80" y2="69"/><line x1="110" y1="35" x2="110" y2="69"/>
    <line x1="140" y1="35" x2="140" y2="69"/><line x1="170" y1="35" x2="170" y2="69"/><line x1="200" y1="35" x2="200" y2="69"/>
    <line x1="230" y1="35" x2="230" y2="69"/><line x1="260" y1="35" x2="260" y2="69"/><line x1="290" y1="35" x2="290" y2="69"/>
    <line x1="320" y1="35" x2="320" y2="69"/><line x1="350" y1="35" x2="350" y2="69"/>
  </g>
  <rect x="20" y="35" width="90" height="34" fill="#bae6fd" opacity="0.7"/>
  <rect x="110" y="35" width="120" height="34" fill="#fed7aa" opacity="0.7"/>
  <text x="20" y="26" fill="#0f172a" font-size="12">1/4 = 3/12</text>
  <text x="120" y="26" fill="#0f172a" font-size="12">1/3 = 4/12</text>
  <text x="250" y="26" fill="#0f172a" font-size="12">Cheese = 5/12</text>
</svg>`
        },
        {
          id: "pf_09",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Adding and Subtracting Decimals example, line 7264",
          standard_ids: ["5.NBT.7"],
          prompt: "Add 3.4 and 2.75.",
          answer_key: "6.15."
        },
        {
          id: "pf_10",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Adding and Subtracting Decimals example, line 7309",
          standard_ids: ["5.NBT.7"],
          prompt: "Subtract 1.09 from 12.",
          answer_key: "10.91."
        },
        {
          id: "pf_11",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Calculate the following, line 7383",
          standard_ids: ["5.NBT.7"],
          prompt: "Calculate: 12.664 + 7.85.",
          answer_key: "20.514."
        },
        {
          id: "pf_12",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Calculate the following, line 7383",
          standard_ids: ["5.NBT.7"],
          prompt: "Calculate: 39.3 - 7.715.",
          answer_key: "31.585."
        },
        {
          id: "pf_13",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Try It! 1 Answer, line 10032",
          standard_ids: ["5.NF.4"],
          prompt: "Compute: (3/5) x (3/5) x (3/5).",
          answer_key: "27/125."
        },
        {
          id: "pf_14",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Try It! 2 Answer, line 10093",
          standard_ids: ["5.NF.4"],
          prompt: "Find the product: 6 x (2 1/2) x (2 1/2). Express as a mixed number in simplest form.",
          answer_key: "37 1/2."
        },
        {
          id: "pf_15",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Example 1 notes, line 10032",
          standard_ids: ["5.NF.4"],
          prompt: "A 2/3-m cube can be filled with 8 cubes of edge length 1/3 m. Each small cube has volume 1/27 m^3. Find the volume of the 2/3-m cube.",
          answer_key: "8/27 m^3."
        },
        {
          id: "pf_16",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Volume with fractional edges, line 10300",
          standard_ids: ["5.NF.4"],
          prompt: "Compute the product and simplify: 50 x (13 1/2).",
          answer_key: "675."
        }
      ]
    },
    {
      id: "power_gap_fill",
      title: "Power Focus Expansion (Missing Standards)",
      purpose: "Textbook-derived power-gap fill for the 15 Grade 5 power standards not covered in the original pilot subset.",
      coverage_summary: {
        standards_targeted: [
          "5.OA.1",
          "5.OA.2",
          "5.NBT.1",
          "5.NBT.3",
          "5.NBT.4",
          "5.NBT.6",
          "5.NF.2",
          "5.NF.3",
          "5.NF.6",
          "5.NF.7",
          "5.MD.1",
          "5.MD.3",
          "5.MD.4",
          "5.MD.5",
          "5.G.1"
        ]
      },
      questions: [
        {
          id: "pfx_01",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Order of operations activity, lines 818-822",
          standard_ids: ["5.OA.1"],
          prompt: "Evaluate the expression 3 + 4 x 5 using the agreed order of operations.",
          answer_key: "23."
        },
        {
          id: "pfx_02",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Parentheses example, line 1036",
          standard_ids: ["5.OA.2"],
          prompt: "Write an expression for: multiply the sum of 5 and 4 by 7.",
          answer_key: "(5 + 4) x 7."
        },
        {
          id: "pfx_03",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Brain Works place value, lines 7929-7931",
          standard_ids: ["5.NBT.1"],
          prompt: "Express 4.867 as ones, tenths, hundredths, and thousandths.",
          answer_key: "4 ones + 8 tenths + 6 hundredths + 7 thousandths."
        },
        {
          id: "pfx_04",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Arrange in increasing order, lines 7619-7622 and answer line 7679",
          standard_ids: ["5.NBT.3"],
          prompt: "Arrange these numbers in increasing order: 4 3/100, 4 2/25, 4.088, 4.1.",
          answer_key: "4 3/100, 4 2/25, 4.088, 4.1."
        },
        {
          id: "pfx_05",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Divide and round, lines 9739-9743",
          standard_ids: ["5.NBT.4"],
          prompt: "Divide 5 by 6 and round the quotient to two decimal places.",
          answer_key: "0.83."
        },
        {
          id: "pfx_06",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Use a simple method to compute, line 411",
          standard_ids: ["5.NBT.6"],
          prompt: "Use a simple method to compute: 1,600 ÷ 25.",
          answer_key: "64."
        },
        {
          id: "pfx_07",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Student Guide page 177, line 7848",
          standard_ids: ["5.NF.2"],
          prompt: "Manny and Frank ordered sausage on 1/4 of a pizza and pepperoni on 1/3 of the pizza. The rest of the pizza had only cheese. How much of the pizza had only cheese?",
          answer_key: "5/12 of the pizza."
        },
        {
          id: "pfx_08",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Sharing problem, lines 4096-4107",
          standard_ids: ["5.NF.3"],
          prompt: "3 chocolate bars are shared equally by 4 people. How much will each person get?",
          answer_key: "3/4 of a chocolate bar."
        },
        {
          id: "pfx_09",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Volume with mixed numbers, line 10172",
          standard_ids: ["5.NF.6"],
          prompt: "A rectangular container has a base area of 50 m^2 and a height of 13 1/2 m. Find its volume.",
          answer_key: "675 m^3."
        },
        {
          id: "pfx_10",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Division by a unit fraction, lines 5419-5421",
          standard_ids: ["5.NF.7"],
          prompt: "What is 6 ÷ 1/2 equal to?",
          answer_key: "12."
        },
        {
          id: "pfx_11",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Try It! 13, lines 10022 and 10092",
          standard_ids: ["5.MD.1"],
          prompt: "Convert 0.009 m to millimeters.",
          answer_key: "9 mm."
        },
        {
          id: "pfx_12",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Unit-cube volume reasoning, lines 10011-10013",
          standard_ids: ["5.MD.3"],
          prompt: "It takes 5 x 5 x 5 cubes with side length 1/5 cm to fill a 1-cm cube. What is the volume of one 1/5-cm cube?",
          answer_key: "1/125 cm^3."
        },
        {
          id: "pfx_13",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Count 1/4-inch cubes to fill prism, lines 10052-10055 and 10079",
          standard_ids: ["5.MD.4"],
          prompt: "How many 1/4-inch cubes are needed to fill a cuboid measuring 3 3/4 in by 1 1/2 in by 1 1/4 in?",
          answer_key: "450 cubes."
        },
        {
          id: "pfx_14",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Area of base x height, lines 10127-10140",
          standard_ids: ["5.MD.5"],
          prompt: "A rectangular container of height 8 cm has a base area of 120.3 cm^2. Find its volume.",
          answer_key: "962.4 cm^3."
        },
        {
          id: "pfx_15",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Coordinate meaning example, line 4645",
          standard_ids: ["5.G.1"],
          prompt: "In the ordered pair (3, 2), how far is the point from the y-axis and from the x-axis?",
          answer_key: "3 units from the y-axis and 2 units from the x-axis."
        }
      ]
    },
    {
      id: "challenge",
      title: "Challenge Areas (Optional Stretch)",
      purpose: "Optional stretch items for the same 4-standard pilot subset (not full Grade 5 CC challenge coverage yet).",
      coverage_summary: {
        standards_targeted: [
          "5.NBT.5",
          "5.NF.1",
          "5.NF.4",
          "5.NBT.7"
        ]
      },
      questions: [
        {
          id: "ch_01",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Chapter 1 Practice, Q9(a), line 469",
          standard_ids: ["5.NBT.5"],
          prompt: "Use a simple method to compute: 35 x 128 - 28 x 35.",
          answer_key: "3,500."
        },
        {
          id: "ch_02",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Chapter 1 Practice, Q9(d), line 473",
          standard_ids: ["5.NBT.5"],
          prompt: "Use a simple method to compute: 897 x 30 - 297 x 30.",
          answer_key: "18,000."
        },
        {
          id: "ch_03",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Chapter 1 Practice, Q6(g), line 421",
          standard_ids: ["5.NBT.5"],
          prompt: "Use a simple method to compute: 64 x 25 x 125 x 16.",
          answer_key: "3,200,000."
        },
        {
          id: "ch_04",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Page 303, line 7477",
          standard_ids: ["5.NF.1"],
          prompt: "Add: 1/4 + 3/8.",
          answer_key: "5/8."
        },
        {
          id: "ch_05",
          source_book: "Math Trailblazers Grade 5",
          source_ref: "Page 304, line 7493",
          standard_ids: ["5.NF.1"],
          prompt: "Add: 2/3 + 5/8.",
          answer_key: "31/24, or 1 7/24."
        },
        {
          id: "ch_06",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Write Simple Equations, Example 1, line 2029",
          standard_ids: ["5.NBT.7"],
          prompt: "2 peaches and 12 apples cost $14.60. 6 peaches and 4 apples cost $18.20. How much is an apple, and how much is a peach?",
          answer_key: "Apple: $0.80. Peach: $2.50."
        },
        {
          id: "ch_07",
          source_book: "Singapore Math Challenge, Grades 5-8",
          source_ref: "Write Simple Equations, Q10, line 2193",
          standard_ids: ["5.NBT.7"],
          prompt: "3 packets of french fries, 2 cheeseburgers, and 1 drink cost $10.95. 1 packet of french fries, 2 cheeseburgers, and 3 drinks cost $11.25. Find the price of one packet of fries, one cheeseburger, and one drink together.",
          answer_key: "$5.55 for one set (fries + cheeseburger + drink)."
        },
        {
          id: "ch_08",
          source_book: "Dimensions Math 6A Teacher's Guide",
          source_ref: "Multiplier and Product, line 8060",
          standard_ids: ["5.NBT.7"],
          prompt: "Without doing full multiplication, decide which products are less than 28.07 and which are more than 28.07: (a) 28.07 x 0.38, (b) 28.07 x 3.8, (c) 0.99 x 28.07, (d) 28.07 x 0.999, (e) 1.03 x 28.07.",
          answer_key: "Less than 28.07: (a), (c), (d). More than 28.07: (b), (e)."
        },
        {
          id: "ch_09",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Fractional prism model, line 10120",
          standard_ids: ["5.NF.4"],
          prompt: "A cuboid has dimensions 3 3/4 in, 1 1/2 in, and 1 1/4 in. Compute 15 x 6 x 5 x 1/64 to find its volume in cubic inches.",
          answer_key: "450/64 = 225/32 = 7 1/32 in^3."
        },
        {
          id: "ch_10",
          source_book: "Dimensions Math 6B Teacher's Guide",
          source_ref: "Try It! and extension notes, line 10093",
          standard_ids: ["5.NF.4"],
          prompt: "Find the missing edge length l: 5 cm x 3.8 cm x l = 266 cm^3.",
          answer_key: "l = 14 cm."
        }
      ]
    }
  ]
};

var NEO_MAP_BY_STANDARD = {
  "5.OA.1": {
    module: "Module 6: Algebra",
    topic_id: "6.1",
    topic_title: "Expressions & Exponents"
  },
  "5.OA.2": {
    module: "Module 6: Algebra",
    topic_id: "6.1",
    topic_title: "Expressions & Exponents"
  },
  "5.NBT.1": {
    module: "Module 3: Decimals",
    topic_id: "3.2",
    topic_title: "Powers of Ten & Place Value"
  },
  "5.NBT.3": {
    module: "Module 3: Decimals",
    topic_id: "3.2",
    topic_title: "Powers of Ten & Place Value"
  },
  "5.NBT.4": {
    module: "Module 3: Decimals",
    topic_id: "3.3",
    topic_title: "Decimal Reasoning & Estimation"
  },
  "5.NBT.5": {
    module: "Module 1: Whole Number Foundations",
    topic_id: "1.1",
    topic_title: "Multi-Digit Operations"
  },
  "5.NBT.6": {
    module: "Module 1: Whole Number Foundations",
    topic_id: "1.4",
    topic_title: "Multi-Digit Division & Quotients"
  },
  "5.NF.1": {
    module: "Module 2: The World of Fractions",
    topic_id: "2.2",
    topic_title: "Addition & Subtraction"
  },
  "5.NF.2": {
    module: "Module 2: The World of Fractions",
    topic_id: "2.2",
    topic_title: "Addition & Subtraction"
  },
  "5.NF.3": {
    module: "Module 2: The World of Fractions",
    topic_id: "2.1",
    topic_title: "Visualization & Equivalence"
  },
  "5.NF.4": {
    module: "Module 2: The World of Fractions",
    topic_id: "2.3",
    topic_title: "Multiplication & Division"
  },
  "5.NF.6": {
    module: "Module 2: The World of Fractions",
    topic_id: "2.4",
    topic_title: "Fraction Applications & Scaling"
  },
  "5.NF.7": {
    module: "Module 2: The World of Fractions",
    topic_id: "2.3",
    topic_title: "Multiplication & Division"
  },
  "5.NBT.7": {
    module: "Module 3: Decimals",
    topic_id: "3.1",
    topic_title: "Decimal Concepts & Operations"
  },
  "5.MD.1": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.7",
    topic_title: "Measurement Conversions & Volume"
  },
  "5.MD.3": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.7",
    topic_title: "Measurement Conversions & Volume"
  },
  "5.MD.4": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.7",
    topic_title: "Measurement Conversions & Volume"
  },
  "5.MD.5": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.7",
    topic_title: "Measurement Conversions & Volume"
  },
  "5.G.1": {
    module: "Module 7: Geometry, Data & Probability",
    topic_id: "7.1",
    topic_title: "Coordinate Geometry"
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
            note: "No Neo Grade 5 topic currently mapped to this CC standard."
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
          note: "No tagged CC standard maps to Neo in current Grade 5 scope."
        };
      }
    }
  }
}

attachMappings(GRADE5_TEXTBOOK_TESTS);

if (typeof window !== "undefined") {
  window.GRADE5_TEXTBOOK_TESTS = GRADE5_TEXTBOOK_TESTS;
}
