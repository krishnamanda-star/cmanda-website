import Image from 'next/image';

export default function CyclingPage() {
  const images = [
    '/hobbies/cycling-1.jpeg',
    '/hobbies/cycling-2.jpeg',
    '/hobbies/cycling-3.jpeg',
  ];

  const highlights = [
    'Road cycling through scenic routes',
    'Mountain biking on challenging trails',
    'Urban cycling and bike commuting',
    'Long-distance rides and adventures',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🚴</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Cycling</h1>
              <p className="text-lg text-gray-600">Meditation in Motion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {images.map((img, index) => (
              <div key={index} className="aspect-video relative rounded-xl overflow-hidden shadow-md">
                <Image
                  src={img}
                  alt={`Cycling ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="prose prose-lg max-w-none mb-12">
          <p className="text-gray-700 leading-relaxed">
            There&apos;s something magical about the open road, the rhythm of pedaling, and the wind in your face. 
            Cycling has become more than just exercise for me — it&apos;s meditation in motion. Whether I&apos;m tackling 
            challenging climbs, enjoying scenic routes, or simply commuting through the city, each ride brings 
            a sense of freedom and connection to the world around me.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            From early morning rides watching the sunrise to long weekend adventures exploring new trails, 
            cycling has taught me about perseverance, the joy of progress, and the beauty of the journey itself.
          </p>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">What I Love About Cycling</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

