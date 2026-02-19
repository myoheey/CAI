export type Gender = "F" | "M" | "N" | "U";
export type AgeBand = "10s" | "20s" | "30s" | "40s" | "50s" | "60s+";

export interface IntakeDraft {
  person: {
    gender: Gender;
    age_band: AgeBand;
  };
  context: {
    industry: string;
    role: string;
    career_years: number;
    current_concerns?: string;
    job_satisfaction?: number;
  };
  relationship_map: {
    current_level: 1 | 2 | 3;
    desired_level?: 1 | 2 | 3;
    notes?: string;
  };
  assessment_meta: {
    test_version: "anchor_v1.2";
    completed_at?: string;
    locale: "ko-KR";
  };
}

export type AnswersMap = Record<string, number>;

export interface QuestionBankItem {
  id: string;
  text: string;
  anchor_code: "TF" | "GM" | "AU" | "SE" | "EC" | "SV" | "CH" | "LS";
  reverse: boolean;
}

export interface QuestionBank {
  version: string;
  scale: {
    min: number;
    max: number;
    labels: string[];
  };
  items: QuestionBankItem[];
}
