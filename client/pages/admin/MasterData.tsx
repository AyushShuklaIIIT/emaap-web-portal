import { useEffect, useState } from "react";

import { ChevronLeft, ChevronRight, Clock, Search } from "lucide-react";

import { DashboardLayout } from "@/components/emaap/DashboardLayout";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useFeeSchedules,
  useInstrumentCategories,
} from "@/hooks/useMasterData";

import type {
  FeeSchedule,
  InstrumentCategory,
} from "@/services/admin/masterData.service";

import FeeBracketModal from "./FeeBracket";
import InstrumentCategoryModal from "./InstrumentCategoryModal";

const tabs = ["Statutory Fee Schedules", "Instrument Categories"];

const PAGE_SIZE = 10;

export default function MasterData() {
  const [activeTab, setActiveTab] = useState(0);
  const [feeQuery, setFeeQuery] = useState("");
  const [feeSearch, setFeeSearch] = useState("");
  const [feePage, setFeePage] = useState(1);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "GATC">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FeeSchedule | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<InstrumentCategory | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFeeSearch(feeQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [feeQuery]);

  useEffect(() => {
    setFeePage(1);
  }, [feeSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCategorySearch(categoryQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [categoryQuery]);

  useEffect(() => {
    setCategoryPage(1);
  }, [categorySearch]);

  useEffect(() => {
    setCategoryPage(1);
  }, [categoryFilter]);

  const {
    data: feeData,
    isLoading: isFeeLoading,
    isError: isFeeError,
  } = useFeeSchedules(feePage, PAGE_SIZE, feeSearch);

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useInstrumentCategories(
    categoryPage,
    PAGE_SIZE,
    categorySearch,
    categoryFilter,
  );

  const feeSchedules = feeData?.data ?? [];

  const feePagination = feeData?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  const categories = categoryData?.data ?? [];

  const categoryPagination = categoryData?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  const feeStartItem =
    feePagination.total === 0
      ? 0
      : (feePagination.page - 1) * feePagination.limit + 1;

  const feeEndItem = Math.min(
    feePagination.page * feePagination.limit,
    feePagination.total,
  );

  const categoryStartItem =
    categoryPagination.total === 0
      ? 0
      : (categoryPagination.page - 1) * categoryPagination.limit + 1;

  const categoryEndItem = Math.min(
    categoryPagination.page * categoryPagination.limit,
    categoryPagination.total,
  );

  const openCreateModal = () => {
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: FeeSchedule) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRule(null);
  };

  const openCreateCategoryModal = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: InstrumentCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  const feeCanGoPrevious = feePagination.page > 1;

  const feeCanGoNext = feePagination.page < feePagination.totalPages;

  const categoryCanGoPrevious = categoryPagination.page > 1;

  const categoryCanGoNext =
    categoryPagination.page < categoryPagination.totalPages;

  const isCurrentTabLoading =
    activeTab === 0 ? isFeeLoading : isCategoryLoading;

  const isCurrentTabError = activeTab === 0 ? isFeeError : isCategoryError;

  const hasCurrentTabData =
    activeTab === 0 ? Boolean(feeData) : Boolean(categoryData);

  if (isCurrentTabLoading && !hasCurrentTabData) {
    return (
      <DashboardLayout role="admin">
        <section className="mx-auto max-w-335 rounded-xl border border-[#E0E0E0] bg-white shadow-card">
          <div className="p-8 text-center text-sm text-[#5C5C70]">
            Loading master data...
          </div>
        </section>
      </DashboardLayout>
    );
  }

  if (isCurrentTabError && !hasCurrentTabData) {
    return (
      <DashboardLayout role="admin">
        <section className="mx-auto max-w-335 rounded-xl border border-[#E0E0E0] bg-white shadow-card">
          <div className="p-8 text-center">
            <p className="font-semibold text-[#1A1A2E]">
              Failed to load master data.
            </p>

            <p className="mt-2 text-sm text-[#5C5C70]">
              Please try again later.
            </p>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <section className="mx-auto max-w-335 overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-card">
        <div className="px-4 pb-0 pt-6 sm:px-7 sm:pt-7">
          <h1 className="text-xl font-bold tracking-tight text-[#1A1A2E] sm:text-2xl">
            System Configuration &amp; Master Data
          </h1>

          <div className="mt-6 flex gap-6 overflow-x-auto border-b border-[#E8E9EC]">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm ${
                  index === activeTab
                    ? "border-[#0B3D91] font-bold text-[#0B3D91]"
                    : "border-transparent font-medium text-[#5C5C70] hover:border-[#CBD5E1] hover:text-[#0B3D91]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 0 && (
          <div className="px-4 pb-7 pt-7 sm:px-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-lg font-bold text-[#0B3D91]">
                Central Notified Verification Fees
              </h2>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:w-67.5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />

                  <Input
                    value={feeQuery}
                    onChange={(event) => setFeeQuery(event.target.value)}
                    placeholder="Search by Category or Code..."
                    className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
                  />
                </div>

                <Button
                  onClick={openCreateModal}
                  className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]"
                >
                  + Add New Fee Bracket
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
              <div className="overflow-x-auto">
                <Table className="mobile-card-table min-w-280">
                  <TableHeader>
                    <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                      <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Ref Code &amp; Instrument Category
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Technical Specification
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Prescribed Verification Fee
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Revenue Split Rule
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Status
                      </TableHead>

                      <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {feeSchedules.map((schedule) => (
                      <TableRow
                        key={schedule.id}
                        className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                      >
                        <TableCell className="px-5 py-5 align-top">
                          <p className="font-semibold text-[#1A1A2E]">
                            {schedule.code}
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#0B3D91]">
                            {schedule.category}
                          </p>

                          <p className="mt-1 text-xs text-[#5C5C70]">
                            {schedule.stateName} ({schedule.stateCode})
                          </p>
                        </TableCell>

                        <TableCell className="max-w-57.5 py-5 align-top text-sm leading-5 text-[#1A1A2E]">
                          {schedule.specification}
                        </TableCell>

                        <TableCell className="py-5 align-top font-bold text-[#1A1A2E]">
                          {schedule.fee}
                        </TableCell>

                        <TableCell className="py-5 align-top text-sm text-[#1A1A2E]">
                          {schedule.split}
                        </TableCell>

                        <TableCell className="py-5 align-top">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                              schedule.tone === "active"
                                ? "bg-[#1E8E3E] text-white"
                                : "bg-[#E0E0E0] text-[#1A1A2E]"
                            }`}
                          >
                            {schedule.status}
                          </span>

                          {schedule.statusNote && (
                            <p className="mt-2 whitespace-nowrap text-xs text-[#5C5C70]">
                              {schedule.statusNote}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="pr-5 py-5 align-top">
                          <Button
                            variant="ghost"
                            disabled={schedule.tone === "deprecated"}
                            onClick={() => openEditModal(schedule)}
                            className={`h-9 whitespace-nowrap px-2 text-xs font-semibold ${
                              schedule.tone === "deprecated"
                                ? "text-[#9A9AA3]"
                                : "text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                            }`}
                          >
                            {schedule.tone === "deprecated"
                              ? "Locked"
                              : "Edit/View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {feeSchedules.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-12 text-center text-sm text-[#5C5C70]"
                        >
                          {feeSearch
                            ? "No fee schedules match your search."
                            : "No fee schedules found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[#5C5C70]">
                    Showing {feeStartItem} to {feeEndItem} of{" "}
                    {feePagination.total} registered fee schedules.
                  </p>

                  {feePagination.totalPages > 0 && (
                    <p className="mt-1 text-xs text-[#8A8A98]">
                      Page {feePagination.page} of {feePagination.totalPages}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!feeCanGoPrevious || isFeeLoading}
                    onClick={() =>
                      setFeePage((current) => Math.max(current - 1, 1))
                    }
                    className="h-9 gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!feeCanGoNext || isFeeLoading}
                    onClick={() =>
                      setFeePage((current) =>
                        Math.min(current + 1, feePagination.totalPages),
                      )
                    }
                    className="h-9 gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <span className="flex items-center gap-1.5 text-xs italic text-[#5C5C70]">
                  <Clock className="h-3.5 w-3.5" />
                  Last system-wide update: 01 April 2026 by SuperAdmin
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="px-4 pb-7 pt-7 sm:px-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-lg font-bold text-[#0B3D91]">
                Instrument Categories
              </h2>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:w-67.5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A98]" />

                  <Input
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder="Search by Category or Code..."
                    className="h-10 rounded-lg border-[#E0E0E0] pl-9 text-sm shadow-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15"
                  />
                </div>

                <Select
                  value={categoryFilter}
                  onValueChange={(value: "ALL" | "GATC") =>
                    setCategoryFilter(value)
                  }
                >
                  <SelectTrigger className="h-10 sm:w-44">
                    <SelectValue placeholder="Filter categories" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ALL">All Instruments</SelectItem>
                    <SelectItem value="GATC">GATC Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={openCreateCategoryModal}
                  className="h-10 w-fit rounded-lg bg-[#FF6F00] px-4 font-bold text-white shadow-none hover:bg-[#E66000]"
                >
                  + Add New Category
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-[#E0E0E0]">
              <div className="overflow-x-auto">
                <Table className="mobile-card-table min-w-225">
                  <TableHeader>
                    <TableRow className="border-b border-[#E0E0E0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
                      <TableHead className="h-12 px-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Category Code
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Category Name
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Accuracy Class
                      </TableHead>

                      <TableHead className="h-12 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        OIML Standard Ref
                      </TableHead>

                      <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Verification Cycle
                      </TableHead>

                      <TableHead className="h-12 pr-5 text-[11px] font-bold uppercase tracking-wide text-[#5C5C70]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {categories.map((category) => (
                      <TableRow
                        key={category.id}
                        className="border-b border-[#E8E9EC] hover:bg-[#FAFBFC]"
                      >
                        <TableCell className="px-5 py-5 align-top">
                          <p className="font-semibold text-[#1A1A2E]">
                            {category.code}
                          </p>
                        </TableCell>

                        <TableCell className="py-5 align-top">
                          <p className="font-semibold text-[#0B3D91]">
                            {category.name}
                          </p>
                        </TableCell>

                        <TableCell className="py-5 align-top text-sm text-[#1A1A2E]">
                          {category.accuracyClass}
                        </TableCell>

                        <TableCell className="py-5 align-top text-sm text-[#1A1A2E]">
                          {category.oimlRef}
                        </TableCell>

                        <TableCell className="pr-5 py-5 align-top text-sm text-[#1A1A2E]">
                          {category.cycleMonths} months
                        </TableCell>

                        <TableCell className="pr-5 py-5 align-top">
                          <Button
                            variant="ghost"
                            onClick={() => openEditCategoryModal(category)}
                            className="h-9 whitespace-nowrap px-2 text-xs font-semibold text-[#0B3D91] hover:bg-primary/5 hover:text-[#0B3D91]"
                          >
                            Edit/View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {categories.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-12 text-center text-sm text-[#5C5C70]"
                        >
                          {categorySearch
                            ? "No instrument categories match your search."
                            : "No instrument categories found."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4 border-t border-[#E8E9EC] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[#5C5C70]">
                    Showing {categoryStartItem} to {categoryEndItem} of{" "}
                    {categoryPagination.total} instrument categories.
                  </p>

                  {categoryPagination.totalPages > 0 && (
                    <p className="mt-1 text-xs text-[#8A8A98]">
                      Page {categoryPagination.page} of{" "}
                      {categoryPagination.totalPages}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!categoryCanGoPrevious || isCategoryLoading}
                    onClick={() =>
                      setCategoryPage((current) => Math.max(current - 1, 1))
                    }
                    className="h-9 gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!categoryCanGoNext || isCategoryLoading}
                    onClick={() =>
                      setCategoryPage((current) =>
                        Math.min(current + 1, categoryPagination.totalPages),
                      )
                    }
                    className="h-9 gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <FeeBracketModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={selectedRule}
      />

      <InstrumentCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        initialData={selectedCategory}
      />
    </DashboardLayout>
  );
}
