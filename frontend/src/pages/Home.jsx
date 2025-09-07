import { useState } from 'react';
import { MessageSquare, Brain, ArrowRight, Sparkles, Target, TrendingUp, AlertCircle } from 'lucide-react';

// Left Side Component - Hero Section
function HeroSection({ onFeedbackClick }) {
  return (
    <div className="flex-1 flex flex-col justify-center pr-12">
      <div className="space-y-8">
        {/* Logo/Brand section */}
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CommentAI
          </h1>
        </div>

        {/* Hero content */}
        <div className="space-y-6">
          <h2 className="text-6xl font-bold leading-tight">
            Intelligent
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Comment
            </span>
            Classification
          </h2>
          
          <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
            Harness the power of machine learning to automatically categorize and analyze comments with precision and speed.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Target className="h-8 w-8 text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">Accurate Classification</h3>
            <p className="text-sm text-gray-400">AI-powered analysis with high precision rates</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Sparkles className="h-8 w-8 text-pink-400 mb-3" />
            <h3 className="font-semibold mb-2">Real-time Processing</h3>
            <p className="text-sm text-gray-400">Instant results with lightning-fast analysis</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <TrendingUp className="h-8 w-8 text-blue-400 mb-3" />
            <h3 className="font-semibold mb-2">Continuous Learning</h3>
            <p className="text-sm text-gray-400">Improving accuracy through feedback</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <button
            onClick={onFeedbackClick}
            className="group flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <span>View Feedback</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Right Side Component - Comment Classifier
function CommentClassifier() {
  const [comment, setComment] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/health");
      const data = await response.json();
      alert(`Connection successful! Status: ${data.status}`);
    } catch (error) {
      alert(`Connection failed: ${error.message}`);
    }
  };

  const handleClassify = async () => {
    if (!comment.trim()) return;

    setIsClassifying(true);
    setError(null);
    
    try {
      const response = await fetch("http://127.0.0.1:5000/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ comment: comment.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if there's an error in the response
      if (data.error) {
        throw new Error(data.error);
      }

      // Set classification result - now matches the Flask response format
      setClassification({
        category: data.category,
        confidence: data.confidence,
        allPredictions: data.all_predictions // Optional: store detailed results
      });

    } catch (error) {
      console.error("Error classifying comment:", error);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError("Cannot connect to server. Please make sure the Flask backend is running on http://127.0.0.1:5000");
      } else if (error.message.includes('HTTP error')) {
        setError(`Server error: ${error.message}`);
      } else {
        setError(error.message || "Failed to classify comment. Please try again.");
      }
      setClassification(null);
    } finally {
      setIsClassifying(false);
    }
  };

  const clearResults = () => {
    setClassification(null);
    setError(null);
  };

  // Check if comment is non-toxic
  const isNonToxic = classification && (
    classification.category.toLowerCase().includes('non') || 
    classification.category.toLowerCase() === 'normal' ||
    classification.category.toLowerCase() === 'clean' ||
    classification.confidence < 50 // Assuming low confidence means non-toxic
  );

  return (
    <div className="w-96 flex flex-col justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="h-6 w-6 text-purple-400" />
          <h3 className="text-2xl font-bold">Classify Comment</h3>
        </div>

        <div className="space-y-6">
          {/* Comment input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Enter your comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                // Clear previous results when user starts typing
                if (classification || error) {
                  clearResults();
                }
              }}
              placeholder="Type your comment here..."
              className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Test Connection Button - Remove after debugging */}
          {/* <button
            onClick={testConnection}
            className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-white transition-colors duration-300"
          >
            Test Connection
          </button> */}

          {/* Classify button */}
          <button
            onClick={handleClassify}
            disabled={!comment.trim() || isClassifying}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isClassifying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Classifying...</span>
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                <span>Classify Comment</span>
              </>
            )}
          </button>

          {/* Error display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-red-400 mb-1">Error</div>
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Non-toxic message */}
          {isNonToxic && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 animate-fadeIn">
              <div className="text-center text-green-400 font-semibold text-lg">
                This comment is non toxic 😊
              </div>
            </div>
          )}

          {/* Classification result */}
          {classification && !isNonToxic && (
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Classification Result</span>
                <span className="text-xs text-gray-400">{classification.confidence}% confidence</span>
              </div>
              <div className="text-2xl font-bold text-green-400 mb-2 capitalize">
                {classification.category}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(classification.confidence, 5)}%` }} // Minimum 5% for visibility
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-purple-400">1,247</div>
          <div className="text-sm text-gray-400">Comments Processed</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-pink-400">96.8%</div>
          <div className="text-sm text-gray-400">Accuracy Rate</div>
        </div>
      </div>
    </div>
  );
}

// Main HomePage Component
export default function HomePage() {
  const handleFeedbackPage = () => {
    // Navigate to feedback page - replace with actual navigation
    alert('Navigating to feedback page...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 h-screen flex">
        {/* Left Side - Hero Section */}
        <HeroSection onFeedbackClick={handleFeedbackPage} />
        
        {/* Right Side - Comment Classifier */}
        <CommentClassifier />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}