'use client';

import { useState } from 'react';

interface SeoScore {
  total: number;
  details: {
    nameLength: number;
    addressCompleteness: number;
    keywordOptimization: number;
    googleRanking: number;
    socialMediaPresence: number;
    localSEO: number;
    onlineReviews: number;
  };
  searchData: {
    googleRank?: number;
    monthlySearches?: number;
    competitorRanking?: number[];
  };
  socialMedia: {
    facebook?: { exists: boolean; followers?: number; rating?: number };
    instagram?: { exists: boolean; followers?: number };
    twitter?: { exists: boolean; followers?: number };
    linkedin?: { exists: boolean; followers?: number };
  };
  reviews: {
    google?: { rating: number; count: number };
    yelp?: { rating: number; count: number };
  };
}

interface Recommendation {
  category: string;
  status: 'good' | 'warning' | 'poor';
  message: string;
  improvement: string;
  priority: 'high' | 'medium' | 'low';
}

// Simulated API call - replace with actual SEO API integration
const fetchSEOData = async (_businessName: string, _businessAddress: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulated API response
  return {
    searchRanking: {
      googlePosition: Math.floor(Math.random() * 100),
      monthlySearches: Math.floor(Math.random() * 10000),
      competitorRanks: [1, 3, 5, 8, 12].map(x => x + Math.floor(Math.random() * 5))
    },
    socialMedia: {
      facebook: { exists: Math.random() > 0.3, followers: Math.floor(Math.random() * 10000) },
      instagram: { exists: Math.random() > 0.4, followers: Math.floor(Math.random() * 5000) },
      twitter: { exists: Math.random() > 0.5, followers: Math.floor(Math.random() * 3000) },
      linkedin: { exists: Math.random() > 0.6, followers: Math.floor(Math.random() * 1000) }
    },
    reviews: {
      google: { rating: 3 + Math.random() * 2, count: Math.floor(Math.random() * 500) },
      yelp: { rating: 3 + Math.random() * 2, count: Math.floor(Math.random() * 200) }
    }
  };
};

