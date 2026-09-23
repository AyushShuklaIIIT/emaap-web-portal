import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateInstrumentCategory,
  useUpdateInstrumentCategory,
} from "@/hooks/useMasterData";
import { useToast } from "@/hooks/use-toast";
import type {
  InstrumentAccuracyClass,
  InstrumentCategory,
  InstrumentCategoryPayload,
} from "@/services/admin/masterData.service";

interface InstrumentCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: InstrumentCategory | null;
}

interface FormState {
  category_code: string;
  category_name: string;
  accuracy_class: InstrumentAccuracyClass;
  oiml_standard_ref: string;
  verification_cycle_months: string;
}

const emptyForm: FormState = {
  category_code: "",
  category_name: "",
  accuracy_class: "CLASS_I",
  oiml_standard_ref: "",
  verification_cycle_months: "",
};

const accuracyClasses: { value: InstrumentAccuracyClass; label: string }[] = [
  { value: "CLASS_I", label: "Class I" },
  { value: "CLASS_II", label: "Class II" },
  { value: "CLASS_III", label: "Class III" },
  { value: "CLASS_IIII", label: "Class IIII" },
  { value: "CLASS_M1", label: "Class M1" },
  { value: "CLASS_XIII", label: "Class XIII" },
  { value: "CLASS_0_5", label: "Class 0.5" },
];

export default function InstrumentCategoryModal({
  isOpen,
  onClose,
  initialData,
}: InstrumentCategoryModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const createMutation = useCreateInstrumentCategory();
  const updateMutation = useUpdateInstrumentCategory();
  const isEditMode = Boolean(initialData);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;

    setForm(
      initialData
        ? {
            category_code: initialData.code,
            category_name: initialData.name,
            accuracy_class:
              initialData.accuracyClass as InstrumentAccuracyClass,
            oiml_standard_ref: initialData.oimlRef,
            verification_cycle_months: String(initialData.cycleMonths),
          }
        : emptyForm,
    );
    setErrors({});
  }, [isOpen, initialData]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const cycleMonths = Number(form.verification_cycle_months);

    if (!form.category_code.trim())
      nextErrors.category_code = "Category code is required.";
    if (!form.category_name.trim())
      nextErrors.category_name = "Category name is required.";
    if (!form.oiml_standard_ref.trim())
      nextErrors.oiml_standard_ref = "OIML reference is required.";
    if (!Number.isInteger(cycleMonths) || cycleMonths <= 0) {
      nextErrors.verification_cycle_months = "Enter a positive whole number.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: InstrumentCategoryPayload = {
      category_code: form.category_code.trim(),
      category_name: form.category_name.trim(),
      accuracy_class: form.accuracy_class,
      oiml_standard_ref: form.oiml_standard_ref.trim(),
      verification_cycle_months: cycleMonths,
    };

    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      toast({
        title: isEditMode
          ? "Instrument category updated"
          : "Instrument category created",
        description: "The category was saved successfully.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Unable to save instrument category",
        description: error?.response?.data?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSaving && onClose()}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Instrument Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            Maintain the instrument category used by verification workflows.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["category_code", "Category Code"],
                ["category_name", "Category Name"],
                ["oiml_standard_ref", "OIML Standard Ref"],
                ["verification_cycle_months", "Verification Cycle (Months)"],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                  {label}
                </label>
                <Input
                  type={
                    field === "verification_cycle_months" ? "number" : "text"
                  }
                  min={field === "verification_cycle_months" ? 1 : undefined}
                  value={form[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                  disabled={isSaving}
                />
                {errors[field] && (
                  <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
              Accuracy Class
            </label>
            <select
              value={form.accuracy_class}
              onChange={(event) =>
                updateField(
                  "accuracy_class",
                  event.target.value as InstrumentAccuracyClass,
                )
              }
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-[#E0E0E0] bg-white px-3 text-sm outline-none focus:border-[#0B3D91]"
            >
              {accuracyClasses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#FF6F00] text-white hover:bg-[#E66000]"
            >
              {isSaving ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
