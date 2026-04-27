import type { StatutoryRule } from "../../types";

export const initialStatutoryRules: StatutoryRule[] = [
  {
    id: "rule-paye",
    code: "PAYE",
    name: "PAYE brackets placeholder",
    formulaType: "bracket",
    effectiveFrom: "2026-01-01",
    notes:
      "Sample configurable PAYE brackets for MVP demonstrations. Replace with TRA-reviewed rules before production submission.",
    active: true,
    brackets: [
      { upTo: 270000, rate: 0 },
      { upTo: 520000, rate: 0.08, subtract: 21600 },
      { upTo: 760000, rate: 0.2, subtract: 84000 },
      { upTo: 1000000, rate: 0.25, subtract: 122000 },
      { upTo: null, rate: 0.3, subtract: 172000 },
    ],
  },
  {
    id: "rule-nssf",
    code: "NSSF",
    name: "NSSF total contribution",
    formulaType: "percentage",
    rate: 0.2,
    employeeShare: 0.1,
    employerShare: 0.1,
    effectiveFrom: "2026-01-01",
    notes:
      "Sample/current configurable value based on public guidance: total 20% joint contribution; employee share must not exceed 10%.",
    active: true,
  },
  {
    id: "rule-wcf",
    code: "WCF",
    name: "Workers Compensation Fund",
    formulaType: "percentage",
    rate: 0.005,
    effectiveFrom: "2026-01-01",
    notes:
      "Sample/current configurable value based on WCF public portal guidance: 0.5% of monthly gross earnings.",
    active: true,
  },
  {
    id: "rule-sdl",
    code: "SDL",
    name: "Skills and Development Levy",
    formulaType: "threshold",
    rate: 0.035,
    threshold: 10,
    effectiveFrom: "2026-01-01",
    notes:
      "Sample/current configurable value based on TRA guidance: 3.5% for employers with 10 or more employees.",
    active: true,
  },
];

export function getActiveRule(rules: StatutoryRule[], code: string) {
  return rules.find((rule) => rule.code === code && rule.active);
}
