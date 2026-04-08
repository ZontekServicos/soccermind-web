/**
 * Position translation utility.
 *
 * Maps Sportmonks English position names (full names + short codes)
 * to Portuguese labels used throughout the UI.
 *
 * Internal filter values ALWAYS remain in English (as stored in the DB).
 * Only use this for display purposes.
 */

const PT_LABELS: Record<string, string> = {
  // Full names from Sportmonks
  GOALKEEPER:           "Goleiro",
  "CENTRE BACK":        "Zagueiro",
  DEFENDER:             "Defensor",
  "LEFT BACK":          "Lateral Esq.",
  "RIGHT BACK":         "Lateral Dir.",
  "LEFT WING BACK":     "Ala Esquerdo",
  "RIGHT WING BACK":    "Ala Direito",
  WINGBACK:             "Ala",
  "DEFENSIVE MIDFIELD": "Volante",
  "CENTRAL MIDFIELD":   "Meia Central",
  MIDFIELD:             "Meia",
  "LEFT MIDFIELD":      "Meia Esq.",
  "RIGHT MIDFIELD":     "Meia Dir.",
  "ATTACKING MIDFIELD": "Meia Atacante",
  "LEFT WINGER":        "Ponta Esq.",
  "RIGHT WINGER":       "Ponta Dir.",
  WINGER:               "Ponta",
  ATTACKER:             "Atacante",
  FORWARD:              "Atacante",
  STRIKER:              "Centroavante",
  "CENTRE FORWARD":     "Centroavante",
  "SECOND STRIKER":     "Segundo Atacante",

  // Short codes (FIFA / mock data)
  GK:  "Goleiro",
  SW:  "Libero",
  CB:  "Zagueiro",
  LB:  "Lateral Esq.",
  RB:  "Lateral Dir.",
  LWB: "Ala Esquerdo",
  RWB: "Ala Direito",
  CDM: "Volante",
  DM:  "Volante",
  CM:  "Meia Central",
  LM:  "Meia Esq.",
  RM:  "Meia Dir.",
  CAM: "Meia Atacante",
  AM:  "Meia Atacante",
  LW:  "Ponta Esq.",
  RW:  "Ponta Dir.",
  SS:  "Segundo Atacante",
  CF:  "Segundo Atacante",
  ST:  "Centroavante",
  FW:  "Atacante",
};

/**
 * Returns the Portuguese display label for a position string.
 * Falls back to the original string if no mapping is found.
 */
export function positionLabel(pos: string): string {
  if (!pos || pos === "N/A") return pos;
  return PT_LABELS[pos.trim().toUpperCase()] ?? pos;
}
