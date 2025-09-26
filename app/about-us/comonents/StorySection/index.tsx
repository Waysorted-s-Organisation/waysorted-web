"use client";
import Image from "next/image";
export default function StorySection() {
  return (
    <section className="bg-white text-secondary-db-100 px-85 mx-auto py-40">
      {/* Label */}

      <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-6">
        <Image
          src="/icons/story.svg"
          alt="Our Story"
          width={30}
          height={30}
          className="block p-1"
        />
        <span className="pl-1 pr-2 py-1 text-secondary-db-100">Our Story</span>
      </span>



      {/* Heading */}
      <h2 className="text-3xl md:text-4xl font-bold mb-3">
        This is what we believe.
      </h2>

      {/* Paragraphs */}
      <div className="space-y-6 text-secondary-db-80 text-xl font-regular leading-relaxed max-w-4xl">
        <p>
          At Waysorted, our journey began with a simple vision: to untangle the chaos of creative workflows. As designers ourselves, we have known the struggle and frustration born out of ineffective plugins or workflows, overwhelming project deadlines and scattered drives. When our vision of Waysorted was in its cocoon, we wanted to create something not just as a tool but rather, a creative companion&mdash;a space where every insight, idea, resource and project align seamlessly, so you can design without distractions.
        </p>

        <p>
          Our story isn&apos;t just about us. It&apos;s a confluence of ideas, struggles and ideals. An amalgamation of our visions and our team&apos;s hard-work. Along this voyage, we have spoken with countless designers, freelancers, creators and teams who have faced similar struggles &mdash; lost time, fractured focus and disorganized workspaces. Each struggle was translated to a more efficient plugin. This has been the foundation stone of WaySorted&apos;s evolution. Your creativity deserves solutions and hence, Waysorted exists.
        </p>

        <p>
          But our belief goes beyond tools. Each plugin reflects a promise: clarity over clutter, speed over struggle, creativity over chaos. We&apos;re not just here to organize workflows, we&apos;re here to empower designers to design boldly, with confidence and calm. Our commitment is to keep listening, keep simplifying, and keep innovating so that every designer&apos;s journey is smoother, sharper, and sorted.
        </p>

        <p>
          Because when the workflow gets out of your way, the imagination finally takes the lead.
        </p>

        <p>
          That&apos;s design at its zenith, that&apos;s Waysorted.
        </p>
      </div>
    </section>
  );
}
