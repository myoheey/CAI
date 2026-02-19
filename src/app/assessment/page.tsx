import AssessmentWizard from "@/components/AssessmentWizard";
import { getQuestionItems } from "@/lib/questionBank";

export default async function AssessmentPage() {
  const items = await getQuestionItems();

  return <AssessmentWizard items={items} />;
}
