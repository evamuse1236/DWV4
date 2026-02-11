# Misconception Sync Report

Generated: 2026-02-11T18:00:43.082Z

## Sources

- Parts directory files: 8
- Baseline readable file: `diagnostic-v2-readable.md`

## Totals

- Safe applied from readable parts: 0
- Already matching safe rows: 1860
- Rollback applied from baseline (risky rows): 0
- Risky source rows skipped: 56
- Missing label in parts: 444
- Missing misconception line in parts: 10
- Missing baseline fallback: 0

## Per Target

### C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json

- Safe applied: 0
- Already safe-match: 930
- Rollback applied: 0
- Risky rows skipped: 28
- Missing part label: 222
- Missing part misconception: 5
- Missing baseline fallback: 0

### C:\WProjects\DW\public\diagnostic_v2\mastery_data.json

- Safe applied: 0
- Already safe-match: 930
- Rollback applied: 0
- Risky rows skipped: 28
- Missing part label: 222
- Missing part misconception: 5
- Missing baseline fallback: 0

## Risky Examples

- q_cc_6g1_trapezoid_area_001 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 240 cm²
  - Live choice text: 40 cm²
- q_cc_6g1_trapezoid_area_001 [D] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 20 cm²
  - Live choice text: 30 cm²
- q_mst_7g3_004 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: Circle
  - Live choice text: Triangle
- q_mst_7g3_005 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: Square
  - Live choice text: Cross-section is always a circle
- q_mst_7g3_005 [D] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: Circle
  - Live choice text: Cross-section has no relation to the base
- q_mst_7g5_001 [B] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 65 degrees
  - Live choice text: 143 degrees
- q_mst_7g5_001 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 145 degrees
  - Live choice text: 37 degrees
- q_mst_7g5_001 [D] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 35 degrees
  - Live choice text: 63 degrees
- q_mst_7g5_002 [B] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 68 degrees
  - Live choice text: 22 degrees
- q_mst_7g5_002 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 224 degrees
  - Live choice text: 112 degrees
- q_mst_7g5_002 [D] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 56 degrees
  - Live choice text: 292 degrees
- q_mst_7g5_003 [A] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 15
  - Live choice text: 6
- q_mst_7g5_003 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 45
  - Live choice text: 7
- q_mst_7g5_003 [D] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 120
  - Live choice text: 24
- q_mst_7g5_004 [B] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 50
  - Live choice text: 54
- q_mst_7g5_004 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 130
  - Live choice text: 62
- q_mst_7g5_005 [A] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: Complementary angles
  - Live choice text: 50 degrees
- q_mst_7g5_005 [B] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: Vertical angles
  - Live choice text: 130 degrees
- q_mst_7g6_003 [A] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 64 square units
  - Live choice text: 36 square units
- q_mst_7g6_003 [C] (choice_text_mismatch) in `C:\WProjects\DW\Diagnostic V2\web\public\diagnostic_v2\mastery_data.json`
  - Source choice text: 16 square units
  - Live choice text: 72 square units

