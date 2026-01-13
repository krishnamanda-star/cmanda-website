import Image from 'next/image';

export default function HobbiesPage() {
  const hobbies = [
    {
      id: 'cycling',
      title: 'Cycling',
      icon: '🚴',
      images: [
        '/hobbies/cycling-1.jpeg',
        '/hobbies/cycling-2.jpeg',
        '/hobbies/cycling-3.jpeg',
      ],
      description: `
        There's something magical about the open road, the rhythm of pedaling, and the wind in your face.
        Cycling has become more than just exercise for me – it's meditation in motion. Whether I'm tackling
        challenging climbs, enjoying scenic routes, or simply commuting through the city, each ride brings
        a sense of freedom and connection to the world around me.

        From early morning rides watching the sunrise to long weekend adventures exploring new trails,
        cycling has taught me about perseverance, the joy of progress, and the beauty of the journey itself.
      `,
      highlights: [
        'Road cycling through scenic routes',
        'Mountain biking on challenging trails',
        'Urban cycling and bike commuting',
        'Long-distance rides and adventures',
      ],
    },
    {
      id: 'snowboarding',
      title: 'Snowboarding',
      icon: '🏂',
      images: [
        '/hobbies/snowboarding-1.jpeg',
        '/hobbies/snowboarding-2.jpeg',
      ],
      description: `
        Carving down a mountain on fresh powder is pure bliss. I ride a Lib Tech Orca, and it's transformed
        my snowboarding experience. The Orca's versatility handles everything from groomed runs to deep powder
        with incredible ease and stability.

        Snowboarding is where I find flow state most naturally. The focus required to navigate terrain,
        the physical challenge, and the stunning mountain environments create moments of pure presence.
        Each run is unique, each turn an opportunity to improve, and every day on the mountain is a gift.
      `,
      highlights: [
        'Riding the Lib Tech Orca',
        'Powder days and backcountry adventures',
        'Freestyle and park riding',
        'Mountain exploration and scenic runs',
      ],
    },
    {
      id: 'espresso',
      title: 'Espresso Coffee Making',
      icon: '☕',
      images: [],
      description: `
        The art of pulling the perfect espresso shot is a daily ritual that combines science, technique,
        and a touch of magic. From selecting beans and dialing in the grinder to timing the extraction
        and perfecting the crema, every variable matters.

        What started as a simple appreciation for good coffee has evolved into a passionate hobby.
        I've learned about different bean origins, roast profiles, and brewing techniques. The pursuit
        of that perfect shot – balanced, complex, with rich flavors and silky texture – is an endless
        journey of refinement and discovery.
      `,
      highlights: [
        'Espresso extraction and technique',
        'Latte art and milk steaming',
        'Exploring different bean origins',
        'Home barista equipment and setup',
      ],
    },
    {
      id: 'sports',
      title: 'Sports',
      icon: '⚽',
      images: [],
      description: `
        Sports have always been a central part of my life. Whether I'm playing, watching, or analyzing,
        the world of athletics fascinates me. Team sports teach collaboration and strategy, individual
        sports build discipline and mental toughness, and all sports offer opportunities for growth,
        competition, and camaraderie.

        I enjoy both participating in and following various sports, appreciating the dedication, skill,
        and passion that athletes bring to their craft. Sports are a celebration of human potential,
        perseverance, and the joy of pushing boundaries.
      `,
      highlights: [
        'Playing team and individual sports',
        'Following professional leagues and competitions',
        'Learning sports strategy and analytics',
        'Building fitness and athletic skills',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">My Hobbies & Passions</h1>
          <p className="text-xl text-gray-600">
            Exploring life through movement, craft, and play
          </p>
        </div>
      </div>

      {/* Hobbies Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {hobbies.map((hobby, index) => (
            <section
              key={hobby.id}
              className={`${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } flex flex-col lg:flex gap-8 items-center`}
            >
              {/* Content */}
              <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-10">
                <div className="flex items-center mb-6">
                  <span className="text-5xl mr-4">{hobby.icon}</span>
                  <h2 className="text-3xl font-bold text-gray-900">{hobby.title}</h2>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700 mb-6">
                  {hobby.description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>

                {/* Highlights */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Highlights:</h3>
                  <ul className="space-y-2">
                    {hobby.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Images or Placeholder */}
              <div className="flex-1 w-full">
                {hobby.images.length > 0 ? (
                  <div className="space-y-4">
                    {hobby.images.map((image, idx) => (
                      <div key={idx} className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                        <Image
                          src={image}
                          alt={`${hobby.title} photo ${idx + 1}`}
                          width={800}
                          height={600}
                          className="w-full h-auto object-cover"
                          priority={index === 0 && idx === 0}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl aspect-[4/3] flex items-center justify-center border border-gray-300 shadow-lg">
                    <div className="text-center px-4">
                      <span className="text-6xl mb-4 block">{hobby.icon}</span>
                      <p className="text-gray-600 font-medium">Photo coming soon</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {hobby.title} memories
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <p className="text-gray-600 mb-2">
            These hobbies keep me balanced, energized, and constantly learning.
          </p>
          <p className="text-sm text-gray-500">
            Each one offers unique challenges and rewards that enrich my life.
          </p>
        </div>
      </div>
    </div>
  );
}
