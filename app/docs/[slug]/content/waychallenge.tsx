import Image from "next/image";

export default function Waychallenge() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Waychallenge</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Way Challenge is our series of quick and fun arcade-style games, built directly into the Waysorted platform. The first in the series is Way Fall, a mindful escape designed to sharpen your reflexes and take a break from intense design sessions. Clear your mind and return to your work refreshed and refocused.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Way-Challenge-Image-1.png"
                    alt="Way Challenge Game"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Game Mechanics</h3>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Objective</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Test your reflexes and sharpen your focus. Use the slider to avoid the falling objects and achieve the highest score possible.
            </p>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Controls</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Arrow Keys:</span> Use the Left and Right arrow keys on your keyboard to control the blue paddle.</li>
            </ul>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Scoring</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>You gain one point for every object you successfully avoid with your paddle.</li>
                <li>Your score is displayed in the top right corner of the screen.</li>
            </ul>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Way-Challenge-Image-2.png"
                    alt="Way Challenge Scoring"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Game Over</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The game ends when an object falls on your paddle.
            </p>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Difficulty</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The pace of the game increases as your score climbs. Objects will fall faster and more frequently, challenging your reflexes and concentration.
            </p>
        </>
    );
}
