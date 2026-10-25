// src/services/productService.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Product, ProductCategory } from "../types";

const toProduct = (id: string, data: DocumentData): Product => ({
  id,
  name: data.name,
  category: data.category,
  brand: data.brand,
  description: data.description,
  price: data.price,
  wholesalePrice: data.wholesalePrice,
  image: data.image,
  stock: data.stock,
  available: data.available,
  specifications: data.specifications || {},
  rating: data.rating || 0,
  reviewCount: data.reviewCount || 0,
  tags: data.tags || [],
  featured: data.featured || false,
  createdAt: data.createdAt?.toDate() || new Date(),
});

export const getProducts = async (params?: {
  category?: ProductCategory;
  sortBy?: "price_asc" | "price_desc" | "name" | "rating";
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
}): Promise<{ products: Product[]; lastDoc: DocumentSnapshot | null }> => {
  const colRef = collection(db, "products");
  const constraints: Parameters<typeof query>[1][] = [
    where("available", "==", true),
  ];

  if (params?.category)
    constraints.push(where("category", "==", params.category));

  switch (params?.sortBy) {
    case "price_asc":
      constraints.push(orderBy("price", "asc"));
      break;
    case "price_desc":
      constraints.push(orderBy("price", "desc"));
      break;
    case "rating":
      constraints.push(orderBy("rating", "desc"));
      break;
    default:
      constraints.push(orderBy("name", "asc"));
  }

  const pageSize = params?.pageSize || 20;
  constraints.push(limit(pageSize));

  if (params?.lastDoc) constraints.push(startAfter(params.lastDoc));

  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);
  const products = snap.docs.map((d) => toProduct(d.id, d.data()));
  const lastDoc =
    snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;

  return { products, lastDoc };
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const q = query(
    collection(db, "products"),
    where("featured", "==", true),
    where("available", "==", true),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProduct(d.id, d.data()));
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  return toProduct(snap.id, snap.data());
};

export const searchProducts = async (
  searchTerm: string,
): Promise<Product[]> => {
  // Firestore doesn't support full-text search natively.
  // We use a client-side filter on a reasonable page of products.
  // For production, use Algolia or Typesense.
  const q = query(
    collection(db, "products"),
    where("available", "==", true),
    limit(200),
  );
  const snap = await getDocs(q);
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((d) => toProduct(d.id, d.data()))
    .filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.tags.some((t) => t.includes(term)),
    );
};

export const getProductsByCategory = async (
  category: ProductCategory,
): Promise<Product[]> => {
  const q = query(
    collection(db, "products"),
    where("category", "==", category),
    where("available", "==", true),
    orderBy("rating", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProduct(d.id, d.data()));
};
