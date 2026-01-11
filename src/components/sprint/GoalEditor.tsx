import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Textarea, Card } from "../paper";

interface GoalEditorProps {
  onSave: (goal: {
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
  isLoading?: boolean;
}

const steps = [
  {
    key: "title",
    label: "Goal Title",
    question: "What's your goal?",
    placeholder: "e.g., Learn multiplication tables up to 12",
    helperText: "Give your goal a short, clear name",
  },
  {
    key: "specific",
    label: "Specific",
    question: "What exactly will you do?",
    placeholder: "e.g., I will practice multiplication tables 1-12 every day",
    helperText: "Be as clear as possible about what you want to achieve",
  },
  {
    key: "measurable",
    label: "Measurable",
    question: "How will you know you did it?",
    placeholder: "e.g., I can answer 50 multiplication problems in 5 minutes with 90% accuracy",
    helperText: "How will you measure your success?",
  },
  {
    key: "achievable",
    label: "Achievable",
    question: "Can you really do this in 2 weeks?",
    placeholder: "e.g., Yes, if I practice 15 minutes every day",
    helperText: "Is this goal realistic? What will help you achieve it?",
  },
  {
    key: "relevant",
    label: "Relevant",
    question: "Why does this matter to you?",
    placeholder: "e.g., It will help me solve math problems faster and feel more confident",
    helperText: "Why is this goal important?",
  },
  {
    key: "timeBound",
    label: "Time-bound",
    question: "When will you finish?",
    placeholder: "e.g., By the end of this 2-week sprint",
    helperText: "Set a deadline for your goal",
  },
];

/**
 * Step-by-step SMART goal editor wizard
 */
export function GoalEditor({
  onSave,
  onCancel,
  initialData,
  isLoading,
}: GoalEditorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    specific: initialData?.specific || "",
    measurable: initialData?.measurable || "",
    achievable: initialData?.achievable || "",
    relevant: initialData?.relevant || "",
    timeBound: initialData?.timeBound || "",
  });

  const currentStepData = steps[currentStep];
  const currentValue = formData[currentStepData.key as keyof typeof formData];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSave(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const handleChange = (value: string) => {
    setFormData({
      ...formData,
      [currentStepData.key]: value,
    });
  };

  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentValue.trim().length > 0;

  return (
    <Card className="max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-6">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              index <= currentStep ? "bg-primary-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl font-bold text-primary-600">
          {currentStepData.label.charAt(0)}
        </span>
        <span className="text-sm text-gray-500">
          {currentStepData.label} ({currentStep + 1} of {steps.length})
        </span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {currentStepData.question}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {currentStepData.helperText}
          </p>

          {currentStep === 0 ? (
            <Input
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={currentStepData.placeholder}
              autoFocus
            />
          ) : (
            <Textarea
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={currentStepData.placeholder}
              className="min-h-[100px]"
              autoFocus
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={handleBack} disabled={isLoading}>
          {currentStep === 0 ? "Cancel" : "Back"}
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          isLoading={isLoading && isLastStep}
          className="flex-1"
        >
          {isLastStep ? "Save Goal 🎯" : "Next"}
        </Button>
      </div>

      {/* Preview (on last step) */}
      {isLastStep && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <h3 className="font-medium text-gray-900 mb-2">Goal Preview</h3>
          <p className="font-semibold text-primary-600 mb-2">{formData.title}</p>
          <div className="text-sm space-y-1 text-gray-600">
            <p><strong>S:</strong> {formData.specific}</p>
            <p><strong>M:</strong> {formData.measurable}</p>
            <p><strong>A:</strong> {formData.achievable}</p>
            <p><strong>R:</strong> {formData.relevant}</p>
            <p><strong>T:</strong> {formData.timeBound}</p>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

export default GoalEditor;
