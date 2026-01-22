'use client';

import { useEffect, useState } from 'react';

interface MediumArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  description: string;
  readTime?: string;
}

export default function MeditationPage() {
  const [articles, setArticles] = useState<MediumArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMediumArticles = async () => {
      try {
        // Using rss2json API to convert Medium RSS to JSON
        const response = await fetch(
          'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/mymeditation&api_key=YOUR_KEY&t=${Date.now()}'
        );
        const data = await response.json();
        
        if (data.status === 'ok') {
          const formattedArticles = data.items.map((item: any) => {
            // Extract thumbnail from content or use default
            const thumbnailMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
            const thumbnail = thumbnailMatch ? thumbnailMatch[1] : item.thumbnail || '';
            
            // Strip HTML from description
            const cleanDescription = item.description
              ?.replace(/<[^>]*>/g, '')
              ?.substring(0, 150) + '...';
            
            // Estimate read time (average 200 words per minute)
            const wordCount = item.content?.split(/\s+/).length || 0;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));

            return {
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              thumbnail,
              description: cleanDescription,
              readTime: `${readTime} min read`,
            };
          });
          setArticles(formattedArticles);
        } else {
          setError('Failed to fetch articles');
        }
      } catch (err) {
        setError('Failed to load articles from Medium');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMediumArticles();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mb-3">
            Just Watching
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Reflections from Practice
          </p>
          <a
            href="https://medium.com/mymeditation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
            </svg>
            Follow on Medium
          </a>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">{error}</p>
            <a
              href="https://medium.com/mymeditation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Visit the publication directly on Medium →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <a
                key={index}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Article Thumbnail */}
                {article.thumbnail && (
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Article Content */}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(article.pubDate)}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {!loading && !error && articles.length > 0 && (
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
              <p className="text-gray-700 mb-2 font-medium">
                Want to follow my meditation journey?
              </p>
              <p className="text-gray-500 text-sm mb-5">
                New reflections published regularly on Medium
              </p>
              <a
                href="https://medium.com/mymeditation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                </svg>
                Follow Just Watching
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
