"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  validateBillingDetails,
  postalRuleFor,
  type BillingDetailsField,
} from "@/lib/billing/billing-details";

export type BillingDetails = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  country: string;
  city: string;
  zipCode: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: BillingDetails) => Promise<void>;
  initialData?: BillingDetails | null;
};

export default function BillingDetailsModal({ isOpen, onClose, onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState<BillingDetails>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    country: initialData?.country || "",
    city: initialData?.city || "",
    zipCode: initialData?.zipCode || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Per-field, so the customer is told WHICH entry is wrong rather than being
  // handed one message for a seven-field form.
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BillingDetailsField, string>>>({});

  useEffect(() => {
    if (!initialData) return;
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // The same validator the API runs, so the form and the server can never
    // disagree about what is acceptable. The browser `pattern` attributes only
    // ever constrained the character class - "hskdh" is made of letters, so it
    // passed as a city, and "jshdh" passed as an Indian PIN code.
    const problems = validateBillingDetails(formData);
    if (problems.length) {
      const next: Partial<Record<BillingDetailsField, string>> = {};
      for (const problem of problems) next[problem.field] = problem.message;
      setFieldErrors(next);
      setError(null);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save billing details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-db-100/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-medium text-secondary-db-100">Billing Information</h2>
          <button onClick={onClose} className="text-secondary-db-80 bg-primary-way-5 rounded-md p-1 cursor-pointer">
            <Image
              src="/icons/close-1.svg"
              alt="Close"
              width={12}
              height={12}
            />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          
            <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
  <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">
    Customer first name*
  </label>

  <input
    required
    type="text"
    placeholder="Enter first name"
    value={formData.firstName}
    pattern="^[A-Za-z\s\-']+$"
    title="Only letters, spaces, hyphens, and apostrophes are allowed"
    onChange={(e) =>
      setFormData({ ...formData, firstName: e.target.value })
    }
    className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
  />
</div>
            <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
              <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">Customer last name*</label>
              <input
                required
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                pattern="^[A-Za-z\s\-']+$"
                title="Only letters, spaces, hyphens, and apostrophes are allowed"
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
              />
            </div>
          

          <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
            <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">Email*</label>
            <input
              required
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
            />
          </div>

          <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
            <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">Address*</label>
            <input
              required
              type="text"
              placeholder="Enter street address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
            />
          </div>

          
            <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
              <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">Country*</label>
              <input
                required
                type="text"
                placeholder="Enter country"
                value={formData.country}
                pattern="^[A-Za-z\s\-']+$"
                title="Only letters, spaces, hyphens, and apostrophes are allowed"
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
              />
            </div>
            <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
              <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">City*</label>
              <input
                required
                type="text"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  setFieldErrors((prev) => ({ ...prev, city: undefined }));
                }}
                className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
              />
            </div>
            {fieldErrors.city ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>
            ) : null}
          

          <div className="relative rounded-lg border-2 border-transparent focus-within:border-primary-way-100 bg-primary-way-5 px-3.5 py-2 transition-all">
            <label className="block text-sm font-regular text-secondary-db-100 uppercase tracking-tight">Zip Code*</label>
            <input
              required
              type="text"
              placeholder={
                postalRuleFor(formData.country)
                  ? `Enter ${postalRuleFor(formData.country)!.hint}`
                  : "Enter zip code"
              }
              value={formData.zipCode}
              onChange={(e) => {
                setFormData({ ...formData, zipCode: e.target.value });
                setFieldErrors((prev) => ({ ...prev, zipCode: undefined }));
              }}
              className="mt-0.5 block w-full border-none bg-transparent p-0 text-xs font-regular text-secondary-db-50 placeholder-secondary-db-40 outline-none focus:ring-0"
            />
          </div>
          {fieldErrors.zipCode ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.zipCode}</p>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="pt-2">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full rounded-xl bg-primary-way-100 px-5 py-3.5 text-sm font-regular text-white shadow-lg shadow-primary-way-50/20 transition-all hover:bg-primary-way-60 hover:shadow-primary-way-50/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? "Saving..." : "Continue to Checkout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
