"use client";
import Image from "next/image";
export default function StorySection() {
  return (
    <section className="bg-white text-secondary-db-100 px-100 mx-auto py-40">
      {/* Label */}

      <span className="inline-flex items-center text-sm font-medium bg-secondary-db-5 text-secondary-db-100 rounded-md mb-6">
        <Image
          src="/icons/avail.svg"
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
      <div className="space-y-6 text-secondary-db-80 text-xl font-regular leading-relaxed max-w-3xl">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem,
          ac euismod dolor volutpat sit amet. Vivamus sed semper felis. Interdum et malesuada
          fames ac ante ipsum primis in faucibus. Nam mauris turpis, fermentum non ultricies
          vitae, eleifend vitae neque. Aliquam erat volutpat. Vestibulum volutpat nisl sagittis
          turpis mattis tincidunt. Aliquam nunc nibh, finibus quis euismod vel, dictum sed lectus.
          Donec placerat lacinia urna.
        </p>

        <p>
          Quisque tincidunt mollis neque vitae dignissim. Suspendisse quis volutpat augue,
          at accumsan felis. Phasellus pulvinar pretium aliquet. Cras ultricies lobortis sem vel
          suscipit. Praesent a faucibus sem. Interdum et malesuada fames ac ante ipsum primis
          in faucibus. Ut pharetra gravida elit id convallis. Mauris vehicula augue at cursus
          convallis. Nam pharetra turpis sed accumsan finibus. Donec ac elit tellus. Sed lacus
          libero, blandit eget tortor sit amet, congue sodales elit. Ut sed eros molestie, tempus
          nulla vel, ultricies dolor. Sed sit amet enim sapien. Pellentesque venenatis vestibulum
          massa, non gravida nunc hendrerit quis.
        </p>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem,
          ac euismod dolor volutpat sit amet. Vivamus sed semper felis. Vestibulum volutpat nisl
          sagittis turpis mattis tincidunt. Aliquam nunc nibh, finibus quis euismod vel, dictum
          sed lectus. Donec placerat lacinia urna.
        </p>
      </div>
    </section>
  );
}