export default function Home() {
  const [_businessName, setBusinessName] = useState('');
  const [_businessAddress, setBusinessAddress] = useState('');
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateSEOMetrics = async () => {
    try {
      const apiData = await fetchSEOData(_businessName, _businessAddress);
      
      // Calculate base scores
      const score = {
        nameLength: 0,
        addressCompleteness: 0,
        keywordOptimization: 0,
        googleRanking: 0,
        socialMediaPresence: 0,
        localSEO: 0,
        onlineReviews: 0
      };

      // Basic name and address scoring
      if (_businessName.length > 0) {
        score.nameLength = _businessName.length >= 15 && _businessName.length <= 30 ? 30 :
          _businessName.length < 15 ? Math.round((_businessName.length / 15) * 30) :
          Math.round((40 / _businessName.length) * 30);
        
        const keywords = _businessName.toLowerCase().split(' ');
        score.keywordOptimization = Math.min(keywords.length * 10, 30);
      }

      if (_businessAddress.length > 0) {
        const addressParts = _businessAddress.split(',').length;
        score.addressCompleteness = Math.min(addressParts * 10, 40);
      }

      // Google ranking score (0-100)
      score.googleRanking = Math.max(0, 100 - apiData.searchRanking.googlePosition);

      // Social media presence score
      const socialPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
      const existingPlatforms = socialPlatforms.filter(platform => 
        apiData.socialMedia[platform]?.exists
      ).length;
      score.socialMediaPresence = (existingPlatforms / socialPlatforms.length) * 100;

      // Local SEO score based on reviews
      const avgRating = (apiData.reviews.google.rating + apiData.reviews.yelp.rating) / 2;
      const totalReviews = apiData.reviews.google.count + apiData.reviews.yelp.count;
      score.localSEO = Math.min(100, (avgRating * 10) + (totalReviews / 10));

      // Online reviews score
      score.onlineReviews = Math.min(100, 
        ((apiData.reviews.google.rating / 5) * 50) + 
        ((apiData.reviews.yelp.rating / 5) * 50)
      );

      const total = Object.values(score).reduce((a, b) => a + b, 0) / 7;

      return {
        total: Math.round(total),
        details: score,
        searchData: {
          googleRank: apiData.searchRanking.googlePosition,
          monthlySearches: apiData.searchRanking.monthlySearches,
          competitorRanking: apiData.searchRanking.competitorRanks
        },
        socialMedia: apiData.socialMedia,
        reviews: apiData.reviews
      };
    } catch (_error) {
      throw new Error('Failed to fetch SEO data');
    }
  };

  const generateRecommendations = (score: SeoScore): Recommendation[] => {
    const recs: Recommendation[] = [];

    // Google Ranking Recommendations
    if (score.details.googleRanking < 70) {
      recs.push({
        category: 'Search Engine Ranking',
        status: 'poor',
        message: `Current Google Ranking: Position ${score.searchData.googleRank}`,
        improvement: 'Improve website content, build quality backlinks, and optimize for relevant keywords',
        priority: 'high'
      });
    }

    // Social Media Recommendations
    const missingSocialPlatforms = Object.entries(score.socialMedia)
      .filter(([_, data]) => !data.exists)
      .map(([platform]) => platform);

    if (missingSocialPlatforms.length > 0) {
      recs.push({
        category: 'Social Media Presence',
        status: 'warning',
        message: `Missing presence on: ${missingSocialPlatforms.join(', ')}`,
        improvement: 'Create and maintain active profiles on missing social media platforms',
        priority: 'medium'
      });
    }

    // Review Management Recommendations
    if (score.reviews.google.count < 100 || score.reviews.yelp.count < 50) {
      recs.push({
        category: 'Online Reviews',
        status: 'warning',
        message: `Current reviews: Google (${score.reviews.google.count}), Yelp (${score.reviews.yelp.count})`,
        improvement: 'Encourage satisfied customers to leave reviews and respond to existing reviews',
        priority: 'high'
      });
    }

    // Add existing basic recommendations...
    // ... (previous recommendation logic for name and address)

    return recs;
  };

  const calculateSeoScore = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      const newScore = await calculateSEOMetrics();
      setSeoScore(newScore);
      setRecommendations(generateRecommendations(newScore));
    } catch (_error) {
      setError('Failed to calculate SEO score. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const getOverallStatus = (total: number) => {
    if (total >= 70) return { text: 'GOOD', class: 'bg-green-50 text-green-600' };
    if (total >= 40) return { text: 'FAIR', class: 'bg-yellow-50 text-yellow-600' };
    return { text: 'POOR', class: 'bg-red-50 text-red-600' };
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-7xl mx-auto">
        {seoScore ? (
          <div className="grid grid-cols-1 gap-6">
            {/* First Row - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Column - Business Analyzer */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-semibold mb-6 text-gray-800">
                  Business SEO Analyzer
                </h1>
                
                <div className="space-y-6">
                  {/* Business Name Input */}
                  <div className="relative">
                    <label 
                      htmlFor="businessName" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Business Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg 
                          className="h-5 w-5 text-gray-400" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="businessName"
                        value={_businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-400"
                        placeholder="Enter your business name"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Recommended: 15-30 characters for optimal SEO
                    </p>
                  </div>

                  {/* Business Address Input */}
                  <div className="relative">
                    <label 
                      htmlFor="businessAddress" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Business Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                        <svg 
                          className="h-5 w-5 text-gray-400" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <textarea
                        id="businessAddress"
                        value={_businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-400 resize-none"
                        placeholder="Enter your business address"
                        rows={3}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Include full address: Street, City, State, ZIP, Country
                    </p>
                  </div>

                  {/* Calculate Button */}
                  <button
                    onClick={calculateSeoScore}
                    disabled={isCalculating || !_businessName || !_businessAddress}
                    className={`w-full py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                      isCalculating || !_businessName || !_businessAddress
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    } text-white font-medium`}
                  >
                    {isCalculating ? (
                      <>
                        <svg 
                          className="animate-spin h-5 w-5 text-white" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          ></circle>
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg 
                          className="h-5 w-5" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>Analyze SEO Score</span>
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Second Column - Stack of SEO Score and Action Items */}
              <div className="space-y-6">
                {/* SEO Score Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">SEO Score</h2>
                      <div className={`inline-flex items-center px-2 py-1 rounded ${getOverallStatus(seoScore.total).class}`}>
                        <span className="text-sm font-medium">{getOverallStatus(seoScore.total).text}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-12">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="10"
                          strokeDasharray={`${(seoScore.details.nameLength / 100) * 283} 283`}
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="10"
                          strokeDasharray={`${(seoScore.details.addressCompleteness / 100) * 283} 283`}
                          strokeDashoffset={`${-(seoScore.details.nameLength / 100) * 283}`}
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#EAB308"
                          strokeWidth="10"
                          strokeDasharray={`${(seoScore.details.keywordOptimization / 100) * 283} 283`}
                          strokeDashoffset={`${-((seoScore.details.nameLength + seoScore.details.addressCompleteness) / 100) * 283}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-3xl font-bold">{seoScore.total}</span>
                          <span className="text-xl">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#8B5CF6]"></span>
                        <span className="text-sm text-gray-600">Name Score</span>
                        <span className="ml-auto text-sm font-medium">{seoScore.details.nameLength}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
                        <span className="text-sm text-gray-600">Address Score</span>
                        <span className="ml-auto text-sm font-medium">{seoScore.details.addressCompleteness}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#EAB308]"></span>
                        <span className="text-sm text-gray-600">Keyword Score</span>
                        <span className="ml-auto text-sm font-medium">{seoScore.details.keywordOptimization}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Items Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Action Items</h2>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <h3 className="font-medium">{rec.category}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.message}</p>
                        <p className="text-sm font-medium text-gray-800">
                          💡 {rec.improvement}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row - Three Equal Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Visibility */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Search Visibility</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Google Ranking</h3>
                    <p className="text-2xl font-bold text-blue-600">#{seoScore.searchData.googleRank}</p>
                    <p className="text-sm text-gray-600">Monthly Searches: {seoScore.searchData.monthlySearches}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Competitor Rankings</h3>
                    <div className="space-y-1">
                      {seoScore.searchData.competitorRanking?.map((rank, i) => (
                        <div key={i} className="text-sm">
                          Competitor {i + 1}: #{rank}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Presence */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Social Media Presence</h2>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(seoScore.socialMedia).map(([platform]) => (
                    <div key={platform} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2 capitalize">{platform}</h3>
                      {seoScore.socialMedia[platform]?.exists ? (
                        <>
                          <p className="text-green-600 font-medium">Active</p>
                          <p className="text-sm text-gray-600">{seoScore.socialMedia[platform]?.followers} followers</p>
                        </>
                      ) : (
                        <p className="text-red-600 font-medium">Not Found</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Reviews */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Online Reviews</h2>
                <div className="space-y-4">
                  {Object.entries(seoScore.reviews).map(([platform, data]) => (
                    <div key={platform} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2 capitalize">{platform}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{data.rating.toFixed(1)}</span>
                        <div className="flex-1">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= data.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">{data.count} reviews</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Initial state - only show Business Analyzer
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              {/* Business Analyzer content */}
              <div className="space-y-6">
                {/* Business Name Input */}
                <div className="relative">
                  <label 
                    htmlFor="businessName" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Business Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg 
                        className="h-5 w-5 text-gray-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="businessName"
                      value={_businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-400"
                      placeholder="Enter your business name"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Recommended: 15-30 characters for optimal SEO
                  </p>
                </div>

                {/* Business Address Input */}
                <div className="relative">
                  <label 
                    htmlFor="businessAddress" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Business Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                      <svg 
                        className="h-5 w-5 text-gray-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <textarea
                      id="businessAddress"
                      value={_businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-400 resize-none"
                      placeholder="Enter your business address"
                      rows={3}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Include full address: Street, City, State, ZIP, Country
                  </p>
                </div>

                {/* Calculate Button */}
                <button
                  onClick={calculateSeoScore}
                  disabled={isCalculating || !_businessName || !_businessAddress}
                  className={`w-full py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${
                    isCalculating || !_businessName || !_businessAddress
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                  } text-white font-medium`}
                >
                  {isCalculating ? (
                    <>
                      <svg 
                        className="animate-spin h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        ></circle>
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <svg 
                        className="h-5 w-5" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span>Analyze SEO Score</span>
                    </>
                  )}
                </button>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
