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
  useCreateFeeSchedule,
  useInstrumentCategoryOptions,
  useStates,
  useUpdateFeeSchedule,
} from "@/hooks/useMasterData";

import { useToast } from "@/hooks/use-toast";

import type {
  FeeBasis,
  FeeSchedule,
  FeeSchedulePayload,
} from "@/services/admin/masterData.service";

interface FeeBracketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: FeeSchedule | null;
}

interface FormState {
  state_id: string;
  category_id: string;
  min_value: string;
  max_value: string;
  unit: string;
  fee_amount: string;
  fee_basis: FeeBasis;
  condition: string;
  additional_fee: string;
  additional_unit: string;
  maximum_fee: string;
}

const emptyForm: FormState = {
  state_id: "",
  category_id: "",
  min_value: "",
  max_value: "",
  unit: "",
  fee_amount: "",
  fee_basis: "PER_PIECE",
  condition: "",
  additional_fee: "",
  additional_unit: "",
  maximum_fee: "",
};

const toNullable = (value: string) => {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
};

const getFormFromSchedule = (data: FeeSchedule): FormState => ({
  state_id: data.stateId,
  category_id: data.categoryId,
  min_value: data.minValue ?? "",
  max_value: data.maxValue ?? "",
  unit: data.unit,
  fee_amount: data.feeAmount,
  fee_basis: data.feeBasis,
  condition: data.condition ?? "",
  additional_fee: data.additionalFee ?? "",
  additional_unit: data.additionalUnit ?? "",
  maximum_fee: data.maximumFee ?? "",
});

export default function FeeBracketModal({
  isOpen,
  onClose,
  initialData,
}: FeeBracketModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { data: states = [], isLoading: statesLoading } = useStates();
  const { data: categories = [], isLoading: categoriesLoading } =
    useInstrumentCategoryOptions();
  const createMutation = useCreateFeeSchedule();
  const updateMutation = useUpdateFeeSchedule();
  const isEditMode = Boolean(initialData);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      setForm(getFormFromSchedule(initialData));
    } else {
      setForm(emptyForm);
    }

    setErrors({});
  }, [isOpen, initialData]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.state_id) {
      nextErrors.state_id = "State is required.";
    }

    if (!form.category_id) {
      nextErrors.category_id = "Category is required.";
    }

    if (!form.unit.trim()) {
      nextErrors.unit = "Unit is required.";
    }

    if (!form.fee_amount.trim()) {
      nextErrors.fee_amount = "Fee amount is required.";
    }

    if (
      form.min_value &&
      form.max_value &&
      Number(form.min_value) > Number(form.max_value)
    ) {
      nextErrors.max_value =
        "Maximum value must be greater than or equal to minimum value.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload: FeeSchedulePayload = {
      state_id: form.state_id,
      category_id: form.category_id,
      min_value: toNullable(form.min_value),
      max_value: toNullable(form.max_value),
      unit: form.unit.trim(),
      fee_amount: form.fee_amount.trim(),
      fee_basis: form.fee_basis,
      condition: toNullable(form.condition),
      additional_fee: toNullable(form.additional_fee),
      additional_unit: toNullable(form.additional_unit),
      maximum_fee: toNullable(form.maximum_fee),
    };

    try {
      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: payload,
        });

        toast({
          title: "Fee bracket updated",
          description: "The fee bracket was updated successfully.",
        });
      } else {
        await createMutation.mutateAsync(payload);

        toast({
          title: "Fee bracket created",
          description: "The new fee bracket was created successfully.",
        });
      }

      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Something went wrong while saving the fee bracket.";

      toast({
        title: "Unable to save fee bracket",
        description: message,
        variant: "destructive",
      });
    }
  };

  const loadingOptions = statesLoading || categoriesLoading;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Fee Bracket" : "Add New Fee Bracket"}
          </DialogTitle>

          <DialogDescription>
            {isEditMode
              ? "Update the existing statutory verification fee rule."
              : "Create a new statutory verification fee rule."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                State
              </label>

              <select
                value={form.state_id}
                onChange={(event) =>
                  updateField("state_id", event.target.value)
                }
                disabled={loadingOptions || isSaving}
                className="h-10 w-full rounded-md border border-[#E0E0E0] bg-white px-3 text-sm outline-none focus:border-[#0B3D91]"
              >
                <option value="">Select state</option>

                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name} ({state.code})
                  </option>
                ))}
              </select>

              {errors.state_id && (
                <p className="mt-1 text-xs text-red-600">{errors.state_id}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Instrument Category
              </label>

              <select
                value={form.category_id}
                onChange={(event) =>
                  updateField("category_id", event.target.value)
                }
                disabled={loadingOptions || isSaving}
                className="h-10 w-full rounded-md border border-[#E0E0E0] bg-white px-3 text-sm outline-none focus:border-[#0B3D91]"
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </option>
                ))}
              </select>

              {errors.category_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.category_id}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Min Value
              </label>

              <Input
                type="number"
                min="0"
                step="0.001"
                value={form.min_value}
                onChange={(event) =>
                  updateField("min_value", event.target.value)
                }
                disabled={isSaving}
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Max Value
              </label>

              <Input
                type="number"
                min="0"
                step="0.001"
                value={form.max_value}
                onChange={(event) =>
                  updateField("max_value", event.target.value)
                }
                disabled={isSaving}
                placeholder="100"
              />

              {errors.max_value && (
                <p className="mt-1 text-xs text-red-600">{errors.max_value}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Unit
              </label>

              <Input
                value={form.unit}
                onChange={(event) => updateField("unit", event.target.value)}
                disabled={isSaving}
                placeholder="kg"
              />

              {errors.unit && (
                <p className="mt-1 text-xs text-red-600">{errors.unit}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Fee Amount
              </label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.fee_amount}
                onChange={(event) =>
                  updateField("fee_amount", event.target.value)
                }
                disabled={isSaving}
                placeholder="500"
              />

              {errors.fee_amount && (
                <p className="mt-1 text-xs text-red-600">{errors.fee_amount}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Fee Basis
              </label>

              <select
                value={form.fee_basis}
                onChange={(event) =>
                  updateField("fee_basis", event.target.value as FeeBasis)
                }
                disabled={isSaving}
                className="h-10 w-full rounded-md border border-[#E0E0E0] bg-white px-3 text-sm outline-none focus:border-[#0B3D91]"
              >
                <option value="PER_PIECE">Per Piece</option>

                <option value="PER_METRE">Per Metre</option>

                <option value="PER_LITRE">Per Litre</option>

                <option value="FIXED">Fixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
              Condition
            </label>

            <Input
              value={form.condition}
              onChange={(event) => updateField("condition", event.target.value)}
              disabled={isSaving}
              placeholder="Optional condition or technical specification"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Additional Fee
              </label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.additional_fee}
                onChange={(event) =>
                  updateField("additional_fee", event.target.value)
                }
                disabled={isSaving}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Additional Unit
              </label>

              <Input
                type="number"
                min="0"
                step="0.001"
                value={form.additional_unit}
                onChange={(event) =>
                  updateField("additional_unit", event.target.value)
                }
                disabled={isSaving}
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                Maximum Fee
              </label>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.maximum_fee}
                onChange={(event) =>
                  updateField("maximum_fee", event.target.value)
                }
                disabled={isSaving}
                placeholder="Optional"
              />
            </div>
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
              disabled={isSaving || loadingOptions}
              className="bg-[#0B3D91] text-white hover:bg-[#093475]"
            >
              {isSaving
                ? "Saving..."
                : isEditMode
                  ? "Update Fee Bracket"
                  : "Create Fee Bracket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
