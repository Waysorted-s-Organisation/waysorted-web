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
        Waysorted is a platform designed to speed up your workflow by making work
        tools easier to access. Instead of hunting and juggling multiple tools,
        creators get curated, integrated solution packs right inside their software,
        saving both time and effort.
      </>
    ),
  },
  {
    question: "How is Waysorted different from the other apps or plugins sources?",
    answer: (
      <>
        Unlike competitors that provide individual plugins, Waysorted offers bundled
        packs, a credit system, and an all-in-one marketplace, addressing
        compatibility issues, scattered support, performance strain, and multiple
        subscription costs.
      </>
    ),
  },
  {
    question: "What kind of tools are included?",
    answer: (
      <>
        Waysorted includes 4 initial plugins, some AI-powered, for simplifying
        complex design tasks, streamlining handoffs, integrating all in one, and
        delivering seamless UI experiences, with expansions planned.
      </>
    ),
  },
  {
    question: "Who creates these tools packs?",
    answer: (
      <>
        The core packs are created by a team of highly skilled designers &
        developers.
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
        Open our figma plugin and activate your bonus credits to start using our
        plugin and all the tools we provide. Some tools will consume credits, you
        can refill them by referring our plugin to your friends or by{" "}
        <Link href="#" className="text-primary-way-100 hover:underline">
          purchasing custom credits
        </Link>
        .
      </>
    ),
  },
];
