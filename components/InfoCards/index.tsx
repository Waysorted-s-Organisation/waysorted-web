interface CardProps {
  title: string;
  description: string;
  bgColor: string;
}

const InfoCard: React.FC<CardProps> = ({ title, description, bgColor }) => {
  return (
    // Card container with specified size, border, and shadow
    <div className="w-[306px] h-[255px] border border-secondary-db-20 rounded-xl shadow-sm flex flex-col bg-white p-2">
      {/* Top section for the visual element with a light background color */}
      <div className={`h-[140px] rounded-t-xl flex items-center justify-center ${bgColor}`}>
        
      </div>
      {/* Bottom section for the text content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-lg text-secondary-db-100 mb-1">{title}</h3>
        <p className="text-sm text-secondary-db-70 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};


// --- Main App Component ---
// This component lays out all the cards.

export const InfoCards = () => {
  // Data for the cards
  const cardData = [
    {
      title: 'Increase in Productivity',
      description: 'Users reported completing tasks 30% faster after switching to Waysorted plugin bundles.',
      bgColor: 'bg-tertiary-orange-500-50',
    },
    {
      title: 'Users recommend us',
      description: 'Because great tools shouldn\'t slow you down, they should sort you out.',
      bgColor: 'bg-tertiary-voilet-500-50',
    },
    {
      title: 'Faster Workflow',
      description: 'Smart curation helped users find the right tools 10x faster.',
      bgColor: 'bg-tertiary-green-500-50',
    },
  ];

  return (
    // Main container to center the cards on the page
    <div className=" bg-gray-50 flex items-center justify-center p-8 font-sans">
      {/* Grid container for the cards with the specified gap */}
      <div className="flex flex-wrap justify-center items-center gap-[43px]">
        {cardData.map((card, index) => (
          <InfoCard
            key={index}
            title={card.title}
            description={card.description}
            bgColor={card.bgColor}
          />
        ))}
      </div>
    </div>
  );
};
