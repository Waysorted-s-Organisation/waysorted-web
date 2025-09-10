import Image from "next/image";
export default function AccountOverview() {
    return (
        <>
            <article className="prose max-w-none">
                <main className="flex">
                    <div className="space-y-6 max-w-3xl">
                        <p className="text-gray-700 leading-relaxed"> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nam mauris turpis, fermentum non ultricies vitae, eleifend vitae neque. Aliquam erat volutpat. Vestibulum volutpat nisl sagittis turpis mattis tincidunt. Aliquam nunc nibh, finibus quis euismod vel, dictum sed lectus. Donec placerat lacinia urna. </p>
                        <div className="bg-primary-way-10 rounded-2xl p-6 flex items-center justify-center">
                            <Image src="/images/docs-illustration.png" alt="Documentation Illustration" width={600} height={300} className="object-contain" />
                        </div>
                        <p className="text-gray-700 leading-relaxed"> Quisque tincidunt mollis neque vitae dignissim. Suspendisse quis volutpat augue, at accumsan felis. Phasellus pulvinar pretium aliquet. Cras ultricies lobortis sem vel suscipit. Praesent a faucibus sem. Interdum et malesuada fames ac ante ipsum primis in faucibus. Ut pharetra gravida elit id convallis. Mauris vehicula augue at cursus convallis. Nam pharetra turpis sed accumsan finibus. Donec ac elit tellus. Sed lacus libero, blandit eget tortor sit amet, congue sodales elit. Ut sed eros molestie, tempus nulla vel, ultricies dolor. Sed sit amet enim sapien. Pellentesque venenatis vestibulum massa, non gravida nunc hendrerit quis. </p>
                        <p className="text-gray-700 leading-relaxed"> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce rutrum cursus lorem, ac euismod dolor volutpat sit amet. Vivamus sed semper felis. Vestibulum volutpat nisl sagittis turpis mattis tincidunt. Aliquam nunc nibh, finibus quis euismod vel, dictum sed lectus. Donec placerat lacinia urna. </p>
                    </div>
                </main>
            </article>
        </>
    );
}
