import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import toast from "react-hot-toast";
import {
 Plus,
 Search,
 Edit2,
 Trash2,
 Package,
 TrendingUp,
 TrendingDown,
 X,
 Save,
 Upload,
 FileText,
 Check,
 Palette,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);

const getStatusLabel = (status, t) => {
 const labels = {
 actif: t("products.active"),
 stock_faible: t("products.lowStock"),
 rupture: t("products.outOfStock"),
 };
 return labels[status] || status;
};

const getStatusClass = (status) => {
 const classes = {
 actif: "text-olive",
 stock_faible: "text-ember-500",
 rupture: "text-clay",
 };
 return classes[status] || "text-ink-3";
};

export default function ProductsPage() {
 const { t } = useLanguage();
 const [products, setProducts] = useState([]);
 const [categories, setCategories] = useState([]);
 const [newCategory, setNewCategory] = useState("");
 const [newCategoryColor, setNewCategoryColor] = useState("var(--ember-500)");
 const [search, setSearch] = useState("");
 const [catFilter, setCatFilter] = useState("All");
 const [showModal, setShowModal] = useState(false);
 const [editProduct, setEditProduct] = useState(null);
 const [form, setForm] = useState({
 name: "",
 category: "",
 price: "",
 promotionPrice: "",
 stock: "",
 });
 const [imageFile, setImageFile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [showCsvModal, setShowCsvModal] = useState(false);
 const [csvFile, setCsvFile] = useState(null);
 const [csvAnalyzing, setCsvAnalyzing] = useState(false);
 const [csvAnalysis, setCsvAnalysis] = useState(null);
 const [csvUploading, setCsvUploading] = useState(false);

 useEffect(() => {
 const loadProducts = async () => {
 try {
 const [productData, categoryData] = await Promise.all([
 apiGet("/products"),
 apiGet("/categories"),
 ]);
 setProducts(productData.products || []);
 setCategories(categoryData.categories || []);
 } catch (error) {
 toast.error(error.message || t("products.loadError"));
 } finally {
 setLoading(false);
 }
 };

 loadProducts();
 }, []);

 const categoryNames = categories.map((category) => category.name);
 const categoryOptions = categoryNames;

 const addCategory = async () => {
 if (!newCategory.trim()) return;
 try {
 const category = await apiPost("/categories", {
 name: newCategory.trim(),
 color: newCategoryColor,
 });
 setCategories((current) =>
 [...current, category].sort((a, b) => a.name.localeCompare(b.name)),
 );
 setNewCategory("");
 toast.success(t("products.categoryAdded"));
 } catch (error) {
 toast.error(error.message || t("products.addCategoryError"));
 }
 };

 const deleteCategory = async (category) => {
 try {
 await apiDelete(`/categories/${category.id}`);
 setCategories((current) =>
 current.filter((item) => item.id !== category.id),
 );
 if (catFilter === category.name)
 setCatFilter(t("products.allCategories"));
 toast.success(t("products.categoryDeleted"));
 } catch (error) {
 toast.error(error.message || t("products.categoryDeleteError"));
 }
 };

 const filtered = (products || []).filter((p) => {
 const matchSearch =
 p.name.toLowerCase().includes(search.toLowerCase()) ||
 p.category.toLowerCase().includes(search.toLowerCase());
 const matchCat =
 catFilter === t("products.allCategories") || p.category === catFilter;
 return matchSearch && matchCat;
 });

 const openAdd = () => {
 setEditProduct(null);
 setForm({
 name: "",
 category: categoryOptions[0] || "",
 price: "",
 promotionPrice: "",
 stock: "",
 });
 setImageFile(null);
 setShowModal(true);
 };

 const openEdit = (p) => {
 setEditProduct(p);
 setForm({
 name: p.name,
 category: p.category,
 price: p.price,
 promotionPrice: p.promotion_price || "",
 stock: p.stock,
 });
 setImageFile(null);
 setShowModal(true);
 };

 const handleSave = async () => {
 if (!form.name || !form.price || form.stock === "") {
 toast.error(t("common.fillAllFields") || "Please fill in all fields");
 return;
 }

 try {
 const payload = {
 name: form.name,
 category: form.category,
 price: parseFloat(form.price),
 promotion_price:
 form.promotionPrice === "" ? null : parseFloat(form.promotionPrice),
 stock: parseInt(form.stock, 10),
 };
 let savedProduct;
 if (editProduct) {
 savedProduct = await apiPut(`/products/${editProduct.id}`, payload);
 setProducts((current) =>
 current.map((p) => (p.id === savedProduct.id ? savedProduct : p)),
 );
 toast.success(t("products.productUpdated"));
 } else {
 savedProduct = await apiPost("/products", payload);
 setProducts((current) => [savedProduct, ...current]);
 toast.success(t("products.productAdded"));
 }
 if (imageFile && savedProduct?.id) {
 const imageData = new FormData();
 imageData.append("image", imageFile);
 const withImage = await apiPost(
 `/products/${savedProduct.id}/image`,
 imageData,
 );
 setProducts((current) =>
 current.map((p) => (p.id === withImage.id ? withImage : p)),
 );
 }
 setShowModal(false);
 setImageFile(null);
 } catch (error) {
 toast.error(error.message || t("common.saveError") || "Failed to save");
 }
 };

 const handleDelete = async (id) => {
 if (!window.confirm(t("products.delete") + " this product?")) return;
 try {
 await apiDelete(`/products/${id}`);
 setProducts((current) => current.filter((p) => p.id !== id));
 toast.success(t("products.productDeleted"));
 } catch (error) {
 toast.error(
 error.message || t("common.deleteError") || "Failed to delete",
 );
 }
 };

 const handleCsvFileChange = (e) => {
 const file = e.target.files[0];
 if (file && file.name.endsWith(".csv")) {
 setCsvFile(file);
 setCsvAnalysis(null);
 } else {
 toast.error(t("products.uploadCSVError") || "Please select a CSV file");
 }
 };

 const analyzeCsv = async () => {
 if (!csvFile) return;

 setCsvAnalyzing(true);
 const formData = new FormData();
 formData.append("file", csvFile);

 try {
 const response = await apiPost("/csv/analyze", formData);

 if (response.success) {
 setCsvAnalysis(response);
 toast.success(`Analyzed ${response.total} products`);
 } else {
 toast.error(response.error || "Failed to analyze CSV");
 }
 } catch (error) {
 toast.error(error.message || "Failed to analyze CSV");
 } finally {
 setCsvAnalyzing(false);
 }
 };

 const importCsvProducts = async () => {
 if (!csvAnalysis || !csvAnalysis.products) return;

 setCsvUploading(true);
 try {
 for (const product of csvAnalysis.products) {
 await apiPost("/products", product);
 }
 toast.success(`Imported ${csvAnalysis.products.length} products`);
 setShowCsvModal(false);
 setCsvFile(null);
 setCsvAnalysis(null);

 // Reload products
 const data = await apiGet("/products");
 setProducts(data.products || []);
 } catch (error) {
 toast.error("Failed to import products");
 } finally {
 setCsvUploading(false);
 }
 };

 const totalProducts = products.length;
 const inStock = products.filter((p) => p.status === "actif").length;
 const lowStock = products.filter((p) => p.status === "stock_faible").length;
 const outStock = products.filter((p) => p.status === "rupture").length;

 return (
 <Layout title={t("products.title")}>
 {/* Stats */}
 <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
 {[
 {
 label: t("products.totalProducts") || "Total Products",
 value: totalProducts,
 color: "bg-ember-500",
 },
 {
 label: t("products.inStock") || "In Stock",
 value: inStock,
 color: "bg-olive",
 },
 { label: t("products.lowStock"), value: lowStock, color: "bg-ember-500" },
 {
 label: t("products.outOfStock"),
 value: outStock,
 color: "bg-clay",
 },
 ].map((s, i) => (
 <div
 key={i}
 className="bg-surface border hairline rounded-xs p-4 flex items-center gap-4"
 >
 <div
 className={`w-11 h-11 rounded-xs ${s.color} flex items-center justify-center`}
 >
 <Package size={20} className="text-ground" />
 </div>
 <div>
 <p className="portal-label">{s.label}</p>
 <p className="portal-heading text-2xl">{s.value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Toolbar */}
 <div className="bg-surface border hairline rounded-xs p-4 mb-6">
 <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
 <div className="flex flex-col sm:flex-row gap-3 flex-1">
 <div className="relative flex-1 max-w-xs">
 <Search
 size={16}
 className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
 />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder={t("products.searchPlaceholder")}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 pl-9 text-ink placeholder-muted focus:outline-none focus:border-ember-500 transition-colors"
 />
 </div>
 <div className="flex gap-2 flex-wrap">
 {[t("products.allCategories"), ...categoryNames].map((c) => (
 <button
 key={c}
 onClick={() => setCatFilter(c)}
  className={`px-3 py-1.5 rounded-xs font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] antialiased transition-colors ${catFilter === c ? "bg-ember-500 text-white" : "bg-canvas text-ink hover:bg-surface-2"}`}
 >
 {c}
 </button>
 ))}
 </div>
 </div>
 <div className="flex gap-2 flex-shrink-0">
 <button
 onClick={() => setShowCsvModal(true)}
 className="portal-pill-btn"
 >
 <Upload size={16} /> {t("products.importCSV")}
 </button>
 <button onClick={openAdd} className="portal-pill-btn">
 <Plus size={16} /> {t("products.addProduct")}
 </button>
 </div>
 </div>
 </div>

 <div className="bg-surface border hairline rounded-xs p-4 mb-6">
 <div className="flex flex-col lg:flex-row lg:items-center gap-3">
 <div className="flex items-center gap-2">
 <Palette size={16} className="text-ember-500" />
 <span className="portal-heading text-sm">
 {t("products.manageCategories")}
 </span>
 </div>
 <div className="flex flex-1 flex-col sm:flex-row gap-2">
 <input
 value={newCategory}
 onChange={(e) => setNewCategory(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && addCategory()}
 placeholder={t("products.newCategoryName")}
 className="flex-1 bg-canvas border hairline rounded-xs px-3 py-2 portal-text text-ink placeholder-muted focus:outline-none focus:border-ember-500"
 />
 <input
 type="color"
 value={newCategoryColor}
 onChange={(e) => setNewCategoryColor(e.target.value)}
 title={t("products.chooseCategoryColor")}
 className="h-10 w-12 bg-canvas border hairline rounded-xs p-1 cursor-pointer"
 />
 <button
 onClick={addCategory}
 className="portal-pill-btn justify-center"
 >
 <Plus size={15} /> {t("products.addCategoryBtn")}
 </button>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 mt-3">
 {categories.map((category) => (
 <div
 key={category.id}
 className="flex items-center gap-2 bg-canvas border hairline rounded-xs px-2.5 py-1.5"
 >
 <span
 className="w-2.5 h-2.5 rounded-full"
 style={{ backgroundColor: category.color }}
 />
 <span className="portal-label">{category.name}</span>
 <button
 onClick={() => deleteCategory(category)}
 title={t("products.deleteCategory")}
 className="text-ink-3 hover:text-clay transition-colors"
 >
 <X size={13} />
 </button>
 </div>
 ))}
 </div>
 </div>

 {loading && (
 <div className="bg-surface border hairline rounded-xs text-center py-8 portal-text">
 {t("products.loading")}
 </div>
 )}

 {/* Products Table */}
 <div className="bg-surface border hairline rounded-xs p-5">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b hairline">
 <th className="portal-dates-header">{t("products.product")}</th>
 <th className="portal-dates-header">
 {t("products.category")}
 </th>
 <th className="portal-dates-header">{t("products.price")}</th>
 <th className="portal-dates-header">{t("products.stock")}</th>
 <th className="portal-dates-header">{t("products.sold")}</th>
 <th className="portal-dates-header">{t("products.revenue")}</th>
 <th className="portal-dates-header">{t("products.trend")}</th>
 <th className="portal-dates-header">{t("products.status")}</th>
 <th className="portal-dates-header">{t("products.actions")}</th>
 </tr>
 </thead>
 <tbody>
 {filtered.map((p) => {
 return (
 <tr
 key={p.id}
 className="hover:bg-canvas/50 transition-colors"
 >
 <td className="portal-dates-cell portal-dates-cell-primary">
 {p.name}
 </td>
 <td className="portal-dates-cell">
 <span className="portal-label bg-olive/10 text-olive px-2 py-1 rounded">
 {p.category}
 </span>
 </td>
 <td className="portal-dates-cell font-medium text-ink">
 {p.promotion_price ? (
 <div>
 <span className="line-through text-ink-3 mr-2">
 {fmt(p.price)} DA
 </span>
 <span className="text-ember-500">
 {fmt(p.promotion_price)} DA
 </span>
 </div>
 ) : (
 `${fmt(p.price)} DA`
 )}
 </td>
 <td
 className={`portal-dates-cell font-semibold ${p.stock === 0 ? "text-clay" : p.stock <= 10 ? "text-ember-500" : "text-olive"}`}
 >
 {p.stock === 0
 ? ` ${t("products.outOfStock")}`
 : p.stock}
 </td>
 <td className="portal-dates-cell text-ink-2">
 {p.sold}
 </td>
 <td className="portal-dates-cell font-semibold text-ember-500">
 {fmt(p.revenue)} DA
 </td>
 <td className="portal-dates-cell">
 <div
 className={`flex items-center gap-1 font-semibold portal-label ${p.trend >= 0 ? "text-olive" : "text-clay"}`}
 >
 {p.trend >= 0 ? (
 <TrendingUp size={12} />
 ) : (
 <TrendingDown size={12} />
 )}
 {p.trend >= 0 ? "+" : ""}
 {p.trend}%
 </div>
 </td>
 <td className="portal-dates-cell">
 <span className={getStatusClass(p.status)}>
 {getStatusLabel(p.status, t)}
 </span>
 </td>
 <td className="portal-dates-cell">
 <div className="flex items-center gap-2">
 <button
 onClick={() => openEdit(p)}
 className="p-1.5 rounded-xs hover:bg-ember-500/20 text-ember-500 transition-colors"
 >
 <Edit2 size={14} />
 </button>
 <button
 onClick={() => handleDelete(p.id)}
 className="p-1.5 rounded-xs hover:bg-clay/20 text-clay transition-colors"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 {filtered.length === 0 && (
 <div className="text-center py-12 portal-text">
 <Package size={40} className="mx-auto mb-3 opacity-30" />
 <p>{t("products.noProducts") || "No products found"}</p>
 </div>
 )}
 </div>
 </div>

 {/* Product Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <div className="bg-surface border hairline rounded-xs p-6 w-full max-w-md animate-rise-in">
 <div className="flex items-center justify-between mb-5">
 <h3 className="portal-heading text-lg">
 {editProduct
 ? t("products.editProduct")
 : t("products.newProduct")}
 </h3>
 <button
 onClick={() => setShowModal(false)}
 className="p-2 rounded-xs hover:bg-canvas text-ink-3"
 >
 <X size={18} />
 </button>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block portal-label mb-1.5">
 {t("products.productName")}
 </label>
 <input
 type="text"
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-ember-500 transition-colors"
 placeholder={t("products.productNamePlaceholder")}
 />
 </div>
 <div>
 <label className="block portal-label mb-1.5">
 {t("products.category")}
 </label>
 <select
 value={form.category}
 onChange={(e) =>
 setForm({ ...form, category: e.target.value })
 }
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 text-ink focus:outline-none focus:border-ember-500 transition-colors"
 >
 <option value="">{t("products.selectCategory")}</option>
 {categoryOptions.map((c) => (
 <option key={c} value={c}>
 {c}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block portal-label mb-1.5">
 {t("products.price")} (DA)
 </label>
 <input
 type="number"
 value={form.price}
 onChange={(e) => setForm({ ...form, price: e.target.value })}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-ember-500 transition-colors"
 placeholder="0"
 />
 </div>
 <div>
 <label className="block portal-label mb-1.5">
 {t("products.stock")}
 </label>
 <input
 type="number"
 value={form.stock}
 onChange={(e) => setForm({ ...form, stock: e.target.value })}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-ember-500 transition-colors"
 placeholder="0"
 />
 </div>
 <div>
 <label className="block portal-label mb-1.5">
 {t("products.promotionPrice") || "Promotion price"} (DA)
 </label>
 <input
 type="number"
 min="0"
 step="0.01"
 value={form.promotionPrice}
 onChange={(e) =>
 setForm({ ...form, promotionPrice: e.target.value })
 }
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-ember-500 transition-colors"
 placeholder={
 t("products.promotionPricePlaceholder") ||
 "Leave empty for no promotion"
 }
 />
 </div>
 <div>
 <label className="block portal-label mb-1.5">
 Product image
 </label>
 <input
 type="file"
 accept="image/*"
 onChange={(e) => setImageFile(e.target.files?.[0] || null)}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 text-ink file:mr-3 file:rounded-xs file:border-0 file:bg-ember-500 file:px-3 file:py-1 file:text-ground"
 />
 <p className="portal-label text-ink-3 mt-1">
 PNG, JPG, or WEBP up to 8MB.
 </p>
 </div>
 </div>
 <div className="flex gap-3 mt-6">
 <button
 onClick={handleSave}
 className="flex-1 portal-pill-btn justify-center"
 >
 <Save size={16} /> {t("products.save")}
 </button>
 <button
 onClick={() => setShowModal(false)}
 className="portal-pill-btn justify-center"
 >
 {t("products.cancel")}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* CSV Import Modal */}
 {showCsvModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <div className="bg-surface border hairline rounded-xs p-6 w-full max-w-lg animate-rise-in">
 <div className="flex items-center justify-between mb-5">
 <h3 className="portal-heading text-lg">
 {t("products.importFromCSV")}
 </h3>
 <button
 onClick={() => setShowCsvModal(false)}
 className="p-2 rounded-xs hover:bg-canvas text-ink-3"
 >
 <X size={18} />
 </button>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block portal-label mb-1.5">
 {t("products.selectCSVFile")}
 </label>
 <div className="relative">
 <input
 type="file"
 accept=".csv"
 onChange={handleCsvFileChange}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-3 text-ink file:mr-4 file:py-1 file:px-3 file:rounded-xs file:border-0 file:text-sm file:font-medium file:bg-ember-500 file:text-ground hover:file:bg-ember-500/80"
 />
 </div>
 <p className="portal-label text-ink-3 mt-2 text-xs">
 {t("products.requiredColumns")}
 </p>
 </div>

 {csvAnalysis && (
 <div className="bg-canvas border hairline rounded-xs p-4">
 <div className="flex items-center gap-2 mb-3">
 <Check size={18} className="text-olive" />
 <span className="portal-heading text-sm text-olive">
 {t("products.analysisComplete")}
 </span>
 </div>
 <div className="space-y-2 portal-text text-sm">
 <p>
 <span className="text-ink-3">
 {t("products.totalProducts")}
 </span>{" "}
 {csvAnalysis.total}
 </p>
 <p>
 <span className="text-ink-3">
 {t("products.detectedColumns")}
 </span>{" "}
 {Object.keys(csvAnalysis.column_mapping).join(", ")}
 </p>
 {csvAnalysis.preview && csvAnalysis.preview.length > 0 && (
 <div className="mt-3">
 <p className="text-ink-3 mb-2">
 {t("products.preview")}
 </p>
 <div className="space-y-1">
 {csvAnalysis.preview.map((p, i) => (
 <div
 key={i}
 className="bg-surface p-2 rounded text-xs"
 >
 {p.name} - {p.category} - {p.price} DA
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 <div className="flex gap-3 mt-6">
 <button
 onClick={() => setShowCsvModal(false)}
 className="w-full bg-canvas border hairline rounded-xs px-4 py-2 portal-label text-ink-2 hover:bg-canvas/50 transition-colors justify-center"
 >
 {t("products.cancel")}
 </button>
 {!csvAnalysis ? (
 <button
 onClick={analyzeCsv}
 disabled={!csvFile || csvAnalyzing}
 className="portal-pill-btn flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {csvAnalyzing ? (
 t("products.analyzing")
 ) : (
 <>
 <FileText size={16} /> {t("products.analyze")}
 </>
 )}
 </button>
 ) : (
 <button
 onClick={importCsvProducts}
 disabled={csvUploading}
 className="portal-pill-btn flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {csvUploading ? (
 t("products.importing")
 ) : (
 <>
 <Upload size={16} /> {t("products.importProducts")}
 </>
 )}
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </Layout>
 );
}
