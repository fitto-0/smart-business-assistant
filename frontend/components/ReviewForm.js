import { useState } from "react";
import { Star, X } from "lucide-react";
import { apiPost } from "../lib/api";
import toast from "react-hot-toast";

const ReviewForm = ({ products, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    product_id: "",
    customer_name: "",
    rating: 5,
    comment: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.customer_name || !formData.comment) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/analysis/reviews", formData);
      toast.success("Review added successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-ground-secondary border hairline rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="portal-heading text-lg">Add Customer Review</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-ground rounded-lg transition-colors"
          >
            <X size={20} className="text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div>
            <label className="portal-label block mb-2">Product *</label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full bg-ground border hairline rounded-lg px-4 py-2.5 portal-text focus:outline-none focus:border-amber"
              required
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label className="portal-label block mb-2">Customer Name *</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full bg-ground border hairline rounded-lg px-4 py-2.5 portal-text focus:outline-none focus:border-amber"
              placeholder="Enter customer name"
              required
            />
          </div>

          {/* Rating */}
          <div>
            <label className="portal-label block mb-2">Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    size={28}
                    className={star <= formData.rating ? "text-amber fill-amber" : "text-muted"}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="portal-label block mb-2">Review Comment *</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full bg-ground border hairline rounded-lg px-4 py-2.5 portal-text focus:outline-none focus:border-amber h-32 resize-none"
              placeholder="Enter customer review..."
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="portal-label block mb-2">Review Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-ground border hairline rounded-lg px-4 py-2.5 portal-text focus:outline-none focus:border-amber"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border hairline rounded-lg portal-label hover:bg-ground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-amber text-ground rounded-lg portal-label font-semibold hover:bg-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
