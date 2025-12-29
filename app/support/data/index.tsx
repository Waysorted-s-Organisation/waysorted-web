import { ReactNode } from "react";
import Link from "next/link";

export interface FAQItem {
  question: string;
  answer: ReactNode; // 👈 supports JSX and text
}

export const faqData: FAQItem[] = [
  {
    question: "What is Waysorted?",
    answer: (
      <>
        Waysorted unifies essential design tools into one place, so you spend less
        time switching between plugins and tabs. By reducing tool juggling, it helps
        teams work faster, stay focused, and avoid unnecessary costs from managing
        multiple tools.
      </>
    ),
  },
  {
    question: "How is Waysorted different from the other apps or plugins sources?",
    answer: (
      <>
        Unlike individual plugins or scattered tool sources, Waysorted brings
        essential tools together in one unified suite. This reduces compatibility
        issues, performance strain, scattered support, and the cost of managing
        multiple subscriptions, so teams work more smoothly and efficiently.
      </>
    ),
  },
  {
    question: "What kind of tools are included?",
    answer: (
      <>
        Waysorted currently includes four core tools for color management, PDF
        export, file importing, and unit conversion. More tools are planned,
        including Way AI and additional utilities designed to further simplify and
        streamline creative workflows.
      </>
    ),
  },
  {
    question: "Who creates these tools packs?",
    answer: (
      <>
        Waysorted currently includes four core tools for color management, PDF export,
        file importing, and unit conversion. More tools are planned,
        including Way AI and additional utilities designed to further
        simplify and streamline creative workflows.
      </>
    ),
  },
  {
    question: "Can I suggest tools to be included?",
    answer: (
      <>
        Yes, through the{" "}
        <Link href="/support/request" className="text-primary-way-100 hover:underline">
          Request-a-Feature
        </Link>{" "}
        tab which encourages user input and suggestions.
      </>
    ),
  },
  {
    question: "Will Waysorted slow down my Figma?",
    answer: (
      <>
        No, Our unified design minimizes system strain and performance issues rather
        improves accessibility that lacks with multiple disjointed plugins.
      </>
    ),
  },
  {
    question: "Is Waysorted safe and secure?",
    answer: (
      <>
        Yes, we emphasize secure tool bundling and usability within Figma&apos;s
        ecosystem while complying all certificates as an integrated platform.
      </>
    ),
  },
  {
    question: "What if I face issues while using Waysorted?",
    answer: (
      <>
        Reach out to{" "}
        <Link href="/support" className="text-primary-way-100 hover:underline">
          support
        </Link>
        , the platform provides consistent, up-to-date assistance to resolve any
        concerns. Moreover, use the{" "}
        <Link href="/report" className="text-primary-way-100 hover:underline">
          Report-a-Bug
        </Link>{" "}
        tab for reporting issues.
      </>
    ),
  },
  {
    question: "How do I get started?",
    answer: (
      <>
        Open the Waysorted Figma plugin to start using the tools available during
        the beta. All current features are accessible for testing and feedback. A
        credit-based system for premium features will be introduced in a future
        release.
      </>
    ),
  },
];
