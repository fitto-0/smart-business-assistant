import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../lib/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Star, ThumbsUp, ThumbsDown, Minus, MessageSquare, Plus, Upload } from "lucide-react";
import ReviewForm from "../components/ReviewForm";
import toast from "react-hot-toast";
import { format } from "date-fns";

const SentimentIcon = ({ s }) => {
  if (s === "positif") return <ThumbsUp size={14} className="text-teal" />;
  if (s === "négatif") return <ThumbsDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-amber" />;
};

const SentimentBadge = ({ s }) => {
  const cls = s === "positif" ? "text-teal" : s === "négatif" ? "text-red-400" : "text-amber";
  return <span className={`portal-label ${cls}`}>{s}</span>;
};

const Stars = ({ n }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={12} className={i <= n ? "text-amber fill-amber" : "text-muted"} />
    ))}
  </div>
);

const ScoreBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? "#2E6B72" : score >= 0.4 ? "#E8913C" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-ground rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="portal-label font-semibold w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reviewsData, productsData] = await Promise.all([
          apiGet("/analysis/sentiment"),
          apiGet("/products")
        ]);
        setReviews(reviewsData.reviews || []);
        setStats(reviewsData.stats || []);
        setAverageRating(Number(reviewsData.averageRating || 0));
        setTotalReviews(Number(reviewsData.totalReviews || 0));
        setProducts(productsData.products || []);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleReviewAdded = () => {
    const loadReviews = async () => {
      try {
        const data = await apiGet("/analysis/sentiment");
        setReviews(data.reviews || []);
        setStats(data.stats || []);
        setAverageRating(Number(data.averageRating || 0));
        setTotalReviews(Number(data.totalReviews || 0));
      } catch (error) {
        console.error("Failed to reload reviews", error);
      }
    };
    loadReviews();
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
  };

  const handleCSVImport = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await apiPost('/analysis/reviews/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`Successfully imported ${response.imported || 0} reviews`);
      setCsvFile(null);
      handleReviewAdded();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import reviews');
    } finally {
      setUploading(false);
    }
  };

  const pieData = [
    {
      name: "Positif",
      value: Number(
        stats.find((s) => s.sentiment === "positif")?.percentage || 0,
      ),
      color: "#10b981",
    },
    {
      name: "Neutre",
      value: Number(
        stats.find((s) => s.sentiment === "neutre")?.percentage || 0,
      ),
      color: "#f59e0b",
    },
    {
      name: "Négatif",
      value: Number(
        stats.find((s) => s.sentiment === "négatif")?.percentage || 0,
      ),
      color: "#ef4444",
    },
  ];

  const avgScore = Number(
    (
      (reviews.reduce((s, r) => s + Number(r.score || 0), 0) /
        Math.max(reviews.length, 1)) *
      100
    ).toFixed(0),
  );

  if (loading) {
    return (
      <Layout title="Customer Reviews">
        <div className="bg-ground-secondary border hairline rounded-xl text-center py-16 portal-text">
          Loading reviews…
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Customer Reviews">
      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowReviewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90 transition-colors"
        >
          <Plus size={18} />
          Add Review
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="flex items-center gap-2 px-4 py-2.5 border hairline rounded-lg portal-label hover:border-amber/50 transition-colors cursor-pointer"
          >
            <Upload size={18} />
            {csvFile ? csvFile.name : "Import CSV"}
          </label>
          {csvFile && (
            <button
              onClick={handleCSVImport}
              disabled={uploading}
              className="px-4 py-2.5 bg-teal text-ground rounded-lg portal-label font-semibold hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Importing..." : "Import"}
            </button>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          products={products}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewAdded}
        />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber flex items-center justify-center">
            <Star size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">Average Rating</p>
            <p className="portal-heading text-2xl">
              {averageRating.toFixed(1)}
              <span className="portal-label">/5</span>
            </p>
          </div>
        </div>
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center">
            <ThumbsUp size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">Positive Reviews</p>
            <p className="portal-heading text-2xl">
              {stats.find((s) => s.sentiment === "positif")?.count || 0}{" "}
              <span className="portal-label text-teal">
                ({stats.find((s) => s.sentiment === "positif")?.percentage || 0}
                %)
              </span>
            </p>
          </div>
        </div>
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-400 flex items-center justify-center">
            <ThumbsDown size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">Negative Reviews</p>
            <p className="portal-heading text-2xl">
              {stats.find((s) => s.sentiment === "négatif")?.count || 0}{" "}
              <span className="portal-label text-red-400">
                ({stats.find((s) => s.sentiment === "négatif")?.percentage || 0}
                %)
              </span>
            </p>
          </div>
        </div>
        <div className="bg-ground-secondary border hairline rounded-xl p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber flex items-center justify-center">
            <MessageSquare size={20} className="text-ground" />
          </div>
          <div>
            <p className="portal-label">AI Sentiment Score</p>
            <p className="portal-heading text-2xl">
              {avgScore}
              <span className="portal-label">%</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Sentiment Pie */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5 flex flex-col items-center">
          <h3 className="portal-heading text-base mb-1 self-start">
            Sentiment Distribution
          </h3>
          <p className="portal-label mb-4 self-start">
            Automatic NLP analysis
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [`${v}%`, n]}
                contentStyle={{
                  background: "#101317",
                  border: "1px solid rgba(237,231,220,0.13)",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="portal-label">
                  {d.name} <strong className="text-ink">{d.value}%</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-ground-secondary border hairline rounded-xl p-5 xl:col-span-2">
          <h3 className="portal-heading text-base mb-1">
            Rating Distribution
          </h3>
          <p className="portal-label mb-5">
            Customer rating breakdown
          </p>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(
                (r) => Number(r.rating) === star,
              ).length;
              const pct = reviews.length
                ? Math.round((count / reviews.length) * 100)
                : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-14">
                    <Star size={12} className="text-amber fill-amber" />
                    <span className="portal-label font-semibold">
                      {star}
                    </span>
                  </div>
                  <div className="flex-1 bg-ground rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-amber transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="portal-label w-10 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 p-3 rounded-xl bg-amber/10 border hairline flex items-center gap-3">
            <Star size={20} className="text-amber fill-amber flex-shrink-0" />
            <div>
              <p className="portal-heading text-sm">
                Overall rating: {averageRating.toFixed(1)}/5
              </p>
              <p className="portal-label">
                Based on {totalReviews} customer reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-ground-secondary border hairline rounded-xl p-5">
        <h3 className="portal-heading text-base mb-5">
          All Customer Reviews
        </h3>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl bg-ground/50 border hairline hover:border-amber/30 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber flex items-center justify-center text-ground font-bold text-sm flex-shrink-0">
                    {review.customer_name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="portal-label font-semibold text-ink">
                      {review.customer_name}
                    </p>
                    <p className="portal-label text-muted">
                      {review.product_name || "Product"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Stars n={review.rating} />
                  <SentimentBadge s={review.sentiment} />
                </div>
              </div>
              <p className="portal-text leading-relaxed mb-3 italic">
                "{review.comment}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 portal-label text-muted">
                  <SentimentIcon s={review.sentiment} />
                  <span>{review.date ? format(new Date(review.date), 'yyyy-MM-dd') : 'N/A'}</span>
                </div>
                <div className="w-40">
                  <p className="portal-label text-muted mb-1">
                    AI Score: {Math.round(Number(review.score || 0) * 100)}%
                  </p>
                  <ScoreBar score={review.score} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
