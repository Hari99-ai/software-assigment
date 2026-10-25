import * as admin from "firebase-admin";
import catalog from "./catalog.json";
export const products = catalog;
if (require.main === module) {
  if (!admin.apps.length) admin.initializeApp();
  const db = admin.firestore();
  const batch = db.batch();
  for (const product of products)
    batch.set(db.doc(`products/${product.id}`), {
      ...product,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  batch
    .commit()
    .then(() => {
      console.log(
        `Seeded ${products.length} sample products with manufacturer imagery.`,
      );
      return admin.app().delete();
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
}
